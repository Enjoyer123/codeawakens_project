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
import { loadKnapsackExampleBlocks } from '../../gameutils/utils/blockly/loadKnapsackExample';
import { loadDynamicKnapsackExampleBlocks } from '../../gameutils/utils/blockly/loadDynamicKnapsackExample';
import { loadSubsetSumExampleBlocks } from '../../gameutils/utils/blockly/loadSubsetSumExample';
import { loadDynamicSubsetSumExampleBlocks } from '../../gameutils/utils/blockly/loadDynamicSubsetSumExample';
import { loadCoinChangeExampleBlocks } from '../../gameutils/utils/blockly/loadCoinChangeExample';
import { loadDynamicCoinChangeExampleBlocks } from '../../gameutils/utils/blockly/loadDynamicCoinChangeExample';
import { loadGreedyCoinChangeExampleBlocks } from '../../gameutils/utils/blockly/loadGreedyCoinChangeExample';
import { loadDijkstraExampleBlocks } from '../../gameutils/utils/blockly/loadDijkstraExample';
import { loadPrimExampleBlocks } from '../../gameutils/utils/blockly/loadPrimExample';
import { loadDynamicAntDpExampleBlocks } from '../../gameutils/utils/blockly/loadDynamicAntDpExample';
import { loadTrainScheduleExampleBlocks } from '../../gameutils/utils/blockly/loadTrainScheduleExample';

// Import components
import GameArea from '../../components/playgame/GameArea';
import BlocklyArea from '../../components/playgame/BlocklyArea';
import GameWithGuide from '../../components/playgame/GameWithGuide';

const LevelGame = () => {
  console.log('🔍 [LevelGame] Component render');
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

  // Debug: Log hintData changes
  useEffect(() => {
    console.log('🔍 [LevelGame] hintData state changed:', hintData);
  }, [hintData]);

  // Score system state
  const [finalScore, setFinalScore] = useState(null);

  // Hint open / count state
  const [hintOpen, setHintOpen] = useState(false);
  const [hintOpenCount, setHintOpenCount] = useState(0);
  const hintOpenAtStepRef = useRef(null);

  // Level-based hints (from DB) state
  const [levelHints, setLevelHints] = useState([]); // kept mainly for debug; source of truth is currentLevel.hints
  const [levelHintIndex, setLevelHintIndex] = useState(0);
  const [activeLevelHint, setActiveLevelHint] = useState(null);

  // User Big O selection state
  const [userBigO, setUserBigO] = useState(null);

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

  // Debug: Log currentLevel.starter_xml before passing to useBlocklySetup
  console.log('🔍 [LevelGame] Before useBlocklySetup:', {
    hasCurrentLevel: !!currentLevel,
    currentLevelId: currentLevel?.level_id,
    hasStarterXml: !!currentLevel?.starter_xml,
    starterXmlType: typeof currentLevel?.starter_xml,
    starterXmlLength: currentLevel?.starter_xml ? currentLevel.starter_xml.length : 0,
    starterXmlPreview: currentLevel?.starter_xml ? currentLevel.starter_xml.substring(0, 100) : null
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
    initPhaserGame,
    starter_xml: currentLevel?.starter_xml || null,
    blocklyLoaded
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
    setLevelHints([]);
    setLevelHintIndex(0);
    setActiveLevelHint(null);
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

  // Sync level hints from currentLevel (DB hints)
  useEffect(() => {
    console.log('🔍 [LevelGame] Sync level hints from currentLevel:', {
      hasCurrentLevel: !!currentLevel,
      levelId: currentLevel?.level_id,
      rawHintsType: typeof currentLevel?.hints,
      rawHintsLength: Array.isArray(currentLevel?.hints) ? currentLevel.hints.length : 'n/a',
      rawHints: currentLevel?.hints
    });

    if (currentLevel && Array.isArray(currentLevel.hints)) {
      const ordered = [...currentLevel.hints]
        .filter(h => h.is_active !== false)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      console.log('🔍 [LevelGame] Ordered levelHints:', ordered);
      setLevelHints(ordered);
      setLevelHintIndex(0);
      setActiveLevelHint(null);
    } else {
      setLevelHints([]);
      setLevelHintIndex(0);
      setActiveLevelHint(null);
    }
  }, [currentLevel]);

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
  console.log('🔍 [LevelGame] Calling usePatternAnalysis with setCurrentHint:', {
    hasSetCurrentHint: !!setCurrentHint,
    setCurrentHintType: typeof setCurrentHint,
    setCurrentHint: setCurrentHint
  });
  usePatternAnalysis({
    blocklyLoaded,
    workspaceRef,
    goodPatterns,
    setHintData,
    setCurrentHint,
    setCurrentWeaponData,
    setPatternFeedback,
    setPartialWeaponKey,
    highlightBlocks,
    clearHighlights,
    hintOpen,
    hintData
  });

  // Update currentHint from hintData.hint
  // Priority: hintData.hint > loading message
  useEffect(() => {
    const hintValue = hintData?.hint;

    console.log('🔍 [LevelGame] hintData update effect triggered:', {
      hintDataHint: hintValue,
      hintDataHintType: typeof hintValue,
      hintDataHintLength: hintValue?.length,
      hintDataCurrentStep: hintData?.currentStep,
      hintDataTotalSteps: hintData?.totalSteps,
      currentHint: currentHint,
      hintDataExists: !!hintData,
      hintDataKeys: hintData ? Object.keys(hintData) : [],
      hintDataStringified: JSON.stringify(hintData)
    });

    // Always update if hintData.hint exists and is not empty
    // This will override the loading message
    if (hintValue && typeof hintValue === 'string' && hintValue.trim() !== '') {
      console.log('🔍 [LevelGame] ✅ Condition passed! Updating currentHint from hintData.hint:', hintValue);
      console.log('🔍 [LevelGame] Current currentHint before update:', currentHint);
      if (currentHint !== hintValue) {
        setCurrentHint(hintValue);
        console.log('🔍 [LevelGame] ✅ setCurrentHint called with:', hintValue);
      } else {
        console.log('🔍 [LevelGame] ⚠️ currentHint already equals hintValue, skipping update');
      }
    } else {
      console.log('🔍 [LevelGame] ❌ Condition NOT passed:', {
        hasHintData: !!hintData,
        hasHint: !!hintValue,
        hintType: typeof hintValue,
        hintValue: hintValue,
        hintTrimmed: hintValue?.trim(),
        hintIsEmpty: hintValue?.trim() === ''
      });

      // If hintData exists but hint is empty, show default message
      // But only if current hint is still the loading message
      if (hintData && (!hintValue || hintValue.trim() === '') && currentHint && currentHint.includes('โหลดด่าน')) {
        console.log('🔍 [LevelGame] Setting default hint: "วาง blocks เพื่อเริ่มต้น"');
        setCurrentHint("วาง blocks เพื่อเริ่มต้น");
      }
    }
  }, [hintData, currentHint]);

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
              console.log('🔔 onToggleHint (popup close) called - hintOpen currently:', hintOpen);
              setHintOpen(false);
            }}
            hintOpenCount={hintOpenCount}
            levelHints={levelHints}
            activeLevelHint={activeLevelHint}
            workspaceRef={workspaceRef}
            onNeedHintClick={() => {
              // คำนวณ hints จาก currentLevel โดยตรง (ไม่พึ่ง state ซิงค์)
              const baseHints = Array.isArray(currentLevel?.hints)
                ? [...currentLevel.hints]
                  .filter(h => h.is_active !== false)
                  .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                : [];

              console.log('🔔 Need Hint clicked', {
                levelHintsLength: baseHints.length,
                levelHintIndex,
                needHintDisabled:
                  !baseHints || baseHints.length === 0 || levelHintIndex >= baseHints.length
              });
              // ถ้าใช้หมดแล้ว ไม่ทำอะไร
              if (!baseHints || baseHints.length === 0 || levelHintIndex >= baseHints.length) return;
              const nextHint = baseHints[levelHintIndex];
              console.log('🔔 Next level hint selected:', nextHint);
              setActiveLevelHint(nextHint);
              setLevelHintIndex(levelHintIndex + 1);
              setHintOpen(true);
            }}
            needHintDisabled={
              !Array.isArray(currentLevel?.hints) ||
              currentLevel.hints.filter(h => h.is_active !== false).length === 0 ||
              levelHintIndex >= currentLevel.hints.filter(h => h.is_active !== false).length
            }
            playerCoins={getCurrentGameState().playerCoins || []}
            rescuedPeople={rescuedPeople}
            finalScore={finalScore}
            inCombatMode={inCombatMode}
            blocklyJavaScriptReady={blocklyJavaScriptReady}
            showScore={true}
            userBigO={userBigO}
            onUserBigOChange={setUserBigO}
          />
        </div>

        {/* Blockly Area - 35% ของหน้าจอ */}
        <div className="w-[35%] border-l border-black flex flex-col bg-gray-800/50 backdrop-blur-sm overflow-hidden">
          {/* Level Header - Simplified */}
          <div className="bg-stone-900 p-4  shadow-lg">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {currentLevel?.name || `ด่าน ${levelId}`}
                  </h2>
                </div>
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

                  {/* Ant DP (Applied Dynamic) */}
                  {currentLevel?.appliedData?.type?.includes('ANT') && (
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
                  )}
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
        userBigO={userBigO}
        getToken={getToken}
      />
    </GameWithGuide>
  );
};

export default LevelGame;