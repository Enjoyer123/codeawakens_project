/**
 * Hook for initializing level data from API response into game-ready format.
 * Receives raw levelData from useLevel() and transforms it for Phaser + Blockly.
 */

import { useEffect, useRef } from 'react';
import {
  getWeaponData,
  getWeaponsData,
  loadWeaponsData
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
const buildPatterns = (levelResponse, isPreview, patternId = null) => {
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

  let validPatterns = isPreview ? allPatterns : allPatterns.filter((p) => p.is_available === true);

  // In preview mode with a specific pattern selected, only test that one
  if (isPreview && patternId !== null) {
    validPatterns = validPatterns.filter(p => String(p.pattern_id) === String(patternId));
  }

  return validPatterns;
};

// ─── Helper: Resolve background image URL ───
const resolveBackgroundUrl = (levelResponse) => {
  const bg = levelResponse.background_image;
  if (!bg) return '/default-background.png';
  if (bg.startsWith('http')) return bg;
  return `${API_BASE_URL}${bg.startsWith('/') ? '' : '/'}${bg}`;
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

// ─── Helper: Parse JSON-string fields from API ───
const JSON_FIELDS_ARRAY = ['monsters', 'obstacles', 'coin_positions', 'coins', 'people'];
const JSON_FIELDS_OBJECT = ['algo_data', 'applied_data', 'custom_data'];

const parseJsonFields = (data) => {
  const parsed = {};
  JSON_FIELDS_ARRAY.forEach(key => { parsed[key] = safeParse(data[key], []); });
  JSON_FIELDS_OBJECT.forEach(key => { parsed[key] = safeParse(data[key], null); });
  return parsed;
};

// ═══════════════════════════════════════════
// Main Hook
// ═══════════════════════════════════════════

export function useLevelInitializer({
  levelData,
  getToken,
  isPreview,
  patternId,
  setEnabledBlocks,
  setGoodPatterns,
  setPlayerHp,
  setIsCompleted,
  setIsGameOver,
  setCurrentWeaponData,
  setGameState,
  setCurrentLevelState,
  setTextCode,
  setCodeValidation
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
        // 0. Ensure weapons data is loaded from API before processing
        await loadWeaponsData(getToken);

        // 1. Build enabled blocks + patterns
        const enabledBlocks = buildEnabledBlocks(levelData);
        const goodPatterns = buildPatterns(levelData, isPreview, patternId);

        // 3. Build formatted level data (spread API data + computed fields)
        const formatted = {
          ...levelData,
          ...parseJsonFields(levelData),
          background_image: resolveBackgroundUrl(levelData),
          nodes: normalizeNodes(levelData.nodes),
          edges: normalizeEdges(levelData.edges),
          enabledBlocks,
          victoryConditions: extractVictoryConditions(levelData),
          defaultWeaponKey: 'stick',
          goodPatterns,
          test_cases: extractTestCases(levelData),
        };

        // 4. Set global + React state
        setLevelData(formatted);
        setCurrentLevelState(formatted);
        setEnabledBlocks(enabledBlocks);
        setGoodPatterns(goodPatterns);


        setCurrentGameState({
          currentNodeId: formatted.start_node_id,
          direction: 0,
          goalReached: false,
          moveCount: 0,
          isGameOver: false,
          weaponKey: formatted.defaultWeaponKey,
          weaponData: getWeaponData(formatted.defaultWeaponKey),
          activeEffects: [],   // รีเซ็ต effect จากด่านเก่า ไม่งั้น syncEffectsWithState จะดึงค่าเก่ามาสร้าง Aura ใหม่
          patternTypeId: 0,    // รีเซ็ต pattern match
          levelData: formatted
        });

        resetPlayerHp(setPlayerHp);
        setPlayerHp(100);
        setIsCompleted(false);
        setIsGameOver(false);
        setCurrentWeaponData(getWeaponData(formatted.defaultWeaponKey));
        setGameState('ready');

        // Reset Text Code state
        if (setTextCode) setTextCode("");
        if (setCodeValidation) setCodeValidation({ isValid: false, message: "" });

        // Marking this level as fully initialized
        initRef.current = levelData.level_id;

      } catch (err) {
        console.error('Error initializing level data:', err);
      }
    };

    initializeLevel();
  }, [levelData, getToken]);
}
