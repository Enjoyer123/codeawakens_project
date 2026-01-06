const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all level categories with pagination
exports.getAllLevelCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    let where = {};
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      where = {
        OR: [
          { category_name: { contains: searchLower, mode: 'insensitive' } },
          { description: { contains: searchLower, mode: 'insensitive' } },
        ],
      };
    }

    const total = await prisma.levelCategory.count({ where });

    const levelCategories = await prisma.levelCategory.findMany({
      where,
      include: {
        levels: {
          select: {
            level_id: true,
            level_name: true,
            is_unlocked: true,
            required_level_id: true,
            require_pre_score: true,
          },
        },
        category_items: {
          orderBy: {
            display_order: 'asc',
          },
        },
      },
      orderBy: {
        difficulty_order: "asc",
      },
      skip,
      take: limit,
    });

    // Calculate dynamic unlocks
    const clerkUserId = req.user?.id;
    let completedLevelIds = new Set();
    let userPreScore = 0;

    if (clerkUserId) {
      const user = await prisma.user.findUnique({
        where: { clerk_user_id: clerkUserId },
        select: { user_id: true, pre_score: true }
      });

      if (user) {
        userPreScore = user.pre_score || 0;
        const progress = await prisma.userProgress.findMany({
          where: {
            user_id: user.user_id,
            OR: [
              { status: 'completed' },
              { is_correct: true } // Handle cases where status might not be updated but is_correct is true
            ]
          },
          select: { level_id: true }
        });
        completedLevelIds = new Set(progress.map(p => p.level_id));
      }
    }

    // Add level_count to each category and compute dynamic is_unlocked
    const categoriesWithCount = levelCategories.map(category => {
      const processedLevels = category.levels ? category.levels.map(level => {
        const isStaticUnlocked = level.is_unlocked;
        // Check if required level is completed (if a requirement exists)
        const isPrereqMet = level.required_level_id
          ? completedLevelIds.has(level.required_level_id)
          : false;

        // Check if pre-score requirement is met
        const isScoreMet = (level.require_pre_score !== null && level.require_pre_score !== undefined)
          ? userPreScore >= level.require_pre_score
          : false;

        // Level is unlocked if:
        // 1. It is statically unlocked (default open) AND no score requirement overrides it
        // 2. OR Prerequisites are met
        // 3. OR Pre-score requirement is met (bypass)
        // Note: If require_pre_score is set, we ignore the static is_unlocked from DB to enforce the check
        const isUnlocked = (isStaticUnlocked && !level.require_pre_score) || isPrereqMet || isScoreMet;

        return {
          ...level,
          is_unlocked: isUnlocked
        };
      }) : [];

      return {
        ...category,
        levels: processedLevels,
        level_count: processedLevels.filter(level => level.is_unlocked === true).length,
      };
    });

    res.json({
      levelCategories: categoriesWithCount,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching level categories:", error);
    res.status(500).json({ message: "Error fetching level categories", error: error.message });
  }
};

// Get level category by ID
exports.getLevelCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const levelCategory = await prisma.levelCategory.findUnique({
      where: { category_id: parseInt(categoryId) },
      include: {
        levels: {
          select: {
            level_id: true,
            level_name: true,
            description: true,
            difficulty: true,
            goal_node_id: true,
            monsters: true,
            category_id: true,
            start_node_id: true,
            goal_type: true,
            is_unlocked: true,
            required_level_id: true,
            require_pre_score: true,
          },
          orderBy: {
            level_id: 'asc',
          },
        },
        category_items: {
          orderBy: {
            display_order: 'asc',
          },
        },
      },
    });

    if (!levelCategory) {
      return res.status(404).json({ message: "Level category not found" });
    }

    // Calculate dynamic unlocks (Same logic as getAllLevelCategories)
    const clerkUserId = req.user?.id;
    let completedLevelIds = new Set();
    let userPreScore = 0;

    if (clerkUserId) {
      const user = await prisma.user.findUnique({
        where: { clerk_user_id: clerkUserId },
        select: { user_id: true, pre_score: true }
      });

      if (user) {
        userPreScore = user.pre_score || 0;
        const progress = await prisma.userProgress.findMany({
          where: {
            user_id: user.user_id,
            OR: [
              { status: 'completed' },
              { is_correct: true }
            ]
          },
          select: { level_id: true }
        });
        completedLevelIds = new Set(progress.map(p => p.level_id));
      }
    }

    // Process levels to set dynamic is_unlocked
    const processedLevels = levelCategory.levels ? levelCategory.levels.map(level => {
      const isStaticUnlocked = level.is_unlocked;
      const isPrereqMet = level.required_level_id
        ? completedLevelIds.has(level.required_level_id)
        : false;

      const isScoreMet = (level.require_pre_score !== null && level.require_pre_score !== undefined)
        ? userPreScore >= level.require_pre_score
        : false;

      const isUnlocked = (isStaticUnlocked && !level.require_pre_score) || isPrereqMet || isScoreMet;

      return {
        ...level,
        is_unlocked: isUnlocked
      };
    }) : [];

    // Return category with processed levels
    res.json({
      levelCategory: {
        ...levelCategory,
        levels: processedLevels
      }
    });
  } catch (error) {
    console.error("Error fetching level category:", error);
    res.status(500).json({ message: "Error fetching level category", error: error.message });
  }
};

// Create level category
exports.createLevelCategory = async (req, res) => {
  try {
    const {
      category_name,
      description,
      item_enable,
      item,
      difficulty_order,
      color_code,
      block_key,
    } = req.body;

    if (!category_name || !description || !difficulty_order || !color_code) {
      return res.status(400).json({
        message: "Missing required fields: category_name, description, difficulty_order, color_code"
      });
    }

    const trimmedCategoryName = category_name.trim();
    const trimmedColorCode = color_code.trim();

    // Fix sequence issue: Reset the sequence to match the current max ID
    try {
      await prisma.$executeRaw`
        SELECT setval(
          pg_get_serial_sequence('level_categories', 'category_id'),
          COALESCE((SELECT MAX(category_id) FROM level_categories), 1),
          true
        )
      `;
      console.log("Sequence reset successfully");
    } catch (seqError) {
      console.warn("Warning: Could not reset sequence:", seqError);
    }

    // Prepare category_items data
    const categoryItemsData = [];
    if (item_enable === true || item_enable === 'true') {
      if (Array.isArray(item) && item.length > 0) {
        categoryItemsData.push(...item.map((itemType, index) => ({
          item_type: itemType,
          display_order: index,
        })));
      }
    }

    console.log('Creating category with items:', {
      item_enable,
      item,
      categoryItemsData,
    });

    // Create category with items
    const levelCategory = await prisma.levelCategory.create({
      data: {
        category_name: trimmedCategoryName,
        description: description.trim(),
        item_enable: item_enable === true || item_enable === 'true' || item_enable === false,
        difficulty_order: parseInt(difficulty_order),
        color_code: trimmedColorCode,
        block_key: (block_key && block_key !== 'null' && block_key !== '') ? block_key : null,
        category_items: categoryItemsData.length > 0
          ? {
            create: categoryItemsData,
          }
          : undefined,
      },
      include: {
        category_items: true,
      },
    });
    console.log("Level category created:", levelCategory);
    res.status(201).json({
      message: "Level category created successfully",
      levelCategory,
    });
  } catch (error) {
    console.error("Error creating level category:", error);
    console.error("Error stack:", error.stack);
    console.error("Error code:", error.code);
    console.error("Error meta:", error.meta);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: "A level category with this name already exists." });
    } else if (error.code === 'P2011') {
      return res.status(400).json({ message: "Null constraint violation. Check required fields." });
    }
    res.status(500).json({ message: "Error creating level category", error: error.message });
  }
};

// Update level category
exports.updateLevelCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const {
      category_name,
      description,
      item_enable,
      item,
      difficulty_order,
      color_code,
      block_key,
    } = req.body;

    if (!category_name || !description || !difficulty_order || !color_code) {
      return res.status(400).json({
        message: "Missing required fields: category_name, description, difficulty_order, color_code"
      });
    }

    const existingLevelCategory = await prisma.levelCategory.findUnique({
      where: { category_id: parseInt(categoryId) },
    });

    if (!existingLevelCategory) {
      return res.status(404).json({ message: "Level category not found" });
    }

    // Delete existing items first
    await prisma.levelCategoryItem.deleteMany({
      where: { category_id: parseInt(categoryId) },
    });

    // Prepare category_items data
    const categoryItemsData = [];
    if (item_enable === true || item_enable === 'true') {
      if (Array.isArray(item) && item.length > 0) {
        categoryItemsData.push(...item.map((itemType, index) => ({
          item_type: itemType,
          display_order: index,
        })));
      }
    }

    console.log('Updating category with items:', {
      categoryId,
      item_enable,
      item,
      categoryItemsData,
    });

    // Update category and create new items
    const levelCategory = await prisma.levelCategory.update({
      where: { category_id: parseInt(categoryId) },
      data: {
        category_name: category_name.trim(),
        description: description.trim(),
        item_enable: item_enable === true || item_enable === 'true',
        difficulty_order: parseInt(difficulty_order),
        color_code: color_code.trim(),
        block_key: (block_key && block_key !== 'null' && block_key !== '') ? block_key : null,
        category_items: categoryItemsData.length > 0
          ? {
            create: categoryItemsData,
          }
          : undefined,
      },
      include: {
        category_items: true,
      },
    });

    res.json({
      message: "Level category updated successfully",
      levelCategory,
    });
  } catch (error) {
    console.error("Error updating level category:", error);
    console.error("Error stack:", error.stack);
    console.error("Error code:", error.code);
    console.error("Error meta:", error.meta);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: "A level category with this name already exists." });
    } else if (error.code === 'P2025') {
      return res.status(404).json({ message: "Level category not found" });
    } else if (error.code === 'P2011') {
      return res.status(400).json({ message: "Null constraint violation. Check required fields." });
    }
    res.status(500).json({ message: "Error updating level category", error: error.message });
  }
};

// Delete level category
exports.deleteLevelCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    console.log("Delete level category request:", { categoryId });

    const levelCategory = await prisma.levelCategory.findUnique({
      where: { category_id: parseInt(categoryId) },
      include: {
        levels: true,
      },
    });

    if (!levelCategory) {
      return res.status(404).json({ message: "Level category not found" });
    }

    console.log("Level category found:", {
      category_id: levelCategory.category_id,
      category_name: levelCategory.category_name,
      levelsCount: levelCategory.levels?.length || 0
    });

    // Prevent deletion if level category is used in levels
    if (levelCategory.levels && levelCategory.levels.length > 0) {
      return res.status(400).json({
        message: `Cannot delete level category: This category is being used in ${levelCategory.levels.length} level(s). Please remove or reassign all levels from this category before deleting.`,
        levels_count: levelCategory.levels.length,
        level_ids: levelCategory.levels.map(l => l.level_id)
      });
    }

    // Delete the level category (safe because no levels exist)
    await prisma.levelCategory.delete({
      where: { category_id: parseInt(categoryId) },
    });

    console.log("Level category deleted successfully");

    res.json({
      message: "Level category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting level category:", error);
    console.error("Error stack:", error.stack);
    console.error("Error code:", error.code);
    console.error("Error meta:", error.meta);

    // Provide more detailed error message
    let errorMessage = "Error deleting level category";
    if (error.code === 'P2003') {
      errorMessage = "Cannot delete level category: There are related records that prevent deletion";
    } else if (error.code === 'P2025') {
      errorMessage = "Level category not found";
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      message: errorMessage,
      error: error.message,
      code: error.code,
      meta: error.meta
    });
  }
};

