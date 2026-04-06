const prisma = require("../models/prisma");
const { buildPaginationResponse } = require("../utils/pagination");

async function getAllUsers({ page, limit, search, skip }) {
  let where = {};
  if (search.trim()) {
    const s = search.toLowerCase();
    where = { OR: [{ username: { contains: s, mode: "insensitive" } }, { email: { contains: s, mode: "insensitive" } }, { first_name: { contains: s, mode: "insensitive" } }, { last_name: { contains: s, mode: "insensitive" } }] };
  }
  const total = await prisma.user.count({ where });
  const users = await prisma.user.findMany({
    where,
    select: { user_id: true, clerk_user_id: true, username: true, email: true, first_name: true, last_name: true, profile_image: true, role: true, is_active: true, created_at: true },
    orderBy: { created_at: "desc" }, skip, take: limit,
  });
  return { users, pagination: buildPaginationResponse(page, limit, total) };
}

async function updateUserRole(userId, role, adminClerkId) {
  if (!role || !["user", "admin"].includes(role)) { const err = new Error("Invalid role. Must be 'user' or 'admin'"); err.status = 400; throw err; }
  const targetUser = await prisma.user.findUnique({ where: { user_id: userId } });
  if (!targetUser) { const err = new Error("User not found"); err.status = 404; throw err; }
  if (targetUser.clerk_user_id === adminClerkId && role === "user") { const err = new Error("Cannot remove your own admin role"); err.status = 400; throw err; }

  return prisma.user.update({
    where: { user_id: userId },
    data: { role },
    select: { user_id: true, clerk_user_id: true, username: true, email: true, first_name: true, last_name: true, profile_image: true, role: true, is_active: true },
  });
}

async function getUserDetails(userId) {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { user_id: true, clerk_user_id: true, username: true, email: true, first_name: true, last_name: true, profile_image: true, role: true, is_active: true, created_at: true, updated_at: true, pre_score: true, post_score: true, skill_level: true },
  });
  if (!user) { const err = new Error("User not found"); err.status = 404; throw err; }

  const userProgress = await prisma.userProgress.findMany({ where: { user_id: userId }, orderBy: { completed_at: "desc" } });
  const userRewards = await prisma.userReward.findMany({ where: { user_id: userId }, include: { reward: true }, orderBy: { earned_at: "desc" } });

  return { user, user_progress: userProgress, user_reward: userRewards };
}

async function deleteUser(userId, adminClerkId) {
  const targetUser = await prisma.user.findUnique({ where: { user_id: userId } });
  if (!targetUser) { const err = new Error("User not found"); err.status = 404; throw err; }
  if (targetUser.clerk_user_id === adminClerkId) { const err = new Error("Cannot delete your own account"); err.status = 400; throw err; }
  await prisma.user.delete({ where: { user_id: userId } });
}

async function resetUserTestScore(userId, type) {
  if (!["pre", "post"].includes(type)) { const err = new Error("Invalid test type. Use 'pre' or 'post'."); err.status = 400; throw err; }

  const updateData = {};
  if (type === "pre") updateData.pre_score = null;
  if (type === "post") updateData.post_score = null;
  const targetTestType = type === "pre" ? "PreTest" : "PostTest";

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { user_id: userId }, data: updateData });
    await tx.userTest.deleteMany({ where: { user_id: userId, test: { test_type: targetTestType } } });
  });
}

async function getUserTestHistory(userId) {
  const userTests = await prisma.userTest.findMany({
    where: { user_id: userId },
    include: { test: { include: { choices: true } }, choice: true },
    orderBy: { answered_at: "desc" },
  });

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

module.exports = { getAllUsers, updateUserRole, getUserDetails, deleteUser, resetUserTestScore, getUserTestHistory };
