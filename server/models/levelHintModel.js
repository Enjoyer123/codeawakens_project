import prisma from "./prisma.js";

const HINT_INCLUDE = { level: { select: { level_id: true, level_name: true, category: { select: { category_name: true } } } }, hint_images: { orderBy: { hint_image_id: "asc" } } };

export const countLevelHints = async (where) => prisma.levelHint.count({ where });
export const findManyLevelHints = async (where, skip, limit) => prisma.levelHint.findMany({ where, include: HINT_INCLUDE, orderBy: [{ level_id: "asc" }, { display_order: "asc" }], skip, take: limit });
export const findLevelById = async (levelId) => prisma.level.findUnique({ where: { level_id: levelId } });
export const findHintsByLevelId = async (levelId) => prisma.levelHint.findMany({ where: { level_id: levelId }, include: { hint_images: { orderBy: { hint_image_id: "asc" } } }, orderBy: { display_order: "asc" } });
export const createLevelHint = async (data) => prisma.levelHint.create({ data, include: { level: { select: { level_id: true, level_name: true, category: { select: { category_name: true } } } }, hint_images: true } });
export const findHintById = async (hintId) => prisma.levelHint.findUnique({ where: { hint_id: hintId } });
export const updateLevelHint = async (hintId, data) => prisma.levelHint.update({ where: { hint_id: hintId }, data, include: HINT_INCLUDE });
export const findHintForDeletion = async (hintId) => prisma.levelHint.findUnique({ where: { hint_id: hintId }, include: { hint_images: true } });
export const deleteHintImagesMany = async (hintId) => prisma.levelHintImage.deleteMany({ where: { hint_id: hintId } });
export const deleteLevelHint = async (hintId) => prisma.levelHint.delete({ where: { hint_id: hintId } });
export const createHintImage = async (data) => prisma.levelHintImage.create({ data });
export const findHintImageById = async (imageId) => prisma.levelHintImage.findUnique({ where: { hint_image_id: imageId } });
export const deleteHintImage = async (imageId) => prisma.levelHintImage.delete({ where: { hint_image_id: imageId } });
