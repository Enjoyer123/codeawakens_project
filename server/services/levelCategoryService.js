import * as categoryRepo from "../models/levelCategoryModel.js";
import { safeDeleteFile, moveFile } from "../utils/fileHelper.js";
import { calculateLockState, getCompletedLevelIds, resolveUser } from "./levelService.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// ── Service Functions ──

export const getAllLevelCategories = async (search, clerkUserId) => {
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

  const levelCategories = await categoryRepo.findManyCategories(where);

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

export const getLevelCategoryById = async (categoryId, clerkUserId) => {
  const levelCategory = await categoryRepo.findCategoryByIdWithLevels(categoryId);

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

export const createLevelCategory = async (data) => {
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

  const levelCategory = await categoryRepo.createCategory({
      
      category_name: data.category_name.trim(),
      description: data.description.trim(),
      item_enable: data.item_enable === true || data.item_enable === "true",
      block_key: data.block_key && data.block_key !== "null" && data.block_key !== "" ? data.block_key : null,
      background_image: data.background_image || null,
      coordinates: data.coordinates ? JSON.parse(JSON.stringify(data.coordinates)) : null,
      category_items: categoryItemsData.length > 0 ? { create: categoryItemsData } : undefined,
    
    });

  return levelCategory;
}

export const updateLevelCategory = async (categoryId, data) => {
  if (!data.category_name || !data.description) {
    const err = new Error("Missing required fields: category_name, description");
    err.status = 400;
    throw err;
  }

  const existing = await categoryRepo.findCategoryById(categoryId);
  if (!existing) {
    const err = new Error("Level category not found");
    err.status = 404;
    throw err;
  }

  // Delete existing items first
  await categoryRepo.deleteCategoryItems(categoryId);

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

  const levelCategory = await categoryRepo.updateCategory(categoryId, {
      
      category_name: data.category_name.trim(),
      description: data.description.trim(),
      item_enable: data.item_enable === true || data.item_enable === "true",
      block_key: data.block_key && data.block_key !== "null" && data.block_key !== "" ? data.block_key : null,
      background_image: data.background_image !== undefined ? data.background_image : undefined,
      coordinates: data.coordinates !== undefined ? JSON.parse(JSON.stringify(data.coordinates)) : undefined,
      category_items: categoryItemsData.length > 0 ? { create: categoryItemsData } : undefined,
    
    });

  return levelCategory;
}

export const deleteLevelCategory = async (categoryId) => {
  const levelCategory = await categoryRepo.findCategoryForDeletion(categoryId);

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

  await categoryRepo.deleteCategory(categoryId);
}

export const uploadCategoryBackground = async (categoryId, file) => {
  const levelCategory = await categoryRepo.findCategoryById(categoryId);

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

  const updated = await categoryRepo.updateCategoryPartial(categoryId, { background_image: pathFile });

  return updated;
}

export const deleteCategoryBackground = async (categoryId) => {
  const levelCategory = await categoryRepo.findCategoryById(categoryId);
  if (!levelCategory) {
    const err = new Error("Level category not found");
    err.status = 404;
    throw err;
  }

  if (levelCategory.background_image) {
    safeDeleteFile(levelCategory.background_image);
  }

  const updated = await categoryRepo.updateCategoryPartial(categoryId, { background_image: null });
  return updated;
}

export const updateLevelCategoryCoordinates = async (categoryId, coordinates) => {
  const levelCategory = await categoryRepo.findCategoryById(categoryId);
  if (!levelCategory) {
    const err = new Error("Level category not found");
    err.status = 404;
    throw err;
  }

  const updated = await categoryRepo.updateCategoryPartial(categoryId, { coordinates });
  return updated;
}


