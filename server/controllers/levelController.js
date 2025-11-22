const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all levels with pagination
exports.getAllLevels = async (req, res) => {
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
          { level_name: { contains: searchLower, mode: 'insensitive' } },
          { description: { contains: searchLower, mode: 'insensitive' } },
        ],
      };
    }

    const total = await prisma.level.count({ where });

    const levels = await prisma.level.findMany({
      where,
      include: {
        category: {
          select: {
            category_id: true,
            category_name: true,
            color_code: true,
          },
        },
        creator: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
        required_level: {
          select: {
            level_id: true,
            level_name: true,
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
      levels,
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
    console.error("Error fetching levels:", error);
    res.status(500).json({ message: "Error fetching levels", error: error.message });
  }
};

// Get all categories for dropdown
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.levelCategory.findMany({
      orderBy: {
        difficulty_order: 'asc',
      },
      select: {
        category_id: true,
        category_name: true,
        description: true,
        color_code: true,
        difficulty_order: true,
      },
    });

    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories", error: error.message });
  }
};

// Get all levels for prerequisite dropdown
exports.getLevelsForPrerequisite = async (req, res) => {
  try {
    const levels = await prisma.level.findMany({
      select: {
        level_id: true,
        level_name: true,
        category: {
          select: {
            category_name: true,
          },
        },
      },
      orderBy: {
        level_name: 'asc',
      },
    });

    res.json(levels);
  } catch (error) {
    console.error("Error fetching levels for prerequisite:", error);
    res.status(500).json({ message: "Error fetching levels", error: error.message });
  }
};

// Get single level by ID
exports.getLevelById = async (req, res) => {
  try {
    const { levelId } = req.params;

    const level = await prisma.level.findUnique({
      where: { level_id: parseInt(levelId) },
      include: {
        category: true,
        creator: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
        required_level: {
          select: {
            level_id: true,
            level_name: true,
          },
        },
        level_blocks: {
          include: {
            block: true,
          },
        },
        level_victory_conditions: {
          include: {
            victory_condition: true,
          },
        },
      },
    });

    if (!level) {
      return res.status(404).json({ message: "Level not found" });
    }

    res.json(level);
  } catch (error) {
    console.error("Error fetching level:", error);
    res.status(500).json({ message: "Error fetching level", error: error.message });
  }
};

// Create new level
exports.createLevel = async (req, res) => {
  try {
    const {
      category_id,
      level_name,
      description,
      difficulty_level,
      difficulty,
      is_unlocked,
      required_level_id,
      textcode,
      background_image,
      start_node_id,
      goal_node_id,
      goal_type,
      nodes,
      edges,
      monsters,
      obstacles,
      coin_positions,
      people,
      treasures,
      block_ids,
      victory_condition_ids,
    } = req.body;

    // Get user from request (set by authCheck middleware)
    const clerkUserId = req.user?.id;
    if (!clerkUserId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Find user by clerk_user_id
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: clerkUserId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate required fields
    const missingFields = [];
    if (!category_id || category_id === '') missingFields.push('category_id');
    if (!level_name || level_name.trim() === '') missingFields.push('level_name');
    if (!difficulty_level || difficulty_level === '') missingFields.push('difficulty_level');
    if (!difficulty || difficulty.trim() === '') missingFields.push('difficulty');
    if (!background_image || background_image.trim() === '') missingFields.push('background_image');

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Validate category exists
    const category = await prisma.levelCategory.findUnique({
      where: { category_id: parseInt(category_id) },
    });

    if (!category) {
      return res.status(400).json({ message: "Category not found" });
    }

    // Validate required_level_id if provided
    if (required_level_id) {
      const requiredLevel = await prisma.level.findUnique({
        where: { level_id: parseInt(required_level_id) },
      });

      if (!requiredLevel) {
        return res.status(400).json({ message: "Required level not found" });
      }
    }

    // Parse JSON fields if they are strings
    const parseJsonField = (field) => {
      if (!field) return null;
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch (e) {
          return null;
        }
      }
      return field;
    };

    // Fix sequence issue: Reset the sequences to match the current max IDs
    // This prevents "Unique constraint failed" errors when the sequences are out of sync
    try {
      // Reset level_id sequence
      await prisma.$executeRaw`
        SELECT setval(
          pg_get_serial_sequence('levels', 'level_id'),
          COALESCE((SELECT MAX(level_id) FROM levels), 1),
          true
        )
      `;
      console.log("Level sequence reset successfully");
    } catch (seqError) {
      console.warn("Warning: Could not reset level sequence:", seqError);
    }

    // Reset level_blocks sequence if we're creating blocks
    if (block_ids && block_ids.length > 0) {
      try {
        await prisma.$executeRaw`
          SELECT setval(
            pg_get_serial_sequence('level_blocks', 'level_block_id'),
            COALESCE((SELECT MAX(level_block_id) FROM level_blocks), 1),
            true
          )
        `;
        console.log("Level blocks sequence reset successfully");
      } catch (seqError) {
        console.warn("Warning: Could not reset level_blocks sequence:", seqError);
      }
    }

    // Reset level_victory_conditions sequence if we're creating victory conditions
    if (victory_condition_ids && victory_condition_ids.length > 0) {
      try {
        await prisma.$executeRaw`
          SELECT setval(
            pg_get_serial_sequence('level_victory_conditions', 'level_victory_condition_id'),
            COALESCE((SELECT MAX(level_victory_condition_id) FROM level_victory_conditions), 1),
            true
          )
        `;
        console.log("Level victory conditions sequence reset successfully");
      } catch (seqError) {
        console.warn("Warning: Could not reset level_victory_conditions sequence:", seqError);
      }
    }

    const level = await prisma.level.create({
      data: {
        category_id: parseInt(category_id),
        level_name,
        description: description || null,
        difficulty_level: parseInt(difficulty_level),
        difficulty,
        is_unlocked: is_unlocked === true || is_unlocked === 'true',
        required_level_id: required_level_id ? parseInt(required_level_id) : null,
        textcode: textcode === true || textcode === 'true',
        background_image,
        start_node_id: start_node_id ? parseInt(start_node_id) : null,
        goal_node_id: goal_node_id ? parseInt(goal_node_id) : null,
        goal_type: goal_type || null,
        nodes: parseJsonField(nodes),
        edges: parseJsonField(edges),
        monsters: parseJsonField(monsters),
        obstacles: parseJsonField(obstacles),
        coin_positions: parseJsonField(coin_positions),
        people: parseJsonField(people),
        treasures: parseJsonField(treasures),
        created_by: user.user_id,
        level_blocks: block_ids && block_ids.length > 0 ? {
          create: block_ids.map((blockId, index) => ({
            block_id: parseInt(blockId),
            order_sequence: index + 1,
          })),
        } : undefined,
        level_victory_conditions: victory_condition_ids && victory_condition_ids.length > 0 ? {
          create: victory_condition_ids.map(vcId => ({
            victory_condition_id: parseInt(vcId),
          })),
        } : undefined,
      },
      include: {
        category: {
          select: {
            category_id: true,
            category_name: true,
            color_code: true,
          },
        },
        creator: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
        required_level: {
          select: {
            level_id: true,
            level_name: true,
          },
        },
        level_blocks: {
          include: {
            block: true,
          },
        },
        level_victory_conditions: {
          include: {
            victory_condition: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Level created successfully",
      level,
    });
  } catch (error) {
    console.error("Error creating level:", error);
    res.status(500).json({ message: "Error creating level", error: error.message });
  }
};

// Update level
exports.updateLevel = async (req, res) => {
  try {
    const { levelId } = req.params;
    const {
      category_id,
      level_name,
      description,
      difficulty_level,
      difficulty,
      is_unlocked,
      required_level_id,
      textcode,
      background_image,
      start_node_id,
      goal_node_id,
      goal_type,
      nodes,
      edges,
      monsters,
      obstacles,
      coin_positions,
      people,
      treasures,
      block_ids,
      victory_condition_ids,
    } = req.body;

    const existingLevel = await prisma.level.findUnique({
      where: { level_id: parseInt(levelId) },
    });

    if (!existingLevel) {
      return res.status(404).json({ message: "Level not found" });
    }

    // Parse JSON fields if they are strings
    const parseJsonField = (field) => {
      if (field === undefined) return undefined;
      if (field === null || field === '') return null;
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch (e) {
          return null;
        }
      }
      return field;
    };

    const updateData = {};
    if (category_id !== undefined) {
      // Validate category exists
      const category = await prisma.levelCategory.findUnique({
        where: { category_id: parseInt(category_id) },
      });
      if (!category) {
        return res.status(400).json({ message: "Category not found" });
      }
      updateData.category_id = parseInt(category_id);
    }
    if (level_name !== undefined) updateData.level_name = level_name;
    if (description !== undefined) updateData.description = description;
    if (difficulty_level !== undefined) updateData.difficulty_level = parseInt(difficulty_level);
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (is_unlocked !== undefined) updateData.is_unlocked = is_unlocked === true || is_unlocked === 'true';
    if (required_level_id !== undefined) {
      if (required_level_id === null || required_level_id === '') {
        updateData.required_level_id = null;
      } else {
        // Validate required_level_id
        const requiredLevel = await prisma.level.findUnique({
          where: { level_id: parseInt(required_level_id) },
        });
        if (!requiredLevel) {
          return res.status(400).json({ message: "Required level not found" });
        }
        updateData.required_level_id = parseInt(required_level_id);
      }
    }
    if (textcode !== undefined) updateData.textcode = textcode === true || textcode === 'true';
    if (background_image !== undefined) updateData.background_image = background_image;
    if (start_node_id !== undefined) updateData.start_node_id = start_node_id ? parseInt(start_node_id) : null;
    if (goal_node_id !== undefined) updateData.goal_node_id = goal_node_id ? parseInt(goal_node_id) : null;
    if (goal_type !== undefined) updateData.goal_type = goal_type || null;
    if (nodes !== undefined) updateData.nodes = parseJsonField(nodes);
    if (edges !== undefined) updateData.edges = parseJsonField(edges);
    if (monsters !== undefined) updateData.monsters = parseJsonField(monsters);
    if (obstacles !== undefined) updateData.obstacles = parseJsonField(obstacles);
    if (coin_positions !== undefined) updateData.coin_positions = parseJsonField(coin_positions);
    if (people !== undefined) updateData.people = parseJsonField(people);
    if (treasures !== undefined) updateData.treasures = parseJsonField(treasures);

    // Use transaction to update level and relationships
    const level = await prisma.$transaction(async (tx) => {
      // Update level
      const updatedLevel = await tx.level.update({
        where: { level_id: parseInt(levelId) },
        data: updateData,
      });

      // Update level blocks if provided
      if (block_ids !== undefined) {
        // Delete existing level blocks
        await tx.levelBlock.deleteMany({
          where: { level_id: parseInt(levelId) },
        });

        // Create new level blocks
        if (block_ids && block_ids.length > 0) {
          await tx.levelBlock.createMany({
            data: block_ids.map((blockId, index) => ({
              level_id: parseInt(levelId),
              block_id: parseInt(blockId),
              order_sequence: index + 1,
            })),
          });
        }
      }

      // Update level victory conditions if provided
      if (victory_condition_ids !== undefined) {
        // Delete existing level victory conditions
        await tx.levelVictoryCondition.deleteMany({
          where: { level_id: parseInt(levelId) },
        });

        // Create new level victory conditions
        if (victory_condition_ids && victory_condition_ids.length > 0) {
          await tx.levelVictoryCondition.createMany({
            data: victory_condition_ids.map(vcId => ({
              level_id: parseInt(levelId),
              victory_condition_id: parseInt(vcId),
            })),
          });
        }
      }

      // Return updated level with relations
      return await tx.level.findUnique({
        where: { level_id: parseInt(levelId) },
        include: {
          category: {
            select: {
              category_id: true,
              category_name: true,
              color_code: true,
            },
          },
          creator: {
            select: {
              user_id: true,
              username: true,
              email: true,
            },
          },
          required_level: {
            select: {
              level_id: true,
              level_name: true,
            },
          },
          level_blocks: {
            include: {
              block: true,
            },
          },
          level_victory_conditions: {
            include: {
              victory_condition: true,
            },
          },
        },
      });
    });

    res.json({
      message: "Level updated successfully",
      level,
    });
  } catch (error) {
    console.error("Error updating level:", error);
    res.status(500).json({ message: "Error updating level", error: error.message });
  }
};

// Delete level
exports.deleteLevel = async (req, res) => {
  try {
    const { levelId } = req.params;

    const level = await prisma.level.findUnique({
      where: { level_id: parseInt(levelId) },
    });

    if (!level) {
      return res.status(404).json({ message: "Level not found" });
    }

    await prisma.level.delete({
      where: { level_id: parseInt(levelId) },
    });

    res.json({
      message: "Level deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting level:", error);
    res.status(500).json({ message: "Error deleting level", error: error.message });
  }
};

// Upload level background image
exports.uploadLevelBackgroundImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const imagePath = `/uploads/levels/${req.file.filename}`;

    res.json({
      message: "Background image uploaded successfully",
      imagePath,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("Error uploading background image:", error);
    res.status(500).json({ message: "Error uploading background image", error: error.message });
  }
};

