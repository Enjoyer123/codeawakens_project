import * as testCaseService from "../services/testCaseService.js";

export const getTestCasesByLevel = async (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    const result = await testCaseService.getTestCasesByLevel(levelId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching test cases:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching test cases",
    });
  }
};

export const createTestCase = async (req, res) => {
  try {
    const result = await testCaseService.createTestCase(req.body);
    
    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating test case:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error creating test case",
    });
  }
};

export const updateTestCase = async (req, res) => {
  try {
    const testCaseId = parseInt(req.params.testCaseId);
    const result = await testCaseService.updateTestCase(testCaseId, req.body);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating test case:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error updating test case",
    });
  }
};

export const deleteTestCase = async (req, res) => {
  try {
    const testCaseId = parseInt(req.params.testCaseId);
    await testCaseService.deleteTestCase(testCaseId);
    
    res.status(200).json({
      message: "Test case deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting test case:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting test case",
    });
  }
};
