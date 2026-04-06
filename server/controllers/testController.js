import * as testService from "../services/testService.js";
import { cleanupTempFile } from "../utils/fileHelper.js";

export const getTestsByType = async (req, res) => {
  try {
    const testType = req.params.type;
    const isEditMode = req.query.edit === "true";
    const result = await testService.getTestsByType(testType, isEditMode);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching tests:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching tests",
    });
  }
};

export const submitTest = async (req, res) => {
  const clerkUserId = req.user.id;
  const answers = req.body;
  console.log(`[TEST] User ${clerkUserId} submitted test.`);
  
  try {
    const result = await testService.submitTest(clerkUserId, answers);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error evaluating test:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error evaluating test",
    });
  }
};

export const getAllTests = async (req, res) => {
  try {
    const result = await testService.getAllTests();
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching tests:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching tests",
    });
  }
};

export const createTest = async (req, res) => {
  try {
    const result = await testService.createTest(req.body);
    
    res.status(201).json({
      message: "Test created successfully",
      test: result,
    });
  } catch (error) {
    console.error("Error creating test:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error creating test",
    });
  }
};

export const updateTest = async (req, res) => {
  try {
    const testId = parseInt(req.params.id);
    const result = await testService.updateTest(testId, req.body);
    
    res.status(200).json({
      message: "Test updated successfully",
      test: result,
    });
  } catch (error) {
    console.error("Error updating test:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error updating test",
    });
  }
};

export const deleteTest = async (req, res) => {
  try {
    const testId = parseInt(req.params.id);
    await testService.deleteTest(testId);
    
    res.status(200).json({
      message: "Test deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting test:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting test",
    });
  }
};

export const deleteTestChoice = async (req, res) => {
  try {
    const choiceId = parseInt(req.params.id);
    await testService.deleteTestChoice(choiceId);
    
    res.status(200).json({
      message: "Choice deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting choice:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting choice",
    });
  }
};

export const uploadTestImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    
    const filePath = `/uploads/tests/${req.file.filename}`;
    res.status(200).json({
      message: "Test image uploaded successfully",
      path: filePath,
    });
  } catch (error) {
    console.error("Error uploading test image:", error.message);
    res.status(500).json({
      message: "Upload failed",
    });
  }
};

export const uploadChoiceImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    
    const filePath = `/uploads/test_choices/${req.file.filename}`;
    res.status(200).json({
      message: "Choice image uploaded successfully",
      path: filePath,
    });
  } catch (error) {
    console.error("Error uploading choice image:", error.message);
    res.status(500).json({
      message: "Upload failed",
    });
  }
};
