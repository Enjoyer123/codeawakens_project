import React, { useEffect, useRef, useState } from "react";
import { playBGM, stopBGM } from '../../gameutils/sound/soundManager';
import { removeStarterListener, loadStarterXml } from './hooks/blocklysetup/xmlLoader';
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import useUserStore from '../../store/useUserStore';
import ProgressModal from '../../pages/user/ProgressModal';
import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/javascript";
// Import utilities and data
import { clearRescuedPeople } from '../../gameutils/entities/personUtils';
import { clearPlayerCoins } from '../../gameutils/entities/coinUtils';
import { seedWeaponsData } from '../../gameutils/entities/weaponUtils';

// Import components
import GameArea from './GameArea';
import BlocklyArea from './BlocklyArea';
import GuidePopup from './modals/GuidePopup';
import LoadXmlModal from './modals/LoadXmlModal';

// Import custom hooks
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
import { useHintSystem } from '../../hooks/useHintSystem';

import { EXAMPLE_LOADERS } from './constants/exampleLoaders';
import ExecutionErrorModal from './modals/ExecutionErrorModal';
import PageLoader from '../../components/shared/Loading/PageLoader';
import { useSuppressBlocklyWarnings } from '../../components/admin/level/hooks/useSuppressBlocklyWarnings';

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

  // Progress tracking
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [gameResult, setGameResult] = useState(null);

  // Level data
  const [currentLevel, setCurrentLevel] = useState(null);
  const [enabledBlocks, setEnabledBlocks] = useState({});
  const [workspaceVersion, setWorkspaceVersion] = useState(0);


  // Load XML Modal
  const [showLoadXmlModal, setShowLoadXmlModal] = useState(false);

  // Game state
  const [playerHpState, setPlayerHp] = useState(100);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Weapon tracking
  const [currentWeaponData, setCurrentWeaponData] = useState(null);

  // Big O complexity
  const [userBigO, setUserBigO] = useState(null);
  const [showBigOQuiz, setShowBigOQuiz] = useState(false);

  // Pattern system
  const [patternData, setPatternData] = useState({});

  // Score system
  const [finalScore, setFinalScore] = useState(null);

  // Admin pattern management
  const [goodPatterns, setGoodPatterns] = useState([]);

  // Text code editor
  const [textCode, setTextCode] = useState("");
  const [starterTextCode, setStarterTextCode] = useState("");
  const [codeValidation, setCodeValidation] = useState({ isValid: false, message: "" });

  // Test result
  const [testCaseResult, setTestCaseResult] = useState(null);

  // History system (reuse existing service hooks)
  const { data: userProfileData } = useProfile();
  const { data: allLevelsRaw } = useLevels(1, 1000);
  const userProgress = userProfileData?.user_progress || [];
  const allLevelsData = allLevelsRaw?.levels || [];

  // Suppress Blockly deprecation warnings
  useSuppressBlocklyWarnings();


  // ═══════════════════════════════════════════
  // Text code validation
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
  // 1. DATA LOADING — level + weapons
  // ═══════════════════════════════════════════

  const { data: levelData, isLoading: isLevelLoading, isError: isLevelError, error: levelError } = useLevel(levelId);
  const { data: weaponsResponse, isLoading: isWeaponsLoading } = useWeapons(1, 1000);
  
  // Seed physical cache early so Phraser/Blockly formatters can use synchronous getWeaponData
  useEffect(() => {
    if (weaponsResponse?.weapons) {
      seedWeaponsData(weaponsResponse.weapons);
    }
  }, [weaponsResponse]);

  // Initialize level after levelData and weaponsCache are ready
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

  // Sync error state directly from query
  const error = isLevelError ? (levelError?.message || "Failed to load level") : null;


  // Pattern analysis and weapon display
  usePatternAnalysis({
    blocklyLoaded,
    workspaceRef,
    workspaceVersion,
    goodPatterns,
    setPatternData,
    setCurrentWeaponData,
  });



  // Init Blockly & Phaser + cleanup ตอนออกจากด่าน
  useEffect(() => {
    if (!currentLevel || !blocklyRef.current || Object.keys(enabledBlocks).length === 0) {
      return;
    }

    initBlocklyAndPhaser();
    setWorkspaceVersion(v => v + 1);
    playBGM('game');

    return () => {
      setBlocklyLoaded(false);
      clearPlayerCoins();
      clearRescuedPeople();

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

  // Load pattern XML if provided (Admin Preview Pattern Selector)
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
        if (currentLevel?.starter_xml) {
          loadStarterXml(workspaceRef.current, currentLevel.starter_xml, currentLevel?.textcode || false, handleInitialCodeGenerated);
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

  // Initialize Phaser game
  const { initPhaserGame } = usePhaserGame({
    gameRef,
    phaserGameRef,
    currentLevel,
    setCurrentWeaponData,
    setPlayerHp,
    setIsGameOver,
    isRunning
  });

  // Code execution
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

  // Big O selection — runs code immediately after selection if pending
  const handleBigOSelect = (value) => {
    setUserBigO(value);
    setShowBigOQuiz(false);
  };

  const handleRunClick = () => {
    if (patternData?.patternPercentage === 100 && patternData?.bestPatternBigO && !userBigO) {
      setShowBigOQuiz(true);
      return;
    }
    runCode();
  };

  // After BigO is set (via quiz), run code
  useEffect(() => {
    // Only trigger if we have a BigO selected, no quiz is showing, 
    // and the game is currently 'ready' (preventing repeated runs if already completed/gameOver)
    if (userBigO && showBigOQuiz === false && gameState === 'ready') {
      // Only trigger this if we just closed the quiz and had hit "Run" before
      runCode();
    }
  }, [userBigO, showBigOQuiz]);

  // Initialize Blockly
  const { initBlocklyAndPhaser } = useBlocklySetup({
    blocklyRef,
    workspaceRef,
    enabledBlocks,
    setBlocklyLoaded,
    initPhaserGame,
    starter_xml: currentLevel?.starter_xml || null,
    blocklyLoaded,
    isTextCodeEnabled: currentLevel?.textcode || false,
    onCodeGenerated: handleInitialCodeGenerated
  });

  // Guide system
  const { showGuide, guides, closeGuide, openGuide, hasGuides } = useGuideSystem(currentLevel);

  const { showHint, hints, closeHint, openHint, hasHints } = useHintSystem(currentLevel);

  if ((!levelData && isLevelLoading) || isWeaponsLoading) {
    return <PageLoader message="Loading level..." />;
  }

  if (error) {
    return <PageError message={error} />;
  }

  return (
    <>
      {showGuide && (
        <GuidePopup
          guides={guides}
          onClose={closeGuide}
          levelName={currentLevel?.level_name || 'ด่าน'}
        />
      )}
      <div className={`flex ${isPreview ? 'h-full' : 'h-screen'} bg-[#0f111a]`}>
        {/* Game Area - 50% */}
        <div className="w-[50%] relative bg-[#0f111a]">
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
            hintOpen={showHint}
            onToggleHint={closeHint}
            levelHints={hints}
            hasHints={hasHints}
            onOpenHint={openHint}
            onUserBigOChange={handleBigOSelect}
            showBigOQuiz={showBigOQuiz}
            onCloseBigOQuiz={() => setShowBigOQuiz(false)}
            hasGuides={hasGuides}
            onOpenGuide={openGuide}
          />
        </div>

        {/* Blockly Area - 50% */}
        <div className="w-[50%] border-l border-black flex flex-col backdrop-blur-sm overflow-hidden">
          <div className="flex flex-col h-full relative">
            <div className="flex-1 min-h-0 relative shadow-2xl rounded-lg overflow-hidden">
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
                isPreview={isPreview}
                isAdmin={isAdmin}
                starterTextCode={starterTextCode}
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
