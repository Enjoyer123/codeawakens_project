import prisma from "../models/prisma.js";

export const getDashboardStats = async () => {
  const totalUsers = await prisma.user.count({ where: { role: "user" } });
  const totalLevels = await prisma.level.count();
  return { totalUsers, totalLevels };
}

export const getLevelStats = async () => {
  const levels = await prisma.level.groupBy({ by: ["category_id"], _count: { level_id: true }, orderBy: { _count: { level_id: "desc" } } });
  return Promise.all(levels.map(async (item) => {
    const category = await prisma.levelCategory.findUnique({ where: { category_id: item.category_id }, select: { category_name: true } });
    return { name: category ? category.category_name : "Unknown", value: item._count.level_id };
  }));
}

export const getUserStats = async () => {
  const skillDistribution = await prisma.user.groupBy({ by: ["skill_level"], _count: { user_id: true }, where: { role: "user", skill_level: { not: null } } });
  return { skillDistribution: skillDistribution.map((item) => ({ name: item.skill_level || "Unranked", value: item._count.user_id })) };
}

export const getTestStats = async () => {
  const avgScores = await prisma.user.aggregate({ _avg: { pre_score: true, post_score: true }, where: { role: "user", pre_score: { not: null } } });
  return [{ name: "Average Scores", pre_test: Math.round(avgScores._avg.pre_score || 0), post_test: Math.round(avgScores._avg.post_score || 0) }];
}


