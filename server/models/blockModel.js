import prisma from "./prisma.js";

export const countBlocks = async (where) => prisma.block.count({ where });
export const findManyBlocks = async (where, skip, limit) => prisma.block.findMany({ where, orderBy: { created_at: "desc" }, skip, take: limit });
export const findBlockById = async (blockId) => prisma.block.findUnique({ where: { block_id: blockId } });
export const findBlockByKey = async (blockKey) => prisma.block.findUnique({ where: { block_key: blockKey } });
export const findBlockByKeyExceptId = async (blockKey, excludeId) => prisma.block.findFirst({ where: { block_key: blockKey, block_id: { not: excludeId } } });
export const createBlock = async (data) => prisma.block.create({ data });
export const updateBlock = async (blockId, data) => prisma.block.update({ where: { block_id: blockId }, data });
export const findBlockForDeletion = async (blockId) => prisma.block.findUnique({ where: { block_id: blockId }, include: { level_blocks: true } });
export const deleteBlock = async (blockId) => prisma.block.delete({ where: { block_id: blockId } });
