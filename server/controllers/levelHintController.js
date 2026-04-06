import * as levelHintService from "../services/levelHintService.js";
import { parsePagination } from "../utils/pagination.js";
import { cleanupTempFile } from "../utils/fileHelper.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export const getAllLevelHints = async (req, res) => {
  try {
    const paginationData = parsePagination(req.query);
    const result = await levelHintService.getAllLevelHints(paginationData);
    
    sendSuccess(res, result, "Level hints fetched successfully");
  } catch (error) {
    console.error("Error fetching level hints:", error.message);
    sendError(res, error.message || "Error fetching level hints", error.status || 500);
  }
};

export const getHintsByLevelId = async (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    const result = await levelHintService.getHintsByLevelId(levelId);
    
    sendSuccess(res, result, "Hints fetched successfully");
  } catch (error) {
    console.error("Error fetching hints for level:", error.message);
    sendError(res, error.message || "Error fetching hints for level", error.status || 500);
  }
};

export const createLevelHint = async (req, res) => {
  try {
    const result = await levelHintService.createLevelHint(req.body);
    
    sendSuccess(res, { hint: result }, "Level hint created successfully", 201);
  } catch (error) {
    console.error("Error creating level hint:", error.message);
    sendError(res, error.message || "Error creating level hint", error.status || 500);
  }
};

export const updateLevelHint = async (req, res) => {
  try {
    const hintId = parseInt(req.params.hintId);
    const result = await levelHintService.updateLevelHint(hintId, req.body);
    
    sendSuccess(res, { hint: result }, "Level hint updated successfully");
  } catch (error) {
    console.error("Error updating level hint:", error.message);
    sendError(res, error.message || "Error updating level hint", error.status || 500);
  }
};

export const deleteLevelHint = async (req, res) => {
  try {
    const hintId = parseInt(req.params.hintId);
    await levelHintService.deleteLevelHint(hintId);
    
    sendSuccess(res, null, "Level hint deleted successfully");
  } catch (error) {
    console.error("Error deleting level hint:", error.message);
    sendError(res, error.message || "Error deleting level hint", error.status || 500);
  }
};

export const uploadHintImage = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, "No file uploaded", 400);
    }
    
    const hintId = parseInt(req.params.hintId);
    const result = await levelHintService.uploadHintImage(hintId, req.file);
    
    sendSuccess(res, { hintImage: result }, "Level hint image uploaded successfully", 201);
  } catch (error) {
    console.error("Error uploading level hint image:", error.message);
    cleanupTempFile(req.file);
    sendError(res, error.message || "Error uploading level hint image", error.status || 500);
  }
};

export const deleteHintImage = async (req, res) => {
  try {
    const imageId = parseInt(req.params.imageId);
    await levelHintService.deleteHintImage(imageId);
    
    sendSuccess(res, null, "Level hint image deleted successfully");
  } catch (error) {
    console.error("Error deleting level hint image:", error.message);
    sendError(res, error.message || "Error deleting level hint image", error.status || 500);
  }
};
