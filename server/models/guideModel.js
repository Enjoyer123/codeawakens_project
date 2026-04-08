import prisma from "./prisma.js";

const GUIDE_INCLUDE = { level: { select: { level_id: true, level_name: true, category: { select: { category_name: true, testcase_enable: true, pseudocode_enable: true } } } }, guide_images: { orderBy: { guide_file_id: "asc" } } };

export const countGuides = async (where) => prisma.guide.count({ where });
export const findManyGuides = async (where, skip, limit) => prisma.guide.findMany({ where, include: GUIDE_INCLUDE, orderBy: [{ level_id: "asc" }, { display_order: "asc" }], skip, take: limit });
export const findLevelById = async (levelId) => prisma.level.findUnique({ where: { level_id: levelId } });
export const findGuidesByLevelId = async (levelId) => prisma.guide.findMany({ where: { level_id: levelId }, include: { guide_images: { orderBy: { guide_file_id: "asc" } } }, orderBy: { display_order: "asc" } });
export const findGuideById = async (guideId) => prisma.guide.findUnique({ where: { guide_id: guideId }, include: GUIDE_INCLUDE });
export const createGuide = async (data) => prisma.guide.create({ data, include: { level: { select: { level_id: true, level_name: true, category: { select: { category_name: true, testcase_enable: true, pseudocode_enable: true } } } }, guide_images: true } });
export const updateGuide = async (guideId, data) => prisma.guide.update({ where: { guide_id: guideId }, data, include: GUIDE_INCLUDE });
export const findGuideForDeletion = async (guideId) => prisma.guide.findUnique({ where: { guide_id: guideId }, include: { guide_images: true } });
export const deleteGuideImagesMany = async (guideId) => prisma.guide_Image.deleteMany({ where: { guide_id: guideId } });
export const deleteGuide = async (guideId) => prisma.guide.delete({ where: { guide_id: guideId } });
export const createGuideImage = async (data) => prisma.guide_Image.create({ data });
export const findGuideImageById = async (imageId) => prisma.guide_Image.findUnique({ where: { guide_file_id: imageId } });
export const deleteGuideImage = async (imageId) => prisma.guide_Image.delete({ where: { guide_file_id: imageId } });
