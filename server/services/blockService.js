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
  const { block_key, block_name, block_type, description, is_available } = data;
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
      block_type: block_type || "general",
      description: description || null,
      is_available:
        is_available === true ||
        is_available === "true" ||
        is_available === undefined,
     });
}

export const updateBlock = async (blockId, data) => {
  const existing = await blockRepo.findBlockForDeletion(blockId);
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
  await blockRepo.deleteBlock(blockId);
}


