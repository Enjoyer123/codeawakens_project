import * as rewardRepo from "../models/rewardModel.js";
import { buildPaginationResponse } from "../utils/pagination.js";
import { safeDeleteFile, moveFile } from "../utils/fileHelper.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const LEVEL_SELECT = { level_id: true, level_name: true, category: { select: { category_name: true } } };

export const getAllRewards = async ({ page, limit, search, skip }) => {
  let where = {};
  if (search.trim()) {
    const s = search.toLowerCase();
    where = { OR: [{ reward_name: { contains: s, mode: "insensitive" } }, { description: { contains: s, mode: "insensitive" } }] };
  }
  const total = await rewardRepo.countRewards(where);
  const rewards = await rewardRepo.findManyRewards(where, skip, limit);
  return { rewards, pagination: buildPaginationResponse(page, limit, total) };
}

export const getRewardById = async (rewardId) => {
  const reward = await rewardRepo.findRewardById(rewardId);
  if (!reward) { const err = new Error("Reward not found"); err.status = 404; throw err; }
  return reward;
}

export const createReward = async (data) => {
  const { level_id, reward_type, reward_name, description, required_score, frame1 } = data;
  if (!level_id || !reward_type || !reward_name || required_score === undefined) {
    const err = new Error("Missing required fields: level_id, reward_type, reward_name, required_score"); err.status = 400; throw err;
  }
  const level = await rewardRepo.findLevelById(parseInt(level_id));
  if (!level) { const err = new Error("Level not found"); err.status = 400; throw err; }
  const validTypes = ["weapon", "block", "badge", "experience", "coin"];
  if (!validTypes.includes(reward_type)) { const err = new Error("Invalid reward_type"); err.status = 400; throw err; }

  return rewardRepo.createReward({  level_id: parseInt(level_id), reward_type, reward_name, description: description || null, required_score: parseInt(required_score), frame1: frame1 || null  });
}

export const updateReward = async (rewardId, data) => {
  const existing = await rewardRepo.findSimpleRewardById(rewardId);
  if (!existing) { const err = new Error("Reward not found"); err.status = 404; throw err; }

  const updateData = {};
  if (data.level_id !== undefined) {
    const level = await rewardRepo.findLevelById(parseInt(data.level_id));
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

  return rewardRepo.updateReward(rewardId, updateData);
}

export const deleteReward = async (rewardId) => {
  const reward = await rewardRepo.findSimpleRewardById(rewardId);
  if (!reward) { const err = new Error("Reward not found"); err.status = 404; throw err; }
  if (reward.frame1) safeDeleteFile(reward.frame1);
  await rewardRepo.deleteReward(rewardId);
}

export const uploadRewardFrame = async (rewardId, file, frameNumber) => {
  if (!frameNumber || frameNumber !== "1") { const err = new Error("Invalid frame_number. Must be 1"); err.status = 400; throw err; }
  const reward = await rewardRepo.findSimpleRewardById(rewardId);
  if (!reward) { const err = new Error("Reward not found"); err.status = 404; throw err; }

  const ext = path.extname(file.originalname);
  const correctFilename = `reward-${rewardId}-frame${frameNumber}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
  const rewardsDir = path.join(__dirname, "..", "uploads", "rewards");
  const correctPath = path.join(rewardsDir, correctFilename);
  moveFile(file.path, correctPath);

  const pathFile = `/uploads/rewards/${correctFilename}`;
  const frameField = `frame${frameNumber}`;

  if (reward[frameField]) safeDeleteFile(reward[frameField]);

  return rewardRepo.updateReward(rewardId, { [frameField]: pathFile });
}

export const deleteRewardFrame = async (rewardId, frameNumber) => {
  if (!frameNumber || frameNumber !== "1") { const err = new Error("Invalid frame_number. Must be 1"); err.status = 400; throw err; }
  const reward = await rewardRepo.findSimpleRewardById(rewardId);
  if (!reward) { const err = new Error("Reward not found"); err.status = 404; throw err; }
  const frameField = `frame${frameNumber}`;
  if (!reward[frameField]) { const err = new Error("Frame image not found"); err.status = 404; throw err; }

  safeDeleteFile(reward[frameField]);
  return rewardRepo.updateReward(rewardId, { [frameField]: null });
}


