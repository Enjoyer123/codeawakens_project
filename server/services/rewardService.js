const prisma = require("../models/prisma");
const { buildPaginationResponse } = require("../utils/pagination");
const { safeDeleteFile, moveFile } = require("../utils/fileHelper");
const path = require("path");
const fs = require("fs");

const LEVEL_SELECT = { level_id: true, level_name: true, category: { select: { category_name: true } } };

async function getAllRewards({ page, limit, search, skip }) {
  let where = {};
  if (search.trim()) {
    const s = search.toLowerCase();
    where = { OR: [{ reward_name: { contains: s, mode: "insensitive" } }, { description: { contains: s, mode: "insensitive" } }] };
  }
  const total = await prisma.reward.count({ where });
  const rewards = await prisma.reward.findMany({
    where, include: { level: { select: LEVEL_SELECT } },
    orderBy: { reward_id: "desc" }, skip, take: limit,
  });
  return { rewards, pagination: buildPaginationResponse(page, limit, total) };
}

async function getRewardById(rewardId) {
  const reward = await prisma.reward.findUnique({ where: { reward_id: rewardId }, include: { level: { select: LEVEL_SELECT } } });
  if (!reward) { const err = new Error("Reward not found"); err.status = 404; throw err; }
  return reward;
}

async function createReward(data) {
  const { level_id, reward_type, reward_name, description, required_score, frame1 } = data;
  if (!level_id || !reward_type || !reward_name || required_score === undefined) {
    const err = new Error("Missing required fields: level_id, reward_type, reward_name, required_score"); err.status = 400; throw err;
  }
  const level = await prisma.level.findUnique({ where: { level_id: parseInt(level_id) } });
  if (!level) { const err = new Error("Level not found"); err.status = 400; throw err; }
  const validTypes = ["weapon", "block", "badge", "experience", "coin"];
  if (!validTypes.includes(reward_type)) { const err = new Error("Invalid reward_type"); err.status = 400; throw err; }

  return prisma.reward.create({
    data: { level_id: parseInt(level_id), reward_type, reward_name, description: description || null, required_score: parseInt(required_score), frame1: frame1 || null },
    include: { level: { select: LEVEL_SELECT } },
  });
}

async function updateReward(rewardId, data) {
  const existing = await prisma.reward.findUnique({ where: { reward_id: rewardId } });
  if (!existing) { const err = new Error("Reward not found"); err.status = 404; throw err; }

  const updateData = {};
  if (data.level_id !== undefined) {
    const level = await prisma.level.findUnique({ where: { level_id: parseInt(data.level_id) } });
    if (!level) { const err = new Error("Level not found"); err.status = 400; throw err; }
    updateData.level_id = parseInt(data.level_id);
  }
  if (data.reward_type !== undefined) {
    const validTypes = ["weapon", "block", "badge", "experience", "coin"];
    if (!validTypes.includes(data.reward_type)) { const err = new Error("Invalid reward_type"); err.status = 400; throw err; }
    updateData.reward_type = data.reward_type;
  }
  if (data.reward_name !== undefined) updateData.reward_name = data.reward_name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.required_score !== undefined) updateData.required_score = parseInt(data.required_score);
  if (data.frame1 !== undefined) updateData.frame1 = data.frame1 || null;

  return prisma.reward.update({ where: { reward_id: rewardId }, data: updateData, include: { level: { select: LEVEL_SELECT } } });
}

async function deleteReward(rewardId) {
  const reward = await prisma.reward.findUnique({ where: { reward_id: rewardId } });
  if (!reward) { const err = new Error("Reward not found"); err.status = 404; throw err; }
  if (reward.frame1) safeDeleteFile(reward.frame1);
  await prisma.reward.delete({ where: { reward_id: rewardId } });
}

async function uploadRewardFrame(rewardId, file, frameNumber) {
  if (!frameNumber || frameNumber !== "1") { const err = new Error("Invalid frame_number. Must be 1"); err.status = 400; throw err; }
  const reward = await prisma.reward.findUnique({ where: { reward_id: rewardId } });
  if (!reward) { const err = new Error("Reward not found"); err.status = 404; throw err; }

  const ext = path.extname(file.originalname);
  const correctFilename = `reward-${rewardId}-frame${frameNumber}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
  const rewardsDir = path.join(__dirname, "..", "uploads", "rewards");
  const correctPath = path.join(rewardsDir, correctFilename);
  moveFile(file.path, correctPath);

  const pathFile = `/uploads/rewards/${correctFilename}`;
  const frameField = `frame${frameNumber}`;

  if (reward[frameField]) safeDeleteFile(reward[frameField]);

  return prisma.reward.update({
    where: { reward_id: rewardId },
    data: { [frameField]: pathFile },
    include: { level: { select: LEVEL_SELECT } },
  });
}

async function deleteRewardFrame(rewardId, frameNumber) {
  if (!frameNumber || frameNumber !== "1") { const err = new Error("Invalid frame_number. Must be 1"); err.status = 400; throw err; }
  const reward = await prisma.reward.findUnique({ where: { reward_id: rewardId } });
  if (!reward) { const err = new Error("Reward not found"); err.status = 404; throw err; }
  const frameField = `frame${frameNumber}`;
  if (!reward[frameField]) { const err = new Error("Frame image not found"); err.status = 404; throw err; }

  safeDeleteFile(reward[frameField]);
  return prisma.reward.update({
    where: { reward_id: rewardId },
    data: { [frameField]: null },
    include: { level: { select: LEVEL_SELECT } },
  });
}

module.exports = { getAllRewards, getRewardById, createReward, updateReward, deleteReward, uploadRewardFrame, deleteRewardFrame };
