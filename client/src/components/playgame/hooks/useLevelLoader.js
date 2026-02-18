/**
 * Hook for loading level data
 */

import { useEffect } from 'react';
import { useAuth } from "@clerk/clerk-react";
import { fetchLevelById } from '../../../services/levelService';
import { getUserByClerkId } from '../../../services/profileService';
import {

  loadWeaponsData,
  getWeaponData,
  getWeaponsData
} from '../../../gameutils/shared/items';

import { ensureDefaultBlocks } from '../../../gameutils/blockly';
import {
  safeParse,
  normalizeNodes,
  normalizeEdges,
  normalizePatternHints,
  setLevelData,
  setCurrentGameState,
  resetPlayerHp,
} from '../../../gameutils/shared/game';

import { API_BASE_URL } from '../../../config/apiConfig';

/**
 * Hook for loading level data
 */
// Removed direct fetching and internal state management.
// This hook now processes the level data passed to it.

// Note: We'll now export a function that processes the data, rather than a self-contained hook that fetches.
// Or we modify this hook to take `levelData` as input and only run effects when `levelData` changes.

export function useLevelInitializer({
  levelData, // Now receiving data from parent
  getToken,
  isPreview,
  // setLoading, // Managed by parent's useLevel
  // setError,   // Managed by parent's useLevel
  // setCurrentLevel, // We might still need to set this if GameCore relies on it, but ideally GameCore uses the prop
  setEnabledBlocks,
  setGoodPatterns,
  setCurrentHint,
  setPlayerNodeId,
  setPlayerDirection,
  setPlayerHp,
  setIsCompleted,
  setIsGameOver,
  setCurrentWeaponData,
  // setPatternFeedback,
  setGameState,
  setCurrentLevelState // Renamed to clarify it sets the state in parent
}) {
  useEffect(() => {
    if (!levelData) return;

    const initializeLevel = async () => {
      try {
        // Load weapons data first
        await loadWeaponsData(getToken);

        // normalize level data
        const levelResponse = levelData;

        console.log('🔍 [useLevelInitializer] Processing level data');

        // Check if level is unlocked
        const { user } = await getUserByClerkId(getToken);
        const isAdmin = user?.role === 'admin';

        if (!isPreview && !isAdmin && levelResponse.is_unlocked === false) {
          console.error('Level not unlocked');
          // Ideally throw error or handle UI state
        }

        const victoryConditions = (levelResponse.level_victory_conditions || [])
          .map((vc) => ({
            level_victory_condition_id: vc.level_victory_condition_id,
            type: vc.victory_condition?.type,
            description: vc.victory_condition?.description,
            check: vc.victory_condition?.check
          }))
          .filter((vc) => vc.type);

        const guides = (levelResponse.guides || []).map((guide) => ({
          ...guide,
          guide_images: guide.guide_images || []
        }));

        // Normalize level-based hints (for Need Hint button)
        const levelHints = (levelResponse.hints || []).map((hint) => ({
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

        // Process enabled blocks from level_blocks
        const enabledBlocksObj = {};
        (levelResponse.level_blocks || []).forEach((blockInfo) => {
          if (blockInfo?.block?.block_key) {
            const blockKey = blockInfo.block.block_key;
            enabledBlocksObj[blockKey] = true;
          }
        });

        const fallbackEnabledBlocks =
          levelResponse.enabled_blocks ||
          levelResponse.enabledBlocks ||
          levelResponse.enabledBlocksMap ||
          levelResponse.allowedBlocks;

        if (Object.keys(enabledBlocksObj).length === 0 && fallbackEnabledBlocks) {
          if (Array.isArray(fallbackEnabledBlocks)) {
            fallbackEnabledBlocks.forEach((blockInfo) => {
              if (typeof blockInfo === 'string') {
                enabledBlocksObj[blockInfo] = true;
              } else if (blockInfo?.block_key) {
                enabledBlocksObj[blockInfo.block_key] = true;
              } else if (blockInfo?.block?.block_key) {
                enabledBlocksObj[blockInfo.block.block_key] = true;
              }
            });
          } else if (typeof fallbackEnabledBlocks === 'object') {
            Object.keys(fallbackEnabledBlocks).forEach((key) => {
              if (fallbackEnabledBlocks[key]) {
                enabledBlocksObj[key] = true;
              }
            });
          }
        }

        if (Object.keys(enabledBlocksObj).length === 0) {
          const defaultBlocks = ensureDefaultBlocks();
          Object.assign(enabledBlocksObj, defaultBlocks);
        }
        setEnabledBlocks(enabledBlocksObj);

        const allPatterns = (levelResponse.patterns || [])
          .map((pattern) => {
            // Get weaponKey from weapon object or weapon_id
            let weaponKey = null;
            if (pattern.weapon?.weapon_key) {
              weaponKey = pattern.weapon.weapon_key;
            } else if (pattern.weapon_id) {
              // If weapon_id exists but weapon object is not loaded, try to get from weaponsData
              const weaponsData = getWeaponsData();
              if (weaponsData) {
                const weapon = Object.values(weaponsData).find(w => w.weaponId === pattern.weapon_id);
                if (weapon) {
                  weaponKey = weapon.weaponKey;
                }
              }
              // If still not found, use default
              if (!weaponKey) {
                weaponKey = "stick"; // Default weapon
              }
            } else {
              // No weapon_id, use default
              weaponKey = "stick"; // Default weapon
            }

            return {
              ...pattern,
              name: pattern.pattern_name,
              xmlPattern: pattern.xmlpattern,
              weaponKey: weaponKey,
              pattern_type_id: pattern.pattern_type?.pattern_type_id || pattern.pattern_type_id,
              hints: normalizePatternHints(pattern.hints)
            };
          })
          .filter((pattern, index, self) =>
            index === self.findIndex((p) => p.pattern_id === pattern.pattern_id)
          );

        // In preview mode, use all patterns (including is_available = false)
        // In normal mode, only use patterns with is_available = true (Official Logic)
        const goodPatterns = isPreview
          ? allPatterns
          : allPatterns.filter(p => p.is_available === true);

        const backgroundPath = levelResponse.background_image
          ? (levelResponse.background_image.startsWith('http')
            ? levelResponse.background_image
            : `${API_BASE_URL}${levelResponse.background_image.startsWith('/') ? '' : '/'}${levelResponse.background_image}`)
          : '/default-background.png';

        const formattedLevelData = {
          id: levelResponse.level_id,
          level_id: levelResponse.level_id,
          name: levelResponse.level_name,
          level_name: levelResponse.level_name,
          description: levelResponse.description,
          difficulty: levelResponse.difficulty,
          character: levelResponse.character || 'player',
          background_image: backgroundPath,
          startNodeId: levelResponse.start_node_id,
          goalNodeId: levelResponse.goal_node_id,
          nodes: normalizeNodes(levelResponse.nodes),
          edges: normalizeEdges(levelResponse.edges),
          monsters: safeParse(levelResponse.monsters, []),
          obstacles: safeParse(levelResponse.obstacles, []),
          coinPositions: safeParse(levelResponse.coin_positions, []),
          coins: safeParse(levelResponse.coins, []),
          people: safeParse(levelResponse.people, []),
          treasures: safeParse(levelResponse.treasures, []),
          knapsackData: safeParse(levelResponse.knapsack_data, null),
          subsetSumData: safeParse(levelResponse.subset_sum_data, null),
          coinChangeData: safeParse(levelResponse.coin_change_data, null),
          nqueenData: safeParse(levelResponse.nqueen_data, null),
          appliedData: safeParse(levelResponse.applied_data, null),
          enabledBlocks: enabledBlocksObj,
          victoryConditions,
          guides,
          hints: levelHints,
          defaultWeaponKey: "stick",
          goodPatterns,
          goalType: levelResponse.goal_type || "ถึงเป้าหมาย",
          textcode: levelResponse.textcode || false,
          // Include category data for DijkstraStateTable
          category: levelResponse.category || null,
          category_id: levelResponse.category_id || null,
          // Custom data for special levels like Train Schedule
          customData: levelResponse.custom_data || null,
          gameType: levelResponse.game_type || (safeParse(levelResponse.applied_data)?.type === 'GREEDY_TRAIN_SCHEDULE' ? 'train_schedule' : null),
          isMaxCapacityLevel: (levelResponse.level_name && (
            levelResponse.level_name.toLowerCase().includes('ง้อไบ๊') ||
            levelResponse.level_name.toLowerCase().includes('emei') ||
            levelResponse.level_name.toLowerCase().includes('cable car') ||
            levelResponse.level_name.toLowerCase().includes('minimum')
          )) ||
            (safeParse(levelResponse.applied_data)?.type === 'graph_max_capacity' ||
              safeParse(levelResponse.applied_data)?.type === 'GRAPH_MAX_CAPACITY'),
          // Include starter XML for auto-loading
          starter_xml: levelResponse.starter_xml || null,
          // Include test cases for function return validation
          // Fallback to custom_data.test_cases if not provided in top-level response
          test_cases: (levelResponse.level_test_cases || safeParse(levelResponse.custom_data, {})?.test_cases || []).map(tc => ({
            test_case_id: tc.test_case_id,
            test_case_name: tc.test_case_name,
            is_primary: tc.is_primary,
            function_name: tc.function_name,
            input_params: tc.input_params,
            expected_output: tc.expected_output,
            comparison_type: tc.comparison_type || 'exact',
            display_order: tc.display_order || 0
          }))
        };

        setLevelData(formattedLevelData);
        setCurrentLevelState(formattedLevelData);
        setGoodPatterns(formattedLevelData.goodPatterns);

        setCurrentHint(`📍 โหลดด่าน "${formattedLevelData.name}" เสร็จแล้ว`);

        setCurrentGameState({
          currentNodeId: formattedLevelData.startNodeId,
          direction: 0,
          goalReached: false,
          moveCount: 0,
          isGameOver: false,
          weaponKey: formattedLevelData.defaultWeaponKey || "stick",
          weaponData: getWeaponData(formattedLevelData.defaultWeaponKey || "stick"),
          levelData: formattedLevelData
        });

        resetPlayerHp(setPlayerHp);

        setPlayerNodeId(formattedLevelData.startNodeId);
        setPlayerDirection(0);
        setPlayerHp(100);
        setIsCompleted(false);
        setIsGameOver(false);
        const weaponKey = formattedLevelData.defaultWeaponKey || "stick";
        const weaponData = getWeaponData(weaponKey);
        setCurrentWeaponData(weaponData);
        // setPatternFeedback("วาง blocks เพื่อดูผลลัพธ์");
        setGameState("ready");

      } catch (err) {
        console.error('Error initializing level data:', err);
        // handle error
      }
    };

    initializeLevel();
  }, [levelData, getToken]);
  // Removed isPreview form dep array to avoid re-runs if it doesn't change
  // Added levelData as main dependency
}

