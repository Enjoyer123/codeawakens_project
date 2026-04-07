import * as blockRepo from "../models/blockModel.js";
import { buildPaginationResponse } from "../utils/pagination.js";

export const getAllBlocks = async ({ page, limit, search, skip }) => {
  let where = {};
  if (search.trim()) {
    const s = search.toLowerCase();
    where = {
      OR: [
        { block_name: { contains: s, mode: "insensitive" } },
        { block_key: { contains: s, mode: "insensitive" } },
      ],
    };
  }
  const total = await blockRepo.countBlocks(where);
  const blocks = await blockRepo.findManyBlocks(where, skip, limit);
  return { blocks, pagination: buildPaginationResponse(page, limit, total) };
}

export const getBlockById = async (blockId) => {
  const block = await blockRepo.findBlockById(blockId);
  if (!block) {
    const err = new Error("Block not found");
    err.status = 404;
    throw err;
  }
  return block;
}

export const createBlock = async (data) => {
  const { block_key, block_name, category, description, is_available, syntax_example, block_image } = data;
  if (!block_key || !block_name) {
    const err = new Error("Missing required fields: block_key, block_name");
    err.status = 400;
    throw err;
  }
  const existing = await blockRepo.findBlockByKey(block_key);
  if (existing) {
    const err = new Error(
      `Block key "${block_key}" already exists. Each block must have a unique key.`,
    );
    err.status = 409;
    throw err;
  }
  
  return blockRepo.createBlock({ 
    block_key,
    block_name,
    category: category || "logic",
    description: description || null,
    is_available: is_available === true || is_available === "true" || is_available === undefined,
    syntax_example: syntax_example || null,
    block_image: block_image || null,
  });
}

export const updateBlock = async (blockId, data) => {
  const existing = await blockRepo.findBlockById(blockId);
  if (!existing) {
    const err = new Error("Block not found");
    err.status = 404;
    throw err;
  }

  // If block_key is changing, ensure it remains unique
  if (data.block_key && data.block_key !== existing.block_key) {
    const keyExists = await blockRepo.findBlockByKeyExceptId(data.block_key, blockId);
    if (keyExists) {
      const err = new Error(`Block key "${data.block_key}" already exists.`);
      err.status = 409;
      throw err;
    }
  }

  const updateData = {};
  if (data.block_key) updateData.block_key = data.block_key;
  if (data.block_name) updateData.block_name = data.block_name;
  if (data.category) updateData.category = data.category;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.syntax_example !== undefined) updateData.syntax_example = data.syntax_example;
  if (data.block_image !== undefined) updateData.block_image = data.block_image;
  
  if (data.is_available !== undefined) {
    updateData.is_available = data.is_available === true || data.is_available === "true";
  }

  return blockRepo.updateBlock(blockId, updateData);
}

export const deleteBlock = async (blockId) => {
  const block = await blockRepo.findBlockForDeletion(blockId);
  if (!block) {
    const err = new Error("Block not found");
    err.status = 404;
    throw err;
  }

  if (block.level_blocks && block.level_blocks.length > 0) {
    const err = new Error(
      `Cannot delete block: This block is being used in ${block.level_blocks.length} level(s). Please remove the block from all levels before deleting.`,
    );
    err.status = 400;
    throw err;
  }

  return blockRepo.deleteBlock(blockId);
}


