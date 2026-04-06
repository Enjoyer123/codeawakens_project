const prisma = require("../models/prisma");
const { buildPaginationResponse } = require("../utils/pagination");

async function getAllBlocks({ page, limit, search, skip }) {
  let where = {};
  if (search.trim()) {
    const s = search.toLowerCase();
    where = { OR: [{ block_name: { contains: s, mode: "insensitive" } }, { block_key: { contains: s, mode: "insensitive" } }] };
  }
  const total = await prisma.block.count({ where });
  const blocks = await prisma.block.findMany({ where, orderBy: { created_at: "desc" }, skip, take: limit });
  return { blocks, pagination: buildPaginationResponse(page, limit, total) };
}

async function getBlockById(blockId) {
  const block = await prisma.block.findUnique({ where: { block_id: blockId } });
  if (!block) { const err = new Error("Block not found"); err.status = 404; throw err; }
  return block;
}

async function createBlock(data) {
  const { block_key, block_name, block_type, description, is_available } = data;
  if (!block_key || !block_name) { const err = new Error("Missing required fields: block_key, block_name"); err.status = 400; throw err; }
  const existing = await prisma.block.findUnique({ where: { block_key } });
  if (existing) { const err = new Error(`Block key "${block_key}" already exists. Each block must have a unique key.`); err.status = 409; throw err; }
  return prisma.block.create({
    data: { block_key, block_name, block_type: block_type || "general", description: description || null, is_available: is_available === true || is_available === "true" || is_available === undefined },
  });
}

async function updateBlock(blockId, data) {
  const existing = await prisma.block.findUnique({ where: { block_id: blockId } });
  if (!existing) { const err = new Error("Block not found"); err.status = 404; throw err; }

  if (data.block_key && data.block_key !== existing.block_key) {
    const keyExists = await prisma.block.findFirst({ where: { block_key: data.block_key, block_id: { not: blockId } } });
    if (keyExists) { const err = new Error(`Block key "${data.block_key}" already exists.`); err.status = 409; throw err; }
  }

  const updateData = {};
  if (data.block_key !== undefined) updateData.block_key = data.block_key;
  if (data.block_name !== undefined) updateData.block_name = data.block_name;
  if (data.block_type !== undefined) updateData.block_type = data.block_type;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.is_available !== undefined) updateData.is_available = data.is_available === true || data.is_available === "true";

  return prisma.block.update({ where: { block_id: blockId }, data: updateData });
}

async function deleteBlock(blockId) {
  const block = await prisma.block.findUnique({ where: { block_id: blockId }, include: { level_blocks: true } });
  if (!block) { const err = new Error("Block not found"); err.status = 404; throw err; }
  if (block.level_blocks && block.level_blocks.length > 0) {
    const err = new Error(`Cannot delete block: This block is being used in ${block.level_blocks.length} level(s). Please remove the block from all levels before deleting.`);
    err.status = 400; throw err;
  }
  await prisma.block.delete({ where: { block_id: blockId } });
}

module.exports = { getAllBlocks, getBlockById, createBlock, updateBlock, deleteBlock };
