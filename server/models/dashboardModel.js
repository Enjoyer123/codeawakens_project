import prisma from "./prisma.js";

export const countActiveUsers = async () => prisma.user.count({ where: { role: "user" } });
export const countTotalLevels = async () => prisma.level.count();

export const getLevelCountByCategory = async () => prisma.level.groupBy({ by: ["category_id"], _count: { level_id: true }, orderBy: { _count: { level_id: "desc" } } });
export const getCategoryNameById = async (categoryId) => prisma.levelCategory.findUnique({ where: { category_id: categoryId }, select: { category_name: true } });

export const getSkillDistribution = async () => prisma.user.groupBy({ by: ["skill_level"], _count: { user_id: true }, where: { role: "user", skill_level: { not: null } } });
export const getAverageTestScores = async () => prisma.user.aggregate({ _avg: { pre_score: true, post_score: true }, where: { role: "user", pre_score: { not: null } } });
