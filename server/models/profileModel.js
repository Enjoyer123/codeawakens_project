import prisma from "./prisma.js";

// ====== FINDERS ======
export const findUserByClerkId = async (clerkUserId) => prisma.user.findUnique({ where: { clerk_user_id: clerkUserId } });
export const findUserByClerkIdDetailed = async (clerkUserId) => prisma.user.findUnique({
  where: { clerk_user_id: clerkUserId },
  select: {
    user_id: true, clerk_user_id: true, username: true, email: true,
    first_name: true, last_name: true, profile_image: true, role: true,
    is_active: true, created_at: true, updated_at: true,
    pre_score: true, post_score: true, skill_level: true,
  }
});
export const findUserByClerkIdMinimal = async (clerkUserId) => prisma.user.findUnique({
  where: { clerk_user_id: clerkUserId }, select: { user_id: true }
});
export const findUserByClerkIdProfileImage = async (clerkUserId) => prisma.user.findUnique({
  where: { clerk_user_id: clerkUserId }, select: { profile_image: true }
});

export const findUserProgressByUserId = async (userId) => prisma.userProgress.findMany({
  where: { user_id: userId }, orderBy: { completed_at: "desc" }
});
export const findUserRewardsByUserId = async (userId) => prisma.userReward.findMany({
  where: { user_id: userId }, include: { reward: true }, orderBy: { earned_at: "desc" }
});
export const findUserProgressForLevel = async (userId, levelId) => prisma.userProgress.findUnique({
  where: { user_id_level_id: { user_id: userId, level_id: levelId } }
});
export const findRewardsForLevel = async (levelId) => prisma.reward.findMany({
  where: { level_id: levelId }
});
export const findUserRewardsForLevel = async (userId, levelId) => prisma.userReward.findMany({
  where: { user_id: userId, level_id: levelId }, select: { reward_id: true }
});

// ====== CRUD ======
export const createUser = async (data) => prisma.user.create({ data });
export const updateUserByClerkId = async (clerkUserId, data) => prisma.user.update({ where: { clerk_user_id: clerkUserId }, data });

export const createUserProgress = async (data) => prisma.userProgress.create({ data });
export const updateUserProgress = async (progressId, data) => prisma.userProgress.update({ where: { progress_id: progressId }, data });

export const createUserReward = async (userId, rewardId, levelId) => prisma.userReward.create({
  data: { user_id: userId, reward_id: rewardId, level_id: levelId, earned_at: new Date() },
  include: { reward: true }
});
