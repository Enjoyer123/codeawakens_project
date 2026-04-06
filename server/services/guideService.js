import * as guideRepo from "../models/guideModel.js";
import { buildPaginationResponse } from "../utils/pagination.js";
import { safeDeleteFile } from "../utils/fileHelper.js";

export const getAllGuides = async ({ page, limit, search, skip }) => {
  let where = {};
  if (search.trim()) {
    where = { OR: [{ title: { contains: search.toLowerCase(), mode: "insensitive" } }] };
  }

  const total = await guideRepo.countGuides(where);
  const guides = await guideRepo.findManyGuides(where, skip, limit);

  return { guides, pagination: buildPaginationResponse(page, limit, total) };
}

export const getGuidesByLevel = async (levelId) => {
  const level = await guideRepo.findLevelById(levelId);
  if (!level) { const err = new Error("Level not found"); err.status = 404; throw err; }

  return guideRepo.findGuidesByLevelId(levelId);
}

export const getGuideById = async (guideId) => {
  const guide = await guideRepo.findGuideById(guideId);
  if (!guide) { const err = new Error("Guide not found"); err.status = 404; throw err; }
  return guide;
}

export const createGuide = async (data) => {
  const { level_id, title, display_order, is_active } = data;
  if (!level_id || !title || !title.trim()) {
    const err = new Error("Missing required fields: level_id, title"); err.status = 400; throw err;
  }

  const level = await guideRepo.findLevelById(parseInt(level_id));
  if (!level) { const err = new Error("Level not found"); err.status = 400; throw err; }

  return guideRepo.createGuide({
    level_id: parseInt(level_id),
    title: title.trim(),
    display_order: display_order ? parseInt(display_order) : 0,
    is_active: is_active === true || is_active === "true" || is_active === undefined,
  });
}

export const updateGuide = async (guideId, data) => {
  const existing = await guideRepo.findGuideById(guideId);
  if (!existing) { const err = new Error("Guide not found"); err.status = 404; throw err; }

  const updateData = {};
  if (data.level_id !== undefined) {
    const level = await guideRepo.findLevelById(parseInt(data.level_id));
    if (!level) { const err = new Error("Level not found"); err.status = 400; throw err; }
    updateData.level_id = parseInt(data.level_id);
  }
  if (data.title !== undefined) updateData.title = data.title;
  if (data.display_order !== undefined) updateData.display_order = parseInt(data.display_order);
  if (data.is_active !== undefined) updateData.is_active = data.is_active === true || data.is_active === "true";

  return guideRepo.updateGuide(guideId, updateData);
}

export const deleteGuide = async (guideId) => {
  const guide = await guideRepo.findGuideForDeletion(guideId);
  if (!guide) { const err = new Error("Guide not found"); err.status = 404; throw err; }

  if (guide.guide_images && guide.guide_images.length > 0) {
    for (const image of guide.guide_images) { safeDeleteFile(image.path_file); }
    await guideRepo.deleteGuideImagesMany(guideId);
  }
  await guideRepo.deleteGuide(guideId);
}

export const uploadGuideImage = async (guideId, file) => {
  const guide = await guideRepo.findGuideById(guideId);
  if (!guide) { const err = new Error("Guide not found"); err.status = 404; throw err; }

  const pathFile = `/uploads/guides/${file.filename}`;
  return guideRepo.createGuideImage({ guide_id: guideId, path_file: pathFile });
}

export const deleteGuideImage = async (imageId) => {
  const guideImage = await guideRepo.findGuideImageById(imageId);
  if (!guideImage) { const err = new Error("Guide image not found"); err.status = 404; throw err; }

  safeDeleteFile(guideImage.path_file);
  await guideRepo.deleteGuideImage(imageId);
}


