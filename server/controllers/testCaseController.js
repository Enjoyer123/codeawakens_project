import * as testCaseService from "../services/testCaseService.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export const getTestCasesByLevel = async (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    const result = await testCaseService.getTestCasesByLevel(levelId);
    
    sendSuccess(res, result, "Test cases ดึงข้อมูลสำเร็จ");
  } catch (error) {
    console.error("Error fetching test cases:", error.message);
    sendError(res, error.message || "Error fetching test cases", error.status || 500);
  }
};

export const createTestCase = async (req, res) => {
  try {
    const result = await testCaseService.createTestCase(req.body);
    
    sendSuccess(res, { testCase: result }, "สร้าง Test Case สำเร็จ", 201);
  } catch (error) {
    console.error("Error creating test case:", error.message);
    sendError(res, error.message || "Error creating test case", error.status || 500);
  }
};

export const updateTestCase = async (req, res) => {
  try {
    const testCaseId = parseInt(req.params.testCaseId);
    const result = await testCaseService.updateTestCase(testCaseId, req.body);
    
    sendSuccess(res, { testCase: result }, "อัปเดต Test Case สำเร็จ");
  } catch (error) {
    console.error("Error updating test case:", error.message);
    sendError(res, error.message || "Error updating test case", error.status || 500);
  }
};

export const deleteTestCase = async (req, res) => {
  try {
    const testCaseId = parseInt(req.params.testCaseId);
    await testCaseService.deleteTestCase(testCaseId);
    
    sendSuccess(res, null, "ลบ Test Case สำเร็จ");
  } catch (error) {
    console.error("Error deleting test case:", error.message);
    sendError(res, error.message || "Error deleting test case", error.status || 500);
  }
};
