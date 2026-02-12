// src/components/playegame/GameCore.jsx
// Core game component that can be reused for both normal play and preview mode
import React, { useEffect, useMemo, useRef, useState } from "react";
// import { updateTrainScheduleVisuals, updateRopePartitionVisuals } from '../../gameutils/phaser';
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import ProgressModal from '../../pages/user/ProgressModal';
import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/javascript";

// import { API_BASE_URL } from '../../config/apiConfig';
// NOTE: 11/2/2026 เป็นแบบ golbal ต้องเปลี่ยนเป็นของใครของมัน
window.Blockly = Blockly;

// Import utilities and data
import {
  getWeaponData,
  getRescuedPeople,
  displayPlayerWeapon,
  getCollectedTreasures,
  clearPlayerCoins,
  clearRescuedPeople,
  clearStack
} from '../../gameutils/shared/items';
import {
  getCurrentGameState,
} from '../../gameutils/shared/game';
import {
  isInCombat
} from '../../gameutils/shared/combat';
import { clearGameOverScreen, showGameOver, showVictory } from '../../gameutils/phaser';

// Import components
import GameArea from './GameArea';
import BlocklyArea from './BlocklyArea';
import GameWithGuide from './GameWithGuide';
import LoadXmlModal from './LoadXmlModal';

// Import custom hooks
import { useGameActions } from './hooks/useGameActions';
import { useGameConditions } from './hooks/useGameConditions';
import { usePhaserGame } from './hooks/usePhaserGame';
import { useBlocklySetup } from './hooks/blocklysetup/useBlocklySetup';
import { useCodeExecution } from './hooks/execution/useCodeExecution';
import { useGameHistory } from './hooks/useGameData';
import { useLevel } from '../../services/hooks/useLevel';
import { usePatterns } from '../../services/hooks/usePattern';
import { useLevelInitializer } from './hooks/useLevelLoader';
import { usePatternAnalysis } from './hooks/usePatternAnalysis';
import { useTextCodeValidation } from './hooks/useTextCodeValidation';
import { useGuideSystem } from '../../hooks/useGuideSystem';
import { getUserByClerkId } from '../../services/profileService';
import { fetchAllLevels } from '../../services/levelService';


// Import utils
import { calculateFinalScore } from './utils/scoreUtils';
import { highlightBlocks as highlightBlocksUtil, clearHighlights as clearHighlightsUtil } from './utils/visualGuide';
import { handleRestartGame as handleRestartGameUtil, handleVictory as handleVictoryUtil } from './utils/gameHandlers';
// Import example loaders configuration
import { EXAMPLE_LOADERS } from './constants/exampleLoaders';
// Import API bridges
import { setupRopePartitionBridge } from './utils/apiBridges/ropePartitionBridge';
import { updateTrainScheduleVisualsIfNeeded, updateRopePartitionVisualsIfNeeded } from './utils/apiBridges/visualUpdates';
import ExecutionErrorModal from './ExecutionErrorModal';
import PageLoader from '../../components/shared/Loading/PageLoader';
import { resetDijkstraState } from '../../gameutils/blockly/graph/dijkstraStateManager';
import { resetAntDpTableState } from '../../gameutils/blockly/algorithms/ant_dp/antDpStateManager';
import { resetCoinChangeTableState } from '../../gameutils/blockly/algorithms/coin_change/coinChangeStateManager';
import { resetKnapsackTableState } from '../../gameutils/blockly/algorithms/knapsack/knapsackStateManager';
import { resetSubsetSumTableState } from '../../gameutils/blockly/algorithms/subset_sum/subsetSumStateManager';

const resetAllGameStates = () => {
  resetDijkstraState();
  resetAntDpTableState();
  resetCoinChangeTableState();
  resetKnapsackTableState();
  resetSubsetSumTableState();

  // Clear shared game state (Coins, People, Treasures)
  clearPlayerCoins();
  clearRescuedPeople();
  clearStack();
};


/**
 * GameCore Component
 * 
 * @param {Object} props
 * @param {string} props.levelId - Level ID to load
 * @param {boolean} props.isPreview - Whether this is preview mode (default: false)
 * @param {number} props.patternId - Pattern ID for preview mode (optional)
 * @param {Function} props.onSaveProgress - Callback function to save progress (optional, only used in normal mode)
 * @param {Function} props.onUnlockPattern - Callback function when pattern is unlocked (optional, for preview mode)
 * @param {Function} props.onUnlockLevel - Callback function when level is unlocked (optional, for preview mode)
 */
const GameCore = ({
  levelId: propLevelId,
  isPreview = false,
  patternId = null,
  onSaveProgress = null,
  onUnlockPattern = null,
  onUnlockLevel = null
}) => {
  const { levelId: paramLevelId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  // Use prop levelId if provided, otherwise use param from route
  const levelId = propLevelId || paramLevelId;

  // Suppress Blockly deprecation warnings globally for this component
  useEffect(() => {
    const originalConsoleWarn = console.warn;
    console.warn = function (...args) {
      const message = args.join(' ');
      if (message.includes('getAllVariables was deprecated') ||
        message.includes('Use Blockly.Workspace.getVariableMap().getAllVariables instead') ||
        message.includes('Blockly.Workspace.getAllVariables was deprecated')) {
        return;
      }
      originalConsoleWarn.apply(console, args);
    };

    return () => {
      console.warn = originalConsoleWarn;
    };
  }, []);



  const gameRef = useRef(null);
  const blocklyRef = useRef(null);
  const workspaceRef = useRef(null);
  const phaserGameRef = useRef(null);
  const highlightOverlaysRef = useRef({});


  const [gameState, setGameState] = useState("loading");
  const [currentHint, setCurrentHint] = useState("Loading level data...");
  const [blocklyLoaded, setBlocklyLoaded] = useState(false);



  // Progress tracking state (only used in normal mode)
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const gameStartTime = useRef(null);

  // State for API data
  const [currentLevel, setCurrentLevel] = useState(null);
  const [enabledBlocks, setEnabledBlocks] = useState({});
  const enabledBlockKeySignature = useMemo(
    () => Object.keys(enabledBlocks).sort().join(','),
    [enabledBlocks]
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load XML Modal state
  const [showLoadXmlModal, setShowLoadXmlModal] = useState(false);

  // Game state
  const [playerNodeId, setPlayerNodeId] = useState(0);
  const [playerDirection, setPlayerDirection] = useState(0);
  const [playerHpState, setPlayerHp] = useState(100);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Simplified weapon tracking
  const [currentWeaponData, setCurrentWeaponData] = useState(null);
  const [patternFeedback, setPatternFeedback] = useState("วาง blocks เพื่อดูผลลัพธ์");
  const [partialWeaponKey, setPartialWeaponKey] = useState(null);
  const [earnedWeaponKey, setEarnedWeaponKey] = useState(null);

  // Big O complexity state
  const [userBigO, setUserBigO] = useState(null);
  const [showBigOQuiz, setShowBigOQuiz] = useState(false);



  const handleBigOSelect = (value) => {
    setUserBigO(value);
    setShowBigOQuiz(false);
  };

  // Hint system state
  const [hintData, setHintData] = useState({
    hint: "วาง blocks เพื่อเริ่มต้น",
    showHint: false,
    currentStep: 0,
    totalSteps: 0,
    progress: 0
  });



  // Score system state
  const [finalScore, setFinalScore] = useState(null);

  // Hint open / count state
  const [hintOpen, setHintOpen] = useState(false);
  const [hintOpenCount, setHintOpenCount] = useState(0);
  const hintOpenAtStepRef = useRef(null);

  // Ensure finalScore is set when game is over
  useEffect(() => {
    if (isGameOver && !finalScore) {
      setFinalScore({ totalScore: 0, stars: 0 });
    }
  }, [isGameOver, finalScore]);

  // Combat system state
  const [inCombatMode, setInCombatMode] = useState(false);

  // Person rescue state
  const [rescuedPeople, setRescuedPeople] = useState([]);
  // Treasure collection state
  const [collectedTreasures, setCollectedTreasures] = useState([]);

  // Level-based hints (from DB) state for Need Hint button
  const [levelHintIndex, setLevelHintIndex] = useState(0);
  const [activeLevelHint, setActiveLevelHint] = useState(null);

  // Sync combat state with combat system
  // NOTE: 10/2/69 This is not used in preview mode


  // Sync rescued people state
  useEffect(() => {
    const interval = setInterval(() => {
      const currentRescued = getRescuedPeople();
      setRescuedPeople(currentRescued);

      // Also sync collected treasures
      const currentTreasures = getCollectedTreasures();
      setCollectedTreasures(currentTreasures);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Admin pattern management
  const [goodPatterns, setGoodPatterns] = useState([]);

  // Text code editor state
  const [textCode, setTextCode] = useState("");
  const [codeValidation, setCodeValidation] = useState({ isValid: false, message: "" });
  const [blocklyJavaScriptReady, setBlocklyJavaScriptReady] = useState(false);



  // History system state - using TanStack Query
  const { userProgress, allLevels: allLevelsData } = useGameHistory();

  // Fetch user progress and all levels

  // Ideally, invalidate query here, but for now relies on natural refetch or we can import useQueryClient
  // For simplicity, we assume ProgressModal might trigger refetch internally or just let it be.
  // Actually, useGameHistory relies on useUserProfile which has staleTime 5 mins.
  // We should invalidate 'userProfile' when level is completed/saved.
  // ProgressModal saves data. We can pass a refetch function if needed,
  // or better, handle invalidation in the mutation that saves progress (which is likely in ProgressModal or passed down).
  // Current GameCore doesn't have the save mutation visible here (passed as prop or handled inside logic).
  const handleCloseProgressModal = () => {
    setShowProgressModal(false);
  };

  // Set blocklyJavaScriptReady when blocklyLoaded becomes true
  useEffect(() => {
    console.log("🔍 useEffect for blocklyJavaScriptReady:", {
      blocklyLoaded,
      hasWorkspace: !!workspaceRef.current,
      blocklyJavaScriptReady,
      shouldSet: blocklyLoaded && workspaceRef.current && !blocklyJavaScriptReady
    });

    if (blocklyLoaded && workspaceRef.current && !blocklyJavaScriptReady) {
      console.log("✅ blocklyLoaded is true, setting blocklyJavaScriptReady to true");
      setBlocklyJavaScriptReady(true);
    }
  }, [blocklyLoaded, blocklyJavaScriptReady]);

  // Debug: Log codeValidation changes




  // Text code validation - using hook
  const { handleTextCodeChange } = useTextCodeValidation({
    currentLevel,
    textCode,
    workspaceRef,
    blocklyLoaded,
    blocklyJavaScriptReady,
    setCodeValidation
  });

  // Handle text code changes with state update
  const handleTextCodeChangeWithState = (newCode) => {
    setTextCode(newCode);
    handleTextCodeChange(newCode);
  };

  // Initialize game action and condition hooks
  const { moveForward, turnLeft, turnRight, hit } = useGameActions({
    currentLevel,
    setPlayerNodeId,
    setPlayerDirection,
    setCurrentHint,
    setIsGameOver,
    setGameState,
    setShowProgressModal,
    setTimeSpent,
    setGameResult,
    gameStartTime,
    isPreview
  });

  const { foundMonster, canMoveForward, nearPit, atGoal } = useGameConditions({
    currentLevel
  });





  const { data: levelData, isLoading: isLevelLoading, isError: isLevelError, error: levelError } = useLevel(levelId);

  // Initialize level data when levelData is available
  useLevelInitializer({
    levelData, // Pass the data from useLevel
    getToken,
    isPreview,
    // setLoading, // No longer passed, state handled here
    // setError,   // No longer passed
    // setCurrentLevel, // No longer passed, we only set it here via local effect if needed or rely on levelData
    setEnabledBlocks,
    setGoodPatterns,
    setCurrentHint,
    setPlayerNodeId,
    setPlayerDirection,
    setPlayerHp,
    setIsCompleted,
    setIsGameOver,
    setCurrentWeaponData,
    setPatternFeedback,
    setGameState,
    setCurrentLevelState: setCurrentLevel // Mapping back to the state setter
  });

  // Sync loading and error states
  useEffect(() => {
    setLoading(isLevelLoading);
  }, [isLevelLoading]);

  useEffect(() => {
    if (isLevelError && levelError) {
      setError(levelError.message || "Failed to load level");
    }
  }, [isLevelError, levelError]);


  // Reset text code state when level changes
  useEffect(() => {
    if (levelId) {
      console.log("🔄 Resetting text code state for new level:", levelId);
      setTextCode("");
      setCodeValidation({ isValid: false, message: "" });
      setBlocklyJavaScriptReady(false);
      resetAllGameStates(); // Reset algorithm visual state
    }
  }, [levelId]);

  // Load patterns for the level using TanStack Query
  const { data: patternsData } = usePatterns(currentLevel?.level_id || currentLevel?.id);

  useEffect(() => {
    if (patternsData) {
      // Handle both array and object with patterns property
      const patterns = Array.isArray(patternsData) ? patternsData : (patternsData.patterns || []);

      // In preview mode, use all patterns (including is_available = false)
      // In normal mode, only use patterns with is_available = true
      const filteredPatterns = isPreview
        ? patterns
        : patterns.filter(p => p.is_available === true);

      setGoodPatterns(filteredPatterns);
    }
  }, [patternsData, isPreview]);

  // Pattern analysis and weapon display - using hook


  usePatternAnalysis({
    blocklyLoaded,
    workspaceRef,
    goodPatterns,
    setHintData,
    setCurrentHint, // <- Added
    setCurrentWeaponData,
    setPatternFeedback,
    setPartialWeaponKey,

    hintOpen,        // <- Added
    hintData         // <- Added
  });

  // Initialize Blockly and Phaser when ready
  useEffect(() => {
    console.log("🔧 useEffect for initBlocklyAndPhaser triggered", {
      gameState,
      enabledBlockKeySignature,
      enabledBlocksCount: Object.keys(enabledBlocks).length
    });
    if (!currentLevel || !blocklyRef.current) {
      console.log("⏸️ Waiting for currentLevel or blocklyRef");
      return;
    }
    if (!enabledBlockKeySignature || Object.keys(enabledBlocks).length === 0) {
      console.log("⏸️ Waiting for enabledBlocks");
      return;
    }
    console.log("✅ All conditions met, calling initBlocklyAndPhaser");
    initBlocklyAndPhaser();

    // Cleanup function
    return () => {
      console.log("🧹 Cleanup: Destroying Phaser game and Blockly workspace...");

      resetAllGameStates(); // Reset algorithm visual state

      if (phaserGameRef.current) {
        try {
          phaserGameRef.current.destroy(true);
          phaserGameRef.current = null;
          console.log("✅ Phaser game destroyed");
        } catch (e) {
          console.error("❌ Error destroying Phaser game:", e);
        }
      }

      if (workspaceRef.current) {
        try {
          workspaceRef.current.dispose();
          workspaceRef.current = null;
          console.log("✅ Blockly workspace disposed");
        } catch (e) {
          console.warn("Error disposing workspace:", e);
        }
      }
    };
  }, [currentLevel, enabledBlockKeySignature, blocklyRef.current]);

  // Handle victory - using utils
  const handleVictory = async (matchedPattern = null) => {
    await handleVictoryUtil({
      isCompleted,
      setIsCompleted,
      setIsRunning,
      setGameState,
      showVictory,
      calculateFinalScore,
      setFinalScore,
      gameStartTime,
      setTimeSpent,
      setGameResult,
      isPreview,
      onUnlockPattern,
      onUnlockLevel,
      patternId,
      currentLevel,
      setShowProgressModal,
      hintOpenCount,
      matchedPattern,
      userBigO // Pass userBigO state
    });
  };

  // Rest of the component implementation...
  // (This is a large component, so I'll continue with the key parts)

  // Test result state
  const [testCaseResult, setTestCaseResult] = useState(null);

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
    handleRestartGame: () => handleRestartGameUtil({
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
    })
  });

  // Initialize Blockly
  const { initBlocklyAndPhaser } = useBlocklySetup({
    blocklyRef,
    workspaceRef,
    enabledBlocks,
    enabledBlockKeySignature,
    setBlocklyLoaded,
    setBlocklyJavaScriptReady,
    setCurrentHint,
    initPhaserGame,
    starter_xml: currentLevel?.starter_xml || null,
    blocklyLoaded,
    isTextCodeEnabled: currentLevel?.textcode || false,
    onCodeGenerated: handleTextCodeChangeWithState
  });

  // Code execution
  const { runCode, executionError, clearExecutionError } = useCodeExecution({
    workspaceRef,
    currentLevel,
    setPlayerNodeId,
    setPlayerDirection,
    setPlayerHp,
    setIsCompleted,
    setIsRunning,
    setIsGameOver,
    setGameState,
    setCurrentHint,
    setShowProgressModal,
    setTimeSpent,
    setGameResult,
    setFinalScore,
    gameStartTime,
    setAttempts,
    setRescuedPeople,
    blocklyJavaScriptReady,
    codeValidation,
    isPreview,
    patternId,
    onUnlockPattern,
    onUnlockLevel,
    goodPatterns,
    hintOpenCount,
    moveForward,
    turnLeft,
    turnRight,
    hit,
    foundMonster,
    canMoveForward,
    nearPit,
    atGoal,
    setHintData, // Pass setHintData to allow visualization updates from execution
    setTestCaseResult, // Pass setTestCaseResult to update UI with test results
    userBigO, // Pass userBigO for scoring
    hintData // Pass hintData for pattern matching info in scoring
  });

  // Trigger Big O Quiz logic moved to handleRunClick
  const [shouldRunAfterBigO, setShouldRunAfterBigO] = useState(false);

  // Hook to run code after BigO selection
  useEffect(() => {
    if (shouldRunAfterBigO && userBigO) {
      console.log('Running code after BigO selection');
      runCode();
      setShouldRunAfterBigO(false);
    }
  }, [shouldRunAfterBigO, userBigO, runCode]);

  const handleRunClick = () => {
    // Check if pattern matched 100% AND BigO is required (bestPatternBigO exists) AND BigO not yet provided
    // Also ensure we are not already running
    if (hintData?.patternPercentage === 100 && hintData?.bestPatternBigO && !userBigO) {
      setShowBigOQuiz(true);
      setShouldRunAfterBigO(true);
      return;
    }
    runCode();
  };

  // Handle restart game - using utils
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
    setTestCaseResult(null); // Clear test results on restart
  };

  // Game action and condition functions are now provided by custom hooks (useGameActions, useGameConditions)

  // ============================================================================
  // EFFECTS - API Bridges
  // ============================================================================

  // Rope Partition Visual API Bridge
  useEffect(() => {
    if (!currentLevel) return;

    const isRopePartition = currentLevel.gameType === 'rope_partition' ||
      (currentLevel.appliedData && currentLevel.appliedData.type === 'BACKTRACKING_ROPE_PARTITION');

    if (isRopePartition) {
      return setupRopePartitionBridge(currentLevel, setHintData);
    }
  }, [currentLevel]);



  // Visual updates for Train Schedule and Rope Partition
  useEffect(() => {
    updateTrainScheduleVisualsIfNeeded(currentLevel, hintData);
    updateRopePartitionVisualsIfNeeded(currentLevel, hintData);
  }, [currentLevel, hintData, hintData?.assignments]);

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



  // Guide system state (Called unconditionally for React Hook rules)
  // Handles null currentLevel internally
  const { showGuide, guides, closeGuide, openGuide, hasGuides } = useGuideSystem(currentLevel);

  if (loading) {
    return <PageLoader message="Loading level..." />;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">Error: {error}</div>;
  }

  // Guide system state
  // (Moved to top level)

  // Initialize Blockly and Phaser when ready

  return (
    <GameWithGuide
      levelData={currentLevel}

      // Guide props
      showGuide={showGuide}
      guides={guides}
      closeGuide={closeGuide}
    >
      <div className={`flex ${isPreview ? 'h-full' : 'h-screen'} bg-[#0f111a]`}>
        {/* Game Area - 65% ของหน้าจอ */}

        <div className="w-[50%] relative bg-[#0f111a]">
          <GameArea
            gameRef={gameRef}
            gameState={gameState}
            isRunning={isRunning}
            isGameOver={isGameOver}
            onRestart={handleRestartGame}
            levelData={currentLevel}
            currentLevel={currentLevel}
            playerNodeId={playerNodeId}
            playerDirection={playerDirection}
            playerHpState={playerHpState}
            isCompleted={isCompleted}
            currentWeaponData={currentWeaponData}
            currentHint={currentHint}
            hintData={hintData}
            hintOpen={hintOpen}
            onToggleHint={() => setHintOpen(false)}
            hintOpenCount={hintOpenCount}
            levelHints={Array.isArray(currentLevel?.hints) ? currentLevel.hints : []}
            activeLevelHint={activeLevelHint}
            onNeedHintClick={() => {
              const baseHints = Array.isArray(currentLevel?.hints)
                ? [...currentLevel.hints]
                  .filter(h => h.is_active !== false)
                  .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                : [];

              console.log('🔔 [GameCore] Need Hint clicked (preview)', {
                levelHintsLength: baseHints.length,
                levelHintIndex,
              });

              if (!baseHints || baseHints.length === 0) return;

              // Logic change: Loop back to start if we reached the end
              let targetIndex = levelHintIndex;
              if (targetIndex >= baseHints.length) {
                targetIndex = 0;
              }

              const nextHint = baseHints[targetIndex];
              console.log('🔔 [GameCore] Next level hint selected:', nextHint);
              setActiveLevelHint(nextHint);
              // Set next index (if we just showed 0, next is 1)
              setLevelHintIndex(targetIndex + 1);
              setHintOpen(true);
            }}
            needHintDisabled={
              !Array.isArray(currentLevel?.hints) ||
              currentLevel.hints.filter(h => h.is_active !== false).length === 0
            }
            finalScore={finalScore}
            inCombatMode={inCombatMode}
            playerCoins={getCurrentGameState().playerCoins || []}
            rescuedPeople={rescuedPeople}
            collectedTreasures={collectedTreasures}
            workspaceRef={workspaceRef}
            userBigO={userBigO}
            onUserBigOChange={handleBigOSelect} // Update to use handleBigOSelect
            showBigOQuiz={showBigOQuiz}
            onCloseBigOQuiz={() => setShowBigOQuiz(false)}
            userProgress={userProgress}
            hasGuides={hasGuides}
          />
        </div>

        {/* Blockly Area - 35% ของหน้าจอ */}
        <div
          className="w-[50%] border-l border-black flex flex-col backdrop-blur-sm overflow-hidden"
          style={{
            // backgroundImage: "url('/blocklyBg.png')",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            imageRendering: "pixelated"
          }}
        >
          <div className="flex flex-col h-full relative">

            {/* Floating Level Name */}
            <div className="absolute top-4 right-8 z-10 pointer-events-none">
              <h2 className="text-xl font-bold text-white/90 drop-shadow-md bg-[#2e1065]/80 backdrop-blur-md px-3 py-1 rounded-lg border border-purple-500/30">
                {currentLevel?.level_name || `ด่าน ${levelId}`}
                {isPreview && <span className="ml-2 text-yellow-400 text-sm">(Preview)</span>}
              </h2>
            </div>
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
              />
            </div>
          </div>

        </div>
      </div>

      {/* Progress Modal - only show in normal mode */}
      {!isPreview && (
        <>
          <ProgressModal
            isOpen={showProgressModal}
            onClose={handleCloseProgressModal}
            gameResult={gameResult}
            levelData={currentLevel}
            attempts={attempts}
            timeSpent={timeSpent}
            blocklyXml={workspaceRef.current ? Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspaceRef.current)) : null}
            textCodeContent={currentLevel?.textcode ? textCode || '' : null}
            finalScore={finalScore}
            hp_remaining={playerHpState}
            getToken={getToken}
            userBigO={userBigO}
            targetBigO={hintData?.bestPatternBigO || hintData?.bestPattern?.big_o || hintData?.bestPattern?.bigO}
          />

          {/* Floating "Show Results" button - appears when modal is minimized */}
          {!showProgressModal && (isCompleted || isGameOver) && (
            <button
              onClick={() => setShowProgressModal(true)}
              className="fixed top-20 right-4 z-50 group transition-transform hover:scale-105 active:translate-y-1 w-48"
            >
              {/* 1. Base Button Image */}
              <img
                src="/button.png"
                alt="Show Results"
                className="w-full h-auto block select-none"
                style={{ imageRendering: 'pixelated' }}
              />
              {/* 2. Hover Image */}
              <img
                src="/buttonhover.png"
                alt="Show Results Hover"
                className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-100 select-none"
                style={{ imageRendering: 'pixelated' }}
              />
              {/* 3. Text Overlay */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 pb-1 text-[#fdf6e3] group-hover:text-white font-bold font-pixel text-[10px] sm:text-xs tracking-wider uppercase drop-shadow-md">
                <span>SHOW RESULTS</span>
              </div>
            </button>
          )}
        </>
      )}

      {/* Load XML Modal */}
      {isPreview && (
        <LoadXmlModal
          isOpen={showLoadXmlModal}
          onClose={() => setShowLoadXmlModal(false)}
          options={EXAMPLE_LOADERS.map(loader => ({
            ...loader,
            onClick: () => workspaceRef.current && loader.loader(workspaceRef.current)
          }))}
        />
      )}

      <ExecutionErrorModal
        open={!!executionError}
        error={executionError}
        onClose={clearExecutionError}
      />
    </GameWithGuide>
  );
};

export default GameCore;