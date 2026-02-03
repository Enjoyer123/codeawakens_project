const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");
const fs = require("fs");

// Get all level categories without pagination
exports.getAllLevelCategories = async (req, res) => {
  try {
    const search = req.query.search || '';

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

    const levelCategories = await prisma.levelCategory.findMany({
      where,
      include: {
        levels: {
          select: {
            level_id: true,
            level_name: true,
            is_unlocked: true,
            required_level_id: true,
            required_skill_level: true,
            coordinates: true, // Included coordinates
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
    });

    // Data for dynamic unlocks and visibility
    const clerkUserId = req.user?.id;
    let completedLevelIds = new Set();
    let userPreScore = 0;
    let isAdmin = false;

    let user = null;
    if (clerkUserId) {
      user = await prisma.user.findUnique({
        where: { clerk_user_id: clerkUserId },
        select: { user_id: true, skill_level: true, role: true }
      });

      if (user) {
        isAdmin = user.role === 'admin';
        // userPreScore = user.pre_score || 0;
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

    // Add level_count to each category and compute dynamic is_unlocked
    const categoriesWithCount = levelCategories.map(category => {
      const processedLevels = category.levels ? category.levels
        .filter(level => level.is_unlocked || isAdmin) // Only show published OR show all for admin
        .map(level => {
          // Level visibility is determined by static is_unlocked (Published status)
          const isPublished = level.is_unlocked;

          // Admin bypasses locking
          if (isAdmin) {
            return {
              ...level,
              is_unlocked: isPublished,
              is_locked: false
            };
          }

          // Level functional locking is determined by prerequisites and scores
          const isPrereqMet = level.required_level_id
            ? completedLevelIds.has(level.required_level_id)
            : true;

          // Check skill level requirement
          let isSkillMet = true;
          if (level.required_skill_level && user && user.skill_level) {
            const skillRank = {
              'Zone_A': 1,
              'Zone_B': 2,
              'Zone_C': 3
            };
            const userRank = skillRank[user.skill_level] || 0;
            const requiredRank = skillRank[level.required_skill_level] || 0;
            isSkillMet = userRank >= requiredRank;
          } else if (level.required_skill_level && (!user || !user.skill_level)) {
            isSkillMet = false;
          }

          // Unlock if EITHER condition is met (Prereq OR Skill)
          // isLocked is true only if BOTH are false
          const isLocked = !(isPrereqMet || isSkillMet);

          return {
            ...level,
            is_unlocked: isPublished,
            is_locked: isLocked
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
            required_skill_level: true,
            coordinates: true, // Included coordinates
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

    // Calculate dynamic unlocks
    const clerkUserId = req.user?.id;
    let completedLevelIds = new Set();
    let userPreScore = 0;
    let isAdmin = false;

    let user = null;
    if (clerkUserId) {
      user = await prisma.user.findUnique({
        where: { clerk_user_id: clerkUserId },
        select: { user_id: true, skill_level: true, role: true }
      });

      if (user) {
        isAdmin = user.role === 'admin';
        // userPreScore = user.pre_score || 0;
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
    const processedLevels = levelCategory.levels ? levelCategory.levels
      .filter(level => level.is_unlocked || isAdmin)
      .map(level => {
        const isPublished = level.is_unlocked;

        if (isAdmin) {
          return {
            ...level,
            is_unlocked: isPublished,
            is_locked: false
          };
        }

        const isPrereqMet = level.required_level_id
          ? completedLevelIds.has(level.required_level_id)
          : true;

        // Check skill level requirement
        let isSkillMet = true;
        if (level.required_skill_level && user && user.skill_level) {
          const skillRank = {
            'Zone_A': 1,
            'Zone_B': 2,
            'Zone_C': 3
          };
          const userRank = skillRank[user.skill_level] || 0;
          const requiredRank = skillRank[level.required_skill_level] || 0;
          isSkillMet = userRank >= requiredRank;
        } else if (level.required_skill_level && (!user || !user.skill_level)) {
          isSkillMet = false;
        }

        // Unlock if EITHER condition is met (Prereq OR Skill)
        // isLocked is true only if BOTH are false
        const isLocked = !(isPrereqMet || isSkillMet);

        return {
          ...level,
          is_unlocked: isPublished,
          is_locked: isLocked
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
      background_image,
      coordinates
    } = req.body;

    if (!category_name || !description || !difficulty_order || !color_code) {
      return res.status(400).json({
        message: "Missing required fields: category_name, description, difficulty_order, color_code"
      });
    }

    const trimmedCategoryName = category_name.trim();
    const trimmedColorCode = color_code.trim();

    // Sequence reset logic removed for production deployment


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
        background_image: background_image || null,
        coordinates: coordinates ? JSON.parse(JSON.stringify(coordinates)) : null, // Ensure valid JSON
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
      background_image,
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
        color_code: color_code.trim(),
        block_key: (block_key && block_key !== 'null' && block_key !== '') ? block_key : null,
        background_image: background_image !== undefined ? background_image : undefined,
        coordinates: coordinates !== undefined ? JSON.parse(JSON.stringify(coordinates)) : undefined, // Update if provided
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

    // Delete image if exists
    if (levelCategory.background_image) {
      const filePath = path.join(__dirname, "..", levelCategory.background_image);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(`Error deleting file ${filePath}:`, err);
        }
      }
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

// Upload category background
exports.uploadCategoryBackground = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const levelCategory = await prisma.levelCategory.findUnique({
      where: { category_id: parseInt(categoryId) },
    });

    if (!levelCategory) {
      // Delete uploaded file if category doesn't exist
      if (req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      }
      return res.status(404).json({ message: "Level category not found" });
    }

    // Generate correct filename
    const ext = path.extname(req.file.originalname);
    const timestamp = Date.now();
    const correctFilename = `category-bg-${categoryId}-${timestamp}${ext}`;

    // Move/rename file
    const tempPath = req.file.path;
    const itemsDir = path.join(__dirname, "..", "uploads", "items"); // Reuse items dir or create categories dir? 
    // Wait, let's check structure. Probably 'uploads/categories' if it exists. Or just 'uploads'.
    // User structure seems to be 'uploads/rewards', 'uploads/levels'.
    // I'll use 'uploads/categories'. Warning: I need to ensure dir exists or use general 'uploads'.
    // `rewardController` used `path.join(__dirname, "..", "uploads", "rewards")`.
    // I should create/use `uploads/categories`.
    // BUT `multer` middleware usually defines destination.
    // If I use the same middleware as rewards, it might drop in generic folder.
    // I'll assume `uploads/categories` is desired. I'll use `fs.mkdirSync` to be safe.

    const categoriesDir = path.join(__dirname, "..", "uploads", "categories");
    if (!fs.existsSync(categoriesDir)) {
      fs.mkdirSync(categoriesDir, { recursive: true });
    }

    const correctPath = path.join(categoriesDir, correctFilename);

    try {
      fs.renameSync(tempPath, correctPath);
    } catch (renameError) {
      // Try copy and delete if rename fails (cross-device)
      try {
        fs.copyFileSync(tempPath, correctPath);
        fs.unlinkSync(tempPath);
      } catch (copyError) {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        return res.status(500).json({ message: "Error saving file", error: copyError.message });
      }
    }

    const path_file = `/uploads/categories/${correctFilename}`;

    // Update DB
    const updateData = { background_image: path_file };

    // Delete old file
    if (levelCategory.background_image) {
      const oldFilePath = path.join(__dirname, "..", levelCategory.background_image);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (err) { }
      }
    }

    const updatedCategory = await prisma.levelCategory.update({
      where: { category_id: parseInt(categoryId) },
      data: updateData,
    });

    res.json({
      message: "Background uploaded successfully",
      levelCategory: updatedCategory,
    });
  } catch (error) {
    console.error("Error uploading background:", error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Error uploading background", error: error.message });
  }
};

// Delete category background
exports.deleteCategoryBackground = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const levelCategory = await prisma.levelCategory.findUnique({
      where: { category_id: parseInt(categoryId) },
    });

    if (!levelCategory) {
      return res.status(404).json({ message: "Level category not found" });
    }

    if (levelCategory.background_image) {
      const filePath = path.join(__dirname, "..", levelCategory.background_image);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      }
    }

    const updatedCategory = await prisma.levelCategory.update({
      where: { category_id: parseInt(categoryId) },
      data: { background_image: null },
    });

    res.json({
      message: "Background deleted successfully",
      levelCategory: updatedCategory,
    });
  } catch (error) {
    console.error("Error deleting background:", error);
    res.status(500).json({ message: "Error deleting background", error: error.message });
  }
};

// Update only level category coordinates
exports.updateLevelCategoryCoordinates = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { coordinates } = req.body;

    const levelCategory = await prisma.levelCategory.findUnique({
      where: { category_id: parseInt(categoryId) },
    });

    if (!levelCategory) {
      return res.status(404).json({ message: "Level category not found" });
    }

    const updatedCategory = await prisma.levelCategory.update({
      where: { category_id: parseInt(categoryId) },
      data: {
        coordinates: coordinates, // Expecting JSON object or null
      },
    });

    res.json({
      message: "Level category coordinates updated successfully",
      levelCategory: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating level category coordinates:", error);
    res.status(500).json({ message: "Error updating level category coordinates", error: error.message });
  }
};
