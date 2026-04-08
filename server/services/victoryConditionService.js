import * as vcRepo from "../models/victoryConditionModel.js";
import { buildPaginationResponse } from "../utils/pagination.js";

export const getAllVictoryConditions = async ({ page, limit, search, skip }) => {
  let where = {};
  if (search.trim()) {
    const s = search.toLowerCase();
    where = { OR: [{ type: { contains: s, mode: "insensitive" } }, { description: { contains: s, mode: "insensitive" } }] };
  }
  const total = await vcRepo.countVictoryConditions(where);
  const victoryConditions = await vcRepo.findManyVictoryConditions(where, skip, limit);
  return { victoryConditions, pagination: { total, totalPages: Math.ceil(total / limit), page, limit } };
}

export const getVictoryConditionById = async (vcId) => {
  const vc = await vcRepo.findVictoryConditionById(vcId);
  if (!vc) { const err = new Error("Victory condition not found"); err.status = 404; throw err; }
  return vc;
}

export const createVictoryCondition = async (data) => {
  const { type, description, is_available } = data;
  if (!type || !description) { const err = new Error("Missing required fields: type, description"); err.status = 400; throw err; }
  const trimmedType = type.trim();
  const existing = await vcRepo.findVictoryConditionByType(trimmedType);
  if (existing) { const err = new Error(`A victory condition with this type "${trimmedType}" already exists.`); err.status = 409; throw err; }

  return vcRepo.createVictoryCondition({ type: trimmedType, description: description.trim(), is_available: is_available === true || is_available === "true" || is_available === undefined });
}

export const updateVictoryCondition = async (vcId, data) => {
  const { type, description, is_available } = data;
  if (!type || !description) { const err = new Error("Missing required fields: type, description"); err.status = 400; throw err; }

  const existing = await vcRepo.findVictoryConditionById(vcId);
  if (!existing) { const err = new Error("Victory condition not found"); err.status = 404; throw err; }

  const trimmedType = type.trim();
  if (trimmedType !== existing.type) {
    const duplicate = await vcRepo.findVictoryConditionByTypeExceptId(trimmedType, vcId);
    if (duplicate) { const err = new Error(`A victory condition with this type "${trimmedType}" already exists.`); err.status = 409; throw err; }
  }

  return vcRepo.updateVictoryCondition(vcId, { type: trimmedType, description: description.trim(), is_available: is_available === true || is_available === "true" });
}

export const deleteVictoryCondition = async (vcId) => {
  const vc = await vcRepo.findVictoryConditionForDeletion(vcId);
  if (!vc) { const err = new Error("Victory condition not found"); err.status = 404; throw err; }

  if (vc.level_victory_conditions && vc.level_victory_conditions.length > 0) {
    const uniqueLevelIds = [...new Set(vc.level_victory_conditions.map((lvc) => lvc.level_id))];
    const err = new Error(`Cannot delete victory condition: Used in ${vc.level_victory_conditions.length} level victory condition(s) across ${uniqueLevelIds.length} level(s).`);
    err.status = 400; throw err;
  }

  await vcRepo.deleteVictoryCondition(vcId);
}


