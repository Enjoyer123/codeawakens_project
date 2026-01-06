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
  displayPlayerWeapon,
  getCollectedTreasures
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
import { getUserByClerkId } from '../../services/profileService';
import { fetchAllLevels } from '../../services/levelService';

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
    highlightBlocks, // <- Added
    clearHighlights, // <- Added
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

  // Rope Partition Visual API Bridge
  useEffect(() => {
    if (!currentLevel) return;
    const isRopePartition = currentLevel.gameType === 'rope_partition' || (currentLevel.appliedData && currentLevel.appliedData.type === 'BACKTRACKING_ROPE_PARTITION');


    if (isRopePartition) {
      // Rope Partition API Bridge (Tree Version)
      if (typeof globalThis !== 'undefined') {
        console.log('[Rope Bridge] Initializing Rope Partition API (Tree)');

        // Setup shared state for the run
        let treeNodes = [];
        globalThis.ropeStack = []; // Stack to track recursion path ids

        // Helper to update React State safely
        const updateTreeState = () => {
          setHintData(prev => ({
            ...prev,
            nodes: [...treeNodes]
          }));
        };

        // Stack Helper
        const getRopeParent = () => {
          if (globalThis.ropeStack.length === 0) return -1;
          return globalThis.ropeStack[globalThis.ropeStack.length - 1];
        };

        // 1. Init
        globalThis.initRopeTree = async () => {
          try {
            if (globalThis.__isVisualRun === false) return; // Skip for background tests
            console.log('[Rope API] Init Tree');
            treeNodes = [];
            globalThis.ropeStack = [];
            setHintData(prev => ({ ...prev, nodes: [], result: null }));
            // Wait a bit for clear to happen
            await new Promise(r => setTimeout(r, 50));
          } catch (e) {
            console.error('[Rope API] Init Error:', e);
          }
        };

        // 1.5 Stack Operations (Wrappers)
        globalThis.pushRopeNode = async (cut, sum) => {
          const parentId = getRopeParent();
          const depth = globalThis.ropeStack.length;

          if (depth > 50) {
            console.warn('[Rope API] Depth Limit Exceeded (50)');
            return -1;
          }

          // Force Number types for visual consistency
          const numCut = Number(cut);
          const numSum = Number(sum);
          console.log('[Rope API] Push Node:', { parentId, cut: numCut, sum: numSum, depth });

          const id = await globalThis.addRopeNode(parentId, numCut, numSum, depth);
          globalThis.ropeStack.push(id);
          return id;
        };

        globalThis.popRopeNode = async () => {
          try {
            if (globalThis.__isVisualRun === false) return; // Skip for background tests
            if (globalThis.ropeStack.length > 0) globalThis.ropeStack.pop();
            await new Promise(r => setTimeout(r, 20));
          } catch (e) {
            console.error('[Rope API] Pop Error:', e);
          }
        };

        // 2. Add Node
        globalThis.addRopeNode = async (parentId, cut, sum, depth) => {
          try {
            if (globalThis.__isVisualRun === false) return 9999; // Skip for background tests

            const id = treeNodes.length;
            const newNode = {
              id,
              parentId,
              cut,
              sum,
              depth,
              status: 'visiting' // visiting, success, pruned, normal
            };
            treeNodes.push(newNode);
            updateTreeState();

            await new Promise(r => setTimeout(r, 100)); // Animation delay
            return id;
          } catch (e) {
            console.error('[Rope API] Add Node Error:', e);
            return -1;
          }
        };

        // 3. Update Status
        globalThis.updateRopeNodeStatus = async (nodeId, status, sum) => {
          try {
            if (globalThis.__isVisualRun === false) return; // Skip for background tests

            const node = treeNodes.find(n => n.id === nodeId);
            if (node) {
              node.status = status;
              updateTreeState();
              await new Promise(r => setTimeout(r, 50));
            }
          } catch (e) {
            console.error('[Rope API] Update Status Error:', e);
          }
        };

        // 4. Report Result
        globalThis.reportRopeResult = (ans, path) => {
          console.log('[Rope API] Result:', ans, path);
          setHintData(prev => ({
            ...prev,
            result: ans,
            minSolution: path
          }));
        };

        // 5. Getters
        // 5. Getters
        globalThis.getRopeCuts = () => {
          // Look in payload first (standard), then direct properties (fallback)
          const data = currentLevel?.appliedData?.payload || currentLevel?.customData || currentLevel?.appliedData || {};
          const cuts = data.cuts || data.lengths || [2, 3, 5];
          console.log('[Rope DEBUG] getRopeCuts raw:', cuts);
          if (Array.isArray(cuts) && cuts.length > 0) {
            const validCuts = cuts.map(c => Number(c));
            if (validCuts.every(c => !Number.isNaN(c))) return validCuts;
          }
          return [2, 3, 5];
        };

        globalThis.getRopeTarget = () => {
          const data = currentLevel?.appliedData?.payload || currentLevel?.customData || currentLevel?.appliedData || {};
          // Support both ropeLength (new) and total (old)
          let target = Number(data.ropeLength || data.total);
          if (Number.isNaN(target) || target <= 0) {
            // Fallback if NaN or invalid
            console.warn('[Rope API] Invalid target, using default 10. Data:', data);
            target = 10;
          }
          console.log('[Rope DEBUG] getRopeTarget:', target);
          return target;
        };
      }
    } else {
      // Cleanup
      if (typeof globalThis !== 'undefined') {
        // cleanup globals
        ['initRopeTree', 'addRopeNode', 'updateRopeNodeStatus', 'reportRopeResult', 'getRopeCuts', 'getRopeTarget'].forEach(fn => {
          if (globalThis[fn]) delete globalThis[fn];
        });
      }
    }

    return () => {
      if (typeof globalThis !== 'undefined') {
        ['initRopeTree', 'addRopeNode', 'updateRopeNodeStatus', 'reportRopeResult', 'getRopeCuts', 'getRopeTarget'].forEach(fn => {
          if (globalThis[fn]) delete globalThis[fn];
        });
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
            userProgress={userProgress}
            allLevels={allLevelsData}
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
            backgroundImage: "url('/paper.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
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
                {workspaceRef.current && (
                  <div className="flex gap-2">
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
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded"
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
                      className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded"
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
                      className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded"
                      title="🎒 โหลด Knapsack"
                    >
                      🎒 โหลด Knapsack
                    </button>
                    <button
                      onClick={() => {
                        if (workspaceRef.current) {
                          loadTrainScheduleExampleBlocks(workspaceRef.current);
                        }
                      }}
                      className="px-3 py-1 bg-pink-700 hover:bg-pink-800 text-white text-sm rounded"
                      title="🚂 โหลด Train Schedule"
                    >
                      🚂 โหลด Train Schedule
                    </button>
                    <button
                      onClick={() => {
                        if (workspaceRef.current) {
                          loadDynamicKnapsackExampleBlocks(workspaceRef.current);
                        }
                      }}
                      className="px-3 py-1 bg-yellow-700 hover:bg-yellow-800 text-white text-sm rounded"
                      title="🎒 โหลด Knapsack (DP)"
                    >
                      🎒 โหลด Knapsack (DP)
                    </button>
                    <button
                      onClick={() => {
                        if (workspaceRef.current) {
                          loadSubsetSumExampleBlocks(workspaceRef.current);
                        }
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                      title="⚔️ โหลด Subset Sum"
                    >
                      ⚔️ โหลด Subset Sum
                    </button>
                    <button
                      onClick={() => {
                        if (workspaceRef.current) {
                          loadDynamicSubsetSumExampleBlocks(workspaceRef.current);
                        }
                      }}
                      className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white text-sm rounded"
                      title="⚔️ โหลด Subset Sum (DP)"
                    >
                      ⚔️ โหลด Subset Sum (DP)
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
    </GameWithGuide>
  );
};

export default GameCore;