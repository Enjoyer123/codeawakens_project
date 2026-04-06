import prisma from "./prisma.js";

export const countAdminUsers = async (where) => prisma.user.count({ where });
export const findManyAdminUsers = async (where, skip, limit) => prisma.user.findMany({ where, select: { user_id: true, clerk_user_id: true, username: true, email: true, first_name: true, last_name: true, profile_image: true, role: true, is_active: true, created_at: true }, orderBy: { created_at: "desc" }, skip, take: limit });
export const findUserById = async (userId) => prisma.user.findUnique({ where: { user_id: userId } });
export const updateUserRole = async (userId, role) => prisma.user.update({ where: { user_id: userId }, data: { role }, select: { user_id: true, clerk_user_id: true, username: true, email: true, first_name: true, last_name: true, profile_image: true, role: true, is_active: true } });
export const findUserDetails = async (userId) => prisma.user.findUnique({ where: { user_id: userId }, select: { user_id: true, clerk_user_id: true, username: true, email: true, first_name: true, last_name: true, profile_image: true, role: true, is_active: true, created_at: true, updated_at: true, pre_score: true, post_score: true, skill_level: true } });
export const findUserProgressExt = async (userId) => prisma.userProgress.findMany({ where: { user_id: userId }, orderBy: { completed_at: "desc" } });
export const findUserRewardsExt = async (userId) => prisma.userReward.findMany({ where: { user_id: userId }, include: { reward: true }, orderBy: { earned_at: "desc" } });
export const deleteUserById = async (userId) => prisma.user.delete({ where: { user_id: userId } });
export const executeResetScoreTransaction = async (userId, updateData, targetTestType) => {
  return await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { user_id: userId }, data: updateData });
    await tx.userTest.deleteMany({ where: { user_id: userId, test: { test_type: targetTestType } } });
  });
};
export const findUserTestHistory = async (userId) => prisma.userTest.findMany({ where: { user_id: userId }, include: { test: { include: { choices: true } }, choice: true }, orderBy: { answered_at: "desc" } });
