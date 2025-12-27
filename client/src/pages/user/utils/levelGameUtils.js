// Utility functions for LevelGame component
import { getWeaponData, getWeaponsData } from '../../../gameutils/utils/gameUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Note: calculateFinalScore is now imported from '../../components/playgame/utils/scoreUtils'
// to avoid duplication with GameCore.jsx

/**
 * Normalize level data helpers
 */
export function safeParse(value, fallback = []) {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') {
    // For JSON fields from database (already parsed by Prisma)
    return value;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed;
    } catch (e) {
      console.warn("Failed to parse JSON field:", e, value);
      return fallback;
    }
  }
  return fallback;
}

export function normalizeNodes(value) {
  const parsedValue = safeParse(value, []);
  const nodesArray = Array.isArray(parsedValue)
    ? parsedValue
    : Array.isArray(parsedValue?.nodes)
      ? parsedValue.nodes
      : [];

  const normalized = nodesArray
    .map((node, index) => {
      if (!node) return null;
      const id = Number(node.id ?? node.node_id ?? node.index ?? index + 1);
      const x = Number(node.x ?? node.position?.x ?? node.pos?.x);
      const y = Number(node.y ?? node.position?.y ?? node.pos?.y);
      if (!Number.isFinite(id) || !Number.isFinite(x) || !Number.isFinite(y)) {
        return null;
      }
      return { id, x, y };
    })
    .filter(Boolean);

  if (normalized.length > 0) return normalized;

  return [
    { id: 1, x: 200, y: 200 },
    { id: 2, x: 400, y: 200 },
    { id: 3, x: 600, y: 200 },
  ];
}

export function normalizeEdges(value) {
  const parsedValue = safeParse(value, []);
  const edgesArray = Array.isArray(parsedValue)
    ? parsedValue
    : Array.isArray(parsedValue?.edges)
      ? parsedValue.edges
      : [];

  const normalized = edgesArray
    .map((edge) => {
      if (!edge) return null;
      const from = Number(edge.from ?? edge.source ?? edge.start);
      const to = Number(edge.to ?? edge.target ?? edge.end);
      if (!Number.isFinite(from) || !Number.isFinite(to)) {
        return null;
      }
      const normalizedEdge = { from, to };
      // เพิ่ม value field ถ้ามี
      if (edge.value !== undefined && edge.value !== null) {
        normalizedEdge.value = Number(edge.value);
      }
      return normalizedEdge;
    })
    .filter(Boolean);

  if (normalized.length > 0) return normalized;

  return [
    { from: 1, to: 2 },
    { from: 2, to: 3 },
  ];
}

export function normalizePatternHints(rawHints) {
  if (!rawHints) return [];
  if (typeof rawHints === 'string' && rawHints.trim()) {
    try {
      return JSON.parse(rawHints);
    } catch (e) {
      console.warn('Failed to parse hints JSON:', e);
      return [];
    }
  }
  if (Array.isArray(rawHints)) {
    return rawHints.map((hint) => ({
      step: hint.step,
      hintType: hint.hintType,
      difficulty: hint.difficulty,
      content: typeof hint.content === 'object' ? hint.content : {},
      visualGuide: typeof hint.visualGuide === 'object'
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
}

/**
 * Process patterns from API response
 */
export function processPatterns(patterns) {
  return patterns
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
        // If still not found, try to fetch weapon by ID from API
        // For now, use default - weapon should be loaded from API response
        if (!weaponKey) {
          console.warn(`⚠️ Weapon ID ${pattern.weapon_id} not found in weaponsData, using default`);
          weaponKey = "stick"; // Default weapon
        }
      } else {
        // No weapon_id, use default
        console.log(`ℹ️ Pattern "${pattern.pattern_name}" has no weapon_id, using default weapon`);
        weaponKey = "stick"; // Default weapon
      }

      console.log(`🔍 Pattern "${pattern.pattern_name}" weaponKey: ${weaponKey}`, {
        hasWeapon: !!pattern.weapon,
        weapon_id: pattern.weapon_id,
        weapon_key: pattern.weapon?.weapon_key
      });

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
}

/**
 * Process enabled blocks from level response
 */
export function processEnabledBlocks(levelResponse, ensureDefaultBlocks) {
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
  return enabledBlocksObj;
}

/**
 * Format level data from API response
 */
export function formatLevelData(levelResponse, enabledBlocksObj, goodPatterns) {
  const backgroundPath = levelResponse.background_image
    ? (levelResponse.background_image.startsWith('http')
      ? levelResponse.background_image
      : `${API_BASE_URL}${levelResponse.background_image.startsWith('/') ? '' : '/'}${levelResponse.background_image}`)
    : '/default-background.png';

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

  return {
    id: levelResponse.level_id,
    name: levelResponse.level_name,
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
    people: safeParse(levelResponse.people, []),
    treasures: safeParse(levelResponse.treasures, []),
    knapsackData: (() => {
      const parsed = safeParse(levelResponse.knapsack_data, null);
      console.log('🔍 Parsing knapsack_data:', {
        raw: levelResponse.knapsack_data,
        parsed: parsed,
        type: typeof parsed
      });
      return parsed;
    })(),
    subsetSumData: safeParse(levelResponse.subset_sum_data, null),
    coinChangeData: safeParse(levelResponse.coin_change_data, null),
    nqueenData: safeParse(levelResponse.nqueen_data, null),
    enabledBlocks: enabledBlocksObj,
    victoryConditions,
    guides,
    defaultWeaponKey: "stick",
    goodPatterns,
    goalType: levelResponse.goal_type || "ถึงเป้าหมาย",
    textcode: levelResponse.textcode || false
  };
}

