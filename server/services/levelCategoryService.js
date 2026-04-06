const prisma = require("../models/prisma");
const { safeDeleteFile, moveFile } = require("../utils/fileHelper");
const { calculateLockState, getCompletedLevelIds, resolveUser } = require("./levelService");
const path = require("path");
const fs = require("fs");

// ── Service Functions ──

async function getAllLevelCategories(search, clerkUserId) {
  let where = {};
  if (search && search.trim()) {
    const searchLower = search.toLowerCase();
    where = {
      OR: [
        { category_name: { contains: searchLower, mode: "insensitive" } },
        { description: { contains: searchLower, mode: "insensitive" } },
      ],
    };
  }

  const levelCategories = await prisma.levelCategory.findMany({
    where,
    include: {
      levels: {
        select: {
          level_id: true, level_name: true, is_unlocked: true,
          required_level_id: true, required_skill_level: true,
          required_for_post_test: true, coordinates: true,
        },
      },
      category_items: { orderBy: { display_order: "asc" } },
    },
  });

  const user = await resolveUser(clerkUserId);
  let completedLevelIds = new Set();
  const isAdmin = user && user.role === "admin";

  if (user) {
    completedLevelIds = await getCompletedLevelIds(user.user_id);
  }

  const categoriesWithCount = levelCategories.map((category) => {
    const processedLevels = category.levels
      ? category.levels
          .filter((level) => level.is_unlocked || isAdmin)
          .map((level) => ({
            ...level,
            ...calculateLockState(level, user, completedLevelIds),
          }))
      : [];

    return {
      ...category,
      levels: processedLevels,
      level_count: processedLevels.filter((l) => l.is_unlocked === true).length,
    };
  });

  return { levelCategories: categoriesWithCount };
}

async function getLevelCategoryById(categoryId, clerkUserId) {
  const levelCategory = await prisma.levelCategory.findUnique({
    where: { category_id: categoryId },
    include: {
      levels: {
        select: {
          level_id: true, level_name: true, description: true,
          goal_node_id: true, category_id: true, start_node_id: true,
          is_unlocked: true, required_level_id: true,
          required_skill_level: true, required_for_post_test: true,
          coordinates: true,
        },
        orderBy: { level_id: "asc" },
      },
      category_items: { orderBy: { display_order: "asc" } },
    },
  });

  if (!levelCategory) {
    const err = new Error("Level category not found");
    err.status = 404;
    throw err;
  }

  const user = await resolveUser(clerkUserId);
  let completedLevelIds = new Set();
  const isAdmin = user && user.role === "admin";

  if (user) {
    completedLevelIds = await getCompletedLevelIds(user.user_id);
  }

  const processedLevels = levelCategory.levels
    ? levelCategory.levels
        .filter((level) => level.is_unlocked || isAdmin)
        .map((level) => ({
          ...level,
          ...calculateLockState(level, user, completedLevelIds),
        }))
    : [];

  return { levelCategory: { ...levelCategory, levels: processedLevels } };
}

async function createLevelCategory(data) {
  if (!data.category_name || !data.description) {
    const err = new Error("Missing required fields: category_name, description");
    err.status = 400;
    throw err;
  }

  const categoryItemsData = [];
  if (data.item_enable === true || data.item_enable === "true") {
    if (Array.isArray(data.item) && data.item.length > 0) {
      categoryItemsData.push(
        ...data.item.map((itemType, index) => ({
          item_type: itemType,
          display_order: index,
        }))
      );
    }
  }

  const levelCategory = await prisma.levelCategory.create({
    data: {
      category_name: data.category_name.trim(),
      description: data.description.trim(),
      item_enable: data.item_enable === true || data.item_enable === "true",
      block_key: data.block_key && data.block_key !== "null" && data.block_key !== "" ? data.block_key : null,
      background_image: data.background_image || null,
      coordinates: data.coordinates ? JSON.parse(JSON.stringify(data.coordinates)) : null,
      category_items: categoryItemsData.length > 0 ? { create: categoryItemsData } : undefined,
    },
    include: { category_items: true },
  });

  return levelCategory;
}

async function updateLevelCategory(categoryId, data) {
  if (!data.category_name || !data.description) {
    const err = new Error("Missing required fields: category_name, description");
    err.status = 400;
    throw err;
  }

  const existing = await prisma.levelCategory.findUnique({
    where: { category_id: categoryId },
  });
  if (!existing) {
    const err = new Error("Level category not found");
    err.status = 404;
    throw err;
  }

  // Delete existing items first
  await prisma.levelCategoryItem.deleteMany({ where: { category_id: categoryId } });

  const categoryItemsData = [];
  if (data.item_enable === true || data.item_enable === "true") {
    if (Array.isArray(data.item) && data.item.length > 0) {
      categoryItemsData.push(
        ...data.item.map((itemType, index) => ({
          item_type: itemType,
          display_order: index,
        }))
      );
    }
  }

  const levelCategory = await prisma.levelCategory.update({
    where: { category_id: categoryId },
    data: {
      category_name: data.category_name.trim(),
      description: data.description.trim(),
      item_enable: data.item_enable === true || data.item_enable === "true",
      block_key: data.block_key && data.block_key !== "null" && data.block_key !== "" ? data.block_key : null,
      background_image: data.background_image !== undefined ? data.background_image : undefined,
      coordinates: data.coordinates !== undefined ? JSON.parse(JSON.stringify(data.coordinates)) : undefined,
      category_items: categoryItemsData.length > 0 ? { create: categoryItemsData } : undefined,
    },
    include: { category_items: true },
  });

  return levelCategory;
}

async function deleteLevelCategory(categoryId) {
  const levelCategory = await prisma.levelCategory.findUnique({
    where: { category_id: categoryId },
    include: { levels: true },
  });

  if (!levelCategory) {
    const err = new Error("Level category not found");
    err.status = 404;
    throw err;
  }

  if (levelCategory.levels && levelCategory.levels.length > 0) {
    const err = new Error(
      `Cannot delete level category: This category is being used in ${levelCategory.levels.length} level(s). Please remove or reassign all levels from this category before deleting.`
    );
    err.status = 400;
    throw err;
  }

  if (levelCategory.background_image) {
    safeDeleteFile(levelCategory.background_image);
  }

  await prisma.levelCategory.delete({ where: { category_id: categoryId } });
}

async function uploadCategoryBackground(categoryId, file) {
  const levelCategory = await prisma.levelCategory.findUnique({
    where: { category_id: categoryId },
  });

  if (!levelCategory) {
    const err = new Error("Level category not found");
    err.status = 404;
    throw err;
  }

  const ext = path.extname(file.originalname);
  const timestamp = Date.now();
  const correctFilename = `category-bg-${categoryId}-${timestamp}${ext}`;
  const categoriesDir = path.join(__dirname, "..", "uploads", "categories");
  const correctPath = path.join(categoriesDir, correctFilename);

  moveFile(file.path, correctPath);

  const pathFile = `/uploads/categories/${correctFilename}`;

  // Delete old file
  if (levelCategory.background_image) {
    safeDeleteFile(levelCategory.background_image);
  }

  const updated = await prisma.levelCategory.update({
    where: { category_id: categoryId },
    data: { background_image: pathFile },
  });

  return updated;
}

async function deleteCategoryBackground(categoryId) {
  const levelCategory = await prisma.levelCategory.findUnique({
    where: { category_id: categoryId },
  });
  if (!levelCategory) {
    const err = new Error("Level category not found");
    err.status = 404;
    throw err;
  }

  if (levelCategory.background_image) {
    safeDeleteFile(levelCategory.background_image);
  }

  const updated = await prisma.levelCategory.update({
    where: { category_id: categoryId },
    data: { background_image: null },
  });
  return updated;
}

async function updateLevelCategoryCoordinates(categoryId, coordinates) {
  const levelCategory = await prisma.levelCategory.findUnique({
    where: { category_id: categoryId },
  });
  if (!levelCategory) {
    const err = new Error("Level category not found");
    err.status = 404;
    throw err;
  }

  const updated = await prisma.levelCategory.update({
    where: { category_id: categoryId },
    data: { coordinates },
  });
  return updated;
}

module.exports = {
  getAllLevelCategories,
  getLevelCategoryById,
  createLevelCategory,
  updateLevelCategory,
  deleteLevelCategory,
  uploadCategoryBackground,
  deleteCategoryBackground,
  updateLevelCategoryCoordinates,
};
