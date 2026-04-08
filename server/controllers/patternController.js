import * as patternService from "../services/patternService.js";
import { parsePagination } from "../utils/pagination.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export const createPattern = async (req, res) => {
  try {
    const result = await patternService.createPattern(req.body);
    
    sendSuccess(res, { pattern: result }, "เพิ่มรูปแบบคำตอบสำเร็จ", 201);
  } catch (error) {
    console.error("Error creating pattern:", error.message);
    sendError(res, error.message || "Error creating pattern", error.status || 500);
  }
};

export const getAllPatterns = async (req, res) => {
  try {
    const paginationData = parsePagination(req.query);
    const result = await patternService.getAllPatterns(paginationData, req.query.level_id);
    
    sendSuccess(res, result, "Patterns ดึงข้อมูลสำเร็จ");
  } catch (error) {
    console.error("Error fetching patterns:", error.message);
    sendError(res, error.message || "Error fetching patterns", error.status || 500);
  }
};

export const getPatternById = async (req, res) => {
  try {
    const patternId = parseInt(req.params.patternId);
    const result = await patternService.getPatternById(patternId);
    
    sendSuccess(res, result, "Pattern ดึงข้อมูลสำเร็จ");
  } catch (error) {
    console.error("Error fetching pattern:", error.message);
    sendError(res, error.message || "Error fetching pattern", error.status || 500);
  }
};

export const updatePattern = async (req, res) => {
  try {
    const patternId = parseInt(req.params.patternId);
    const result = await patternService.updatePattern(patternId, req.body);
    
    sendSuccess(res, { pattern: result }, "อัปเดตรูปแบบคำตอบสำเร็จ");
  } catch (error) {
    console.error("Error updating pattern:", error.message);
    sendError(res, error.message || "Error updating pattern", error.status || 500);
  }
};

export const deletePattern = async (req, res) => {
  try {
    const patternId = parseInt(req.params.patternId);
    await patternService.deletePattern(patternId);
    
    sendSuccess(res, null, "ลบรูปแบบคำตอบสำเร็จ");
  } catch (error) {
    console.error("Error deleting pattern:", error.message);
    sendError(res, error.message || "Error deleting pattern", error.status || 500);
  }
};

export const getPatternTypes = async (req, res) => {
  try {
    const result = await patternService.getPatternTypes();
    
    sendSuccess(res, result, "Pattern types ดึงข้อมูลสำเร็จ");
  } catch (error) {
    console.error("Error fetching pattern types:", error.message);
    sendError(res, error.message || "Error fetching pattern types", error.status || 500);
  }
};

export const unlockPattern = async (req, res) => {
  try {
    const patternId = parseInt(req.params.patternId);
    const result = await patternService.unlockPattern(patternId);
    
    sendSuccess(res, { pattern: result }, "Pattern unlocked successfully");
  } catch (error) {
    console.error("Error unlocking pattern:", error.message);
    sendError(res, error.message || "Error unlocking pattern", error.status || 500);
  }
};
