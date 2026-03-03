// src/components/playgame/GameCore.jsx
// Core game component that can be reused for both normal play and preview mode
import React, { useEffect, useRef, useState } from "react";

import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import useUserStore from '../../store/useUserStore';
import ProgressModal from '../../pages/user/ProgressModal';
import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/javascript";
window.Blockly = Blockly;

// Import utilities and data
import { getWeaponData } from '../../gameutils/entities/weaponUtils';
import { getRescuedPeople, clearRescuedPeople } from '../../gameutils/entities/personUtils';
import { clearPlayerCoins } from '../../gameutils/entities/coinUtils';
import { getCurrentGameState } from '../../gameutils/shared/game';
import { displayPlayerWeapon } from '../../gameutils/combat/weaponEffects';
import { clearGameOverScreen } from '../../gameutils/effects/gameEffects';

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
import { usePatterns } from '../../services/hooks/usePattern';
import { useLevelInitializer } from './hooks/useLevelLoader';
import { usePatternAnalysis } from './hooks/usePatternAnalysis';
import { useTextCodeValidation } from './hooks/useTextCodeValidation';
import { useGuideSystem } from '../../hooks/useGuideSystem';

// Import utils
import { handleRestartGame as handleRestartGameUtil } from './utils/gameHandlers';
import { EXAMPLE_LOADERS } from './constants/exampleLoaders';
import ExecutionErrorModal from './modals/ExecutionErrorModal';
import PageLoader from '../../components/shared/Loading/PageLoader';
import { useSuppressBlocklyWarnings } from '../../components/admin/level/hooks/useSuppressBlocklyWarnings';

const resetAllGameStates = () => {
  clearPlayerCoins();
  clearRescuedPeople();
};

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
  const gameStartTime = useRef(null);

  const [gameState, setGameState] = useState("loading");
  const [currentHint, setCurrentHint] = useState("Loading level data...");
  const [blocklyLoaded, setBlocklyLoaded] = useState(0);
  const [blocklyJavaScriptReady, setBlocklyJavaScriptReady] = useState(false);

  // Progress tracking
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [gameResult, setGameResult] = useState(null);

  // Level data
  const [currentLevel, setCurrentLevel] = useState(null);
  const [enabledBlocks, setEnabledBlocks] = useState({});
  const [error, setError] = useState(null);

  // Load XML Modal
  const [showLoadXmlModal, setShowLoadXmlModal] = useState(false);

  // Game state
  const [playerNodeId, setPlayerNodeId] = useState(0);
  const [playerDirection, setPlayerDirection] = useState(0);
  const [playerHpState, setPlayerHp] = useState(100);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Weapon tracking
  const [currentWeaponData, setCurrentWeaponData] = useState(null);

  // Big O complexity
  const [userBigO, setUserBigO] = useState(null);
  const [showBigOQuiz, setShowBigOQuiz] = useState(false);

  // Hint system
  const [hintData, setHintData] = useState({
    hint: "วาง blocks เพื่อเริ่มต้น",
    showHint: false,
    currentStep: 0,
    totalSteps: 0,
    progress: 0
  });

  // Score system
  const [finalScore, setFinalScore] = useState(null);

  // Hint panel state
  const [hintOpen, setHintOpen] = useState(false);

  // Ensure finalScore is set when game is over
  useEffect(() => {
    if (isGameOver && !finalScore) {
      setFinalScore({ totalScore: 0, stars: 0 });
    }
  }, [isGameOver, finalScore]);


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

  // Set blocklyJavaScriptReady when blocklyLoaded becomes true
  useEffect(() => {
    if (blocklyLoaded && workspaceRef.current && !blocklyJavaScriptReady) {
      setBlocklyJavaScriptReady(true);
    }
  }, [blocklyLoaded, blocklyJavaScriptReady]);

  // Suppress Blockly deprecation warnings
  useSuppressBlocklyWarnings();

  // Text code validation
  const { handleTextCodeChange } = useTextCodeValidation({
    currentLevel,
    textCode,
    workspaceRef,
    blocklyLoaded,
    blocklyJavaScriptReady,
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

  const { data: levelData, isLoading: isLevelLoading, isError: isLevelError, error: levelError } = useLevel(levelId);

  useLevelInitializer({
    levelData,
    getToken,
    isPreview,
    setEnabledBlocks,
    setGoodPatterns,
    setCurrentHint,
    setPlayerNodeId,
    setPlayerDirection,
    setPlayerHp,
    setIsCompleted,
    setIsGameOver,
    setCurrentWeaponData,
    setGameState,
    setCurrentLevelState: setCurrentLevel
  });

  // Sync error state from query
  useEffect(() => {
    if (isLevelError && levelError) {
      setError(levelError.message || "Failed to load level");
    }
  }, [isLevelError, levelError]);

  // Reset text code state when level changes
  useEffect(() => {
    if (levelId) {
      setTextCode("");
      setCodeValidation({ isValid: false, message: "" });
      setBlocklyJavaScriptReady(false);
      resetAllGameStates();
    }
  }, [levelId]);

  // Load patterns for the level
  const { data: patternsData } = usePatterns(currentLevel?.level_id || currentLevel?.id);

  useEffect(() => {
    if (patternsData) {
      const patterns = Array.isArray(patternsData) ? patternsData : (patternsData.patterns || []);
      let filteredPatterns = isPreview
        ? patterns
        : patterns.filter(p => p.is_available === true);

      // If a specific pattern is selected in preview mode, ONLY test against that pattern
      if (isPreview && patternId !== null) {
        filteredPatterns = filteredPatterns.filter(p => String(p.pattern_id) === String(patternId));
      }

      setGoodPatterns(filteredPatterns);
      console.log('🟡 [GameCore] setGoodPatterns:', filteredPatterns.length, 'patterns, patternId:', patternId, 'blocklyLoaded:', blocklyLoaded);
    }
  }, [patternsData, isPreview, patternId]);

  // Pattern analysis and weapon display
  usePatternAnalysis({
    blocklyLoaded,
    workspaceRef,
    goodPatterns,
    setHintData,
    setCurrentWeaponData,
  });

  // Load pattern XML if provided (Admin Preview Pattern Selector)
  // ใช้ ref เพื่อจำค่าเก่า ป้องกันไม่ให้ยิงตอนเข้าด่านครั้งแรก (useBlocklySetup จัดการเองแล้ว)
  const prevPatternXmlRef = React.useRef(undefined);

  useEffect(() => {
    if (!isPreview || !workspaceRef.current || !blocklyLoaded) return;

    const prev = prevPatternXmlRef.current;
    prevPatternXmlRef.current = patternXml;

    // ถ้าเลือก Pattern → โหลด XML ของ Pattern นั้น
    if (patternXml) {
      try {
        workspaceRef.current.clear();
        const xmlDom = Blockly.utils.xml.textToDom(patternXml);
        Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
      } catch (e) {
        console.error("Error loading pattern XML into workspace:", e);
      }
    }
    // ถ้ายกเลิกเลือก (จาก Pattern กลับมา "เล่นเฉยๆ") → โหลด starter XML ของด่าน
    else if (prev) {
      try {
        workspaceRef.current.clear();
        if (currentLevel?.starter_xml) {
          const xmlDom = Blockly.utils.xml.textToDom(currentLevel.starter_xml);
          Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
        }
      } catch (e) {
        console.error("Error loading starter XML into workspace:", e);
      }
    }
    // ถ้าทั้ง patternXml และ prev เป็น null/undefined → เพิ่งเข้าด่าน, ไม่ต้องทำอะไร (useBlocklySetup จัดการแล้ว)
  }, [patternXml, blocklyLoaded, isPreview]);

  // Initialize Blockly and Phaser when ready
  useEffect(() => {
    if (!currentLevel || !blocklyRef.current || Object.keys(enabledBlocks).length === 0) {
      return;
    }

    initBlocklyAndPhaser();

    return () => {
      resetAllGameStates();

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
  }, [currentLevel, blocklyRef.current]);

  // Update player weapon display
  const updatePlayerWeaponDisplay = () => {
    const currentState = getCurrentGameState();
    const weaponKey = currentState.weaponKey || 'stick';
    const weaponData = getWeaponData(weaponKey);
    setCurrentWeaponData(weaponData);

    const currentScene = getCurrentGameState().currentScene;
    if (currentScene && currentScene.add && currentScene.player) {
      try {
        displayPlayerWeapon(weaponKey, currentScene);
      } catch (error) {
        console.error("Error updating weapon display:", error);
      }
    }
  };

  // Handle restart game
  const handleRestartGame = () => {
    handleRestartGameUtil({
      currentLevel,
      setPlayerNodeId,
      setPlayerDirection,
      setPlayerHp,
      setIsCompleted,
      setIsGameOver,
      setGameState,
      setCurrentHint,
      clearGameOverScreen,
      updatePlayerWeaponDisplay
    });
    setTestCaseResult(null);
  };

  // Initialize Phaser game
  const { initPhaserGame } = usePhaserGame({
    gameRef,
    phaserGameRef,
    currentLevel,
    setCurrentWeaponData,
    setPlayerHp,
    setIsGameOver,
    setCurrentHint,
    isRunning,
    handleRestartGame
  });

  // Code execution
  const { runCode, executionError, clearExecutionError } = useCodeExecution({
    workspaceRef,
    currentLevel,
    blocklyJavaScriptReady,
    codeValidation,
    isPreview,
    patternId,
    onUnlockPattern,
    onUnlockLevel,
    gameStartTime,
    getToken,
    textCode,
    setters: {
      setPlayerNodeId, setPlayerDirection, setPlayerHp,
      setIsCompleted, setIsRunning, setIsGameOver,
      setGameState, setCurrentHint, setShowProgressModal,
      setGameResult, setFinalScore,
      setHintData, setTestCaseResult
    },
    scoring: {
      goodPatterns, userBigO, hintData
    }
  });

  // Big O selection — runs code immediately after selection if pending
  const handleBigOSelect = (value) => {
    setUserBigO(value);
    setShowBigOQuiz(false);
  };

  const handleRunClick = () => {
    if (hintData?.patternPercentage === 100 && hintData?.bestPatternBigO && !userBigO) {
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
    setBlocklyJavaScriptReady,
    initPhaserGame,
    starter_xml: currentLevel?.starter_xml || null,
    blocklyLoaded,
    isTextCodeEnabled: currentLevel?.textcode || false,
    onCodeGenerated: handleInitialCodeGenerated
  });

  // Guide system
  const { showGuide, guides, closeGuide, openGuide, hasGuides } = useGuideSystem(currentLevel);

  // Handle need hint click (UI validation only, actual checks happen on render via needHintDisabled)
  const handleNeedHintClick = () => {
    setHintOpen(true);
  };

  if (!levelData && isLevelLoading) {
    return <PageLoader message="Loading level..." />;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">Error: {error}</div>;
  }

  return (
    <>
      {showGuide && (
        <GuidePopup
          guides={guides}
          onClose={closeGuide}
          levelName={currentLevel?.name || 'ด่าน'}
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
            hintData={hintData}
            hintOpen={hintOpen}
            onToggleHint={() => setHintOpen(false)}
            levelHints={Array.isArray(currentLevel?.hints) ? currentLevel.hints : []}
            onNeedHintClick={handleNeedHintClick}
            needHintDisabled={
              !Array.isArray(currentLevel?.hints) ||
              currentLevel.hints.filter(h => h.is_active !== false).length === 0
            }
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
                blocklyJavaScriptReady={blocklyJavaScriptReady}
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
            targetBigO={hintData?.bestPatternBigO || hintData?.bestPattern?.big_o || hintData?.bestPattern?.bigO}
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