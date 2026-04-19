import React, { useEffect, useRef, useState } from "react";
import { playBGM, stopBGM, playSound } from '../../gameutils/sound/soundManager';
import { removeStarterListener, loadStarterXml } from './hooks/blocklysetup/xmlLoader';
import { detectAlgoType } from '../../gameutils/shared/levelType';
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import useUserStore from '../../store/useUserStore';
import ProgressModal from '../../pages/user/ProgressModal';
import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/javascript";
// นำเข้า Utilities และตัวแปร Data
import { clearRescuedPeople } from '../../gameutils/entities/personUtils';
import { clearPlayerCoins } from '../../gameutils/entities/coinUtils';
import { seedWeaponsData } from '../../gameutils/entities/weaponUtils';
import { animationController } from '../../gameutils/algo/playback/AnimationController';

// นำเข้า Components ฝั่ง UI
import GameArea from './GameArea';
import BlocklyArea from './BlocklyArea';
import GuidePopup from './modals/GuidePopup';
import LoadXmlModal from './modals/LoadXmlModal';
import MissionBriefing from './modals/MissionBriefingModal';

// นำเข้า Custom Hooks
import { usePhaserGame } from './hooks/usePhaserGame';
import { useBlocklySetup } from './hooks/blocklysetup/useBlocklySetup';
import { useCodeExecution } from './hooks/execution/useCodeExecution';
import { useProfile } from '../../services/hooks/useProfile';
import { useLevel, useLevels } from '../../services/hooks/useLevel';
import { useWeapons } from '../../services/hooks/useWeapons';

import { useLevelInitializer } from './hooks/useLevelLoader';
import { usePatternAnalysis } from './hooks/usePatternAnalysis';
import { useTextCodeValidation } from './hooks/useTextCodeValidation';
import { useGuideSystem } from '../../hooks/useGuideSystem';
import { usePseudocodeSync } from './hooks/usePseudocodeSync';

import { EXAMPLE_LOADERS } from './constants/exampleLoaders';
import ExecutionErrorModal from './modals/ExecutionErrorModal';
import PageLoader from '../../components/shared/Loading/PageLoader';
import { useSuppressBlocklyWarnings } from '../../components/admin/level/hooks/useSuppressBlocklyWarnings';
import PageError from '@/components/shared/Error/PageError';

/**
 * GameCore Component
 *
 * @param {Object} props
 * @param {string} props.levelId - Level ID to load
 * @param {boolean} props.isPreview - Whether this is preview mode (default: false)
 * @param {number} props.patternId - Pattern ID for preview mode (optional)
 * @param {Function} props.onUnlockPattern - Callback when pattern is unlocked (optional)
 * @param {Function} props.onUnlockLevel - Callback when level is unlocked (optional)
 */
const GameCore = ({
  levelId: propLevelId,
  isPreview = false,
  patternId = null,
  patternXml = null,
  onUnlockPattern = null,
  onUnlockLevel = null
}) => {
  const { levelId: paramLevelId } = useParams();
  const { getToken } = useAuth();
  const { role } = useUserStore();
  const isAdmin = role === 'admin';

  const levelId = propLevelId || paramLevelId;

  const gameRef = useRef(null);
  const blocklyRef = useRef(null);
  const workspaceRef = useRef(null);
  const phaserGameRef = useRef(null);

  const [gameState, setGameState] = useState("loading");
  const [blocklyLoaded, setBlocklyLoaded] = useState(false);

  // จัดการ State ควบคุม Progress
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [showMissionBriefing, setShowMissionBriefing] = useState(false);
  const missionAcceptedRef = useRef(false);

  // เตรียมข้อมูล Level Data
  const [currentLevel, setCurrentLevel] = useState(null);
  const [enabledBlocks, setEnabledBlocks] = useState({});
  const [workspaceVersion, setWorkspaceVersion] = useState(0);


  // เตรียม State สำหรับโหลด XML Modal
  const [showLoadXmlModal, setShowLoadXmlModal] = useState(false);

  // จัดการ Game State หลัก
  const [playerHpState, setPlayerHp] = useState(100);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // ติดตามสถานะ Weapon ที่ใช้บนแมพ
  const [currentWeaponData, setCurrentWeaponData] = useState(null);

  // จัดการ State วิเคราะห์ Big O Complexity
  const [userBigO, setUserBigO] = useState(null);
  const [showBigOQuiz, setShowBigOQuiz] = useState(false);

  // จัดการระบบ Pattern
  const [patternData, setPatternData] = useState({});

  // ควบคุมระบบ Score ของด่าน
  const [finalScore, setFinalScore] = useState(null);

  // ระบบจัดการ Pattern ฝั่ง Admin
  const [goodPatterns, setGoodPatterns] = useState([]);

  // หน้าต่างแก้ไขโค้ด (Text Editor)
  const [textCode, setTextCode] = useState("");
  const [starterTextCode, setStarterTextCode] = useState("");
  const [codeValidation, setCodeValidation] = useState({ isValid: false, message: "" });

  // สถานะเก็บผลลัพธ์ Test Case
  const [testCaseResult, setTestCaseResult] = useState(null);

  // เรียกใช้ Service Hook เช็ค History System
  const { data: userProfileData } = useProfile();
  const { data: allLevelsRaw } = useLevels(1, 1000);
  const userProgress = userProfileData?.user_progress || [];
  const allLevelsData = allLevelsRaw?.levels || [];

  // ซ่อน Warning ส่วนที่เลิกใช้งานของ Blockly
  useSuppressBlocklyWarnings();


  // ═══════════════════════════════════════════
  // ฟังก์ชัน Validate รูปแบบโค้ด Text
  // ═══════════════════════════════════════════
  const { handleTextCodeChange } = useTextCodeValidation({
    currentLevel,
    textCode,
    workspaceRef,
    blocklyLoaded,
    setCodeValidation
  });

  const handleTextCodeChangeWithState = (newCode) => {
    setTextCode(newCode);
    handleTextCodeChange(newCode);
  };

  const handleInitialCodeGenerated = (newCode) => {
    setStarterTextCode(newCode);
    handleTextCodeChangeWithState(newCode);
  };

  // ═══════════════════════════════════════════
  // 1. โหลดข้อมูลด่าน (Level Data) และ อาวุธ (Weapons)
  // ═══════════════════════════════════════════

  const { data: levelData, isLoading: isLevelLoading, isError: isLevelError, error: levelError } = useLevel(levelId);
  const { data: weaponsResponse, isLoading: isWeaponsLoading } = useWeapons(1, 1000);

  // ดึงข้อมูลเข้า Cache ล่วงหน้า เพื่อให้ Phaser และ Blockly ใช้ getWeaponData แบบ Synchronous ได้
  useEffect(() => {
    if (weaponsResponse?.weapons) {
      seedWeaponsData(weaponsResponse.weapons);
    }
  }, [weaponsResponse]);

  // รันคำสั่งเตรียมด่านทันทีเมื่อ Level Data และ Weapons พร้อม
  useLevelInitializer({
    levelData,
    weaponsData: weaponsResponse?.weapons,
    isPreview,
    patternId,
    setEnabledBlocks,
    setGoodPatterns,
    setPlayerHp,
    setIsCompleted,
    setIsGameOver,
    setCurrentWeaponData,
    setGameState,
    setCurrentLevelState: setCurrentLevel,
    setTextCode,
    setCodeValidation
  });

  // ซิงก์ State แจ้ง Error จากหน้า Query โดยตรง
  const error = isLevelError ? (levelError?.message || "Failed to load level") : null;


  // วิเคราะห์โค้ดเทียบเคียง Pattern และแสดงหน้า Weapon
  usePatternAnalysis({
    blocklyLoaded,
    workspaceRef,
    workspaceVersion,
    goodPatterns,
    setPatternData,
    setCurrentWeaponData,
  });



  // Init ระบบ Blockly/Phaser และการ Cleanup ระหว่างย้ายด่าน
  useEffect(() => {
    if (!currentLevel || !blocklyRef.current || Object.keys(enabledBlocks).length === 0) {
      return;
    }

    initBlocklyAndPhaser();
    setWorkspaceVersion(v => v + 1);

    // เปิดจดหมายชี้แจงเควส (สำหรับโหมดปกติไม่ใช่ฝั่งแอดมิน)
    // รอให้หน้าจอมี Event คลิกก่อนเริ่มเล่น BGM (ตามกฎออโต้เพลย์เบราว์เซอร์)
    if (!isPreview && !missionAcceptedRef.current) {
      setShowMissionBriefing(true);
    } else {
      playBGM('game');
    }

    return () => {
      setBlocklyLoaded(false);
      clearPlayerCoins();
      clearRescuedPeople();

      // หยุด animation ทันทีเมื่อออกจากด่าน ป้องกันไม่ให้ animation ที่ค้างอยู่รันต่อแล้วไปตีกันในด่านใหม่
      animationController.abort();

      stopBGM();

      if (phaserGameRef.current) {
        try {
          phaserGameRef.current.destroy(true);
          phaserGameRef.current = null;
        } catch (e) {
          console.error("Error destroying Phaser game:", e);
        }
      }

      if (workspaceRef.current) {
        try {
          workspaceRef.current.dispose();
          workspaceRef.current = null;
        } catch (e) {
          console.warn("Error disposing workspace:", e);
        }
      }
    };
  }, [currentLevel, enabledBlocks, isWeaponsLoading]);

  // โหลดข้อมูล XML ตาม Pattern หากมีการสั่งในหน้า Admin Preview
  const prevPatternXmlRef = React.useRef(undefined);

  useEffect(() => {
    if (!isPreview || !workspaceRef.current || !blocklyLoaded) return;

    const prev = prevPatternXmlRef.current;
    prevPatternXmlRef.current = patternXml;

    // ถ้าเลือก Pattern → โหลด XML ของ Pattern นั้น
    if (patternXml) {
      try {
        removeStarterListener(workspaceRef.current);
        Blockly.Events.disable();
        workspaceRef.current.clear();
        Blockly.Events.enable();
        const xmlDom = Blockly.utils.xml.textToDom(patternXml);
        Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
      } catch (e) {
        Blockly.Events.enable();
        console.error("Error loading pattern XML into workspace:", e);
      }
    }
    // ถ้ายกเลิกเลือก (จาก Pattern กลับมา "เล่นเฉยๆ") → โหลด starter XML ของด่านใหม่
    else if (prev) {
      try {
        const isHard = currentLevel?.dificulty === 'hard';
        const isMedium = currentLevel?.dificulty === 'medium';
        const sXml = isHard ? null : currentLevel?.starter_xml;
        const fXml = (isMedium || isHard) ? null : currentLevel?.floating_xml;

        if (sXml) {
          loadStarterXml(workspaceRef.current, sXml, fXml, currentLevel?.textcode || false, handleInitialCodeGenerated);
        } else {
          Blockly.Events.disable();
          workspaceRef.current.clear();
          Blockly.Events.enable();
        }
      } catch (e) {
        Blockly.Events.enable();
        console.error("Error restoring starter XML into workspace:", e);
      }
    }
  }, [patternXml, blocklyLoaded, isPreview]);

  // เรียกการเริ่มเกมและจัดการคิว Phaser
  const { initPhaserGame } = usePhaserGame({
    gameRef,
    phaserGameRef,
    currentLevel,
    setCurrentWeaponData,
    setPlayerHp,
    setIsGameOver,
    isRunning
  });

  // ชุดคำสั่งสั่งรันและ Execute ของเกม
  const { runCode, executionError, clearExecutionError } = useCodeExecution({
    workspaceRef,
    currentLevel,
    codeValidation,
    blocklyLoaded,
    isPreview,
    patternId,
    onUnlockPattern,
    onUnlockLevel,
    getToken,
    textCode,
    setters: {
      setPlayerHp,
      setIsCompleted, setIsRunning, setIsGameOver,
      setGameState, setShowProgressModal,
      setGameResult, setFinalScore,
      setPatternData, setTestCaseResult
    },
    scoring: {
      goodPatterns, userBigO, patternData
    }
  });

  // ดักการเลือก Big O — ให้รันโค้ดต่อทันทีถ้ากำลังค้างสถานะรอตรวจสอบอยู่
  const handleBigOSelect = (value) => {
    setUserBigO(value);
    setShowBigOQuiz(false);
  };

  const handleReplayGame = () => {
    // 1. เคลียร์ค่า Execution States
    setShowProgressModal(false);
    setIsCompleted(false);
    setIsRunning(false);
    setIsGameOver(false);
    setGameState("ready");
    setGameResult(null);
    setTestCaseResult(null);

    // 2. สั่งหยุดการรัน Animations บนหน้าจอ
    animationController.abort();

    // 3. เคลียร์ State ตัวละคร (Global Entity)
    clearPlayerCoins();
    clearRescuedPeople();

    // 4. รีสตาร์ทเริ่ม Phaser Game ใหม่อย่างคลีนๆ
    initPhaserGame();
  };

  const handleRunClick = () => {
    if (patternData?.patternPercentage === 100 && patternData?.bestPatternBigO && !userBigO) {
      setShowBigOQuiz(true);
      return;
    }

    // ป้องกันบัคอนิเมชันพัง/ทับซ้อน ด้วยการเลือกรีทำใหม่เฉพาะเมื่อมีการรันไปแล้ว
    if (isCompleted || isGameOver || testCaseResult) {
      handleReplayGame();
      setTimeout(runCode, 50);
      return;
    }

    runCode();
  };

  // รันโค้ดทันทีทื่เพิ่งควิซ BigO เสร็จผ่าน
  useEffect(() => {
    // Only trigger if we have a BigO selected, no quiz is showing, 
    // and the game is currently 'ready' (preventing repeated runs if already completed/gameOver)
    if (userBigO && showBigOQuiz === false && gameState === 'ready') {
      // สั่งรันออโต้แค่ในตอนที่เพิ่งปิดแผงควิซ และเคยกดยืนยันปุ่ม "Run" ไว้อยู่แล่ว
      runCode();
    }
  }, [userBigO, showBigOQuiz]);

  const handleAutoInjectExample = () => {
    if (!workspaceRef.current) return;

    const isHard = currentLevel?.dificulty === 'hard';
    const isMedium = currentLevel?.dificulty === 'medium';

    const sXml = isHard ? null : currentLevel?.starter_xml;
    const fXml = (isMedium || isHard) ? null : currentLevel?.floating_xml;

    removeStarterListener(workspaceRef.current);
    Blockly.Events.disable();
    workspaceRef.current.clear();
    Blockly.Events.enable();

    if (sXml) {
      loadStarterXml(workspaceRef.current, sXml, fXml, currentLevel?.textcode || false, handleInitialCodeGenerated);
    }

    // สั่งเล่นแจ้งเตือนและส่งเสียง Notification
    playSound('powerup');
  };

  // วิเคราะห์ระดับความยาก (Difficulty) ว่าควรโหลดบล็อก XML ปริมาณไหนออกมา
  const isHardMode = currentLevel?.dificulty === 'hard';
  const isMediumMode = currentLevel?.dificulty === 'medium';

  const starterXmlToLoad = isHardMode ? null : (currentLevel?.starter_xml || null);
  const floatingXmlToLoad = (isMediumMode || isHardMode) ? null : (currentLevel?.floating_xml || null);

  // สั่งเริ่มระบบ Blockly ฝั่ง UI
  const { initBlocklyAndPhaser } = useBlocklySetup({
    blocklyRef,
    workspaceRef,
    enabledBlocks,
    setBlocklyLoaded,
    initPhaserGame,
    starter_xml: starterXmlToLoad,
    floating_xml: floatingXmlToLoad,
    blocklyLoaded,
    isTextCodeEnabled: currentLevel?.textcode || false,
    onCodeGenerated: handleInitialCodeGenerated,
    dificulty: currentLevel?.dificulty || 'easy'
  });

  // ควบคุมกลไกการแสดง Guide System
  const { showGuide, guides, closeGuide, openGuide, hasGuides } = useGuideSystem(currentLevel);

  const { selectedBlockType } = usePseudocodeSync({ blocklyLoaded, workspaceRef, patternData });

  if ((!levelData && isLevelLoading) || isWeaponsLoading) {
    return <PageLoader message="Loading level..." />;
  }

  if (error) {
    return <PageError message={error} />;
  }

  return (
    <>
      {showGuide && !showMissionBriefing && (
        <GuidePopup
          guides={guides}
          onClose={closeGuide}
          levelName={currentLevel?.level_name || 'ด่าน'}
        />
      )}

      {/* Mission Briefing Modal */}
      <MissionBriefing
        isOpen={showMissionBriefing}
        levelData={currentLevel}
        onStart={() => {
          setShowMissionBriefing(false);
          missionAcceptedRef.current = true;
        }}
      />

      <div className={`flex ${isPreview ? 'h-full' : 'h-screen'} bg-[#0f111a]`}>
        {/* Game Area - 60% */}
        <div className="w-[60%] relative bg-[#0f111a]">
          {/* Floating Level Name */}
          <div className="absolute top-4 left-4 z-40 pointer-events-none">
            <h2 className="text-xl font-bold text-white/90 drop-shadow-md bg-[#2e1065]/80 backdrop-blur-md px-3 py-1 rounded-lg border border-purple-500/30">
              {currentLevel?.level_name || `ด่าน ${levelId}`}
              {isPreview && <span className="ml-2 text-yellow-400 text-sm">(Preview)</span>}
            </h2>
          </div>
          <GameArea
            gameRef={gameRef}
            currentLevel={currentLevel}
            playerHpState={playerHpState}
            currentWeaponData={currentWeaponData}
            patternData={patternData}
            onUserBigOChange={handleBigOSelect}
            showBigOQuiz={showBigOQuiz}
            onCloseBigOQuiz={() => setShowBigOQuiz(false)}
            hasGuides={hasGuides}
            onOpenGuide={openGuide}
            isRunning={isRunning}
          />
        </div>

        {/* Blockly Area - 40% */}
        <div className="w-[40%] border-l border-black flex flex-col backdrop-blur-sm relative z-50">
          <div className="flex flex-col h-full relative">
            <div className="flex-1 min-h-0 relative shadow-2xl rounded-lg">
              <BlocklyArea
                blocklyRef={blocklyRef}
                blocklyLoaded={blocklyLoaded}
                runCode={handleRunClick}
                gameState={gameState}
                isRunning={isRunning}
                isGameOver={isGameOver}
                currentLevel={currentLevel}
                codeValidation={codeValidation}
                textCode={textCode}
                handleTextCodeChange={handleTextCodeChangeWithState}
                testCaseResult={testCaseResult}
                userProgress={userProgress}
                allLevels={allLevelsData}
                onLoadXml={() => setShowLoadXmlModal(true)}
                onAutoInject={handleAutoInjectExample}
                isPreview={isPreview}
                isAdmin={isAdmin}
                starterTextCode={starterTextCode}
                patternData={patternData}
                selectedBlockType={selectedBlockType}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Modal - normal mode only */}
      {!isPreview && (
        <>
          <ProgressModal
            isOpen={showProgressModal}
            onClose={() => setShowProgressModal(false)}
            onReplay={handleReplayGame}
            gameResult={gameResult}
            levelData={currentLevel}
            blocklyXml={workspaceRef.current ? Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspaceRef.current)) : null}
            textCodeContent={currentLevel?.textcode ? textCode || '' : null}
            finalScore={finalScore}
            hp_remaining={playerHpState}
            getToken={getToken}
            userBigO={userBigO}
            targetBigO={patternData?.bestPatternBigO || patternData?.bestPattern?.big_o || patternData?.bestPattern?.bigO}
          />

          {!showProgressModal && (isCompleted || isGameOver) && (
            <button
              onClick={() => setShowProgressModal(true)}
              className="fixed top-20 right-4 z-50 group transition-transform hover:scale-105 active:translate-y-1 w-48"
            >
              <img
                src="/button.png"
                alt="Show Results"
                className="w-full h-auto block select-none"
                style={{ imageRendering: 'pixelated' }}
              />
              <img
                src="/buttonhover.png"
                alt="Show Results Hover"
                className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-100 select-none"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 pb-1 text-[#fdf6e3] group-hover:text-white font-bold font-pixel text-[10px] sm:text-xs tracking-wider uppercase drop-shadow-md">
                <span>SHOW RESULTS</span>
              </div>
            </button>
          )}
        </>
      )}

      {/* Load XML Modal */}
      {(isPreview || isAdmin) && (
        <LoadXmlModal
          isOpen={showLoadXmlModal}
          onClose={() => setShowLoadXmlModal(false)}
          options={EXAMPLE_LOADERS.map(loader => ({
            ...loader,
            onClick: () => {
              if (workspaceRef.current) {
                workspaceRef.current.clear();
                loader.loader(workspaceRef.current);
              }
            }
          }))}
        />
      )}

      <ExecutionErrorModal
        open={!!executionError}
        error={executionError}
        onClose={clearExecutionError}
      />
    </>
  );
};

export default GameCore;
