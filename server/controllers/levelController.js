import * as levelService from "../services/levelService.js";
import { cleanupTempFile } from "../utils/fileHelper.js";
import { parsePagination } from "../utils/pagination.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export const getAllLevels = async (req, res) => {
  try {
    const clerkUserId = req.user ? req.user.id : null;
    const paginationData = parsePagination(req.query);
    const result = await levelService.getAllLevels(paginationData, req.query, clerkUserId);
    
    sendSuccess(res, result, "Levels fetched successfully");
  } catch (error) {
    console.error("Error fetching levels:", error.message);
    sendError(res, error.message || "Error fetching levels", error.status || 500);
  }
};

export const getLevelsForDropdown = async (req, res) => {
  try {
    const result = await levelService.getLevelsForDropdown();
    
    sendSuccess(res, result, "Levels fetched successfully");
  } catch (error) {
    console.error("Error fetching generic levels:", error.message);
    sendError(res, error.message || "Error fetching generic levels", error.status || 500);
  }
};

export const getLevelById = async (req, res) => {
  try {
    const clerkUserId = req.user ? req.user.id : null;
    const levelId = parseInt(req.params.levelId);
    const result = await levelService.getLevelById(levelId, req.query.admin, clerkUserId);
    
    sendSuccess(res, result, "Level fetched successfully");
  } catch (error) {
    console.error("Error fetching level details:", error.message);
    sendError(res, error.message || "Error fetching level details", error.status || 500);
  }
};

export const createLevel = async (req, res) => {
  try {
    const result = await levelService.createLevel(req.body);
    
    sendSuccess(res, { level: result }, "Level created successfully", 201);
  } catch (error) {
    console.error("Error creating level:", error.message);
    sendError(res, error.message || "Error creating level", error.status || 500);
  }
};

export const updateLevel = async (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    const result = await levelService.updateLevel(levelId, req.body);
    
    sendSuccess(res, { level: result }, "Level updated successfully");
  } catch (error) {
    console.error("Error updating level:", error.message);
    sendError(res, error.message || "Error updating level", error.status || 500);
  }
};

export const deleteLevel = async (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    await levelService.deleteLevel(levelId);
    
    sendSuccess(res, null, "Level deleted successfully");
  } catch (error) {
    console.error("Error deleting level:", error.message);
    sendError(res, error.message || "Error deleting level", error.status || 500);
  }
};

export const uploadLevelBackgroundImage = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, "No file uploaded", 400);
    }
    
    const levelId = parseInt(req.params.levelId);
    const result = await levelService.uploadLevelBackgroundImage(levelId, req.file);
    
    sendSuccess(res, { level: result }, "Background image uploaded successfully");
  } catch (error) {
    console.error("Error uploading background image:", error.message);
    cleanupTempFile(req.file);
    sendError(res, error.message || "Error uploading file", error.status || 500);
  }
};

export const deleteLevelBackgroundImage = async (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    const result = await levelService.deleteLevelBackgroundImage(levelId);
    
    sendSuccess(res, { level: result }, "Background image deleted successfully");
  } catch (error) {
    console.error("Error deleting background image:", error.message);
    sendError(res, error.message || "Error deleting background image", error.status || 500);
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const result = await levelService.getAllCategories();
    sendSuccess(res, result, "Categories fetched successfully");
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    sendError(res, error.message || "Error fetching categories", error.status || 500);
  }
};

export const getLevelsForPrerequisite = async (req, res) => {
  try {
    const result = await levelService.getLevelsForDropdown();
    sendSuccess(res, result, "Prerequisite levels fetched successfully");
  } catch (error) {
    console.error("Error fetching prerequisites:", error.message);
    sendError(res, error.message || "Error fetching prerequisites", error.status || 500);
  }
};

export const unlockLevel = async (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    await levelService.unlockLevel(levelId);
    sendSuccess(res, null, "Level unlocked successfully");
  } catch (error) {
    console.error("Error unlocking level:", error.message);
    sendError(res, error.message || "Error unlocking level", error.status || 500);
  }
};

export const updateLevelCoordinates = async (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    const result = await levelService.updateLevelCoordinates(levelId, req.body.coordinates);
    sendSuccess(res, { level: result }, "Level coordinates updated successfully");
  } catch (error) {
    console.error("Error updating coordinates:", error.message);
    sendError(res, error.message || "Error updating coordinates", error.status || 500);
  }
};
