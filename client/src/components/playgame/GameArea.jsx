// src/components/GameArea.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { directions } from '../../gameutils/shared/game';
import { fetchLevelById } from '../../services/levelService';
import GameStateVisualization from './GameStateVisualization';
import { getCurrentGameState } from '../../gameutils/shared/game';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";

// UI Components
import StatusPanel from './ui/StatusPanel';
import BlockCountPanel from './ui/BlockCountPanel';
import HintButton from './ui/HintButton';
import GuideButton from './ui/GuideButton';
import PatternMatchPanel from './ui/PatternMatchPanel';
import BigOSelector from './ui/BigOSelector';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const GameArea = ({
  gameRef,
  levelData,
  playerNodeId,
  playerDirection,
  playerHpState,
  isCompleted,
  isGameOver,
  currentWeaponData,
  currentHint,
  hintData,
  hintOpen,
  levelHints,
  activeLevelHint,
  onNeedHintClick,
  needHintDisabled,
  onToggleHint,
  hintOpenCount,
  finalScore,
  inCombatMode,
  playerCoins = [],
  rescuedPeople = [],
  collectedTreasures = [],
  workspaceRef,
  userBigO,
  onUserBigOChange,
  userProgress,
  allLevels,
  onOpenGuide,
  hasGuides,
}) => {
  const { getToken } = useAuth();
  const [viewerData, setViewerData] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const currentBlockCount = hintData?.currentBlockCount || 0;

  // ใช้ bestPattern.count ถ้ามี หรือใช้ totalBlocks เป็น fallback
  const patternBlockCount = hintData?.bestPattern?.count || hintData?.totalBlocks || null;
  console.log('🔍 [GameArea] patternBlockCount:', patternBlockCount);
  console.log('🔍 [GameArea] Block count debug:', {
    currentBlockCount,
    patternBlockCount,
    hasBestPattern: !!hintData?.bestPattern,
    bestPatternName: hintData?.bestPattern?.name,
    bestPatternCount: hintData?.bestPattern?.count,
    totalBlocks: hintData?.totalBlocks
  });

  console.log('🔍 [GameArea] render Assist panel state:', {
    onNeedHintClickType: typeof onNeedHintClick,
    hasLevelHints: Array.isArray(levelHints) && levelHints.length > 0,
    levelHintsLength: levelHints?.length || 0,
    hintOpen,
    needHintDisabled,
    hasActiveLevelHint: !!activeLevelHint,
  });

  // --- Logic: ค้นหารูปอาวุธระดับดีที่สุดของด่านนี้ ---
  const allPatterns = [...(levelData?.goodPatterns || []), ...(levelData?.patterns || [])];
  const idealPattern = allPatterns.find(p => p.pattern_type_id === 1) ||
    allPatterns.find(p => p.pattern_type_id === 2);

  const currentBestPattern = hintData?.bestPattern;
  let weaponProgress = 0;

  if (idealPattern) {
    const isMatchingIdeal = currentBestPattern?.pattern_id === idealPattern.pattern_id ||
      currentBestPattern?.name === idealPattern.name;

    if (isMatchingIdeal) {
      weaponProgress = hintData.patternPercentage || 0;
    } else if (currentBestPattern?.pattern_type_id === 2 && idealPattern.pattern_type_id === 1) {
      // ด่านมีระดับดี (Gold) แต่เราเขียนระดับกลาง (Silver) ให้ค้างที่ 66% ตามที่ตกลงกัน
      weaponProgress = 66;
    } else {
      // กรณีอื่นๆ เช่น ยังเขียนไม่ถึง หรือเขียนคนละตัว
      weaponProgress = 0;
    }
  }

  // Helper to get weapon image path
  const getWeaponImage = (pattern) => {
    if (!pattern) return null;
    const key = pattern.weaponKey || pattern.weapon?.weapon_key || 'stick';
    // ลองหาหลายๆ path: uploads, weapons (local), หรือ default stick
    return `${API_BASE_URL}/uploads/weapons/${key}_idle_1.png`;
  };

  const weaponImgSrc = getWeaponImage(idealPattern);

  const closeDetail = () => setViewerData(null);

  // Open detail: try to fetch full level details from API, otherwise use adapter fallback
  const openDetail = async () => {
    // If we already have viewer data, just show it
    if (viewerData) return;

    const adapter = () => ({
      level: levelData || {},
      enabledBlocks: levelData?.enabledBlocks || levelData?.enabled_blocks || [],
      patterns: levelData?.patterns || levelData?.goodPatterns || [],
      victoryConditions: levelData?.victoryConditions || levelData?.victory_conditions || [],
      guides: levelData?.guides || [],
      weaponImages: levelData?.weaponImages || []
    });

    // If level has an id, try fetching full details used by Admin
    const levelId = levelData?.id || levelData?.level_id || levelData?.level?.id;
    if (!levelId || !getToken) {
      setViewerData(adapter());
      return;
    }

    setViewerLoading(true);
    try {
      const fullLevel = await fetchLevelById(getToken, levelId);
      if (fullLevel && fullLevel.level_id) {
        setViewerData({
          level: fullLevel,
          enabledBlocks: (fullLevel.level_blocks || []).map((lb) => lb.block),
          patterns: fullLevel.patterns || [],
          victoryConditions: (fullLevel.level_victory_conditions || []).map(
            (vc) => vc.victory_condition
          ),
          guides: fullLevel.guides || [],
          weaponImages: fullLevel.weaponImages || []
        });
      } else {
        setViewerData(adapter());
      }
    } catch (err) {
      console.warn('Failed to fetch full level details:', err);
      setViewerData(adapter());
    } finally {
      setViewerLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Phaser Game - Main container */}
      <div className="flex-1 w-full relative flex items-end justify-center overflow-hidden bg-stone-900 min-h-0">
        <div
          ref={gameRef}
          className="w-full h-full"
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        />
        {/* Game State Visualization (Unified) */}
        <GameStateVisualization
          levelData={levelData}
          playerCoins={playerCoins}
          rescuedPeople={rescuedPeople}
          collectedTreasures={collectedTreasures}
        />
      </div>

      {/* Compact Bottom UI Bar */}
      <div className="flex-shrink-0 bg-stone-900/95 backdrop-blur-md border-t border-gray-700/50 shadow-2xl z-30">
        <div className="flex items-center gap-4 p-3 text-gray-200">

          {/* STATUS: HP & Weapon */}
          <StatusPanel
            playerHpState={playerHpState}
            currentWeaponData={currentWeaponData}
          />

          {/* Block Count */}
          <BlockCountPanel
            currentBlockCount={currentBlockCount}
            patternBlockCount={patternBlockCount}
          />

          {/* Hint Button */}
          <HintButton
            onNeedHintClick={onNeedHintClick}
            needHintDisabled={needHintDisabled}
          />

          {/* Guide Button */}
          <GuideButton
            onOpenGuide={onOpenGuide}
            disabled={!hasGuides}
          />

          {/* Pattern Match */}
          <PatternMatchPanel
            hintData={hintData}
            idealPattern={idealPattern}
            weaponProgress={weaponProgress}
            weaponImgSrc={weaponImgSrc}
          />

          {/* Big O Complexity */}
          <BigOSelector
            userBigO={userBigO}
            onUserBigOChange={onUserBigOChange}
            hintData={hintData}
          />

        </div>
      </div>

      <Dialog
        open={hintOpen && !!activeLevelHint}
        onOpenChange={(isOpen) => {
          if (!isOpen && onToggleHint) {
            onToggleHint();
          }
        }}
      >
        <DialogContent className="bg-[url('/paper.png')] bg-cover bg-center bg-no-repeat border border-yellow-700/80 max-w-4xl w-[96%] max-h-[85vh] overflow-y-auto p-8 shadow-2xl">
          <DialogHeader className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-yellow-900 font-bold bg-yellow-400/20 px-2 py-0.5 rounded">
                Hint
              </span>
            </div>
            <DialogTitle className="text-lg font-bold text-stone-900">
              {activeLevelHint?.title}
            </DialogTitle>
            {activeLevelHint?.description && (
              <DialogDescription className="text-sm text-stone-800 font-medium leading-relaxed text-left">
                {activeLevelHint.description}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {activeLevelHint?.hint_images && activeLevelHint.hint_images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeLevelHint.hint_images.map(img => (
                  <div
                    key={img.hint_image_id}
                    className="w-full h-60 md:h-72 bg-black/60 border border-yellow-700/50 rounded-xl flex items-center justify-center overflow-hidden"
                  >
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}${img.path_file}`}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 text-[10px] text-yellow-400/80 text-right">
              กดปุ่ม "Need Hint" อีกครั้งเพื่อดู Hint ถัดไป (ถ้ามี)
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>

  );
};

export default GameArea;