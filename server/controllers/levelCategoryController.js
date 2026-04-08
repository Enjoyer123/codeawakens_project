import * as levelCategoryService from "../services/levelCategoryService.js";
import { cleanupTempFile } from "../utils/fileHelper.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export const getAllLevelCategories = async (req, res) => {
  try {
    const clerkUserId = req.user ? req.user.id : null;
    const search = req.query.search || "";
    const result = await levelCategoryService.getAllLevelCategories(search, clerkUserId);
    
    sendSuccess(res, result, "ดึงข้อมูลหัวข้อสำเร็จ");
  } catch (error) {
    console.error("Error fetching level categories:", error.message);
    sendError(res, error.message || "Error fetching level categories", error.status || 500);
  }
};

export const getLevelCategoryById = async (req, res) => {
  try {
    const clerkUserId = req.user ? req.user.id : null;
    const categoryId = parseInt(req.params.categoryId);
    const result = await levelCategoryService.getLevelCategoryById(categoryId, clerkUserId);
    
    sendSuccess(res, result, "ดึงข้อมูลหัวข้อสำเร็จ");
  } catch (error) {
    console.error("Error fetching level category by ID:", error.message);
    sendError(res, error.message || "Error fetching level category", error.status || 500);
  }
};

export const createLevelCategory = async (req, res) => {
  try {
    const result = await levelCategoryService.createLevelCategory(req.body);
    
    sendSuccess(res, { category: result }, "เพิ่มหัวข้อสำเร็จ", 201);
  } catch (error) {
    console.error("Error creating level category:", error.message);
    sendError(res, error.message || "Error creating level category", error.status || 500);
  }
};

export const updateLevelCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const result = await levelCategoryService.updateLevelCategory(categoryId, req.body);
    
    sendSuccess(res, { category: result }, "อัปเดตหัวข้อสำเร็จ");
  } catch (error) {
    console.error("Error updating level category:", error.message);
    sendError(res, error.message || "Error updating level category", error.status || 500);
  }
};

export const deleteLevelCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    await levelCategoryService.deleteLevelCategory(categoryId);
    
    sendSuccess(res, null, "ลบหัวข้อสำเร็จ");
  } catch (error) {
    console.error("Error deleting level category:", error.message);
    sendError(res, error.message || "Error deleting level category", error.status || 500);
  }
};

export const updateLevelCategoryCoordinates = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const result = await levelCategoryService.updateLevelCategoryCoordinates(categoryId, req.body);
    
    sendSuccess(res, { category: result }, "อัปเดตพิกัดสำเร็จ");
  } catch (error) {
    console.error("Error updating category coordinates:", error.message);
    sendError(res, error.message || "Error updating coordinates", error.status || 500);
  }
};

export const uploadCategoryBackground = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, "No image provided", 400);
    }
    
    const categoryId = parseInt(req.params.categoryId);
    const result = await levelCategoryService.uploadCategoryBackground(categoryId, req.file);
    
    sendSuccess(res, { category: result }, "อัปโหลดรูปพื้นหลังสำเร็จ");
  } catch (error) {
    console.error("Error uploading category background:", error.message);
    cleanupTempFile(req.file);
    sendError(res, error.message || "Error uploading category background", error.status || 500);
  }
};

export const deleteCategoryBackground = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const result = await levelCategoryService.deleteCategoryBackground(categoryId);
    
    sendSuccess(res, { category: result }, "ลบรูปพื้นหลังสำเร็จ");
  } catch (error) {
    console.error("Error deleting category background:", error.message);
    sendError(res, error.message || "Error deleting category background", error.status || 500);
  }
};
