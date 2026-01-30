// src/components/GameArea.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { directions } from '../../gameutils/shared/game';
import { fetchLevelById } from '../../services/levelService';
import GameStateVisualization from './GameStateVisualization';
import { getCurrentGameState } from '../../gameutils/shared/game';
// UI Components
import StatusPanel from './ui/StatusPanel';
import BlockCountPanel from './ui/BlockCountPanel';
import HintButton from './ui/HintButton';
import GuideButton from './ui/GuideButton';
import PatternMatchPanel from './ui/PatternMatchPanel';
import BigOSelector from './ui/BigOSelector';
import HintPopup from './HintPopup';

import { API_BASE_URL } from '../../config/apiConfig';

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

      <HintPopup
        hints={levelHints}
        isOpen={hintOpen && levelHints && levelHints.length > 0}
        onClose={onToggleHint}
        initialHintIndex={hintOpenCount}
      />
    </div>

  );
};

export default GameArea;