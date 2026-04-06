import prisma from "./prisma.js";

// Retrieve multiple categories (used in getAllLevelCategories)
export const findManyCategories = async (where) => {
  return await prisma.levelCategory.findMany({
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
};

// Retrieve a single category with nested levels (used in getLevelCategoryById)
export const findCategoryByIdWithLevels = async (categoryId) => {
  return await prisma.levelCategory.findUnique({
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
};

// Simple fetch by Id
export const findCategoryById = async (categoryId) => {
  return await prisma.levelCategory.findUnique({
    where: { category_id: categoryId },
  });
};

// Fetch category by Id to check relationships before deletion
export const findCategoryForDeletion = async (categoryId) => {
	return await prisma.levelCategory.findUnique({
    where: { category_id: categoryId },
    include: { levels: true },
  });
};

// Create a new category
export const createCategory = async (data) => {
  return await prisma.levelCategory.create({
    data,
    include: { category_items: true },
  });
};

// Delete all items linked to a category (used during full update)
export const deleteCategoryItems = async (categoryId) => {
  return await prisma.levelCategoryItem.deleteMany({
    where: { category_id: categoryId },
  });
};

// Update an existing category
export const updateCategory = async (categoryId, data) => {
  return await prisma.levelCategory.update({
    where: { category_id: categoryId },
    data,
    include: data.category_items ? { category_items: true } : undefined,
  });
};

// Standard partial update without nested inclusions
export const updateCategoryPartial = async (categoryId, data) => {
  return await prisma.levelCategory.update({
    where: { category_id: categoryId },
    data,
  });
}

// Delete the category itself
export const deleteCategory = async (categoryId) => {
  return await prisma.levelCategory.delete({
    where: { category_id: categoryId },
  });
};
