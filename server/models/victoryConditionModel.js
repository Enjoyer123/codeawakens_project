import prisma from "./prisma.js";

export const countVictoryConditions = async (where) => prisma.victoryCondition.count({ where });
export const findManyVictoryConditions = async (where, skip, limit) => prisma.victoryCondition.findMany({ where, orderBy: { created_at: "desc" }, skip, take: limit });
export const findVictoryConditionById = async (vcId) => prisma.victoryCondition.findUnique({ where: { victory_condition_id: vcId } });
export const findVictoryConditionByType = async (type) => prisma.victoryCondition.findFirst({ where: { type: { equals: type, mode: "insensitive" } } });
export const findVictoryConditionByTypeExceptId = async (type, vcId) => prisma.victoryCondition.findFirst({ where: { type: { equals: type, mode: "insensitive" }, victory_condition_id: { not: vcId } } });
export const createVictoryCondition = async (data) => prisma.victoryCondition.create({ data });
export const updateVictoryCondition = async (vcId, data) => prisma.victoryCondition.update({ where: { victory_condition_id: vcId }, data });
export const findVictoryConditionForDeletion = async (vcId) => prisma.victoryCondition.findUnique({ where: { victory_condition_id: vcId }, include: { level_victory_conditions: true } });
export const deleteVictoryCondition = async (vcId) => prisma.victoryCondition.delete({ where: { victory_condition_id: vcId } });
