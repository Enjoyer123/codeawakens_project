/**
 * Hook for loading level data
 */

import { useEffect } from 'react';
import { fetchLevelById } from '../../../services/levelService';
import {
  setLevelData,
  setCurrentGameState,
  resetPlayerHp,
  loadWeaponsData,
  getWeaponData,
  getWeaponsData
} from '../../../gameutils/utils/gameUtils';
import { ensureDefaultBlocks } from '../../../gameutils/utils/blocklyUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

/**
 * Hook for loading level data
 */
export function useLevelLoader({
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
}) {
  useEffect(() => {
    const loadLevel = async () => {
      if (!levelId) return;

      setLoading(true);
      setError(null);

      try {
        // Load weapons data first
        await loadWeaponsData(getToken);

        const levelResponse = await fetchLevelById(getToken, levelId);
        
        // ตรวจสอบว่าด่านถูกปลดล็อคหรือไม่ (สำหรับผู้เล่นปกติ, ไม่ใช่ preview)
        if (!isPreview && levelResponse.is_unlocked === false) {
          throw new Error('ด่านนี้ยังไม่ถูกปลดล็อค กรุณารอให้ admin ทดสอบด่านก่อน');
        }
        
        // Helper functions for data normalization
        const safeParse = (data, defaultValue = []) => {
          if (!data) return defaultValue;
          if (typeof data === 'string') {
            try {
              return JSON.parse(data);
            } catch {
              return defaultValue;
            }
          }
          return Array.isArray(data) ? data : defaultValue;
        };

        const normalizeNodes = (nodes) => {
          if (!nodes) return [];
          if (typeof nodes === 'string') {
            try {
              nodes = JSON.parse(nodes);
            } catch {
              return [];
            }
          }
          return Array.isArray(nodes) ? nodes : [];
        };

        const normalizeEdges = (edges) => {
          if (!edges) return [];
          if (typeof edges === 'string') {
            try {
              edges = JSON.parse(edges);
            } catch {
              return [];
            }
          }
          return Array.isArray(edges) ? edges : [];
        };

        const normalizePatternHints = (rawHints) => {
          if (Array.isArray(rawHints)) {
            return rawHints.map((hint) => ({
              step: hint.step || 0,
              content: hint.content || {},
              trigger: hint.trigger || 'onXmlMatch',
              hintType: hint.hintType || 'guidance',
              difficulty: hint.difficulty || 'basic',
              visualGuide: hint.visualGuide
                ? {
                    highlightBlocks: Array.isArray(hint.visualGuide.highlightBlocks)
                      ? hint.visualGuide.highlightBlocks
                      : []
                  }
                : {},
              xmlCheck: hint.xmlCheck
            }));
          }
          if (typeof rawHints === 'object') {
            return [rawHints];
          }
          return [];
        };

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

        // Process enabled blocks from level_blocks
        const enabledBlocksObj = {};
        (levelResponse.level_blocks || []).forEach((blockInfo) => {
          if (blockInfo?.block?.block_key) {
            const blockKey = blockInfo.block.block_key;
            enabledBlocksObj[blockKey] = true;
            console.log(`✅ Enabled block from level_blocks: ${blockKey}`);
          }
        });
        console.log("🔧 Enabled blocks from level_blocks:", Object.keys(enabledBlocksObj));

        const fallbackEnabledBlocks =
          levelResponse.enabled_blocks ||
          levelResponse.enabledBlocks ||
          levelResponse.enabledBlocksMap ||
          levelResponse.allowedBlocks;

        if (Object.keys(enabledBlocksObj).length === 0 && fallbackEnabledBlocks) {
          console.log("🔧 Using fallback enabled blocks:", fallbackEnabledBlocks);
          if (Array.isArray(fallbackEnabledBlocks)) {
            fallbackEnabledBlocks.forEach((blockInfo) => {
              if (typeof blockInfo === 'string') {
                enabledBlocksObj[blockInfo] = true;
                console.log(`✅ Enabled block from fallback array: ${blockInfo}`);
              } else if (blockInfo?.block_key) {
                enabledBlocksObj[blockInfo.block_key] = true;
                console.log(`✅ Enabled block from fallback array: ${blockInfo.block_key}`);
              } else if (blockInfo?.block?.block_key) {
                enabledBlocksObj[blockInfo.block.block_key] = true;
                console.log(`✅ Enabled block from fallback array: ${blockInfo.block.block_key}`);
              }
            });
          } else if (typeof fallbackEnabledBlocks === 'object') {
            Object.keys(fallbackEnabledBlocks).forEach((key) => {
              if (fallbackEnabledBlocks[key]) {
                enabledBlocksObj[key] = true;
                console.log(`✅ Enabled block from fallback object: ${key}`);
              }
            });
          }
        }

        if (Object.keys(enabledBlocksObj).length === 0) {
          const defaultBlocks = ensureDefaultBlocks();
          Object.assign(enabledBlocksObj, defaultBlocks);
          console.log("🔧 Using default blocks:", Object.keys(defaultBlocks));
        }
        console.log("🔧 Final enabledBlocksObj:", enabledBlocksObj);
        console.log("🔧 Enabled block keys:", Object.keys(enabledBlocksObj));
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
                console.warn(`⚠️ Weapon ID ${pattern.weapon_id} not found in weaponsData, using default`);
                weaponKey = "stick"; // Default weapon
              }
            } else {
              // No weapon_id, use default
              console.log(`ℹ️ Pattern "${pattern.pattern_name}" has no weapon_id, using default weapon`);
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
        // In normal mode, only use patterns with is_available = true
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
          enabledBlocks: enabledBlocksObj,
          victoryConditions,
          guides,
          defaultWeaponKey: "stick",
          goodPatterns,
          goalType: levelResponse.goal_type || "ถึงเป้าหมาย",
          textcode: levelResponse.textcode || false
        };

        console.log("🔍 Final formattedLevelData:", formattedLevelData);
        console.log("🔍 Final goodPatterns:", formattedLevelData.goodPatterns);

        setLevelData(formattedLevelData);
        setCurrentLevel(formattedLevelData);
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
        setPatternFeedback("วาง blocks เพื่อดูผลลัพธ์");
        setGameState("ready");
      } catch (err) {
        console.error('Error loading level data:', err);
        setError("ไม่สามารถโหลดข้อมูลด่านได้: " + err.message);
        setGameState("error");
      } finally {
        setLoading(false);
      }
    };

    loadLevel();
  }, [levelId, getToken]);
}

