// src/components/LevelGame.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import ProgressModal from './ProgressModal';
import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/javascript";

window.Blockly = Blockly;
// Import utilities and data
import {
  getCurrentGameState,
  loadWeaponsData,
  toggleDebugMode,
  getRescuedPeople
} from '../../gameutils/utils/gameUtils';
import { getNextBlockHint } from '../../gameutils/utils/hintSystem';
import { useGameActions } from '../../components/playgame/hooks/useGameActions';
import { useGameConditions } from '../../components/playgame/hooks/useGameConditions';
import { handleRestartGame as handleRestartGameUtil } from '../../components/playgame/utils/gameHandlers';
import { updatePlayerWeaponDisplay } from '../../gameutils/utils/gameUtils';
import { useLevelLoader } from '../../components/playgame/hooks/useLevelLoader';
import { useBlocklySetup } from '../../components/playgame/hooks/useBlocklySetup';
import { usePhaserGame } from '../../components/playgame/hooks/usePhaserGame';
import { useCodeExecution } from '../../components/playgame/hooks/useCodeExecution';
import { useTextCodeValidation } from '../../components/playgame/hooks/useTextCodeValidation';
import { usePatternAnalysis } from '../../components/playgame/hooks/usePatternAnalysis';
import { useVisualGuide } from './hooks/useVisualGuide';
import { isInCombat } from '../../gameutils/utils/combatSystem';
import { clearGameOverScreen, showGameOver } from '../../gameutils/utils/phaserGame';
import { createToolboxConfig } from '../../gameutils/utils/blocklyUtils';
import { loadDfsExampleBlocks } from '../../gameutils/utils/blockly/loadDfsExample';
import { loadBfsExampleBlocks } from '../../gameutils/utils/blockly/loadBfsExample';

// Import components
import GameArea from '../../components/playgame/GameArea';
import BlocklyArea from '../../components/playgame/BlocklyArea';
import GameWithGuide from '../../components/playgame/GameWithGuide';

const LevelGame = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  // Suppress Blockly deprecation warnings globally for this component
  useEffect(() => {
    const originalConsoleWarn = console.warn;
    console.warn = function (...args) {
      const message = args.join(' ');
      if (message.includes('getAllVariables was deprecated') ||
        message.includes('Use Blockly.Workspace.getVariableMap().getAllVariables instead') ||
        message.includes('Blockly.Workspace.getAllVariables was deprecated')) {
        // Suppress this specific deprecation warning
        return;
      }
      originalConsoleWarn.apply(console, args);
    };

    // Cleanup function to restore original console.warn
    return () => {
      console.warn = originalConsoleWarn;
    };
  }, []);

  // Inject global CSS for Blockly highlights to ensure it's visible (some Blockly DOMs are outside React root)
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

  const [gameState, setGameState] = useState("loading");
  const [currentHint, setCurrentHint] = useState("กำลังโหลดข้อมูลด่าน...");
  const [blocklyLoaded, setBlocklyLoaded] = useState(false);

  // Progress tracking state
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

  // Ensure finalScore is set when game is over (so UI can display 0)
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

  // เพิ่ม useEffect นี้เข้าไปในโค้ด
  useEffect(() => {
    // ตรวจสอบ HP = 0 และแสดง Progress Modal
    if (playerHpState <= 0 && !isGameOver && !showProgressModal) {
      console.log("HP = 0 detected, showing game over modal");

      setIsGameOver(true);
      setGameState("gameOver");

      // คำนวณเวลาที่ใช้
      if (gameStartTime.current) {
        const endTime = Date.now();
        setTimeSpent(Math.floor((endTime - gameStartTime.current) / 1000));
      }

      setGameResult('gameover');
      setShowProgressModal(true);

      // แสดง Game Over screen
      const currentState = getCurrentGameState();
      if (currentState.currentScene) {
        showGameOver(currentState.currentScene);
      }
    }
  }, [playerHpState, isGameOver, showProgressModal]);

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

  // Set blocklyJavaScriptReady when blocklyLoaded becomes true
  useEffect(() => {
    if (blocklyLoaded && workspaceRef.current && !blocklyJavaScriptReady) {
      setBlocklyJavaScriptReady(true);
    }
  }, [blocklyLoaded, blocklyJavaScriptReady]);

  // Visual Guide System - use hook
  const { highlightBlocks, clearHighlights } = useVisualGuide(workspaceRef);

  // Use text code validation hook
  const { handleTextCodeChange } = useTextCodeValidation({
    currentLevel,
    textCode,
    workspaceRef,
    blocklyLoaded,
    blocklyJavaScriptReady,
    setCodeValidation
  });

  // Debug mode toggle function
  const handleDebugToggle = () => {
    const newDebugMode = toggleDebugMode();
    setDebugMode(newDebugMode);
    setCurrentHint(newDebugMode ? "🐛 Debug Mode: ON - แสดง Hitbox" : "🐛 Debug Mode: OFF");
  };

  // Use handleRestartGame from GameCore utils (must be before usePhaserGame)
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

  // Use Phaser game hook (must be before useBlocklySetup)
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

  // Use Blockly setup hook
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

  // เริ่มจับเวลาเมื่อเริ่มเกม
  useEffect(() => {
    if (gameState === "running") {
      gameStartTime.current = Date.now();
    }
  }, [gameState]);

  // Reset textCode และ validation เมื่อเปลี่ยนด่าน
  useEffect(() => {
    setTextCode("");
    setCodeValidation({ isValid: false, message: "" });
    setBlocklyJavaScriptReady(false);
  }, [levelId]);

  // Load initial data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await loadWeaponsData(getToken);
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError("ไม่สามารถโหลดข้อมูลได้: " + err.message);
        setCurrentHint("❌ เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Load level data when levelId changes - use hook
  useEffect(() => {
    // Cleanup previous game and workspace when changing levels
    if (phaserGameRef.current) {
      try {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      } catch (error) {
        console.warn("Error destroying Phaser game on level change:", error);
      }
    }

    if (workspaceRef.current) {
      try {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      } catch (error) {
        console.warn("Error disposing Blockly workspace on level change:", error);
      }
    }

    // Reset game state
    setGameState("loading");
    setCurrentHint("กำลังโหลดข้อมูลด่าน...");
    setIsRunning(false);
    setIsCompleted(false);
    setIsGameOver(false);
  }, [levelId]);

  // Use level loader hook
  useLevelLoader({
    levelId: levelId && !isNaN(parseInt(levelId)) ? parseInt(levelId) : null,
    getToken,
    isPreview: false,
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

  // Update toolbox when enabled blocks change
  useEffect(() => {
    if (blocklyLoaded && Object.keys(enabledBlocks).length > 0 && workspaceRef.current) {
      try {
        const newToolbox = createToolboxConfig(enabledBlocks);
        workspaceRef.current.updateToolbox(newToolbox);
          } catch (error) {
        console.warn("Error updating toolbox:", error);
      }
    }
  }, [enabledBlocks, blocklyLoaded]);

  // Use pattern analysis hook
  usePatternAnalysis({
    blocklyLoaded,
    workspaceRef,
    goodPatterns,
    setHintData,
    setCurrentWeaponData,
    setPatternFeedback,
    setPartialWeaponKey,
    highlightBlocks,
    clearHighlights,
    hintOpen,
    hintData
  });

  // Auto-close hint when the user has progressed past the step that was open when they opened the hint
  useEffect(() => {
    if (!hintOpen) return;
    const currentStep = hintData?.currentStep || 0;
    const openedAt = hintOpenAtStepRef.current || 0;
    // If the workspace progressed (currentStep increased) then close the hint and clear highlights
    if (currentStep > openedAt) {
      setHintOpen(false);
      clearHighlights();
    }
  }, [hintData?.currentStep, hintOpen]);

  // Visual Guide System - handled by usePatternAnalysis hook
  // Visual guide highlighting is now managed within pattern analysis

  // Debug useEffects removed - not needed in production

  // Cleanup Phaser game and Blockly workspace on unmount
  useEffect(() => {
    return () => {
      if (phaserGameRef.current) {
        try {
          phaserGameRef.current.destroy(true);
        } catch (error) {
          console.warn("Error destroying Phaser game:", error);
        }
      }
      if (workspaceRef.current) {
        try {
          workspaceRef.current.dispose();
        } catch (error) {
          console.warn("Error disposing Blockly workspace:", error);
        }
        workspaceRef.current = null;
      }
      setBlocklyLoaded(false);
    };
  }, []);

  // Initialize Blockly and Phaser when ready
  useEffect(() => {
    if (!currentLevel || !blocklyRef.current) return;
    if (!enabledBlockKeySignature || Object.keys(enabledBlocks).length === 0) return;
    if (initBlocklyAndPhaser) {
      initBlocklyAndPhaser();
    }
  }, [currentLevel?.id, enabledBlockKeySignature, blocklyRef.current]);

  // loadLevelData is now handled by useLevelLoader hook
  // Removed duplicate loadInitialData and loadLevelData functions

  // Game action functions - use hooks from GameCore (must be before useCodeExecution)
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
    isPreview: false
  });

  // Condition functions - use hooks from GameCore (must be before useCodeExecution)
  const { foundMonster, canMoveForward, nearPit, atGoal } = useGameConditions({
    currentLevel
  });

  // Use code execution hook
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

  const handleBackToMapSelection = () => {
    navigate('/user/mapselect');
  };

  const handleNextLevel = () => {
    const nextLevelId = parseInt(levelId) + 1;
    navigate(`user/mapselection/${nextLevelId}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <p className="text-white text-lg mb-4">{error}</p>
          <button
            onClick={handleBackToMapSelection}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            กลับไปเลือกด่าน
          </button>
        </div>
      </div>
    );
  }

  if (!currentLevel) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">กำลังโหลดด่าน...</p>
        </div>
      </div>
    );
  }


  return (
    <GameWithGuide levelData={currentLevel} levelName={currentLevel?.name || `ด่าน ${levelId}`}>
      {/* CSS for Blockly highlight */}
      <style>
        {`
          .blockly-highlight-border {
            filter: drop-shadow(0 0 8px #00ff00) !important;
          }
          .blockly-highlight-border .blocklyPath {
            stroke: #00ff00 !important;
            stroke-width: 3px !important;
          }
          .blockly-highlight-border .blocklyText {
            fill: #ffffff !important;
          }
        `}
      </style>

      <div className="flex h-screen bg-black text-white overflow-hidden">
        {/* Game Area - 65% ของหน้าจอ */}
        <div className="w-[65%] flex flex-col p-2">
          <GameArea
            gameRef={gameRef}
            levelData={currentLevel}
            playerNodeId={playerNodeId}
            playerDirection={playerDirection}
            playerHpState={playerHpState}
            isCompleted={isCompleted}
            isGameOver={isGameOver}
            currentWeaponData={currentWeaponData}
            currentHint={currentHint}
            hintData={hintData}
            hintOpen={hintOpen}
            onToggleHint={() => {
              console.log('🔔 onToggleHint called - hintOpen currently:', hintOpen, 'hintData.currentStep:', hintData?.currentStep);
              if (!hintOpen) {
                // opening
                setHintOpen(true);
                setHintOpenCount(c => c + 1);
                hintOpenAtStepRef.current = hintData?.currentStep || 0;
                console.log('🔔 Hint opened at step', hintOpenAtStepRef.current, 'new count:', hintOpenCount + 1);

                // Immediately compute hint info and attempt to highlight (in case visual guide effect timing misses)
                try {
                  const ws = workspaceRef.current;
                  const hp = getNextBlockHint(ws, goodPatterns);
                  console.log('🔔 onToggleHint - getNextBlockHint result:', hp);
                  const blocksToHighlight = hp?.hintData?.visualGuide?.highlightBlocks || hp?.hintData?.visualGuide?.highlightBlocks || hp?.patternName && (() => {
                    // fallback: try find pattern by name and use its first hint visualGuide
                    const p = goodPatterns.find(pp => pp.name === hp.patternName);
                    return p?.hints?.[hp.currentStep > 0 ? hp.currentStep - 1 : 0]?.visualGuide?.highlightBlocks;
                  })();
                  console.log('🔔 onToggleHint - blocksToHighlight:', blocksToHighlight);
                  if (Array.isArray(blocksToHighlight) && blocksToHighlight.length > 0) {
                    highlightBlocks(blocksToHighlight);
                  } else {
                    console.log('🔔 onToggleHint - no visualGuide.highlightBlocks found');
                  }
                } catch (e) {
                  console.warn('🔔 onToggleHint fallback failed:', e);
                }
              } else {
                // closing
                setHintOpen(false);
                clearHighlights();
                console.log('🔔 Hint closed');
              }
            }}
            hintOpenCount={hintOpenCount}
            playerCoins={getCurrentGameState().playerCoins || []}
            rescuedPeople={rescuedPeople}
            finalScore={finalScore}
            inCombatMode={inCombatMode}
            blocklyJavaScriptReady={blocklyJavaScriptReady}
            showScore={true}
          />
        </div>

        {/* Blockly Area - 35% ของหน้าจอ */}
        <div className="w-[35%] border-l border-black flex flex-col bg-gray-800/50 backdrop-blur-sm overflow-hidden">
          {/* Level Header - Simplified */}
          <div className="bg-stone-900 p-4  shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {currentLevel?.name || `ด่าน ${levelId}`}
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
            handleTextCodeChange={handleTextCodeChange}
          />

        </div>
      </div>

      {/* Progress Modal */}
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
    </GameWithGuide>
  );
};

export default LevelGame;