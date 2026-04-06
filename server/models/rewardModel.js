import prisma from "./prisma.js";

const LEVEL_SELECT = { level_id: true, level_name: true, category: { select: { category_name: true } } };

export const countRewards = async (where) => prisma.reward.count({ where });
export const findManyRewards = async (where, skip, limit) => prisma.reward.findMany({ where, include: { level: { select: LEVEL_SELECT } }, orderBy: { reward_id: "desc" }, skip, take: limit });
export const findRewardById = async (rewardId) => prisma.reward.findUnique({ where: { reward_id: rewardId }, include: { level: { select: LEVEL_SELECT } } });
export const findLevelById = async (levelId) => prisma.level.findUnique({ where: { level_id: levelId } });
export const createReward = async (data) => prisma.reward.create({ data, include: { level: { select: LEVEL_SELECT } } });
export const findSimpleRewardById = async (rewardId) => prisma.reward.findUnique({ where: { reward_id: rewardId } });
export const updateReward = async (rewardId, data) => prisma.reward.update({ where: { reward_id: rewardId }, data, include: { level: { select: LEVEL_SELECT } } });
export const deleteReward = async (rewardId) => prisma.reward.delete({ where: { reward_id: rewardId } });
