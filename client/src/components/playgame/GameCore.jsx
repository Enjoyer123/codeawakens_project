// src/components/playegame/GameCore.jsx
// Core game component that can be reused for both normal play and preview mode
import React, { useEffect, useMemo, useRef, useState } from "react";
import { updateTrainScheduleVisuals, updateRopePartitionVisuals } from '../../gameutils/phaser';
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import ProgressModal from '../../pages/user/ProgressModal';
import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/javascript";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

window.Blockly = Blockly;

// Import utilities and data
import {
  getWeaponData,

  getRescuedPeople,
  displayPlayerWeapon,
  getCollectedTreasures
} from '../../gameutils/shared/items';
import {
  getCurrentGameState,
  toggleDebugMode,
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
import { useLevelLoader } from './hooks/useLevelLoader';
import { usePatternAnalysis } from './hooks/usePatternAnalysis';
import { useTextCodeValidation } from './hooks/useTextCodeValidation';
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
  const [currentHint, setCurrentHint] = useState("กำลังโหลดข้อมูลด่าน...");
  const [blocklyLoaded, setBlocklyLoaded] = useState(false);

  // Debug: Log blocklyLoaded changes
  useEffect(() => {
    console.log("🔍 blocklyLoaded state changed:", blocklyLoaded);
  }, [blocklyLoaded]);

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
  useEffect(() => {
    let lastCombatState = isInCombat();
    setInCombatMode(lastCombatState);

    const interval = setInterval(() => {
      const currentCombatState = isInCombat();
      // Only update if state changed to prevent infinite loop
      if (currentCombatState !== lastCombatState) {
        lastCombatState = currentCombatState;
        setInCombatMode(currentCombatState);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Check HP = 0 and show Progress Modal (only in normal mode)
  useEffect(() => {
    if (!isPreview && playerHpState <= 0 && !isGameOver && !showProgressModal) {
      console.log("HP = 0 detected, showing game over modal");

      setIsGameOver(true);
      setGameState("gameOver");

      if (gameStartTime.current) {
        const endTime = Date.now();
        setTimeSpent(Math.floor((endTime - gameStartTime.current) / 1000));
      }

      setGameResult('gameover');
      setShowProgressModal(true);

      const currentState = getCurrentGameState();
      if (currentState.currentScene) {
        showGameOver(currentState.currentScene);
      }
    }
  }, [playerHpState, isGameOver, showProgressModal, isPreview]);

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

  // Debug mode state
  const [debugMode, setDebugMode] = useState(false);

  // Text code editor state
  const [textCode, setTextCode] = useState("");
  const [codeValidation, setCodeValidation] = useState({ isValid: false, message: "" });
  const [blocklyJavaScriptReady, setBlocklyJavaScriptReady] = useState(false);

  // Debug: Log blocklyJavaScriptReady changes
  useEffect(() => {
    console.log("🔍 blocklyJavaScriptReady state changed:", blocklyJavaScriptReady);
  }, [blocklyJavaScriptReady]);

  // History system state
  const [userProgress, setUserProgress] = useState([]);
  const [allLevelsData, setAllLevelsData] = useState([]);

  // Fetch user progress and all levels on mount
  // Fetch user progress and all levels
  const fetchHistoryData = React.useCallback(async () => {
    if (!getToken) return;
    try {
      const [profileData, levelsData] = await Promise.all([
        getUserByClerkId(getToken),
        fetchAllLevels(getToken, 1, 100) // Large limit to get all levels
      ]);

      if (profileData?.user_progress) {
        setUserProgress(profileData.user_progress);
      }

      if (levelsData?.levels) {
        setAllLevelsData(levelsData.levels);
      }
      console.log('🔄 History data refreshed');
    } catch (err) {
      console.error("Error fetching history data:", err);
    }
  }, [getToken]);

  // Initial fetch
  useEffect(() => {
    fetchHistoryData();
  }, [fetchHistoryData]);

  const handleCloseProgressModal = () => {
    setShowProgressModal(false);
    // Refresh history data when modal closes (after save)
    fetchHistoryData();
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
  useEffect(() => {
    if (currentLevel?.textcode) {
      console.log("🔍 codeValidation state changed:", codeValidation);
    }
  }, [codeValidation, currentLevel?.textcode]);



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



  // Load level data - using hook
  useLevelLoader({
    levelId,
    getToken,
    isPreview,
    setLoading,
    setError,
    setCurrentLevel,
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
    setGameState
  });

  // Reset text code state when level changes
  useEffect(() => {
    if (levelId) {
      console.log("🔄 Resetting text code state for new level:", levelId);
      setTextCode("");
      setCodeValidation({ isValid: false, message: "" });
      setBlocklyJavaScriptReady(false);
    }
  }, [levelId]);

  // Load patterns for the level
  useEffect(() => {
    const loadPatterns = async () => {
      if (!currentLevel || !getToken) return;

      try {
        const levelId = currentLevel.level_id || currentLevel.id;
        if (!levelId) return;

        const response = await fetch(`${API_BASE_URL}/api/patterns?level_id=${levelId}&limit=100`, {
          headers: {
            'Authorization': `Bearer ${await getToken()}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Handle both array and object with patterns property
          const patterns = Array.isArray(data) ? data : (data.patterns || []);

          // In preview mode, use all patterns (including is_available = false)
          // In normal mode, only use patterns with is_available = true
          const filteredPatterns = isPreview
            ? patterns
            : patterns.filter(p => p.is_available === true);

          setGoodPatterns(filteredPatterns);
        }
      } catch (err) {
        console.error("Error loading patterns:", err);
      }
    };

    loadPatterns();
  }, [currentLevel, getToken]);

  // Pattern analysis and weapon display - using hook
  console.log("🛠️ [GameCore] Calling usePatternAnalysis", {
    blocklyLoaded,
    hasWorkspace: !!workspaceRef.current,
    goodPatternsCount: goodPatterns?.length
  });

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
  }, [currentLevel?.id, enabledBlockKeySignature, blocklyRef.current]);

  // Handle victory condition
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
    blocklyLoaded
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

  const handleDebugToggle = () => {
    setDebugMode(!debugMode);
    toggleDebugMode();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading level...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">Error: {error}</div>;
  }

  return (
    <GameWithGuide
      levelData={currentLevel}
      currentHint={currentHint}
      hintData={hintData}
      hintOpen={hintOpen}
      setHintOpen={setHintOpen}
      onHintClose={() => {
        console.log('🔔 Hint closed');
      }}
      hintOpenCount={hintOpenCount}
      playerCoins={getCurrentGameState().playerCoins || []}
      rescuedPeople={rescuedPeople}
      finalScore={finalScore}
      inCombatMode={inCombatMode}
      blocklyJavaScriptReady={blocklyJavaScriptReady}
      showScore={true}
    >
      <div className={`flex ${isPreview ? 'h-full' : 'h-screen'} bg-gray-900`}>
        {/* Game Area - 65% ของหน้าจอ */}

        <div className="w-[50%] relative bg-black">
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
                needHintDisabled:
                  !baseHints || baseHints.length === 0 || levelHintIndex >= baseHints.length
              });

              if (!baseHints || baseHints.length === 0 || levelHintIndex >= baseHints.length) return;

              const nextHint = baseHints[levelHintIndex];
              console.log('🔔 [GameCore] Next level hint selected:', nextHint);
              setActiveLevelHint(nextHint);
              setLevelHintIndex(levelHintIndex + 1);
              setHintOpen(true);
            }}
            needHintDisabled={
              !Array.isArray(currentLevel?.hints) ||
              currentLevel.hints.filter(h => h.is_active !== false).length === 0 ||
              levelHintIndex >= currentLevel.hints.filter(h => h.is_active !== false).length
            }
            finalScore={finalScore}
            inCombatMode={inCombatMode}
            playerCoins={getCurrentGameState().playerCoins || []}
            rescuedPeople={rescuedPeople}
            collectedTreasures={collectedTreasures}
            workspaceRef={workspaceRef}
            userBigO={userBigO}
            onUserBigOChange={setUserBigO}
          />
        </div>

        {/* Blockly Area - 35% ของหน้าจอ */}
       <div
          className="w-[50%] border-l border-black flex flex-col backdrop-blur-sm overflow-hidden"
          style={{
            backgroundImage: "url('/blocklyBg.png')",
            backgroundSize: "100% 100%", 
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            imageRendering: "pixelated" 
          }}
        >
          <div className="flex flex-col h-full px-4 py-4 md:px-20">

            <div className="bg-stone-900 p-4 shadow-lg shrink-0 mb-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {currentLevel?.level_name || `ด่าน ${levelId}`}
                    {isPreview && <span className="ml-2 text-yellow-400 text-sm">(Preview)</span>}
                  </h2>
                </div>
                {/* Temporary buttons to load example blocks - Remove after development */}
                {workspaceRef.current && isPreview && (
                  <div className="flex flex-wrap gap-2 justify-end mb-2">
                    <button
                      onClick={() => setShowLoadXmlModal(true)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                      title="โหลดตัวอย่าง XML"
                    >
                      📂 โหลด XML
                    </button>
                    <LoadXmlModal
                      isOpen={showLoadXmlModal}
                      onClose={() => setShowLoadXmlModal(false)}
                      options={EXAMPLE_LOADERS.map(loader => ({
                        ...loader,
                        onClick: () => workspaceRef.current && loader.loader(workspaceRef.current)
                      }))}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-h-0 relative shadow-2xl rounded-lg overflow-hidden">

              <BlocklyArea
                blocklyRef={blocklyRef}
                blocklyLoaded={blocklyLoaded}
                runCode={runCode}
                gameState={gameState}
                isRunning={isRunning}
                isGameOver={isGameOver}
                onDebugToggle={handleDebugToggle}
                debugMode={debugMode}
                currentLevel={currentLevel}
                codeValidation={codeValidation}
                blocklyJavaScriptReady={blocklyJavaScriptReady}
                textCode={textCode}
                handleTextCodeChange={handleTextCodeChangeWithState}
                testCaseResult={testCaseResult}
                userProgress={userProgress}
                allLevels={allLevelsData}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Progress Modal - only show in normal mode */}
      {!isPreview && (
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