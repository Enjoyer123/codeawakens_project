import prisma from "../models/prisma.js";
import { buildPaginationResponse } from "../utils/pagination.js";
import { safeDeleteFile } from "../utils/fileHelper.js";

export const getAllGuides = async ({ page, limit, search, skip }) => {
  let where = {};
  if (search.trim()) {
    where = { OR: [{ title: { contains: search.toLowerCase(), mode: "insensitive" } }] };
  }

  const total = await prisma.guide.count({ where });
  const guides = await prisma.guide.findMany({
    where,
    include: {
      level: { select: { level_id: true, level_name: true, category: { select: { category_name: true } } } },
      guide_images: { orderBy: { guide_file_id: "asc" } },
    },
    orderBy: [{ level_id: "asc" }, { display_order: "asc" }],
    skip,
    take: limit,
  });

  return { guides, pagination: buildPaginationResponse(page, limit, total) };
}

export const getGuidesByLevel = async (levelId) => {
  const level = await prisma.level.findUnique({ where: { level_id: levelId } });
  if (!level) { const err = new Error("Level not found"); err.status = 404; throw err; }

  return prisma.guide.findMany({
    where: { level_id: levelId },
    include: { guide_images: { orderBy: { guide_file_id: "asc" } } },
    orderBy: { display_order: "asc" },
  });
}

export const getGuideById = async (guideId) => {
  const guide = await prisma.guide.findUnique({
    where: { guide_id: guideId },
    include: {
      level: { select: { level_id: true, level_name: true, category: { select: { category_name: true } } } },
      guide_images: { orderBy: { guide_file_id: "asc" } },
    },
  });
  if (!guide) { const err = new Error("Guide not found"); err.status = 404; throw err; }
  return guide;
}

export const createGuide = async (data) => {
  const { level_id, title, display_order, is_active } = data;
  if (!level_id || !title || !title.trim()) {
    const err = new Error("Missing required fields: level_id, title"); err.status = 400; throw err;
  }

  const level = await prisma.level.findUnique({ where: { level_id: parseInt(level_id) } });
  if (!level) { const err = new Error("Level not found"); err.status = 400; throw err; }

  return prisma.guide.create({
    data: {
      level_id: parseInt(level_id),
      title: title.trim(),
      display_order: display_order ? parseInt(display_order) : 0,
      is_active: is_active === true || is_active === "true" || is_active === undefined,
    },
    include: {
      level: { select: { level_id: true, level_name: true, category: { select: { category_name: true } } } },
      guide_images: true,
    },
  });
}

export const updateGuide = async (guideId, data) => {
  const existing = await prisma.guide.findUnique({ where: { guide_id: guideId } });
  if (!existing) { const err = new Error("Guide not found"); err.status = 404; throw err; }

  const updateData = {};
  if (data.level_id !== undefined) {
    const level = await prisma.level.findUnique({ where: { level_id: parseInt(data.level_id) } });
    if (!level) { const err = new Error("Level not found"); err.status = 400; throw err; }
    updateData.level_id = parseInt(data.level_id);
  }
  if (data.title !== undefined) updateData.title = data.title;
  if (data.display_order !== undefined) updateData.display_order = parseInt(data.display_order);
  if (data.is_active !== undefined) updateData.is_active = data.is_active === true || data.is_active === "true";

  return prisma.guide.update({
    where: { guide_id: guideId },
    data: updateData,
    include: {
      level: { select: { level_id: true, level_name: true, category: { select: { category_name: true } } } },
      guide_images: { orderBy: { guide_file_id: "asc" } },
    },
  });
}

export const deleteGuide = async (guideId) => {
  const guide = await prisma.guide.findUnique({
    where: { guide_id: guideId },
    include: { guide_images: true },
  });
  if (!guide) { const err = new Error("Guide not found"); err.status = 404; throw err; }

  if (guide.guide_images && guide.guide_images.length > 0) {
    for (const image of guide.guide_images) { safeDeleteFile(image.path_file); }
    await prisma.guide_Image.deleteMany({ where: { guide_id: guideId } });
  }
  await prisma.guide.delete({ where: { guide_id: guideId } });
}

export const uploadGuideImage = async (guideId, file) => {
  const guide = await prisma.guide.findUnique({ where: { guide_id: guideId } });
  if (!guide) { const err = new Error("Guide not found"); err.status = 404; throw err; }

  const pathFile = `/uploads/guides/${file.filename}`;
  return prisma.guide_Image.create({ data: { guide_id: guideId, path_file: pathFile } });
}

export const deleteGuideImage = async (imageId) => {
  const guideImage = await prisma.guide_Image.findUnique({ where: { guide_file_id: imageId } });
  if (!guideImage) { const err = new Error("Guide image not found"); err.status = 404; throw err; }

  safeDeleteFile(guideImage.path_file);
  await prisma.guide_Image.delete({ where: { guide_file_id: imageId } });
}


