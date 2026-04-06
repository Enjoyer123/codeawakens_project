import prisma from "./prisma.js";

// ====== FINDERS ======
export const findUserByClerkId = async (clerkUserId) => prisma.user.findUnique({ where: { clerk_user_id: clerkUserId }, select: { user_id: true, skill_level: true, role: true } });
export const findUserByClerkIdMinimal = async (clerkUserId) => prisma.user.findUnique({ where: { clerk_user_id: clerkUserId } });

export const findCompletedLevelIds = async (userId) => {
  const progress = await prisma.userProgress.findMany({
    where: { user_id: userId, OR: [{ status: "completed" }, { is_correct: true }] },
    select: { level_id: true },
  });
  return new Set(progress.map((p) => p.level_id));
};

export const countLevels = async (where) => prisma.level.count({ where });
export const findManyLevels = async (where, include, skip, limit) => prisma.level.findMany({ where, include, orderBy: { created_at: "desc" }, skip, take: limit });

export const findLevelById = async (levelId, include = undefined) => prisma.level.findUnique({ where: { level_id: levelId }, include });
export const findLevelCategoryById = async (categoryId) => prisma.levelCategory.findUnique({ where: { category_id: categoryId } });
export const findAllCategories = async () => prisma.levelCategory.findMany({
  orderBy: { category_name: "asc" }, include: { category_items: { select: { item_type: true }, orderBy: { display_order: "asc" } } }
});
export const findLevelsForDropdown = async () => prisma.level.findMany({
  select: { level_id: true, level_name: true, category: { select: { category_name: true } } }, orderBy: { level_name: "asc" }
});

// ====== CRUD TRANSACTIONS ======
export const createLevel = async (data, includeArgs) => prisma.level.create({ data, include: includeArgs });
export const deleteLevel = async (levelId) => prisma.level.delete({ where: { level_id: levelId } });
export const updateLevelSimple = async (levelId, data) => prisma.level.update({ where: { level_id: levelId }, data });

export const updateLevelTransaction = async (levelId, updateData, blockIds, victoryConditionIds, includeArgs) => {
  return prisma.$transaction(async (tx) => {
    await tx.level.update({ where: { level_id: levelId }, data: updateData });

    if (blockIds !== undefined) {
      await tx.levelBlock.deleteMany({ where: { level_id: levelId } });
      if (blockIds && blockIds.length > 0) {
        await tx.levelBlock.createMany({
          data: blockIds.map((blockId) => ({ level_id: levelId, block_id: parseInt(blockId) }))
        });
      }
    }

    if (victoryConditionIds !== undefined) {
      await tx.levelVictoryCondition.deleteMany({ where: { level_id: levelId } });
      if (victoryConditionIds && victoryConditionIds.length > 0) {
        await tx.levelVictoryCondition.createMany({
          data: victoryConditionIds.map((vcId) => ({ level_id: levelId, victory_condition_id: parseInt(vcId) }))
        });
      }
    }

    return tx.level.findUnique({ where: { level_id: levelId }, include: includeArgs });
  });
};
