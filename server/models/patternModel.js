import prisma from "./prisma.js";

// ====== FINDERS ======
export const findLevelWithCategory = async (levelId) => prisma.level.findUnique({ where: { level_id: levelId }, include: { category: true, level_blocks: { include: { block: true } } } });
export const findPatternTypeById = async (typeId) => prisma.patternType.findUnique({ where: { pattern_type_id: typeId } });
export const findWeaponById = async (weaponId) => prisma.weapon.findUnique({ where: { weapon_id: weaponId } });
export const countPatterns = async (where) => prisma.pattern.count({ where });
export const findManyPatterns = async (where, skip, limit) => prisma.pattern.findMany({ where, include: { level: { select: { level_id: true, level_name: true } }, pattern_type: true, weapon: { select: { weapon_id: true, weapon_name: true, weapon_key: true } } }, orderBy: { created_at: "desc" }, skip, take: limit });
export const findPatternById = async (patternId) => prisma.pattern.findUnique({ where: { pattern_id: patternId }, include: { level: true, pattern_type: true, weapon: true } });
export const findManyPatternTypes = async () => prisma.patternType.findMany({ orderBy: { pattern_type_id: "asc" } });

// ====== CRUD ======
export const createPattern = async (data) => prisma.pattern.create({ data, include: { level: true, pattern_type: true, weapon: true } });
export const updatePattern = async (patternId, data) => prisma.pattern.update({ where: { pattern_id: patternId }, data, include: { level: true, pattern_type: true, weapon: true } });
export const deletePattern = async (patternId) => prisma.pattern.delete({ where: { pattern_id: patternId } });
export const updatePatternAvailability = async (patternId, isAvailable) => prisma.pattern.update({ where: { pattern_id: patternId }, data: { is_available: isAvailable } });
