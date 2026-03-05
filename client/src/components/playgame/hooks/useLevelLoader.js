/**
 * Hook for initializing level data from API response into game-ready format.
 * Receives raw levelData from useLevel() and transforms it for Phaser + Blockly.
 */

import { useEffect, useRef } from 'react';
import {
  getWeaponData,
  getWeaponsData
} from '../../../gameutils/entities/weaponUtils';

import { ensureDefaultBlocks } from '../../../gameutils/blockly/core/defaults';
import {
  setLevelData,
  setCurrentGameState,
  resetPlayerHp,
} from '../../../gameutils/shared/game/gameState';
import {
  safeParse,
  normalizeNodes,
  normalizeEdges,
  normalizePatternHints,
} from '../../../gameutils/shared/game/levelParser';

import { API_BASE_URL } from '../../../config/apiConfig';

// ─── Helper: Extract victory conditions ───
const extractVictoryConditions = (levelResponse) =>
  (levelResponse.level_victory_conditions || [])
    .map((vc) => ({
      level_victory_condition_id: vc.level_victory_condition_id,
      type: vc.victory_condition?.type,
      description: vc.victory_condition?.description,
      check: vc.victory_condition?.check
    }))
    .filter((vc) => vc.type);

// ─── Helper: Extract guides ───
const extractGuides = (levelResponse) =>
  (levelResponse.guides || []).map((guide) => ({
    ...guide,
    guide_images: guide.guide_images || []
  }));

// ─── Helper: Extract hints ───
const extractHints = (levelResponse) =>
  (levelResponse.hints || []).map((hint) => ({
    hint_id: hint.hint_id,
    level_id: hint.level_id,
    title: hint.title,
    description: hint.description,
    display_order: hint.display_order || 0,
    is_active: hint.is_active,
    created_at: hint.created_at,
    updated_at: hint.updated_at,
    hint_images: hint.hint_images || []
  }));

// ─── Helper: Build enabled blocks map ───
const buildEnabledBlocks = (levelResponse) => {
  const blocksMap = {};

  // Primary source: level_blocks relation
  (levelResponse.level_blocks || []).forEach((blockInfo) => {
    if (blockInfo?.block?.block_key) {
      blocksMap[blockInfo.block.block_key] = true;
    }
  });

  // Fallback: legacy field names
  if (Object.keys(blocksMap).length === 0) {
    const fallback = levelResponse.enabled_blocks || levelResponse.enabledBlocks;
    if (Array.isArray(fallback)) {
      fallback.forEach((item) => {
        const key = typeof item === 'string' ? item : (item?.block_key || item?.block?.block_key);
        if (key) blocksMap[key] = true;
      });
    } else if (fallback && typeof fallback === 'object') {
      Object.entries(fallback).forEach(([key, val]) => { if (val) blocksMap[key] = true; });
    }
  }

  // Default blocks if nothing found
  if (Object.keys(blocksMap).length === 0) {
    Object.assign(blocksMap, ensureDefaultBlocks());
  }

  return blocksMap;
};

// ─── Helper: Resolve weapon key for a pattern ───
const resolveWeaponKey = (pattern) => {
  if (pattern.weapon?.weapon_key) return pattern.weapon.weapon_key;

  if (pattern.weapon_id) {
    const weaponsData = getWeaponsData();
    if (weaponsData) {
      const weapon = Object.values(weaponsData).find(
        (w) => String(w.weaponId) === String(pattern.weapon_id)
      );
      if (weapon) return weapon.weaponKey;
    }
  }

  return 'stick'; // default
};

// ─── Helper: Build patterns list ───
const buildPatterns = (levelResponse, isPreview) => {
  const allPatterns = (levelResponse.patterns || [])
    .map((pattern) => ({
      ...pattern,
      name: pattern.pattern_name,
      xmlPattern: pattern.xmlpattern,
      weaponKey: resolveWeaponKey(pattern),
      pattern_type_id: pattern.pattern_type?.pattern_type_id || pattern.pattern_type_id,
      hints: normalizePatternHints(pattern.hints)
    }))
    // Deduplicate by pattern_id
    .filter((p, i, self) => i === self.findIndex((x) => x.pattern_id === p.pattern_id));

  return isPreview ? allPatterns : allPatterns.filter((p) => p.is_available === true);
};

// ─── Helper: Resolve background image URL ───
const resolveBackgroundUrl = (levelResponse) => {
  const bg = levelResponse.background_image;
  if (!bg) return '/default-background.png';
  if (bg.startsWith('http')) return bg;
  return `${API_BASE_URL}${bg.startsWith('/') ? '' : '/'}${bg}`;
};

// ─── Helper: Check if this is a max-capacity (Emei) level ───
const checkMaxCapacityLevel = (levelResponse) => {
  const name = (levelResponse.level_name || '').toLowerCase();
  const appliedType = safeParse(levelResponse.applied_data)?.type?.toUpperCase();
  return name.includes('ง้อไบ๊') || name.includes('emei') || appliedType === 'GRAPH_MAX_CAPACITY';
};

// ─── Helper: Extract test cases ───
const extractTestCases = (levelResponse) =>
  (levelResponse.level_test_cases || safeParse(levelResponse.custom_data, {})?.test_cases || [])
    .map((tc) => ({
      test_case_id: tc.test_case_id,
      test_case_name: tc.test_case_name,
      is_primary: tc.is_primary,
      function_name: tc.function_name,
      input_params: tc.input_params,
      expected_output: tc.expected_output,
      comparison_type: tc.comparison_type || 'exact',
      display_order: tc.display_order || 0
    }));

// ─── Helper: Build formatted level data ───
const buildFormattedLevel = (levelResponse, enabledBlocks, goodPatterns) => ({
  id: levelResponse.level_id,
  level_id: levelResponse.level_id,
  name: levelResponse.level_name,
  level_name: levelResponse.level_name,
  description: levelResponse.description,
  difficulty: levelResponse.difficulty,
  character: levelResponse.character || 'player',
  background_image: resolveBackgroundUrl(levelResponse),
  startNodeId: levelResponse.start_node_id,
  goalNodeId: levelResponse.goal_node_id,
  nodes: normalizeNodes(levelResponse.nodes),
  edges: normalizeEdges(levelResponse.edges),
  monsters: safeParse(levelResponse.monsters, []),
  obstacles: safeParse(levelResponse.obstacles, []),
  coinPositions: safeParse(levelResponse.coin_positions, []),
  coins: safeParse(levelResponse.coins, []),
  people: safeParse(levelResponse.people, []),
  knapsackData: safeParse(levelResponse.knapsack_data, null),
  subsetSumData: safeParse(levelResponse.subset_sum_data, null),
  coinChangeData: safeParse(levelResponse.coin_change_data, null),
  nqueenData: safeParse(levelResponse.nqueen_data, null),
  appliedData: safeParse(levelResponse.applied_data, null),
  enabledBlocks,
  victoryConditions: extractVictoryConditions(levelResponse),
  guides: extractGuides(levelResponse),
  hints: extractHints(levelResponse),
  defaultWeaponKey: 'stick',
  goodPatterns,
  goalType: levelResponse.goal_type || 'ถึงเป้าหมาย',
  textcode: levelResponse.textcode || false,
  category: levelResponse.category || null,
  category_id: levelResponse.category_id || null,
  customData: levelResponse.custom_data || null,
  gameType: levelResponse.game_type,
  isMaxCapacityLevel: checkMaxCapacityLevel(levelResponse),
  starter_xml: levelResponse.starter_xml || null,
  test_cases: extractTestCases(levelResponse),
});

// ═══════════════════════════════════════════
// Main Hook
// ═══════════════════════════════════════════

export function useLevelInitializer({
  levelData,
  getToken,
  isPreview,
  setEnabledBlocks,
  setGoodPatterns,
  setCurrentHint,
  setPlayerNodeId,
  setPlayerDirection,
  setPlayerHp,
  setIsCompleted,
  setIsGameOver,
  setCurrentWeaponData,
  setGameState,
  setCurrentLevelState
}) {
  const initRef = useRef(null);

  useEffect(() => {
    if (!levelData) return;

    // Check if we already initialized this exact level
    if (initRef.current === levelData.level_id) {
      return; // Skip re-initialization on background refetch
    }

    const initializeLevel = async () => {
      try {
        // 1. Build enabled blocks + patterns
        const enabledBlocks = buildEnabledBlocks(levelData);
        const goodPatterns = buildPatterns(levelData, isPreview);

        // 3. Build formatted level data
        const formatted = buildFormattedLevel(levelData, enabledBlocks, goodPatterns);

        // 4. Set global + React state
        setLevelData(formatted);
        setCurrentLevelState(formatted);
        setEnabledBlocks(enabledBlocks);
        setGoodPatterns(goodPatterns);
        setCurrentHint(`📍 โหลดด่าน "${formatted.name}" เสร็จแล้ว`);

        setCurrentGameState({
          currentNodeId: formatted.startNodeId,
          direction: 0,
          goalReached: false,
          moveCount: 0,
          isGameOver: false,
          weaponKey: formatted.defaultWeaponKey,
          weaponData: getWeaponData(formatted.defaultWeaponKey),
          levelData: formatted
        });

        resetPlayerHp(setPlayerHp);
        setPlayerNodeId(formatted.startNodeId);
        setPlayerDirection(0);
        setPlayerHp(100);
        setIsCompleted(false);
        setIsGameOver(false);
        setCurrentWeaponData(getWeaponData(formatted.defaultWeaponKey));
        setGameState('ready');

        // Marking this level as fully initialized
        initRef.current = levelData.level_id;

      } catch (err) {
        console.error('Error initializing level data:', err);
      }
    };

    initializeLevel();
  }, [levelData, getToken]);
}
