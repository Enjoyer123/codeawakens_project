// src/components/playegame/GameCore.jsx
// Core game component that can be reused for both normal play and preview mode
import React, { useEffect, useMemo, useRef, useState } from "react";
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
    initPhaserGame
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
    atGoal
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
            onToggleHint={() => setHintOpen(!hintOpen)}
            hintOpenCount={hintOpenCount}
            finalScore={finalScore}
            inCombatMode={inCombatMode}
            playerCoins={getCurrentGameState().playerCoins || []}
            rescuedPeople={rescuedPeople}
          />
        </div>

        {/* Blockly Area - 35% ของหน้าจอ */}
        <div className="w-[35%] border-l border-black flex flex-col bg-gray-800/50 backdrop-blur-sm overflow-hidden">
          <div className="bg-stone-900 p-4 shadow-lg">
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
      {!isPreview && (
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
      )}
    </GameWithGuide>
  );
};

export default GameCore;

