const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Count number of Blockly blocks in XML by counting <block ...> tags
 */
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

/**
 * Extract block keys from Blockly XML pattern string
 */
function extractBlockKeysFromXml(xmlPattern) {
  if (!xmlPattern || typeof xmlPattern !== 'string') {
    return [];
  }

  try {
    // Use regex to find all block type attributes
    const blockTypeRegex = /type=["']([^"']+)["']/g;
    const blockKeys = [];
    let match;

    while ((match = blockTypeRegex.exec(xmlPattern)) !== null) {
      const blockType = match[1];
      // Remove quotes if present (e.g., type='"move_forward"' -> move_forward)
      const cleanType = blockType.replace(/^["']|["']$/g, '');
      if (cleanType && !blockKeys.includes(cleanType)) {
        blockKeys.push(cleanType);
      }
    }

    return blockKeys;
  } catch (error) {
    console.error("Error extracting block keys from XML:", error);
    return [];
  }
}

/**
 * Category to required blocks mapping
 * Key: category_name (case-insensitive, normalized to lowercase)
 * Value: Array of required block keys that must ALL be present for pattern_type_id = 1 (ดี)
 * 
 * Rules:
 * - If ALL required blocks are present → pattern_type_id = 1 (ดี)
 * - If SOME required blocks are present → pattern_type_id = 2 (กลาง)
 * - If NO required blocks are present → pattern_type_id = 2 (กลาง)
 */

/**
 * Get required blocks for a category
 * @deprecated Use getRequiredBlocksFromCategory instead which reads from database
 */
function getRequiredBlocksForCategory(categoryName) {
  if (!categoryName) return null;

  const normalizedName = categoryName.toLowerCase().trim();
  return CATEGORY_BLOCK_REQUIREMENTS[normalizedName] || null;
}

/**
 * Get required blocks from category block_key field
 * Supports both array and object formats
 */
function getRequiredBlocksFromCategory(category) {
  if (!category || !category.block_key) {
    return null;
  }

  const blockKey = category.block_key;
  let blocks = [];

  // If it's an array, copy it
  if (Array.isArray(blockKey)) {
    blocks = [...blockKey];
  }
  // If it's an object, extract all values and flatten
  else if (typeof blockKey === 'object') {
    Object.values(blockKey).forEach(value => {
      if (Array.isArray(value)) {
        blocks.push(...value);
      } else if (typeof value === 'string') {
        blocks.push(value);
      }
    });
  }
  // If it's a string, treat as comma-separated
  else if (typeof blockKey === 'string') {
    if (blockKey === 'null' || blockKey === 'undefined') return null;
    blocks = blockKey.split(',');
  }

  // Filter out garbage values
  const validBlocks = blocks
    .map(b => (typeof b === 'string' ? b.trim() : ''))
    .filter(b => b !== '' && b.toLowerCase() !== 'null' && b.toLowerCase() !== 'undefined');

  return validBlocks.length > 0 ? validBlocks : null;
}

/**
 * Evaluate pattern_type_id based on level category and XML pattern
 */
async function evaluatePatternType(levelId, xmlPattern, blockKeywords = null) {
  try {
    // Get level with category and blocks
    const level = await prisma.level.findUnique({
      where: { level_id: parseInt(levelId) },
      include: {
        category: true,
        level_blocks: {
          include: {
            block: true,
          },
        },
      },
    });

    if (!level) {
      throw new Error("Level not found");
    }

    const category = level.category;
    const categoryName = category?.category_name || "";
    const blockKeys = extractBlockKeysFromXml(xmlPattern);

    console.log(`🔍 Evaluating pattern type for level ${levelId}:`);
    console.log(`  - Category: ${categoryName}`);
    console.log(`  - Block keys in pattern: ${blockKeys.join(', ')}`);

    // Priority 1: Get required blocks from category.block_key (new method)
    let requiredBlocks = getRequiredBlocksFromCategory(category);

    if (requiredBlocks && requiredBlocks.length > 0) {
      console.log(`  - Required blocks from category.block_key: ${requiredBlocks.join(', ')}`);
    } else {
      // Priority 2: Fallback to system mapping (backward compatibility)
      // FIX: Removing this fallback because CATEGORY_BLOCK_REQUIREMENTS is not defined, causes Error -> returns 2 (Medium)
      // requiredBlocks = getRequiredBlocksForCategory(categoryName);
      // if (requiredBlocks && requiredBlocks.length > 0) {
      //   console.log(`  - Required blocks from system mapping: ${requiredBlocks.join(', ')}`);
      // }
    }

    if (requiredBlocks && requiredBlocks.length > 0) {
      // ตรวจสอบว่ามีการใช้ required blocks ครบทุกตัวหรือไม่
      const hasAllRequiredBlocks = requiredBlocks.every(block => blockKeys.includes(block));
      const hasSomeRequiredBlocks = requiredBlocks.some(block => blockKeys.includes(block));

      console.log(`  - Required blocks: ${requiredBlocks.join(', ')}`);
      console.log(`  - Has all required blocks: ${hasAllRequiredBlocks}`);
      console.log(`  - Has some required blocks: ${hasSomeRequiredBlocks}`);

      // ถ้าใช้ครบทุกตัว = pattern_type_id = 1 (ดี)
      // ถ้าใช้บางตัว = pattern_type_id = 2 (กลาง)
      // ถ้าไม่ใช้เลย = pattern_type_id = 2 (กลาง)
      const patternTypeId = hasAllRequiredBlocks ? 1 : 2;
      console.log(`  - Evaluated pattern_type_id: ${patternTypeId}`);
      return patternTypeId;
    }

    // Priority 3: ถ้าไม่มี mapping ในระบบ และมี blockKeywords ที่ส่งมา (สำหรับ override)
    if (blockKeywords && Array.isArray(blockKeywords) && blockKeywords.length > 0) {
      const hasAllRequiredBlocks = blockKeywords.every(keyword => blockKeys.includes(keyword));
      const patternTypeId = hasAllRequiredBlocks ? 1 : 2;
      console.log(`  - Using provided block keywords: ${blockKeywords.join(', ')}`);
      console.log(`  - Has all required blocks: ${hasAllRequiredBlocks}`);
      console.log(`  - Evaluated pattern_type_id: ${patternTypeId}`);
      return patternTypeId;
    }

    // Default: ถ้าไม่มี mapping และไม่มี blockKeywords
    // พิจารณาตามที่คุณสั่ง: หากด่านไม่มีการจำกัดบล็อก (block_key) ให้ถือว่าเป็นระดับดี (1) ทันทีที่แอดมินเพิ่มรูปแบบ
    console.log(`  - No block requirements found for category "${categoryName}", auto-assigning to pattern_type_id: 1 (Good Level)`);
    return 1;
  } catch (error) {
    console.error("Error evaluating pattern type:", error);
    // Default to pattern_type_id = 2 (กลาง) on error
    return 2;
  }
}

// Create pattern
exports.createPattern = async (req, res) => {
  try {
    const { level_id, pattern_type_id, weapon_id, pattern_name, description, xmlpattern, hints, block_keywords, bigO } = req.body;

    if (!level_id || !pattern_name) {
      return res.status(400).json({
        message: "Missing required fields: level_id, pattern_name"
      });
    }

    // Verify level exists
    const level = await prisma.level.findUnique({
      where: { level_id: parseInt(level_id) },
      include: {
        category: true,
      },
    });

    if (!level) {
      return res.status(404).json({ message: "Level not found" });
    }

    // Evaluate pattern_type_id automatically if not provided
    let evaluatedPatternTypeId = pattern_type_id;
    if (!pattern_type_id && xmlpattern) {
      evaluatedPatternTypeId = await evaluatePatternType(level_id, xmlpattern, block_keywords);
      console.log(`✅ Auto-evaluated pattern_type_id: ${evaluatedPatternTypeId}`);
    } else if (!pattern_type_id) {
      return res.status(400).json({
        message: "Missing required field: pattern_type_id (or provide xmlpattern for auto-evaluation)"
      });
    }

    // Verify pattern type exists
    const patternType = await prisma.patternType.findUnique({
      where: { pattern_type_id: parseInt(evaluatedPatternTypeId) },
    });

    if (!patternType) {
      return res.status(404).json({ message: "Pattern type not found" });
    }

    // Verify weapon exists if provided
    if (weapon_id) {
      const weapon = await prisma.weapon.findUnique({
        where: { weapon_id: parseInt(weapon_id) },
      });

      if (!weapon) {
        return res.status(404).json({ message: "Weapon not found" });
      }
    }

    const blockCount = countBlocksFromXml(xmlpattern);

    const pattern = await prisma.pattern.create({
      data: {
        level_id: parseInt(level_id),
        pattern_type_id: parseInt(evaluatedPatternTypeId),
        weapon_id: weapon_id ? parseInt(weapon_id) : null,
        pattern_name,
        description: description || null,
        xmlpattern: xmlpattern || null,
        hints: hints ? JSON.parse(JSON.stringify(hints)) : null,
        count: blockCount || 0,
        bigO: bigO || null,
        is_available: false, // Lock pattern until admin tests it in preview mode
      },
      include: {
        level: true,
        pattern_type: true,
        weapon: true,
      },
    });

    res.status(201).json({
      message: "Pattern created successfully",
      pattern,
    });
  } catch (error) {
    console.error("Error creating pattern:", error);
    res.status(500).json({
      message: "Error creating pattern",
      error: error.message
    });
  }
};

// Get all patterns
exports.getAllPatterns = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const levelId = req.query.level_id;
    const skip = (page - 1) * limit;

    let where = {};
    if (levelId) {
      where.level_id = parseInt(levelId);
    }

    const total = await prisma.pattern.count({ where });

    const patterns = await prisma.pattern.findMany({
      where,
      include: {
        level: {
          select: {
            level_id: true,
            level_name: true,
          },
        },
        pattern_type: true,
        weapon: {
          select: {
            weapon_id: true,
            weapon_name: true,
            weapon_key: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      patterns,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching patterns:", error);
    res.status(500).json({
      message: "Error fetching patterns",
      error: error.message
    });
  }
};

// Get pattern by ID
exports.getPatternById = async (req, res) => {
  try {
    const { patternId } = req.params;

    const pattern = await prisma.pattern.findUnique({
      where: { pattern_id: parseInt(patternId) },
      include: {
        level: true,
        pattern_type: true,
        weapon: true,
      },
    });

    if (!pattern) {
      return res.status(404).json({ message: "Pattern not found" });
    }

    res.json(pattern);
  } catch (error) {
    console.error("Error fetching pattern:", error);
    res.status(500).json({
      message: "Error fetching pattern",
      error: error.message
    });
  }
};

// Update pattern
exports.updatePattern = async (req, res) => {
  try {
    const { patternId } = req.params;
    const { pattern_type_id, weapon_id, pattern_name, description, xmlpattern, hints, is_available, bigO } = req.body;

    const existingPattern = await prisma.pattern.findUnique({
      where: { pattern_id: parseInt(patternId) },
    });

    if (!existingPattern) {
      return res.status(404).json({ message: "Pattern not found" });
    }

    // Verify level ID
    const levelId = existingPattern.level_id;

    // Evaluate pattern_type_id automatically if not provided or null
    let evaluatedPatternTypeId = pattern_type_id;
    if (!pattern_type_id) {
      const xmlToEvaluate = xmlpattern !== undefined ? xmlpattern : existingPattern.xmlpattern;
      if (xmlToEvaluate) {
        evaluatedPatternTypeId = await evaluatePatternType(levelId, xmlToEvaluate);
        console.log(`✅ [updatePattern] Auto-reevaluated pattern_type_id: ${evaluatedPatternTypeId}`);
      }
    }

    const updateData = {};
    if (evaluatedPatternTypeId) updateData.pattern_type_id = parseInt(evaluatedPatternTypeId);
    if (weapon_id !== undefined) updateData.weapon_id = weapon_id ? parseInt(weapon_id) : null;
    if (pattern_name) updateData.pattern_name = pattern_name;
    if (description !== undefined) updateData.description = description;
    if (xmlpattern !== undefined) {
      updateData.xmlpattern = xmlpattern;
      updateData.count = countBlocksFromXml(xmlpattern);
    }
    if (hints !== undefined) updateData.hints = JSON.parse(JSON.stringify(hints));
    if (is_available !== undefined) updateData.is_available = is_available;
    if (bigO !== undefined) updateData.bigO = bigO || null;

    const pattern = await prisma.pattern.update({
      where: { pattern_id: parseInt(patternId) },
      data: updateData,
      include: {
        level: true,
        pattern_type: true,
        weapon: true,
      },
    });

    res.json({
      message: "Pattern updated successfully",
      pattern,
    });
  } catch (error) {
    console.error("Error updating pattern:", error);
    res.status(500).json({
      message: "Error updating pattern",
      error: error.message
    });
  }
};

// Delete pattern
exports.deletePattern = async (req, res) => {
  try {
    const { patternId } = req.params;

    const pattern = await prisma.pattern.findUnique({
      where: { pattern_id: parseInt(patternId) },
    });

    if (!pattern) {
      return res.status(404).json({ message: "Pattern not found" });
    }

    await prisma.pattern.delete({
      where: { pattern_id: parseInt(patternId) },
    });

    res.json({
      message: "Pattern deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting pattern:", error);
    res.status(500).json({
      message: "Error deleting pattern",
      error: error.message
    });
  }
};

// Get pattern types
exports.getPatternTypes = async (req, res) => {
  try {
    const patternTypes = await prisma.patternType.findMany({
      orderBy: {
        pattern_type_id: 'asc',
      },
    });

    res.json(patternTypes);
  } catch (error) {
    console.error("Error fetching pattern types:", error);
    res.status(500).json({
      message: "Error fetching pattern types",
      error: error.message
    });
  }
};

// Unlock pattern (set is_available to true)
exports.unlockPattern = async (req, res) => {
  try {
    const { patternId } = req.params;

    const pattern = await prisma.pattern.findUnique({
      where: { pattern_id: parseInt(patternId) },
    });

    if (!pattern) {
      return res.status(404).json({ message: "Pattern not found" });
    }

    const updatedPattern = await prisma.pattern.update({
      where: { pattern_id: parseInt(patternId) },
      data: {
        is_available: true,
      },
    });

    res.json({
      message: "Pattern unlocked successfully",
      pattern: updatedPattern,
    });
  } catch (error) {
    console.error("Error unlocking pattern:", error);
    res.status(500).json({
      message: "Error unlocking pattern",
      error: error.message
    });
  }
};

