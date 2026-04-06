import * as victoryConditionService from "../services/victoryConditionService.js";
import { parsePagination } from "../utils/pagination.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export const getAllVictoryConditions = async (req, res) => {
  try {
    const { page, limit, search, skip } = parsePagination(req.query);
    const result = await victoryConditionService.getAllVictoryConditions({ page, limit, search, skip });
    
    sendSuccess(res, result, "Victory conditions fetched successfully");
  } catch (error) {
    console.error("Error fetching victory conditions:", error.message);
    sendError(res, error.message || "Error fetching victory conditions", error.status || 500);
  }
};

export const getVictoryConditionById = async (req, res) => {
  try {
    const conditionId = parseInt(req.params.victoryConditionId);
    const result = await victoryConditionService.getVictoryConditionById(conditionId);
    
    sendSuccess(res, result, "Victory condition fetched successfully");
  } catch (error) {
    console.error("Error fetching victory condition:", error.message);
    sendError(res, error.message || "Error fetching victory condition", error.status || 500);
  }
};

export const createVictoryCondition = async (req, res) => {
  try {
    const result = await victoryConditionService.createVictoryCondition(req.body);
    
    sendSuccess(res, { victoryCondition: result }, "Victory condition created successfully", 201);
  } catch (error) {
    console.error("Error creating victory condition:", error.message);
    sendError(res, error.message || "Error creating victory condition", error.status || 500);
  }
};

export const updateVictoryCondition = async (req, res) => {
  try {
    const conditionId = parseInt(req.params.victoryConditionId);
    const result = await victoryConditionService.updateVictoryCondition(conditionId, req.body);
    
    sendSuccess(res, { victoryCondition: result }, "Victory condition updated successfully");
  } catch (error) {
    console.error("Error updating victory condition:", error.message);
    sendError(res, error.message || "Error updating victory condition", error.status || 500);
  }
};

export const deleteVictoryCondition = async (req, res) => {
  try {
    const conditionId = parseInt(req.params.victoryConditionId);
    await victoryConditionService.deleteVictoryCondition(conditionId);
    
    sendSuccess(res, null, "Victory condition deleted successfully");
  } catch (error) {
    console.error("Error deleting victory condition:", error.message);
    sendError(res, error.message || "Error deleting victory condition", error.status || 500);
  }
};
