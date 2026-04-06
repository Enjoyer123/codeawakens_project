import prisma from "../models/prisma.js";
import { buildPaginationResponse } from "../utils/pagination.js";

export const getAllVictoryConditions = async ({ page, limit, search, skip }) => {
  let where = {};
  if (search.trim()) {
    const s = search.toLowerCase();
    where = { OR: [{ type: { contains: s, mode: "insensitive" } }, { description: { contains: s, mode: "insensitive" } }, { check: { contains: s, mode: "insensitive" } }] };
  }
  const total = await prisma.victoryCondition.count({ where });
  const victoryConditions = await prisma.victoryCondition.findMany({ where, orderBy: { created_at: "desc" }, skip, take: limit });
  return { victoryConditions, pagination: { total, totalPages: Math.ceil(total / limit), page, limit } };
}

export const getVictoryConditionById = async (vcId) => {
  const vc = await prisma.victoryCondition.findUnique({ where: { victory_condition_id: vcId } });
  if (!vc) { const err = new Error("Victory condition not found"); err.status = 404; throw err; }
  return vc;
}

export const createVictoryCondition = async (data) => {
  const { type, description, check, is_available } = data;
  if (!type || !description || !check) { const err = new Error("Missing required fields: type, description, check"); err.status = 400; throw err; }
  const trimmedType = type.trim();
  const existing = await prisma.victoryCondition.findFirst({ where: { type: { equals: trimmedType, mode: "insensitive" } } });
  if (existing) { const err = new Error(`A victory condition with this type "${trimmedType}" already exists.`); err.status = 409; throw err; }

  return prisma.victoryCondition.create({
    data: { type: trimmedType, description: description.trim(), check: check.trim(), is_available: is_available === true || is_available === "true" || is_available === undefined },
  });
}

export const updateVictoryCondition = async (vcId, data) => {
  const { type, description, check, is_available } = data;
  if (!type || !description || !check) { const err = new Error("Missing required fields: type, description, check"); err.status = 400; throw err; }

  const existing = await prisma.victoryCondition.findUnique({ where: { victory_condition_id: vcId } });
  if (!existing) { const err = new Error("Victory condition not found"); err.status = 404; throw err; }

  const trimmedType = type.trim();
  if (trimmedType !== existing.type) {
    const duplicate = await prisma.victoryCondition.findFirst({
      where: { type: { equals: trimmedType, mode: "insensitive" }, victory_condition_id: { not: vcId } },
    });
    if (duplicate) { const err = new Error(`A victory condition with this type "${trimmedType}" already exists.`); err.status = 409; throw err; }
  }

  return prisma.victoryCondition.update({
    where: { victory_condition_id: vcId },
    data: { type: trimmedType, description: description.trim(), check: check.trim(), is_available: is_available === true || is_available === "true" },
  });
}

export const deleteVictoryCondition = async (vcId) => {
  const vc = await prisma.victoryCondition.findUnique({
    where: { victory_condition_id: vcId },
    include: { level_victory_conditions: true },
  });
  if (!vc) { const err = new Error("Victory condition not found"); err.status = 404; throw err; }

  if (vc.level_victory_conditions && vc.level_victory_conditions.length > 0) {
    const uniqueLevelIds = [...new Set(vc.level_victory_conditions.map((lvc) => lvc.level_id))];
    const err = new Error(`Cannot delete victory condition: Used in ${vc.level_victory_conditions.length} level victory condition(s) across ${uniqueLevelIds.length} level(s).`);
    err.status = 400; throw err;
  }

  await prisma.victoryCondition.delete({ where: { victory_condition_id: vcId } });
}


