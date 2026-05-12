/**
 * DemoGameCore — Auth-free version of GameCore for the Landing page.
 * - No Clerk token required (uses public /api/demo/* endpoints)
 * - isPreview=true → no progress saving
 * - No Mission Briefing, no Guide popup, no BGM
 */

import React, { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/javascript";

import { removeStarterListener } from '../playgame/hooks/blocklysetup/xmlLoader';
import { clearRescuedPeople } from '../../gameutils/entities/personUtils';
import { clearPlayerCoins } from '../../gameutils/entities/coinUtils';
import { seedWeaponsData } from '../../gameutils/entities/weaponUtils';
import { animationController } from '../../gameutils/algo/playback/AnimationController';

import GameArea from '../playgame/GameArea';
import BlocklyArea from '../playgame/BlocklyArea';
import ExecutionErrorModal from '../playgame/modals/ExecutionErrorModal';
import PageLoader from '../shared/Loading/PageLoader';

import { usePhaserGame } from '../playgame/hooks/usePhaserGame';
import { useBlocklySetup } from '../playgame/hooks/blocklysetup/useBlocklySetup';
import { useCodeExecution } from '../playgame/hooks/execution/useCodeExecution';
import { useLevelInitializer } from '../playgame/hooks/useLevelLoader';
import { usePatternAnalysis } from '../playgame/hooks/usePatternAnalysis';
import { useTextCodeValidation } from '../playgame/hooks/useTextCodeValidation';
import { usePseudocodeSync } from '../playgame/hooks/usePseudocodeSync';
import { useSuppressBlocklyWarnings } from '../admin/level/hooks/useSuppressBlocklyWarnings';

import { fetchDemoLevel, fetchDemoWeapons } from '../../services/api/demoService';

// isPreview=true → algoRunner skips all save calls
const IS_PREVIEW = true;
const mockGetToken = async () => null;

const DemoGameCore = ({ levelId }) => {
  const gameRef       = useRef(null);
  const blocklyRef    = useRef(null);
  const workspaceRef  = useRef(null);
  const phaserGameRef = useRef(null);

  // ── Remote data ──
  const [levelData,   setLevelData]   = useState(null);
  const [weaponsData, setWeaponsData] = useState(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [fetchError,  setFetchError]  = useState(null);

  // ── Game UI state ──
  const [gameState,         setGameState]         = useState("loading");
  const [blocklyLoaded,     setBlocklyLoaded]     = useState(false);
  const [currentLevel,      setCurrentLevel]      = useState(null);
  const [enabledBlocks,     setEnabledBlocks]     = useState({});
  const [workspaceVersion,  setWorkspaceVersion]  = useState(0);

  const [playerHpState,     setPlayerHp]          = useState(100);
  const [isCompleted,       setIsCompleted]       = useState(false);
  const [isRunning,         setIsRunning]         = useState(false);
  const [isGameOver,        setIsGameOver]        = useState(false);
  const [currentWeaponData, setCurrentWeaponData] = useState(null);
  const [userBigO,          setUserBigO]          = useState(null);
  const [showBigOQuiz,      setShowBigOQuiz]      = useState(false);
  const [patternData,       setPatternData]       = useState({});
  const [finalScore,        setFinalScore]        = useState(null);
  const [goodPatterns,      setGoodPatterns]      = useState([]);
  const [textCode,          setTextCode]          = useState("");
  const [starterTextCode,   setStarterTextCode]   = useState("");
  const [codeValidation,    setCodeValidation]    = useState({ isValid: false, message: "" });
  const [testCaseResult,    setTestCaseResult]    = useState(null);

  // ── Fetch demo data (no auth) ──
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        const [level, weapons] = await Promise.all([
          fetchDemoLevel(levelId),
          fetchDemoWeapons(),
        ]);
        if (cancelled) return;
        setLevelData(level);
        setWeaponsData(weapons?.weapons || []);
      } catch (err) {
        if (!cancelled) setFetchError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [levelId]);

  useEffect(() => {
    if (weaponsData?.length) seedWeaponsData(weaponsData);
  }, [weaponsData]);

  useSuppressBlocklyWarnings();

  // ── Text code validation ──
  const { handleTextCodeChange } = useTextCodeValidation({
    currentLevel, textCode, workspaceRef, blocklyLoaded, setCodeValidation
  });
  const handleTextCodeChangeWithState = (code) => {
    setTextCode(code);
    handleTextCodeChange(code);
  };
  const handleInitialCodeGenerated = (code) => {
    setStarterTextCode(code);
    handleTextCodeChangeWithState(code);
  };

  // ── Level init ──
  useLevelInitializer({
    levelData, weaponsData,
    isPreview: IS_PREVIEW, patternId: null,
    setEnabledBlocks, setGoodPatterns, setPlayerHp,
    setIsCompleted, setIsGameOver, setCurrentWeaponData,
    setGameState, setCurrentLevelState: setCurrentLevel,
    setTextCode, setCodeValidation,
  });

  // ── Pattern analysis ──
  usePatternAnalysis({
    blocklyLoaded, workspaceRef, workspaceVersion,
    goodPatterns, setPatternData, setCurrentWeaponData,
  });

  // ── Phaser ──
  const { initPhaserGame } = usePhaserGame({
    gameRef, phaserGameRef, currentLevel,
    setCurrentWeaponData, setPlayerHp, setIsGameOver, isRunning,
  });

  // ── Code execution (isPreview=true → no saves) ──
  const { runCode, executionError, clearExecutionError } = useCodeExecution({
    workspaceRef, currentLevel, codeValidation, blocklyLoaded,
    isPreview: IS_PREVIEW, patternId: null,
    onUnlockPattern: null, onUnlockLevel: null,
    getToken: mockGetToken, textCode,
    setters: {
      setPlayerHp, setIsCompleted, setIsRunning, setIsGameOver,
      setGameState,
      setShowProgressModal: () => {},
      setGameResult: () => {},
      setFinalScore, setPatternData, setTestCaseResult,
    },
    scoring: { goodPatterns, userBigO, patternData },
  });

  // ── Difficulty flags ──
  const isHardMode   = currentLevel?.dificulty === 'hard';
  const isMediumMode = currentLevel?.dificulty === 'medium';
  const starterXml   = isHardMode ? null : (currentLevel?.starter_xml || null);
  const floatingXml  = (isMediumMode || isHardMode) ? null : (currentLevel?.floating_xml || null);

  // ── Blockly setup ──
  const { initBlocklyAndPhaser } = useBlocklySetup({
    blocklyRef, workspaceRef, enabledBlocks,
    setBlocklyLoaded, initPhaserGame,
    starter_xml: starterXml, floating_xml: floatingXml,
    blocklyLoaded,
    isTextCodeEnabled: currentLevel?.textcode || false,
    onCodeGenerated: handleInitialCodeGenerated,
    dificulty: currentLevel?.dificulty || 'easy',
  });

  // ── Main effect: init game ──
  useEffect(() => {
    if (!currentLevel || !blocklyRef.current || Object.keys(enabledBlocks).length === 0) return;

    initBlocklyAndPhaser();
    setWorkspaceVersion(v => v + 1);
    // No BGM, no Mission Briefing in demo mode

    return () => {
      setBlocklyLoaded(false);
      clearPlayerCoins();
      clearRescuedPeople();
      animationController.abort();
      if (phaserGameRef.current) {
        try { phaserGameRef.current.destroy(true); phaserGameRef.current = null; } catch (_) {}
      }
      if (workspaceRef.current) {
        try { workspaceRef.current.dispose(); workspaceRef.current = null; } catch (_) {}
      }
    };
  }, [currentLevel, enabledBlocks]);

  // ── Pseudocode sync ──
  const { selectedBlockType } = usePseudocodeSync({ blocklyLoaded, workspaceRef, patternData });

  // ── Replay ──
  const handleReplayGame = () => {
    setIsCompleted(false);
    setIsRunning(false);
    setIsGameOver(false);
    setGameState("ready");
    setTestCaseResult(null);
    animationController.abort();
    clearPlayerCoins();
    clearRescuedPeople();
    initPhaserGame();
  };

  const handleRunClick = () => {
    if (isCompleted || isGameOver || testCaseResult) {
      handleReplayGame();
      setTimeout(runCode, 50);
      return;
    }
    runCode();
  };

  // ── Render ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0f111a]">
        <PageLoader message="Loading demo..." />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0f111a] text-red-400 text-center p-8">
        <div>
          <p className="text-xl font-bold mb-2">ไม่สามารถโหลด Demo ได้</p>
          <p className="text-sm opacity-70">{fetchError}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full bg-[#0f111a]">
        {/* Game Area — 60% */}
        <div className="w-[60%] relative bg-[#0f111a]">
          <div className="absolute top-3 left-3 z-40 pointer-events-none">
            <span className="text-sm font-bold text-white/80 bg-[#2e1065]/80 backdrop-blur-md px-3 py-1 rounded-lg border border-purple-500/30">
              {currentLevel?.level_name || 'Demo'}&nbsp;
              <span className="text-yellow-400">— Demo Mode</span>
            </span>
          </div>
          <GameArea
            gameRef={gameRef}
            currentLevel={currentLevel}
            playerHpState={playerHpState}
            currentWeaponData={currentWeaponData}
            patternData={patternData}
            onUserBigOChange={(val) => { setUserBigO(val); setShowBigOQuiz(false); }}
            showBigOQuiz={showBigOQuiz}
            onCloseBigOQuiz={() => setShowBigOQuiz(false)}
            hasGuides={false}
            onOpenGuide={() => {}}
            isRunning={isRunning}
          />
        </div>

        {/* Blockly Area — 40% */}
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
                userProgress={[]}
                allLevels={[]}
                onLoadXml={() => {}}
                onAutoInject={() => {
                  if (!workspaceRef.current || !currentLevel?.starter_xml) return;
                  removeStarterListener(workspaceRef.current);
                  Blockly.Events.disable();
                  workspaceRef.current.clear();
                  Blockly.Events.enable();
                }}
                isPreview={true}
                isAdmin={false}
                starterTextCode={starterTextCode}
                patternData={patternData}
                selectedBlockType={selectedBlockType}
              />
            </div>
          </div>
        </div>
      </div>

      <ExecutionErrorModal
        open={!!executionError}
        error={executionError}
        onClose={clearExecutionError}
      />
    </>
  );
};

export default DemoGameCore;
