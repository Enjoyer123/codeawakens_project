// src/components/playegame/GameCore.jsx
// Core game component that can be reused for both normal play and preview mode
import React, { useEffect, useMemo, useRef, useState } from "react";
import { updateTrainScheduleVisuals, updateRopePartitionVisuals } from '../../gameutils/utils/phaserGame';
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
  getCurrentGameState,
  getWeaponData,
  toggleDebugMode,
  getRescuedPeople,
  displayPlayerWeapon
} from '../../gameutils/utils/gameUtils';
import {
  isInCombat
} from '../../gameutils/utils/combatSystem';
import { clearGameOverScreen, showGameOver, showVictory } from '../../gameutils/utils/phaserGame';

// Import components
import GameArea from './GameArea';
import BlocklyArea from './BlocklyArea';
import GameWithGuide from './GameWithGuide';

// Import custom hooks
import { useGameActions } from './hooks/useGameActions';
import { useGameConditions } from './hooks/useGameConditions';
import { usePhaserGame } from './hooks/usePhaserGame';
import { useBlocklySetup } from './hooks/useBlocklySetup';
import { useCodeExecution } from './hooks/useCodeExecution';
import { useLevelLoader } from './hooks/useLevelLoader';
import { usePatternAnalysis } from './hooks/usePatternAnalysis';
import { useTextCodeValidation } from './hooks/useTextCodeValidation';

// Import utils
import { calculateFinalScore } from './utils/scoreUtils';
import { highlightBlocks as highlightBlocksUtil, clearHighlights as clearHighlightsUtil } from './utils/visualGuide';
import { handleRestartGame as handleRestartGameUtil, handleVictory as handleVictoryUtil } from './utils/gameHandlers';
import { loadDfsExampleBlocks } from '../../gameutils/utils/blockly/loadDfsExample';
import { loadBfsExampleBlocks } from '../../gameutils/utils/blockly/loadBfsExample';
import { loadDijkstraExampleBlocks } from '../../gameutils/utils/blockly/loadDijkstraExample';
import { loadPrimExampleBlocks } from '../../gameutils/utils/blockly/loadPrimExample';
import { loadKnapsackExampleBlocks } from '../../gameutils/utils/blockly/loadKnapsackExample';
import { loadDynamicKnapsackExampleBlocks } from '../../gameutils/utils/blockly/loadDynamicKnapsackExample';
import { loadKruskalExampleBlocks } from '../../gameutils/utils/blockly/loadKruskalExample';
import { loadSubsetSumExampleBlocks } from '../../gameutils/utils/blockly/loadSubsetSumExample';
import { loadDynamicSubsetSumExampleBlocks } from '../../gameutils/utils/blockly/loadDynamicSubsetSumExample';
import { loadCoinChangeExampleBlocks } from '../../gameutils/utils/blockly/loadCoinChangeExample';
import { loadDynamicCoinChangeExampleBlocks } from '../../gameutils/utils/blockly/loadDynamicCoinChangeExample';
import { loadGreedyCoinChangeExampleBlocks } from '../../gameutils/utils/blockly/loadGreedyCoinChangeExample';
import { loadNQueenExampleBlocks } from '../../gameutils/utils/blockly/loadNQueenExample';
import { loadDynamicAntDpExampleBlocks } from '../../gameutils/utils/blockly/loadDynamicAntDpExample';
import { loadTrainScheduleExampleBlocks } from '../../gameutils/utils/blockly/loadTrainScheduleExample';
import { loadRopePartitionExampleBlocks } from '../../gameutils/utils/blockly/loadRopePartitionExample';
import { loadEmeiMountainExample } from '../../gameutils/utils/blockly/loadEmeiMountainExample';

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

  // Inject global CSS for Blockly highlights
  useEffect(() => {
    try {
      const styleId = 'blockly-highlight-global-styles';
      if (document.getElementById(styleId)) return;
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
  .blockly-highlight-border {
    filter: drop-shadow(0 0 6px rgba(0, 255, 0, 0.8)) !important;
    transition: all 150ms ease-in-out !important;
  }
  .blockly-highlight-border .blocklyPath,
  .blockly-highlight-border path {
    stroke: #00ff00 !important;
    stroke-width: 2px !important;
    stroke-linejoin: round !important;
  }
  .blockly-highlight-border .blocklyOutline,
  .blockly-highlight-border .blocklyPath {
    stroke: #00ff00 !important;
  }
  .blockly-highlight-border .blocklyText,
  .blockly-highlight-border text {
    fill: #ffffff !important;
  }
  .blockly-highlight-border rect,
  .blockly-highlight-border .blocklyPath {
    opacity: 1 !important;
  }
`;

      document.head.appendChild(style);
    } catch (e) {
      console.warn('Could not inject global blockly highlight styles:', e);
    }
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

  // Visual Guide System
  const [highlightedBlocks, setHighlightedBlocks] = useState([]);

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

  // Visual Guide Functions - using utils
  const highlightBlocks = (blockTypes) => {
    if (!workspaceRef.current || !blockTypes || blockTypes.length === 0) {
      setHighlightedBlocks([]);
      return;
    }
    highlightBlocksUtil(workspaceRef.current, blockTypes, highlightOverlaysRef, setHighlightedBlocks);
  };

  const clearHighlights = () => {
    if (!workspaceRef.current) return;
    clearHighlightsUtil(workspaceRef.current, highlightOverlaysRef, setHighlightedBlocks);
  };

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
  usePatternAnalysis({
    blocklyLoaded,
    workspaceRef,
    goodPatterns,
    setHintData,
    setCurrentWeaponData,
    setPatternFeedback,
    setPartialWeaponKey
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
      matchedPattern
    });
  };

  // Rest of the component implementation...
  // (This is a large component, so I'll continue with the key parts)

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
  const { runCode } = useCodeExecution({
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
    setHintData // Pass setHintData to allow visualization updates from execution
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
  };

  // Game action and condition functions are now provided by custom hooks (useGameActions, useGameConditions)

  // Rope Partition Visual API Bridge
  useEffect(() => {
    if (!currentLevel) return;
    const isRopePartition = currentLevel.gameType === 'rope_partition' || (currentLevel.appliedData && currentLevel.appliedData.type === 'BACKTRACKING_ROPE_PARTITION');

    if (isRopePartition) {
      // Rope Partition API Bridge
      if (typeof globalThis !== 'undefined') {
        console.log('[Rope Bridge] Initializing Rope Partition API');
        globalThis.__ropePartition_api = {
          updateCuts: (cuts) => {
            console.log('[Rope Bridge] updateCuts called with:', cuts);
            // cuts is array of segment lengths e.g. [1, 2, 7]
            // We need to pass this to hintData so phaser can render it
            setHintData(prev => ({
              ...prev,
              current: cuts ? [...cuts] : []
            }));
          }
        };
        // Initialize state
        setHintData({ current: [], status: 'Adding cuts...' });
      }
    } else {
      // Cleanup
      if (typeof globalThis !== 'undefined') {
        if (globalThis.__ropePartition_api) delete globalThis.__ropePartition_api;
      }
    }

    return () => {
      if (typeof globalThis !== 'undefined' && globalThis.__ropePartition_api) {
        delete globalThis.__ropePartition_api;
      }
    };
  }, [currentLevel]);


  useEffect(() => {
    // Train Schedule Visuals
    if (currentLevel?.gameType === 'train_schedule' && hintData?.assignments) {
      const scene = getCurrentGameState().currentScene;
      if (scene) {
        console.log('[GameCore] Triggering Train Schedule Visuals from Core', hintData.assignments);
        updateTrainScheduleVisuals(scene, hintData.assignments);
      }
    }

    // Rope Partition Visuals
    if ((currentLevel?.gameType === 'rope_partition' || currentLevel?.appliedData?.type === 'BACKTRACKING_ROPE_PARTITION') && hintData) {
      const scene = getCurrentGameState().currentScene;
      if (scene) {
        // Passing the whole hintData as it contains the rich state object (current, total, status, etc)
        updateRopePartitionVisuals(scene, hintData);
      }
    }
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
      currentLevel={currentLevel}
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
      <div className="flex h-screen bg-gray-900">
        {/* Game Area - 65% ของหน้าจอ */}
        <div className="w-[65%] relative bg-black">
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
            workspaceRef={workspaceRef}
            userBigO={userBigO}
            onUserBigOChange={setUserBigO}
          />
        </div>

        {/* Blockly Area - 35% ของหน้าจอ */}
        <div className="w-[35%] border-l border-black flex flex-col bg-gray-800/50 backdrop-blur-sm overflow-hidden">
          <div className="bg-stone-900 p-4 shadow-lg">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {currentLevel?.level_name || `ด่าน ${levelId}`}
                    {isPreview && <span className="ml-2 text-yellow-400 text-sm">(Preview)</span>}
                  </h2>
                </div>

                {/* Emei Mountain (ง้อไบ๊) Template Buttons */}
                {currentLevel?.isMaxCapacityLevel && (
                  <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/10">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest hidden sm:inline">ไกด์นำเที่ยว:</span>
                    <button
                      onClick={() => workspaceRef.current && loadEmeiMountainExample(workspaceRef.current, 'dijkstra')}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded shadow-lg shadow-indigo-900/40 transition hover:-translate-y-0.5"
                      title="Load Emei Mountain Dijkstra Template"
                    >
                      📦 โหลด Dijkstra (ง้อไบ๊)
                    </button>
                    <button
                      onClick={() => workspaceRef.current && loadEmeiMountainExample(workspaceRef.current, 'prim')}
                      className="px-3 py-1 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded shadow-lg shadow-pink-900/40 transition hover:-translate-y-0.5"
                      title="Load Emei Mountain Prim Template"
                    >
                      📦 โหลด Prim (ง้อไบ๊)
                    </button>
                  </div>
                )}
              </div>
              {/* Temporary buttons to load example blocks - Remove after development */}
              {workspaceRef.current && (
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                  <button
                    onClick={() => {
                      if (workspaceRef.current) {
                        loadDfsExampleBlocks(workspaceRef.current);
                      }
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                    title="โหลด DFS example blocks (ชั่วคราว - สำหรับทดสอบ)"
                  >
                    📦 โหลด DFS
                  </button>
                  <button
                    onClick={() => {
                      if (workspaceRef.current) {
                        loadBfsExampleBlocks(workspaceRef.current);
                      }
                    }}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                    title="โหลด BFS example blocks (ชั่วคราว - สำหรับทดสอบ)"
                  >
                    📦 โหลด BFS
                  </button>
                  <button
                    onClick={() => {
                      if (workspaceRef.current) {
                        loadDijkstraExampleBlocks(workspaceRef.current);
                      }
                    }}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded"
                    title="โหลด Dijkstra example blocks (ชั่วคราว - สำหรับทดสอบ)"
                  >
                    📦 โหลด Dijkstra
                  </button>
                  <button
                    onClick={() => {
                      if (workspaceRef.current) {
                        loadPrimExampleBlocks(workspaceRef.current);
                      }
                    }}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded"
                    title="โหลด Prim example blocks (ชั่วคราว - สำหรับทดสอบ)"
                  >
                    📦 โหลด Prim
                  </button>
                  <button
                    onClick={() => {
                      if (workspaceRef.current) {
                        loadKruskalExampleBlocks(workspaceRef.current);
                      }
                    }}
                    className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded"
                    title="โหลด Kruskal example blocks (ชั่วคราว - สำหรับทดสอบ)"
                  >
                    📦 โหลด Kruskal
                  </button>
                  <button
                    onClick={() => {
                      if (workspaceRef.current) {
                        loadKnapsackExampleBlocks(workspaceRef.current);
                      }
                    }}
                    className="px-3 py-1 bg-pink-600 hover:bg-pink-700 text-white text-sm rounded"
                    title="โหลด Knapsack example blocks (ชั่วคราว - สำหรับทดสอบ)"
                  >
                    📦 โหลด Knapsack
                  </button>
                  <button
                    onClick={() => {
                      if (workspaceRef.current) {
                        loadTrainScheduleExampleBlocks(workspaceRef.current);
                      }
                    }}
                    className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded"
                    title="โหลด Train Schedule Blocks"
                  >
                    📦 โหลด Train Schedule
                  </button>
                  <button
                    onClick={() => {
                      if (workspaceRef.current) {
                        loadDynamicKnapsackExampleBlocks(workspaceRef.current);
                      }
                    }}
                    className="px-3 py-1 bg-pink-700 hover:bg-pink-800 text-white text-sm rounded"
                    title="โหลด Dynamic Knapsack (DP) example blocks (ชั่วคราว - สำหรับทดสอบ)"
                  >
                    📦 โหลด Dynamic Knap
                  </button>
                  <button
                    onClick={() => {
                      if (workspaceRef.current) {
                        loadSubsetSumExampleBlocks(workspaceRef.current);
                      }
                    }}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded"
                    title="โหลด Subset Sum example blocks (ชั่วคราว - สำหรับทดสอบ)"
                  >
                    ➕ โหลด Subset Sum
                  </button>
                  <button
                    onClick={() => {
                      if (workspaceRef.current) {
                        loadDynamicSubsetSumExampleBlocks(workspaceRef.current);
                      }
                    }}
                    className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white text-sm rounded"
                    title="โหลด Dynamic Subset Sum (DP) example blocks (ชั่วคราว - สำหรับทดสอบ)"
                  >
                    ➕ โหลด Dynamic Subset
                  </button>
                  <button
                    onClick={() => {
                      if (workspaceRef.current) {
                        loadCoinChangeExampleBlocks(workspaceRef.current);
                      }
                    }}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded"
                    title="โหลด Coin Change example blocks (ชั่วคราว - สำหรับทดสอบ)"
                  >
                    🪙 โหลด Coin Change
                  </button>
                  <button
                    onClick={() => {
                      if (workspaceRef.current) {
                        loadDynamicCoinChangeExampleBlocks(workspaceRef.current);
                      }
                    }}
                    className="px-3 py-1 bg-indigo-700 hover:bg-indigo-800 text-white text-sm rounded"
                    title="โหลด Dynamic Coin Change (DP) example blocks (ชั่วคราว - สำหรับทดสอบ)"
                  >
                    🪙 โหลด Dynamic Coin
                  </button>
                  <button
                    onClick={() => {
                      if (workspaceRef.current) {
                        loadGreedyCoinChangeExampleBlocks(workspaceRef.current);
                      }
                    }}
                    className="px-3 py-1 bg-indigo-800 hover:bg-indigo-900 text-white text-sm rounded"
                    title="โหลด Greedy Coin Change example blocks (ชั่วคราว - สำหรับทดสอบ)"
                  >
                    🪙 โหลด Coin Greedy
                  </button>
                  <button
                    onClick={() => {
                      if (workspaceRef.current) {
                        loadNQueenExampleBlocks(workspaceRef.current);
                      }
                    }}
                    className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded"
                    title="โหลด N-Queen example blocks (ชั่วคราว - สำหรับทดสอบ)"
                  >
                    👑 โหลด N-Queen
                  </button>

                  {/* Ant DP (Applied Dynamic) */}
                  <button
                    onClick={() => {
                      if (workspaceRef.current) {
                        loadDynamicAntDpExampleBlocks(workspaceRef.current);
                      }
                    }}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-sm rounded"
                    title="โหลด Ant DP example blocks (แบบสั้น - สำหรับโชว์ตาราง)"
                  >
                    🐜 โหลด Ant (สั้น)
                  </button>

                  <button
                    onClick={() => {
                      if (workspaceRef.current) {
                        loadRopePartitionExampleBlocks(workspaceRef.current);
                      }
                    }}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded"
                    title="โหลด Rope Partition (Backtracking)"
                  >
                    🪢 โหลด Rope Partition
                  </button>

                  <>
                    <button
                      onClick={() => workspaceRef.current && loadEmeiMountainExample(workspaceRef.current, 'dijkstra')}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded shadow-md"
                      title="โหลด Dijkstra Max-Cap (ง้อไบ๊)"
                    >
                      📦 โหลด Dijkstra (ง้อไบ๊)
                    </button>
                    <button
                      onClick={() => workspaceRef.current && loadEmeiMountainExample(workspaceRef.current, 'prim')}
                      className="px-3 py-1 bg-pink-600 hover:bg-pink-700 text-white text-sm rounded shadow-md"
                      title="โหลด Prim Max-Cap (ง้อไบ๊)"
                    >
                      📦 โหลด Prim (ง้อไบ๊)
                    </button>
                  </>

                </div>
              )}
            </div>
          </div>

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
          />
        </div>
      </div>

      {/* Progress Modal - only show in normal mode */}
      {
        !isPreview && (
          <ProgressModal
            isOpen={showProgressModal}
            onClose={() => setShowProgressModal(false)}
            gameResult={gameResult}
            levelData={currentLevel}
            attempts={attempts}
            timeSpent={timeSpent}
            blocklyXml={workspaceRef.current ? Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspaceRef.current)) : null}
            textCodeContent={currentLevel?.textcode ? textCode || '' : null}
            finalScore={finalScore}
            hp_remaining={playerHpState}
            getToken={getToken}
          />
        )
      }
    </GameWithGuide >
  );
};

export default GameCore;

