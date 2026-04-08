import * as testService from "../services/testService.js";
import { cleanupTempFile } from "../utils/fileHelper.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export const getTestsByType = async (req, res) => {
  try {
    const testType = req.params.type;
    const isEditMode = req.query.edit === "true";
    const result = await testService.getTestsByType(testType, isEditMode);
    
    sendSuccess(res, result, "Tests ดึงข้อมูลสำเร็จ");
  } catch (error) {
    console.error("Error fetching tests:", error.message);
    sendError(res, error.message || "Error fetching tests", error.status || 500);
  }
};

export const submitTest = async (req, res) => {
  const clerkUserId = req.user.id;
  const { type, answers } = req.body;
  console.log(`[TEST] User ${clerkUserId} submitted test type: ${type}`);
  
  try {
    const result = await testService.submitTest(type, answers, clerkUserId);
    
    sendSuccess(res, result, "Test submitted successfully");
  } catch (error) {
    console.error("Error evaluating test:", error.message);
    sendError(res, error.message || "Error evaluating test", error.status || 500);
  }
};

export const getAllTests = async (req, res) => {
  try {
    const result = await testService.getAllTests();
    
    sendSuccess(res, result, "Tests ดึงข้อมูลสำเร็จ");
  } catch (error) {
    console.error("Error fetching tests:", error.message);
    sendError(res, error.message || "Error fetching tests", error.status || 500);
  }
};

export const createTest = async (req, res) => {
  try {
    const result = await testService.createTest(req.body);
    
    sendSuccess(res, { test: result }, "สร้างแบบทดสอบสำเร็จ", 201);
  } catch (error) {
    console.error("Error creating test:", error.message);
    sendError(res, error.message || "Error creating test", error.status || 500);
  }
};

export const updateTest = async (req, res) => {
  try {
    const testId = parseInt(req.params.id);
    const result = await testService.updateTest(testId, req.body);
    
    sendSuccess(res, { test: result }, "อัปเดตแบบทดสอบสำเร็จ");
  } catch (error) {
    console.error("Error updating test:", error.message);
    sendError(res, error.message || "Error updating test", error.status || 500);
  }
};

export const deleteTest = async (req, res) => {
  try {
    const testId = parseInt(req.params.id);
    await testService.deleteTest(testId);
    
    sendSuccess(res, null, "ลบแบบทดสอบสำเร็จ");
  } catch (error) {
    console.error("Error deleting test:", error.message);
    sendError(res, error.message || "Error deleting test", error.status || 500);
  }
};

export const deleteTestChoice = async (req, res) => {
  try {
    const choiceId = parseInt(req.params.id);
    await testService.deleteTestChoice(choiceId);
    
    sendSuccess(res, null, "ลบตัวเลือกสำเร็จ");
  } catch (error) {
    console.error("Error deleting choice:", error.message);
    sendError(res, error.message || "Error deleting choice", error.status || 500);
  }
};

export const uploadTestImage = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, "No image file provided", 400);
    }
    
    const filePath = `/uploads/tests/${req.file.filename}`;
    sendSuccess(res, { path: filePath }, "Test image อัปโหลดสำเร็จ");
  } catch (error) {
    console.error("Error uploading test image:", error.message);
    sendError(res, "Upload failed", 500);
  }
};

export const uploadChoiceImage = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, "No image file provided", 400);
    }
    
    const filePath = `/uploads/test_choices/${req.file.filename}`;
    sendSuccess(res, { path: filePath }, "Choice image อัปโหลดสำเร็จ");
  } catch (error) {
    console.error("Error uploading choice image:", error.message);
    sendError(res, "Upload failed", 500);
  }
};
