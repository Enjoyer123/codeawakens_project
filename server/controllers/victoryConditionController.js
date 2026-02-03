const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all victory conditions with pagination
exports.getAllVictoryConditions = async (req, res) => {
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
          { type: { contains: searchLower, mode: 'insensitive' } },
          { description: { contains: searchLower, mode: 'insensitive' } },
          { check: { contains: searchLower, mode: 'insensitive' } },
        ],
      };
    }

    const total = await prisma.victoryCondition.count({ where });

    const victoryConditions = await prisma.victoryCondition.findMany({
      where,
      orderBy: {
        created_at: "desc",
      },
      skip,
      take: limit,
    });

    res.json({
      victoryConditions,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching victory conditions:", error);
    res.status(500).json({ message: "Error fetching victory conditions", error: error.message });
  }
};

// Get victory condition by ID
exports.getVictoryConditionById = async (req, res) => {
  try {
    const { victoryConditionId } = req.params;

    const victoryCondition = await prisma.victoryCondition.findUnique({
      where: { victory_condition_id: parseInt(victoryConditionId) },
    });

    if (!victoryCondition) {
      return res.status(404).json({ message: "Victory condition not found" });
    }

    res.json({ victoryCondition });
  } catch (error) {
    console.error("Error fetching victory condition:", error);
    res.status(500).json({ message: "Error fetching victory condition", error: error.message });
  }
};

// Create victory condition function removed: Creation only allowed via seed/migration

// Update victory condition
exports.updateVictoryCondition = async (req, res) => {
  try {
    const { victoryConditionId } = req.params;
    const {
      type,
      description,
      check,
      is_available,
    } = req.body;

    if (!type || !description || !check) {
      return res.status(400).json({
        message: "Missing required fields: type, description, check"
      });
    }

    const existingVictoryCondition = await prisma.victoryCondition.findUnique({
      where: { victory_condition_id: parseInt(victoryConditionId) },
    });

    if (!existingVictoryCondition) {
      return res.status(404).json({ message: "Victory condition not found" });
    }

    // Check if type is being changed and if it already exists for another victory condition
    const trimmedType = type.trim();
    if (trimmedType !== existingVictoryCondition.type) {
      // Check case-insensitive first
      const victoryConditionWithSameType = await prisma.victoryCondition.findFirst({
        where: {
          type: {
            equals: trimmedType,
            mode: 'insensitive'
          },
          victory_condition_id: {
            not: parseInt(victoryConditionId)
          }
        },
      });

      if (victoryConditionWithSameType) {
        return res.status(409).json({
          message: `A victory condition with this type "${trimmedType}" already exists (Victory Condition ID: ${victoryConditionWithSameType.victory_condition_id}).`
        });
      }

      // Also check exact match (case-sensitive) as fallback
      const exactMatch = await prisma.victoryCondition.findUnique({
        where: { type: trimmedType },
      });

      if (exactMatch && exactMatch.victory_condition_id !== parseInt(victoryConditionId)) {
        return res.status(409).json({
          message: `A victory condition with this type "${trimmedType}" already exists (Victory Condition ID: ${exactMatch.victory_condition_id}).`
        });
      }
    }

    const victoryCondition = await prisma.victoryCondition.update({
      where: { victory_condition_id: parseInt(victoryConditionId) },
      data: {
        type: trimmedType,
        description: description.trim(),
        check: check.trim(),
        is_available: is_available === true || is_available === 'true',
      },
    });

    res.json({
      message: "Victory condition updated successfully",
      victoryCondition,
    });
  } catch (error) {
    console.error("Error updating victory condition:", error);
    console.error("Error stack:", error.stack);
    console.error("Error code:", error.code);
    console.error("Error meta:", error.meta);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: "A victory condition with this type already exists." });
    } else if (error.code === 'P2025') {
      return res.status(404).json({ message: "Victory condition not found" });
    } else if (error.code === 'P2011') {
      return res.status(400).json({ message: "Null constraint violation. Check required fields." });
    }
    res.status(500).json({ message: "Error updating victory condition", error: error.message });
  }
};

// Delete victory condition
exports.deleteVictoryCondition = async (req, res) => {
  try {
    const { victoryConditionId } = req.params;

    console.log("Delete victory condition request:", { victoryConditionId });

    const victoryCondition = await prisma.victoryCondition.findUnique({
      where: { victory_condition_id: parseInt(victoryConditionId) },
      include: {
        level_victory_conditions: true,
      },
    });

    if (!victoryCondition) {
      return res.status(404).json({ message: "Victory condition not found" });
    }

    console.log("Victory condition found:", {
      victory_condition_id: victoryCondition.victory_condition_id,
      type: victoryCondition.type,
      levelVictoryConditionsCount: victoryCondition.level_victory_conditions?.length || 0
    });

    // Prevent deletion if victory condition is used in levels
    if (victoryCondition.level_victory_conditions && victoryCondition.level_victory_conditions.length > 0) {
      const levelIds = victoryCondition.level_victory_conditions.map(lvc => lvc.level_id);
      const uniqueLevelIds = [...new Set(levelIds)];

      return res.status(400).json({
        message: `Cannot delete victory condition: This victory condition is being used in ${victoryCondition.level_victory_conditions.length} level victory condition(s) across ${uniqueLevelIds.length} level(s). Please remove the victory condition from all levels before deleting.`,
        level_victory_conditions_count: victoryCondition.level_victory_conditions.length,
        levels_count: uniqueLevelIds.length,
        level_ids: uniqueLevelIds
      });
    }

    // Delete the victory condition (safe because no level_victory_conditions exist)
    await prisma.victoryCondition.delete({
      where: { victory_condition_id: parseInt(victoryConditionId) },
    });

    console.log("Victory condition deleted successfully");

    res.json({
      message: "Victory condition deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting victory condition:", error);
    console.error("Error stack:", error.stack);
    console.error("Error code:", error.code);
    console.error("Error meta:", error.meta);

    // Provide more detailed error message
    let errorMessage = "Error deleting victory condition";
    if (error.code === 'P2003') {
      errorMessage = "Cannot delete victory condition: There are related records that prevent deletion";
    } else if (error.code === 'P2025') {
      errorMessage = "Victory condition not found";
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

