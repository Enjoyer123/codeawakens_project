import * as rewardService from "../services/rewardService.js";
import * as levelService from "../services/levelService.js";
import { parsePagination } from "../utils/pagination.js";
import { cleanupTempFile } from "../utils/fileHelper.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export const getAllRewards = async (req, res) => {
  try {
    const paginationData = parsePagination(req.query);
    const result = await rewardService.getAllRewards(paginationData);
    
    sendSuccess(res, result, "Rewards ดึงข้อมูลสำเร็จ");
  } catch (error) {
    console.error("Error fetching rewards:", error.message);
    sendError(res, error.message || "Error fetching rewards", error.status || 500);
  }
};

export const getLevelsForReward = async (req, res) => {
  try {
    const result = await levelService.getLevelsForDropdown();
    
    sendSuccess(res, result, "Levels ดึงข้อมูลสำเร็จ");
  } catch (error) {
    console.error("Error fetching levels for dropdown:", error.message);
    sendError(res, error.message || "Error fetching levels for dropdown", error.status || 500);
  }
};

export const getRewardById = async (req, res) => {
  try {
    const rewardId = parseInt(req.params.rewardId);
    const result = await rewardService.getRewardById(rewardId);
    
    sendSuccess(res, result, "Reward ดึงข้อมูลสำเร็จ");
  } catch (error) {
    console.error("Error fetching reward:", error.message);
    sendError(res, error.message || "Error fetching reward", error.status || 500);
  }
};

export const createReward = async (req, res) => {
  try {
    const result = await rewardService.createReward(req.body);
    
    sendSuccess(res, { reward: result }, "เพิ่มรางวัลสำเร็จ", 201);
  } catch (error) {
    console.error("Error creating reward:", error.message);
    sendError(res, error.message || "Error creating reward", error.status || 500);
  }
};

export const updateReward = async (req, res) => {
  try {
    const rewardId = parseInt(req.params.rewardId);
    const result = await rewardService.updateReward(rewardId, req.body);
    
    sendSuccess(res, { reward: result }, "อัปเดตรางวัลสำเร็จ");
  } catch (error) {
    console.error("Error updating reward:", error.message);
    sendError(res, error.message || "Error updating reward", error.status || 500);
  }
};

export const deleteReward = async (req, res) => {
  try {
    const rewardId = parseInt(req.params.rewardId);
    await rewardService.deleteReward(rewardId);
    
    sendSuccess(res, null, "ลบรางวัลสำเร็จ");
  } catch (error) {
    console.error("Error deleting reward:", error.message);
    sendError(res, error.message || "Error deleting reward", error.status || 500);
  }
};

export const uploadRewardFrame = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, "No image provided", 400);
    }
    
    const rewardId = parseInt(req.params.rewardId);
    const result = await rewardService.uploadRewardFrame(rewardId, req.file);
    
    sendSuccess(res, { reward: result }, "Reward frame image อัปโหลดสำเร็จ");
  } catch (error) {
    console.error("Error uploading reward frame:", error.message);
    cleanupTempFile(req.file);
    sendError(res, error.message || "Error uploading reward frame image", error.status || 500);
  }
};

export const deleteRewardFrame = async (req, res) => {
  try {
    const rewardId = parseInt(req.params.rewardId);
    const result = await rewardService.deleteRewardFrame(rewardId);
    
    sendSuccess(res, { reward: result }, "ลบรูปภาพกรอบรางวัลสำเร็จ");
  } catch (error) {
    console.error("Error deleting reward frame:", error.message);
    sendError(res, error.message || "Error deleting reward frame image", error.status || 500);
  }
};
