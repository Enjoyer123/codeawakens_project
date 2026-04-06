const prisma = require("../models/prisma");
const { buildPaginationResponse } = require("../utils/pagination");

// ── Utility Functions ──

function countBlocksFromXml(xmlPattern) {
  if (!xmlPattern || typeof xmlPattern !== "string") return 0;
  try {
    const matches = xmlPattern.match(/<block\b/gi);
    return matches ? matches.length : 0;
  } catch (e) {
    console.error("Error counting blocks from XML:", e);
    return 0;
  }
}

function extractBlockKeysFromXml(xmlPattern) {
  if (!xmlPattern || typeof xmlPattern !== "string") return [];
  try {
    const blockTypeRegex = /type=["']([^"']+)["']/g;
    const blockKeys = [];
    let match;
    while ((match = blockTypeRegex.exec(xmlPattern)) !== null) {
      const cleanType = match[1].replace(/^["']|["']$/g, "");
      if (cleanType && !blockKeys.includes(cleanType)) blockKeys.push(cleanType);
    }
    return blockKeys;
  } catch (error) {
    console.error("Error extracting block keys from XML:", error);
    return [];
  }
}

function getRequiredBlocksFromCategory(category) {
  if (!category || !category.block_key) return null;
  const blockKey = category.block_key;
  let blocks = [];

  if (Array.isArray(blockKey)) {
    blocks = [...blockKey];
  } else if (typeof blockKey === "object") {
    Object.values(blockKey).forEach((value) => {
      if (Array.isArray(value)) blocks.push(...value);
      else if (typeof value === "string") blocks.push(value);
    });
  } else if (typeof blockKey === "string") {
    if (blockKey === "null" || blockKey === "undefined") return null;
    blocks = blockKey.split(",");
  }

  const validBlocks = blocks.map((b) => (typeof b === "string" ? b.trim() : "")).filter((b) => b !== "" && b.toLowerCase() !== "null" && b.toLowerCase() !== "undefined");
  return validBlocks.length > 0 ? validBlocks : null;
}

async function evaluatePatternType(levelId, xmlPattern, blockKeywords = null) {
  try {
    const level = await prisma.level.findUnique({
      where: { level_id: parseInt(levelId) },
      include: { category: true, level_blocks: { include: { block: true } } },
    });
    if (!level) throw new Error("Level not found");

    const category = level.category;
    const categoryName = category?.category_name || "";
    const blockKeys = extractBlockKeysFromXml(xmlPattern);

    console.log(`🔍 Evaluating pattern type for level ${levelId}: Category: ${categoryName}, Blocks: ${blockKeys.join(", ")}`);

    let requiredBlocks = getRequiredBlocksFromCategory(category);
    if (requiredBlocks && requiredBlocks.length > 0) {
      console.log(`  - Required blocks from category.block_key: ${requiredBlocks.join(", ")}`);
      const hasAllRequiredBlocks = requiredBlocks.every((block) => blockKeys.includes(block));
      const patternTypeId = hasAllRequiredBlocks ? 1 : 2;
      console.log(`  - Evaluated pattern_type_id: ${patternTypeId}`);
      return patternTypeId;
    }

    if (blockKeywords && Array.isArray(blockKeywords) && blockKeywords.length > 0) {
      const hasAllRequiredBlocks = blockKeywords.every((keyword) => blockKeys.includes(keyword));
      const patternTypeId = hasAllRequiredBlocks ? 1 : 2;
      console.log(`  - Using provided block keywords, pattern_type_id: ${patternTypeId}`);
      return patternTypeId;
    }

    console.log(`  - No block requirements found for "${categoryName}", auto-assigning pattern_type_id: 1`);
    return 1;
  } catch (error) {
    console.error("Error evaluating pattern type:", error);
    return 2;
  }
}

// ── Service Functions ──

async function createPattern(data) {
  const { level_id, pattern_type_id, weapon_id, pattern_name, description, xmlpattern, hints, block_keywords, bigO } = data;
  if (!level_id || !pattern_name) {
    const err = new Error("Missing required fields: level_id, pattern_name"); err.status = 400; throw err;
  }

  const level = await prisma.level.findUnique({ where: { level_id: parseInt(level_id) }, include: { category: true } });
  if (!level) { const err = new Error("Level not found"); err.status = 404; throw err; }

  let evaluatedPatternTypeId = pattern_type_id;
  if (!pattern_type_id && xmlpattern) {
    evaluatedPatternTypeId = await evaluatePatternType(level_id, xmlpattern, block_keywords);
    console.log(`✅ Auto-evaluated pattern_type_id: ${evaluatedPatternTypeId}`);
  } else if (!pattern_type_id) {
    const err = new Error("Missing required field: pattern_type_id (or provide xmlpattern for auto-evaluation)"); err.status = 400; throw err;
  }

  const patternType = await prisma.patternType.findUnique({ where: { pattern_type_id: parseInt(evaluatedPatternTypeId) } });
  if (!patternType) { const err = new Error("Pattern type not found"); err.status = 404; throw err; }

  if (weapon_id) {
    const weapon = await prisma.weapon.findUnique({ where: { weapon_id: parseInt(weapon_id) } });
    if (!weapon) { const err = new Error("Weapon not found"); err.status = 404; throw err; }
  }

  return prisma.pattern.create({
    data: {
      level_id: parseInt(level_id), pattern_type_id: parseInt(evaluatedPatternTypeId),
      weapon_id: weapon_id ? parseInt(weapon_id) : null, pattern_name,
      description: description || null, xmlpattern: xmlpattern || null,
      hints: hints ? JSON.parse(JSON.stringify(hints)) : null,
      count: countBlocksFromXml(xmlpattern) || 0, bigO: bigO || null, is_available: false,
    },
    include: { level: true, pattern_type: true, weapon: true },
  });
}

async function getAllPatterns({ page, limit, skip }, levelId) {
  let where = {};
  if (levelId) where.level_id = parseInt(levelId);

  const total = await prisma.pattern.count({ where });
  const patterns = await prisma.pattern.findMany({
    where,
    include: {
      level: { select: { level_id: true, level_name: true } },
      pattern_type: true,
      weapon: { select: { weapon_id: true, weapon_name: true, weapon_key: true } },
    },
    orderBy: { created_at: "desc" },
    skip, take: limit,
  });
  return { patterns, pagination: buildPaginationResponse(page, limit, total) };
}

async function getPatternById(patternId) {
  const pattern = await prisma.pattern.findUnique({
    where: { pattern_id: patternId },
    include: { level: true, pattern_type: true, weapon: true },
  });
  if (!pattern) { const err = new Error("Pattern not found"); err.status = 404; throw err; }
  return pattern;
}

async function updatePattern(patternId, data) {
  const { pattern_type_id, weapon_id, pattern_name, description, xmlpattern, hints, is_available, bigO } = data;
  const existing = await prisma.pattern.findUnique({ where: { pattern_id: patternId } });
  if (!existing) { const err = new Error("Pattern not found"); err.status = 404; throw err; }

  let evaluatedPatternTypeId = pattern_type_id;
  if (xmlpattern !== undefined) {
    evaluatedPatternTypeId = await evaluatePatternType(existing.level_id, xmlpattern);
    console.log(`✅ [updatePattern] Auto-reevaluated pattern_type_id: ${evaluatedPatternTypeId}`);
  } else if (!pattern_type_id && existing.xmlpattern) {
    evaluatedPatternTypeId = await evaluatePatternType(existing.level_id, existing.xmlpattern);
  }

  const updateData = {};
  if (evaluatedPatternTypeId) updateData.pattern_type_id = parseInt(evaluatedPatternTypeId);
  if (weapon_id !== undefined) updateData.weapon_id = weapon_id ? parseInt(weapon_id) : null;
  if (pattern_name) updateData.pattern_name = pattern_name;
  if (description !== undefined) updateData.description = description;
  if (xmlpattern !== undefined) { updateData.xmlpattern = xmlpattern; updateData.count = countBlocksFromXml(xmlpattern); }
  if (hints !== undefined) updateData.hints = JSON.parse(JSON.stringify(hints));
  if (is_available !== undefined) updateData.is_available = is_available;
  if (bigO !== undefined) updateData.bigO = bigO || null;

  return prisma.pattern.update({
    where: { pattern_id: patternId }, data: updateData,
    include: { level: true, pattern_type: true, weapon: true },
  });
}

async function deletePattern(patternId) {
  const pattern = await prisma.pattern.findUnique({ where: { pattern_id: patternId } });
  if (!pattern) { const err = new Error("Pattern not found"); err.status = 404; throw err; }
  await prisma.pattern.delete({ where: { pattern_id: patternId } });
}

async function getPatternTypes() {
  return prisma.patternType.findMany({ orderBy: { pattern_type_id: "asc" } });
}

async function unlockPattern(patternId) {
  const pattern = await prisma.pattern.findUnique({ where: { pattern_id: patternId } });
  if (!pattern) { const err = new Error("Pattern not found"); err.status = 404; throw err; }
  return prisma.pattern.update({ where: { pattern_id: patternId }, data: { is_available: true } });
}

module.exports = {
  createPattern, getAllPatterns, getPatternById, updatePattern, deletePattern,
  getPatternTypes, unlockPattern,
  // Export utilities for potential reuse
  evaluatePatternType, countBlocksFromXml, extractBlockKeysFromXml,
};
