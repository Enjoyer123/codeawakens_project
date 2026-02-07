const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all levels with pagination
exports.getAllLevels = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  // console.log(`[LEVEL] Fetching levels list. Page: ${page}, Limit: ${limit}, Search: "${search}"`); // Verbose, keeping commented or minimal

  try {
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
    console.error("[ERROR] Failed to fetch levels:", error.message);
    res.status(500).json({ message: "Error fetching levels", error: error.message });
  }
};

// Get all categories for dropdown
exports.getAllCategories = async (req, res) => {
  console.log("[LEVEL] Fetching all categories for dropdown.");
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
        item_enable: true,
        category_items: {
          select: {
            item_type: true,
          },
          orderBy: {
            display_order: 'asc',
          },
        },
      },
    });

    // Transform category_items to item array for backward compatibility
    const categoriesWithItem = categories.map(category => ({
      ...category,
      item: category.category_items?.map(ci => ci.item_type) || null,
    }));

    res.json(categoriesWithItem);
  } catch (error) {
    console.error("[ERROR] Failed to fetch categories:", error.message);
    res.status(500).json({ message: "Error fetching categories", error: error.message });
  }
};

// Get all levels for prerequisite dropdown
exports.getLevelsForPrerequisite = async (req, res) => {
  console.log("[LEVEL] Fetching levels for prerequisite dropdown.");
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
    console.error("[ERROR] Failed to fetch levels for prerequisite:", error.message);
    res.status(500).json({ message: "Error fetching levels", error: error.message });
  }
};

// Get single level by ID
exports.getLevelById = async (req, res) => {
  const { levelId } = req.params;
  const clerkUserId = req.user?.id;
  if (clerkUserId) {
    console.log(`[GAME] User ${clerkUserId} viewing Level ${levelId}.`);
  }

  try {
    const level = await prisma.level.findUnique({
      where: { level_id: parseInt(levelId) },
      include: {
        category: {
          include: {
            category_items: {
              orderBy: {
                display_order: 'asc',
              },
            },
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
        patterns: {
          include: {
            weapon: true,
            pattern_type: true,
          },
        },
        guides: {
          include: {
            guide_images: true,
          },
          orderBy: {
            display_order: 'asc',
          },
        },
        hints: {
          include: {
            hint_images: true,
          },
          orderBy: {
            display_order: 'asc',
          },
        },
        level_test_cases: {
          orderBy: {
            display_order: 'asc',
          },
        },
      },
    });

    if (!level) {
      console.warn(`[GAME] Warning: Level ${levelId} not found.`);
      return res.status(404).json({ message: "Level not found" });
    }

    // Calculate dynamic lock state
    let isPublished = level.is_unlocked;
    let isLocked = false;

    if (clerkUserId) {
      const user = await prisma.user.findUnique({
        where: { clerk_user_id: clerkUserId },
        select: { user_id: true, skill_level: true, role: true }
      });

      if (user) {
        const isAdmin = user.role === 'admin';

        // Security check: If level is not published, only admin can see it
        if (!isPublished && !isAdmin) {
          console.warn(`[GAME] Access Denied: User ${clerkUserId} tried to access unpublished Level ${levelId}.`);
          return res.status(403).json({ message: "This level is not published yet." });
        }

        // Admin bypass for locking
        if (isAdmin) {
          isLocked = false;
        } else {
          // Define unlocking criteria
          const unlockConditions = [];

          // Condition 1: Prerequisite Level
          if (level.required_level_id) {
            const progress = await prisma.userProgress.findUnique({
              where: {
                user_id_level_id: {
                  user_id: user.user_id,
                  level_id: level.required_level_id,
                },
              },
            });
            const isPrereqMet = (progress && (progress.status === 'completed' || progress.is_correct));
            unlockConditions.push(isPrereqMet);
          }

          // Condition 2: Skill Level
          if (level.required_skill_level) {
            let isSkillMet = false;
            if (user.skill_level) {
              const skillRank = {
                'Zone_A': 1,
                'Zone_B': 2,
                'Zone_C': 3
              };
              const userRank = skillRank[user.skill_level] || 0;
              const requiredRank = skillRank[level.required_skill_level] || 0;
              isSkillMet = userRank >= requiredRank;
            }
            unlockConditions.push(isSkillMet);
          }

          // Final Lock Decision
          // If NO requirements (unlockConditions empty), it is UNLOCKED.
          // If HAS requirements, it is UNLOCKED if AT LEAST ONE condition is met (OR logic).
          if (unlockConditions.length > 0) {
            const anyConditionMet = unlockConditions.some(met => met === true);
            isLocked = !anyConditionMet;
          } else {
            isLocked = false;
          }
        }
      }
    } else {
      // Not logged in
      if (!isPublished) {
        return res.status(403).json({ message: "This level is not published yet." });
      }
      if (level.required_skill_level) {
        isLocked = true;
      }
    }

    res.json({
      ...level,
      is_unlocked: isPublished,
      is_locked: isLocked
    });
  } catch (error) {
    console.error(`[ERROR] Failed to fetch Level ${levelId}:`, error.message);
    res.status(500).json({ message: "Error fetching level", error: error.message });
  }
};

// Create new level
exports.createLevel = async (req, res) => {
  const clerkUserId = req.user?.id;
  console.log(`[ADMIN] User ${clerkUserId} creating new level.`);

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
      knapsack_data,
      subset_sum_data,
      coin_change_data,
      nqueen_data,
      applied_data,
      starter_xml,
      block_ids,
      victory_condition_ids,
      required_skill_level,
      required_for_post_test,
      character,
      coordinates,
    } = req.body;

    // Get user from request (set by authCheck middleware)
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
      console.warn(`[ADMIN] Create Level Failed: Missing fields [${missingFields.join(', ')}] by User ${clerkUserId}.`);
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

    // Sequence reset logic removed for production deployment






    const level = await prisma.level.create({
      data: {
        category_id: parseInt(category_id),
        level_name,
        description: description || null,
        difficulty_level: parseInt(difficulty_level),
        difficulty,
        is_unlocked: is_unlocked === true || is_unlocked === 'true',
        required_level_id: required_level_id ? parseInt(required_level_id) : null,
        required_skill_level: required_skill_level || null,
        required_for_post_test: required_for_post_test === true || required_for_post_test === 'true',
        textcode: textcode === true || textcode === 'true',
        background_image,
        start_node_id: start_node_id !== null && start_node_id !== undefined ? parseInt(start_node_id) : null,
        goal_node_id: goal_node_id !== null && goal_node_id !== undefined ? parseInt(goal_node_id) : null,
        goal_type: goal_type || null,
        character: character || null,
        coordinates: parseJsonField(coordinates), // Parse and save coordinates
        nodes: parseJsonField(nodes),
        edges: parseJsonField(edges),
        monsters: parseJsonField(monsters),
        obstacles: parseJsonField(obstacles),
        coin_positions: parseJsonField(coin_positions),
        people: parseJsonField(people),
        treasures: parseJsonField(treasures),
        knapsack_data: parseJsonField(knapsack_data),
        subset_sum_data: parseJsonField(subset_sum_data),
        coin_change_data: parseJsonField(coin_change_data),
        nqueen_data: parseJsonField(nqueen_data),
        applied_data: parseJsonField(applied_data),
        starter_xml: starter_xml || null,
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

    console.log(`[ADMIN] Success: Created Level ${level.level_id} ("${level.level_name}") by User ${clerkUserId}.`);
    res.status(201).json({
      message: "Level created successfully",
      level,
    });
  } catch (error) {
    console.error(`[ERROR] Failed to create level by User ${clerkUserId}:`, error.message);
    res.status(500).json({ message: "Error creating level", error: error.message });
  }
};

// Update level
exports.updateLevel = async (req, res) => {
  const { levelId } = req.params;
  const clerkUserId = req.user?.id;
  console.log(`[ADMIN] User ${clerkUserId} updating Level ${levelId}.`);

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
      knapsack_data,
      subset_sum_data,
      coin_change_data,
      nqueen_data,
      applied_data,
      starter_xml,
      block_ids,
      victory_condition_ids,
      required_skill_level,
      required_for_post_test,
      character,
      coordinates,
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
    if (required_skill_level !== undefined) {
      updateData.required_skill_level = required_skill_level || null;
    }
    if (required_for_post_test !== undefined) {
      updateData.required_for_post_test = required_for_post_test === true || required_for_post_test === 'true';
    }
    if (textcode !== undefined) updateData.textcode = textcode === true || textcode === 'true';
    if (background_image !== undefined) updateData.background_image = background_image;
    if (start_node_id !== undefined) updateData.start_node_id = start_node_id !== null ? parseInt(start_node_id) : null;
    if (goal_node_id !== undefined) updateData.goal_node_id = goal_node_id !== null ? parseInt(goal_node_id) : null;
    if (goal_type !== undefined) updateData.goal_type = goal_type || null;
    if (character !== undefined) updateData.character = character;
    if (coordinates !== undefined) updateData.coordinates = parseJsonField(coordinates); // Update coordinates
    if (nodes !== undefined) updateData.nodes = parseJsonField(nodes);
    if (edges !== undefined) updateData.edges = parseJsonField(edges);
    if (monsters !== undefined) updateData.monsters = parseJsonField(monsters);
    if (obstacles !== undefined) updateData.obstacles = parseJsonField(obstacles);
    if (coin_positions !== undefined) updateData.coin_positions = parseJsonField(coin_positions);
    if (people !== undefined) updateData.people = parseJsonField(people);
    if (treasures !== undefined) updateData.treasures = parseJsonField(treasures);
    if (knapsack_data !== undefined) updateData.knapsack_data = parseJsonField(knapsack_data);
    if (subset_sum_data !== undefined) updateData.subset_sum_data = parseJsonField(subset_sum_data);
    if (coin_change_data !== undefined) updateData.coin_change_data = parseJsonField(coin_change_data);
    if (nqueen_data !== undefined) updateData.nqueen_data = parseJsonField(nqueen_data);
    if (applied_data !== undefined) updateData.applied_data = parseJsonField(applied_data);
    if (starter_xml !== undefined) updateData.starter_xml = starter_xml || null;

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

    console.log(`[ADMIN] Success: Updated Level ${levelId} by User ${clerkUserId}.`);
    res.json({
      message: "Level updated successfully",
      level,
    });
  } catch (error) {
    console.error(`[ERROR] Failed to update Level ${levelId} by User ${clerkUserId}:`, error.message);
    res.status(500).json({ message: "Error updating level", error: error.message });
  }
};

// Delete level
exports.deleteLevel = async (req, res) => {
  const { levelId } = req.params;
  const clerkUserId = req.user?.id;
  console.log(`[ADMIN] User ${clerkUserId} deleting Level ${levelId}.`);

  try {
    const level = await prisma.level.findUnique({
      where: { level_id: parseInt(levelId) },
    });

    if (!level) {
      console.warn(`[ADMIN] Warning: Level ${levelId} not found for deletion.`);
      return res.status(404).json({ message: "Level not found" });
    }

    await prisma.level.delete({
      where: { level_id: parseInt(levelId) },
    });

    console.log(`[ADMIN] Success: Deleted Level ${levelId} by User ${clerkUserId}.`);
    res.json({
      message: "Level deleted successfully",
    });
  } catch (error) {
    console.error(`[ERROR] Failed to delete Level ${levelId} by User ${clerkUserId}:`, error.message);
    res.status(500).json({ message: "Error deleting level", error: error.message });
  }
};

// Upload level background image
// Unlock level (set is_unlocked to true)
exports.unlockLevel = async (req, res) => {
  const { levelId } = req.params;
  console.log(`[ADMIN] Unlocking Level ${levelId}.`);

  try {
    const level = await prisma.level.findUnique({
      where: { level_id: parseInt(levelId) },
    });

    if (!level) {
      return res.status(404).json({ message: "Level not found" });
    }

    const updatedLevel = await prisma.level.update({
      where: { level_id: parseInt(levelId) },
      data: {
        is_unlocked: true,
      },
    });

    console.log(`[ADMIN] Success: Level ${levelId} unlocked.`);
    res.json({
      message: "Level unlocked successfully",
    });
  } catch (error) {
    console.error(`[ERROR] Failed to unlock Level ${levelId}:`, error.message);
    res.status(500).json({
      message: "Error unlocking level",
      error: error.message
    });
  }
};

// Update only level coordinates
exports.updateLevelCoordinates = async (req, res) => {
  const { levelId } = req.params;
  // console.log(`[ADMIN] Updating coordinates for Level ${levelId}.`); // Verbose

  try {
    const { coordinates } = req.body;

    const level = await prisma.level.findUnique({
      where: { level_id: parseInt(levelId) },
    });

    if (!level) {
      return res.status(404).json({ message: "Level not found" });
    }

    const updatedLevel = await prisma.level.update({
      where: { level_id: parseInt(levelId) },
      data: {
        coordinates: coordinates, // Expecting JSON object or null
      },
    });

    res.json({
      message: "Level coordinates updated successfully",
      level: updatedLevel,
    });
  } catch (error) {
    console.error(`[ERROR] Failed to update coordinates for Level ${levelId}:`, error.message);
    res.status(500).json({ message: "Error updating level coordinates", error: error.message });
  }
};

exports.uploadLevelBackgroundImage = async (req, res) => {
  const clerkUserId = req.user?.id;
  console.log(`[ADMIN] User ${clerkUserId} uploading level background.`);

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const imagePath = `/uploads/levels/${req.file.filename}`;

    console.log(`[ADMIN] Success: Level background uploaded by User ${clerkUserId} at ${imagePath}.`);
    res.json({
      message: "Level background image uploaded successfully",
      imageUrl: imagePath,
    });
  } catch (error) {
    console.error(`[ERROR] Failed to upload level background by User ${clerkUserId}:`, error.message);
    res.status(500).json({ message: "Failed to upload level background image", error: error.message });
  }
};
