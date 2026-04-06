import prisma from "../models/prisma.js";
import { buildPaginationResponse } from "../utils/pagination.js";
import { safeDeleteFile, moveFile } from "../utils/fileHelper.js";
import path from "path";
import fs from "fs";

export const getAllLevelHints = async ({ page, limit, search, skip }) => {
  let where = {};
  if (search.trim()) {
    where = { OR: [{ title: { contains: search.toLowerCase(), mode: "insensitive" } }] };
  }
  const total = await prisma.levelHint.count({ where });
  const hints = await prisma.levelHint.findMany({
    where,
    include: { level: { select: { level_id: true, level_name: true, category: { select: { category_name: true } } } }, hint_images: { orderBy: { hint_image_id: "asc" } } },
    orderBy: [{ level_id: "asc" }, { display_order: "asc" }],
    skip, take: limit,
  });
  return { hints, pagination: buildPaginationResponse(page, limit, total) };
}

export const getHintsByLevelId = async (levelId) => {
  return prisma.levelHint.findMany({
    where: { level_id: levelId },
    include: { hint_images: { orderBy: { hint_image_id: "asc" } } },
    orderBy: { display_order: "asc" },
  });
}

export const createLevelHint = async (data) => {
  const { level_id, title, display_order, is_active } = data;
  if (!level_id || !title || !title.trim()) { const err = new Error("Missing required fields: level_id, title"); err.status = 400; throw err; }
  const level = await prisma.level.findUnique({ where: { level_id: parseInt(level_id) } });
  if (!level) { const err = new Error("Level not found"); err.status = 400; throw err; }

  return prisma.levelHint.create({
    data: { level_id: parseInt(level_id), title: title.trim(), display_order: display_order ? parseInt(display_order) : 0, is_active: is_active === true || is_active === "true" || is_active === undefined },
    include: { level: { select: { level_id: true, level_name: true, category: { select: { category_name: true } } } }, hint_images: true },
  });
}

export const updateLevelHint = async (hintId, data) => {
  const existing = await prisma.levelHint.findUnique({ where: { hint_id: hintId } });
  if (!existing) { const err = new Error("Level hint not found"); err.status = 404; throw err; }

  const updateData = {};
  if (data.level_id !== undefined) {
    const level = await prisma.level.findUnique({ where: { level_id: parseInt(data.level_id) } });
    if (!level) { const err = new Error("Level not found"); err.status = 400; throw err; }
    updateData.level_id = parseInt(data.level_id);
  }
  if (data.title !== undefined) updateData.title = data.title;
  if (data.display_order !== undefined) updateData.display_order = parseInt(data.display_order);
  if (data.is_active !== undefined) updateData.is_active = data.is_active === true || data.is_active === "true";

  return prisma.levelHint.update({
    where: { hint_id: hintId }, data: updateData,
    include: { level: { select: { level_id: true, level_name: true, category: { select: { category_name: true } } } }, hint_images: { orderBy: { hint_image_id: "asc" } } },
  });
}

export const deleteLevelHint = async (hintId) => {
  const hint = await prisma.levelHint.findUnique({ where: { hint_id: hintId }, include: { hint_images: true } });
  if (!hint) { const err = new Error("Level hint not found"); err.status = 404; throw err; }

  if (hint.hint_images && hint.hint_images.length > 0) {
    for (const image of hint.hint_images) { safeDeleteFile(image.path_file); }
  }
  await prisma.levelHintImage.deleteMany({ where: { hint_id: hintId } });
  await prisma.levelHint.delete({ where: { hint_id: hintId } });
}

export const uploadHintImage = async (hintId, file) => {
  const hint = await prisma.levelHint.findUnique({ where: { hint_id: hintId } });
  if (!hint) { const err = new Error("Level hint not found"); err.status = 404; throw err; }

  const pathFile = `/uploads/level_hints/${file.filename}`;
  return prisma.levelHintImage.create({ data: { hint_id: hintId, path_file: pathFile } });
}

export const deleteHintImage = async (imageId) => {
  const hintImage = await prisma.levelHintImage.findUnique({ where: { hint_image_id: imageId } });
  if (!hintImage) { const err = new Error("Level hint image not found"); err.status = 404; throw err; }

  safeDeleteFile(hintImage.path_file);
  await prisma.levelHintImage.delete({ where: { hint_image_id: imageId } });
}


