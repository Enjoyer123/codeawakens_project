import * as adminUserRepo from "../models/adminUserModel.js";
import { buildPaginationResponse } from "../utils/pagination.js";

export const getAllUsers = async ({ page, limit, search, skip }) => {
  let where = {};
  if (search.trim()) {
    const s = search.toLowerCase();
    where = { OR: [{ username: { contains: s, mode: "insensitive" } }, { email: { contains: s, mode: "insensitive" } }, { first_name: { contains: s, mode: "insensitive" } }, { last_name: { contains: s, mode: "insensitive" } }] };
  }
  const total = await adminUserRepo.countAdminUsers(where);
  const users = await adminUserRepo.findManyAdminUsers(where, skip, limit);
  return { users, pagination: buildPaginationResponse(page, limit, total) };
}

export const updateUserRole = async (userId, role, adminClerkId) => {
  if (!role || !["user", "admin"].includes(role)) { const err = new Error("Invalid role. Must be 'user' or 'admin'"); err.status = 400; throw err; }
  const targetUser = await adminUserRepo.findUserById(userId);
  if (!targetUser) { const err = new Error("User not found"); err.status = 404; throw err; }
  if (targetUser.clerk_user_id === adminClerkId && role === "user") { const err = new Error("Cannot remove your own admin role"); err.status = 400; throw err; }

  return adminUserRepo.updateUserRole(userId, role);
}

export const getUserDetails = async (userId) => {
  const user = await adminUserRepo.findUserDetails(userId);
  if (!user) { const err = new Error("User not found"); err.status = 404; throw err; }

  const userProgress = await adminUserRepo.findUserProgressExt(userId);
  const userRewards = await adminUserRepo.findUserRewardsExt(userId);

  return { user, user_progress: userProgress, user_reward: userRewards };
}

export const deleteUser = async (userId, adminClerkId) => {
  const targetUser = await adminUserRepo.findUserById(userId);
  if (!targetUser) { const err = new Error("User not found"); err.status = 404; throw err; }
  if (targetUser.clerk_user_id === adminClerkId) { const err = new Error("Cannot delete your own account"); err.status = 400; throw err; }
  await adminUserRepo.deleteUserById(userId);
}

export const resetUserTestScore = async (userId, type) => {
  if (!["pre", "post"].includes(type)) { const err = new Error("Invalid test type. Use 'pre' or 'post'."); err.status = 400; throw err; }

  const updateData = {};
  if (type === "pre") updateData.pre_score = null;
  if (type === "post") updateData.post_score = null;
  const targetTestType = type === "pre" ? "PreTest" : "PostTest";

  await adminUserRepo.executeResetScoreTransaction(userId, updateData, targetTestType);
}

export const getUserTestHistory = async (userId) => {
  const userTests = await adminUserRepo.findUserTestHistory(userId);

  return userTests.map((record) => {
    const correctAnswer = record.test.choices.find((c) => c.is_correct);
    return {
      test_id: record.test_id, test_type: record.test.test_type, question: record.test.question,
      user_choice: record.choice ? record.choice.choice_text : "No Answer",
      is_correct: record.is_correct,
      correct_choice: correctAnswer ? correctAnswer.choice_text : "Unknown",
      answered_at: record.answered_at,
    };
  });
}


