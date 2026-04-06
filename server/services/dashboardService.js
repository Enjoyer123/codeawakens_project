import * as dashboardRepo from "../models/dashboardModel.js";

export const getDashboardStats = async () => {
  const totalUsers = await dashboardRepo.countActiveUsers();
  const totalLevels = await dashboardRepo.countTotalLevels();
  return { totalUsers, totalLevels };
}

export const getLevelStats = async () => {
  const levels = await dashboardRepo.getLevelCountByCategory();
  return Promise.all(levels.map(async (item) => {
    const category = await dashboardRepo.getCategoryNameById(item.category_id);
    return { name: category ? category.category_name : "Unknown", value: item._count.level_id };
  }));
}

export const getUserStats = async () => {
  const skillDistribution = await dashboardRepo.getSkillDistribution();
  return { skillDistribution: skillDistribution.map((item) => ({ name: item.skill_level || "Unranked", value: item._count.user_id })) };
}

export const getTestStats = async () => {
  const avgScores = await dashboardRepo.getAverageTestScores();
  return [{ name: "Average Scores", pre_test: Math.round(avgScores._avg.pre_score || 0), post_test: Math.round(avgScores._avg.post_score || 0) }];
}


