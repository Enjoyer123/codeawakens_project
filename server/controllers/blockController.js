import * as blockService from "../services/blockService.js";
import { parsePagination } from "../utils/pagination.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export const getAllBlocks = async (req, res) => {
  try {
    const paginationData = parsePagination(req.query);
    const result = await blockService.getAllBlocks(paginationData);
    
    sendSuccess(res, result, "Blocks fetched successfully");
  } catch (error) {
    console.error("Error fetching blocks:", error.message);
    sendError(res, error.message || "Error fetching blocks", error.status || 500);
  }
};

export const getBlockById = async (req, res) => {
  try {
    const blockId = parseInt(req.params.blockId);
    const result = await blockService.getBlockById(blockId);
    
    sendSuccess(res, result, "Block fetched successfully");
  } catch (error) {
    console.error("Error fetching block:", error.message);
    sendError(res, error.message || "Error fetching block", error.status || 500);
  }
};

export const createBlock = async (req, res) => {
  try {
    const result = await blockService.createBlock(req.body);
    
    sendSuccess(res, { block: result }, "Block created successfully", 201);
  } catch (error) {
    console.error("Error creating block:", error.message);
    sendError(res, error.message || "Error creating block", error.status || 500);
  }
};

export const updateBlock = async (req, res) => {
  try {
    const blockId = parseInt(req.params.blockId);
    const result = await blockService.updateBlock(blockId, req.body);
    
    sendSuccess(res, { block: result }, "Block updated successfully");
  } catch (error) {
    console.error("Error updating block:", error.message);
    sendError(res, error.message || "Error updating block", error.status || 500);
  }
};

export const deleteBlock = async (req, res) => {
  try {
    const blockId = parseInt(req.params.blockId);
    await blockService.deleteBlock(blockId);
    
    sendSuccess(res, null, "Block deleted successfully");
  } catch (error) {
    console.error("Error deleting block:", error.message);
    sendError(res, error.message || "Error deleting block", error.status || 500);
  }
};

export const uploadBlockImage = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, "No file uploaded", 400);
    }
    
    const filePath = `/uploads/blocks/${req.file.filename}`;
    sendSuccess(res, { path: filePath, filename: req.file.filename }, "Block image uploaded successfully");
  } catch (error) {
    console.error("Error uploading block image:", error.message);
    sendError(res, "Upload failed", 500);
  }
};
