import * as levelRepo from "../models/levelModel.js";
import { buildPaginationResponse } from "../utils/pagination.js";

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
 * Resolve user from clerkUserId (returns null if not found or not logged in)
 */
export const resolveUser = async (clerkUserId) => {
  if (!clerkUserId) return null;
  return levelRepo.findUserByClerkId(clerkUserId);
}

export const getCompletedLevelIds = async (userId) => levelRepo.findCompletedLevelIds(userId);

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

  const total = await levelRepo.countLevels(where);
  const levels = await levelRepo.findManyLevels(where, LEVEL_LIST_INCLUDE, skip, limit);

  return { levels, pagination: buildPaginationResponse(page, limit, total) };
}

export const getLevelById = async (levelId, adminFlag, clerkUserId) => {
  const level = await levelRepo.findLevelById(levelId, LEVEL_DETAIL_INCLUDE);

  if (!level) {
    const err = new Error("Level not found"); err.status = 404; throw err;
  }

  const user = await resolveUser(clerkUserId);
  const isPublished = level.is_unlocked;
  const isAdmin = user && user.role === "admin";

  // Not published → only admin can see
  if (!isPublished && !isAdmin) {
    const err = new Error("This level is not published yet."); err.status = 403; throw err;
  }

  let isLocked = false;
  if (user) {
    if (!isAdmin) {
      const completedIds = await levelRepo.findCompletedLevelIds(user.user_id);
      const lockState = calculateLockState(level, user, completedIds);
      isLocked = lockState.is_locked;
    }
  } else {
    if (!isPublished) {
      const err = new Error("This level is not published yet."); err.status = 403; throw err;
    }
    if (level.required_skill_level) {
      isLocked = true;
    }
  }

  return { ...level, is_unlocked: isPublished, is_locked: isLocked };
}

export const createLevel = async (data, clerkUserId) => {
  if (!clerkUserId) {
    const err = new Error("User not authenticated"); err.status = 401; throw err;
  }

  const user = await levelRepo.findUserByClerkIdMinimal(clerkUserId);
  if (!user) {
    const err = new Error("User not found"); err.status = 404; throw err;
  }

  // Validate required fields
  const missingFields = [];
  if (!data.category_id || data.category_id === "") missingFields.push("category_id");
  if (!data.level_name || data.level_name.trim() === "") missingFields.push("level_name");
  if (!data.background_image || data.background_image.trim() === "") missingFields.push("background_image");
  if (missingFields.length > 0) {
    const err = new Error(`Missing required fields: ${missingFields.join(", ")}`); err.status = 400; throw err;
  }

  // Validate category
  const category = await levelRepo.findLevelCategoryById(parseInt(data.category_id));
  if (!category) {
    const err = new Error("Category not found"); err.status = 400; throw err;
  }

  // Validate prerequisite
  if (data.required_level_id) {
    const reqLevel = await levelRepo.findLevelById(parseInt(data.required_level_id));
    if (!reqLevel) {
      const err = new Error("Required level not found"); err.status = 400; throw err;
    }
  }

  const createData = {
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
  };

  return levelRepo.createLevel(createData, LEVEL_WITH_RELATIONS_INCLUDE);
}

export const updateLevel = async (levelId, data) => {
  const existingLevel = await levelRepo.findLevelById(levelId);
  if (!existingLevel) {
    const err = new Error("Level not found"); err.status = 404; throw err;
  }

  if (data.category_id !== undefined) {
    const category = await levelRepo.findLevelCategoryById(parseInt(data.category_id));
    if (!category) { const err = new Error("Category not found"); err.status = 400; throw err; }
  }

  if (data.required_level_id !== undefined && data.required_level_id !== null && data.required_level_id !== "") {
    const reqLevel = await levelRepo.findLevelById(parseInt(data.required_level_id));
    if (!reqLevel) { const err = new Error("Required level not found"); err.status = 400; throw err; }
  }

  const updateData = {};
  if (data.category_id !== undefined) updateData.category_id = parseInt(data.category_id);
  if (data.level_name !== undefined) updateData.level_name = data.level_name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.is_unlocked !== undefined) updateData.is_unlocked = data.is_unlocked === true || data.is_unlocked === "true";
  if (data.required_level_id !== undefined) {
    updateData.required_level_id = data.required_level_id === null || data.required_level_id === "" ? null : parseInt(data.required_level_id);
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

  return levelRepo.updateLevelTransaction(levelId, updateData, data.block_ids, data.victory_condition_ids, LEVEL_WITH_RELATIONS_INCLUDE);
}

export const deleteLevel = async (levelId) => {
  const level = await levelRepo.findLevelById(levelId);
  if (!level) { const err = new Error("Level not found"); err.status = 404; throw err; }
  await levelRepo.deleteLevel(levelId);
}

export const unlockLevel = async (levelId) => {
  const level = await levelRepo.findLevelById(levelId);
  if (!level) { const err = new Error("Level not found"); err.status = 404; throw err; }
  await levelRepo.updateLevelSimple(levelId, { is_unlocked: true });
}

export const updateLevelCoordinates = async (levelId, coordinates) => {
  const level = await levelRepo.findLevelById(levelId);
  if (!level) { const err = new Error("Level not found"); err.status = 404; throw err; }
  return levelRepo.updateLevelSimple(levelId, { coordinates });
}

export const getAllCategories = async () => {
  const categories = await levelRepo.findAllCategories();
  return categories.map((category) => ({
    ...category, item: category.category_items?.map((ci) => ci.item_type) || null,
  }));
}

export const getLevelsForDropdown = async () => levelRepo.findLevelsForDropdown();

export const uploadLevelBackgroundImage = async (levelId, file) => {
  const level = await levelRepo.findLevelById(levelId);
  if (!level) {
    const err = new Error("Level not found"); err.status = 404; throw err;
  }

  const fileUrl = `/uploads/levels/${file.filename}`;
  return levelRepo.updateLevelSimple(levelId, { background_image: fileUrl });
};

export const deleteLevelBackgroundImage = async (levelId) => {
  const level = await levelRepo.findLevelById(levelId);
  if (!level) {
    const err = new Error("Level not found"); err.status = 404; throw err;
  }
  
  return levelRepo.updateLevelSimple(levelId, { background_image: "" });
};
