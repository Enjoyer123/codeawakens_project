import prisma from "../models/prisma.js";
import { parsePagination, buildPaginationResponse } from "../utils/pagination.js";

// ── Shared Helpers ──

export const parseJsonField = (field) => {
  if (field === undefined) return undefined;
  if (field === null || field === "") return null;
  if (typeof field === "string") {
    try { return JSON.parse(field); } catch { return null; }
  }
  return field;
}

/**
 * Calculate lock state for a level given user context.
 * Shared by levelService and levelCategoryService.
 */
export const calculateLockState = (level, user, completedLevelIds) => {
  const isPublished = level.is_unlocked;

  // Admin bypass
  if (user && user.role === "admin") {
    return { is_unlocked: isPublished, is_locked: false };
  }

  // Not logged in
  if (!user) {
    return {
      is_unlocked: isPublished,
      is_locked: !!level.required_skill_level,
    };
  }

  // Prerequisite check
  const isPrereqMet = level.required_level_id
    ? completedLevelIds.has(level.required_level_id)
    : true;

  // Skill level check
  let isSkillMet = true;
  if (level.required_skill_level) {
    if (user.skill_level) {
      const skillRank = { Zone_A: 1, Zone_B: 2, Zone_C: 3 };
      const userRank = skillRank[user.skill_level] || 0;
      const requiredRank = skillRank[level.required_skill_level] || 0;
      isSkillMet = userRank >= requiredRank;
    } else {
      isSkillMet = false;
    }
  }

  // Unlock if EITHER condition met
  const isLocked = !(isPrereqMet || isSkillMet);

  return { is_unlocked: isPublished, is_locked: isLocked };
}

/**
 * Get completed level IDs for a user (for unlock calculations)
 */
export const getCompletedLevelIds = async (userId) => {
  const progress = await prisma.userProgress.findMany({
    where: {
      user_id: userId,
      OR: [{ status: "completed" }, { is_correct: true }],
    },
    select: { level_id: true },
  });
  return new Set(progress.map((p) => p.level_id));
}

/**
 * Resolve user from clerkUserId (returns null if not found or not logged in)
 */
export const resolveUser = async (clerkUserId) => {
  if (!clerkUserId) return null;
  return prisma.user.findUnique({
    where: { clerk_user_id: clerkUserId },
    select: { user_id: true, skill_level: true, role: true },
  });
}

// ── Includes ──

const LEVEL_LIST_INCLUDE = {
  category: { select: { category_id: true, category_name: true } },
  creator: { select: { user_id: true, username: true, email: true } },
  required_level: { select: { level_id: true, level_name: true } },
};

const LEVEL_DETAIL_INCLUDE = {
  ...LEVEL_LIST_INCLUDE,
  category: {
    include: {
      category_items: { orderBy: { display_order: "asc" } },
    },
  },
  level_blocks: { include: { block: true } },
  level_victory_conditions: { include: { victory_condition: true } },
  patterns: { include: { weapon: true, pattern_type: true } },
  guides: { include: { guide_images: true }, orderBy: { display_order: "asc" } },
  hints: { include: { hint_images: true }, orderBy: { display_order: "asc" } },
  level_test_cases: { orderBy: { display_order: "asc" } },
};

const LEVEL_WITH_RELATIONS_INCLUDE = {
  ...LEVEL_LIST_INCLUDE,
  level_blocks: { include: { block: true } },
  level_victory_conditions: { include: { victory_condition: true } },
};

// ── Service Functions ──

export const getAllLevels = async ({ page, limit, search, skip }) => {
  let where = {};
  if (search.trim()) {
    const searchLower = search.toLowerCase();
    where = {
      OR: [
        { level_name: { contains: searchLower, mode: "insensitive" } },
        { description: { contains: searchLower, mode: "insensitive" } },
      ],
    };
  }

  const total = await prisma.level.count({ where });
  const levels = await prisma.level.findMany({
    where,
    include: LEVEL_LIST_INCLUDE,
    orderBy: { created_at: "desc" },
    skip,
    take: limit,
  });

  return { levels, pagination: buildPaginationResponse(page, limit, total) };
}

export const getLevelById = async (levelId, clerkUserId) => {
  const level = await prisma.level.findUnique({
    where: { level_id: levelId },
    include: LEVEL_DETAIL_INCLUDE,
  });

  if (!level) {
    const err = new Error("Level not found");
    err.status = 404;
    throw err;
  }

  const user = await resolveUser(clerkUserId);
  const isPublished = level.is_unlocked;
  const isAdmin = user && user.role === "admin";

  // Not published → only admin can see
  if (!isPublished && !isAdmin) {
    const err = new Error("This level is not published yet.");
    err.status = 403;
    throw err;
  }

  let isLocked = false;
  if (user) {
    if (!isAdmin) {
      const completedIds = await getCompletedLevelIds(user.user_id);
      const lockState = calculateLockState(level, user, completedIds);
      isLocked = lockState.is_locked;
    }
  } else {
    if (!isPublished) {
      const err = new Error("This level is not published yet.");
      err.status = 403;
      throw err;
    }
    if (level.required_skill_level) {
      isLocked = true;
    }
  }

  return { ...level, is_unlocked: isPublished, is_locked: isLocked };
}

export const createLevel = async (data, clerkUserId) => {
  if (!clerkUserId) {
    const err = new Error("User not authenticated");
    err.status = 401;
    throw err;
  }

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: clerkUserId },
  });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  // Validate required fields
  const missingFields = [];
  if (!data.category_id || data.category_id === "") missingFields.push("category_id");
  if (!data.level_name || data.level_name.trim() === "") missingFields.push("level_name");
  if (!data.background_image || data.background_image.trim() === "") missingFields.push("background_image");
  if (missingFields.length > 0) {
    const err = new Error(`Missing required fields: ${missingFields.join(", ")}`);
    err.status = 400;
    throw err;
  }

  // Validate category
  const category = await prisma.levelCategory.findUnique({
    where: { category_id: parseInt(data.category_id) },
  });
  if (!category) {
    const err = new Error("Category not found");
    err.status = 400;
    throw err;
  }

  // Validate prerequisite
  if (data.required_level_id) {
    const reqLevel = await prisma.level.findUnique({
      where: { level_id: parseInt(data.required_level_id) },
    });
    if (!reqLevel) {
      const err = new Error("Required level not found");
      err.status = 400;
      throw err;
    }
  }

  const level = await prisma.level.create({
    data: {
      category_id: parseInt(data.category_id),
      level_name: data.level_name,
      description: data.description || null,
      is_unlocked: data.is_unlocked === true || data.is_unlocked === "true",
      required_level_id: data.required_level_id ? parseInt(data.required_level_id) : null,
      required_skill_level: data.required_skill_level || "Zone_A",
      required_for_post_test: data.required_for_post_test === true || data.required_for_post_test === "true",
      textcode: data.textcode === true || data.textcode === "true",
      background_image: data.background_image,
      start_node_id: data.start_node_id != null ? parseInt(data.start_node_id) : null,
      goal_node_id: data.goal_node_id != null ? parseInt(data.goal_node_id) : null,
      character: data.character || null,
      coordinates: parseJsonField(data.coordinates),
      nodes: parseJsonField(data.nodes),
      edges: parseJsonField(data.edges),
      map_entities: parseJsonField(data.map_entities),
      algo_data: parseJsonField(data.algo_data),
      starter_xml: data.starter_xml || null,
      created_by: user.user_id,
      level_blocks:
        data.block_ids && data.block_ids.length > 0
          ? { create: data.block_ids.map((id) => ({ block_id: parseInt(id) })) }
          : undefined,
      level_victory_conditions:
        data.victory_condition_ids && data.victory_condition_ids.length > 0
          ? { create: data.victory_condition_ids.map((id) => ({ victory_condition_id: parseInt(id) })) }
          : undefined,
    },
    include: LEVEL_WITH_RELATIONS_INCLUDE,
  });

  return level;
}

export const updateLevel = async (levelId, data) => {
  const existingLevel = await prisma.level.findUnique({
    where: { level_id: levelId },
  });
  if (!existingLevel) {
    const err = new Error("Level not found");
    err.status = 404;
    throw err;
  }

  // Validate category if provided
  if (data.category_id !== undefined) {
    const category = await prisma.levelCategory.findUnique({
      where: { category_id: parseInt(data.category_id) },
    });
    if (!category) {
      const err = new Error("Category not found");
      err.status = 400;
      throw err;
    }
  }

  // Validate prerequisite if provided
  if (data.required_level_id !== undefined && data.required_level_id !== null && data.required_level_id !== "") {
    const reqLevel = await prisma.level.findUnique({
      where: { level_id: parseInt(data.required_level_id) },
    });
    if (!reqLevel) {
      const err = new Error("Required level not found");
      err.status = 400;
      throw err;
    }
  }

  const updateData = {};
  if (data.category_id !== undefined) updateData.category_id = parseInt(data.category_id);
  if (data.level_name !== undefined) updateData.level_name = data.level_name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.is_unlocked !== undefined) updateData.is_unlocked = data.is_unlocked === true || data.is_unlocked === "true";
  if (data.required_level_id !== undefined) {
    updateData.required_level_id =
      data.required_level_id === null || data.required_level_id === ""
        ? null
        : parseInt(data.required_level_id);
  }
  if (data.required_skill_level !== undefined) updateData.required_skill_level = data.required_skill_level || null;
  if (data.required_for_post_test !== undefined) updateData.required_for_post_test = data.required_for_post_test === true || data.required_for_post_test === "true";
  if (data.textcode !== undefined) updateData.textcode = data.textcode === true || data.textcode === "true";
  if (data.background_image !== undefined) updateData.background_image = data.background_image;
  if (data.start_node_id !== undefined) updateData.start_node_id = data.start_node_id !== null ? parseInt(data.start_node_id) : null;
  if (data.goal_node_id !== undefined) updateData.goal_node_id = data.goal_node_id !== null ? parseInt(data.goal_node_id) : null;
  if (data.character !== undefined) updateData.character = data.character;
  if (data.coordinates !== undefined) updateData.coordinates = parseJsonField(data.coordinates);
  if (data.nodes !== undefined) updateData.nodes = parseJsonField(data.nodes);
  if (data.edges !== undefined) updateData.edges = parseJsonField(data.edges);
  if (data.map_entities !== undefined) updateData.map_entities = parseJsonField(data.map_entities);
  if (data.algo_data !== undefined) updateData.algo_data = parseJsonField(data.algo_data);
  if (data.starter_xml !== undefined) updateData.starter_xml = data.starter_xml || null;

  const level = await prisma.$transaction(async (tx) => {
    await tx.level.update({ where: { level_id: levelId }, data: updateData });

    if (data.block_ids !== undefined) {
      await tx.levelBlock.deleteMany({ where: { level_id: levelId } });
      if (data.block_ids && data.block_ids.length > 0) {
        await tx.levelBlock.createMany({
          data: data.block_ids.map((blockId) => ({
            level_id: levelId,
            block_id: parseInt(blockId),
          })),
        });
      }
    }

    if (data.victory_condition_ids !== undefined) {
      await tx.levelVictoryCondition.deleteMany({ where: { level_id: levelId } });
      if (data.victory_condition_ids && data.victory_condition_ids.length > 0) {
        await tx.levelVictoryCondition.createMany({
          data: data.victory_condition_ids.map((vcId) => ({
            level_id: levelId,
            victory_condition_id: parseInt(vcId),
          })),
        });
      }
    }

    return tx.level.findUnique({
      where: { level_id: levelId },
      include: LEVEL_WITH_RELATIONS_INCLUDE,
    });
  });

  return level;
}

export const deleteLevel = async (levelId) => {
  const level = await prisma.level.findUnique({ where: { level_id: levelId } });
  if (!level) {
    const err = new Error("Level not found");
    err.status = 404;
    throw err;
  }
  await prisma.level.delete({ where: { level_id: levelId } });
}

export const unlockLevel = async (levelId) => {
  const level = await prisma.level.findUnique({ where: { level_id: levelId } });
  if (!level) {
    const err = new Error("Level not found");
    err.status = 404;
    throw err;
  }
  await prisma.level.update({
    where: { level_id: levelId },
    data: { is_unlocked: true },
  });
}

export const updateLevelCoordinates = async (levelId, coordinates) => {
  const level = await prisma.level.findUnique({ where: { level_id: levelId } });
  if (!level) {
    const err = new Error("Level not found");
    err.status = 404;
    throw err;
  }
  const updated = await prisma.level.update({
    where: { level_id: levelId },
    data: { coordinates },
  });
  return updated;
}

export const getAllCategories = async () => {
  const categories = await prisma.levelCategory.findMany({
    orderBy: { category_name: "asc" },
    include: {
      category_items: { select: { item_type: true }, orderBy: { display_order: "asc" } },
    },
  });

  return categories.map((category) => ({
    ...category,
    item: category.category_items?.map((ci) => ci.item_type) || null,
  }));
}

export const getLevelsForDropdown = async () => {
  return prisma.level.findMany({
    select: {
      level_id: true,
      level_name: true,
      category: { select: { category_name: true } },
    },
    orderBy: { level_name: "asc" },
  });
}


