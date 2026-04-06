import * as guideService from "../services/guideService.js";
import * as levelService from "../services/levelService.js";
import { parsePagination } from "../utils/pagination.js";
import { cleanupTempFile } from "../utils/fileHelper.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export const getAllGuides = async (req, res) => {
  try {
    const paginationData = parsePagination(req.query);
    const result = await guideService.getAllGuides(paginationData);
    
    sendSuccess(res, result, "Guides fetched successfully");
  } catch (error) {
    console.error("Error fetching guides:", error.message);
    sendError(res, error.message || "Error fetching guides", error.status || 500);
  }
};

export const getGuidesByLevel = async (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    const result = await guideService.getGuidesByLevel(levelId);
    
    sendSuccess(res, result, "Guides fetched successfully");
  } catch (error) {
    console.error("Error fetching guides by level:", error.message);
    sendError(res, error.message || "Error fetching guides by level", error.status || 500);
  }
};

export const getLevelsForGuide = async (req, res) => {
  try {
    const result = await levelService.getLevelsForDropdown();
    
    sendSuccess(res, result, "Levels fetched successfully");
  } catch (error) {
    console.error("Error fetching levels for dropdown:", error.message);
    sendError(res, error.message || "Error fetching levels", error.status || 500);
  }
};

export const getGuideById = async (req, res) => {
  try {
    const guideId = parseInt(req.params.guideId);
    const result = await guideService.getGuideById(guideId);
    
    sendSuccess(res, result, "Guide fetched successfully");
  } catch (error) {
    console.error("Error fetching guide:", error.message);
    sendError(res, error.message || "Error fetching guide", error.status || 500);
  }
};

export const createGuide = async (req, res) => {
  try {
    const result = await guideService.createGuide(req.body);
    
    sendSuccess(res, { guide: result }, "Guide created successfully", 201);
  } catch (error) {
    console.error("Error creating guide:", error.message);
    sendError(res, error.message || "Error creating guide", error.status || 500);
  }
};

export const updateGuide = async (req, res) => {
  try {
    const guideId = parseInt(req.params.guideId);
    const result = await guideService.updateGuide(guideId, req.body);
    
    sendSuccess(res, { guide: result }, "Guide updated successfully");
  } catch (error) {
    console.error("Error updating guide:", error.message);
    sendError(res, error.message || "Error updating guide", error.status || 500);
  }
};

export const deleteGuide = async (req, res) => {
  try {
    const guideId = parseInt(req.params.guideId);
    await guideService.deleteGuide(guideId);
    
    sendSuccess(res, null, "Guide deleted successfully");
  } catch (error) {
    console.error("Error deleting guide:", error.message);
    sendError(res, error.message || "Error deleting guide", error.status || 500);
  }
};

export const uploadGuideImage = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, "No file uploaded", 400);
    }
    
    const guideId = parseInt(req.params.guideId);
    const result = await guideService.uploadGuideImage(guideId, req.file);
    
    sendSuccess(res, { guideImage: result }, "Guide image uploaded successfully", 201);
  } catch (error) {
    console.error("Error uploading guide image:", error.message);
    cleanupTempFile(req.file);
    sendError(res, error.message || "Error uploading guide image", error.status || 500);
  }
};

export const deleteGuideImage = async (req, res) => {
  try {
    const imageId = parseInt(req.params.imageId);
    await guideService.deleteGuideImage(imageId);
    
    sendSuccess(res, null, "Guide image deleted successfully");
  } catch (error) {
    console.error("Error deleting guide image:", error.message);
    sendError(res, error.message || "Error deleting guide image", error.status || 500);
  }
};
