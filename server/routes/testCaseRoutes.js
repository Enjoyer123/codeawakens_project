import express from "express";
const router = express.Router();
import { getTestCasesByLevel, createTestCase, updateTestCase, deleteTestCase } from "../controllers/testCaseController.js";
import authCheck from "../middleware/authCheck.js";
import requireAdmin from "../middleware/requireAdmin.js";

// Get all test cases for a level (public - no auth needed)
router.get('/test-cases/level/:levelId', getTestCasesByLevel);

// Create a new test case (requires authentication and admin)
router.post('/test-cases/', authCheck, requireAdmin, createTestCase);

// Update a test case (requires authentication and admin)
router.put('/test-cases/:testCaseId', authCheck, requireAdmin, updateTestCase);

// Delete a test case (requires authentication and admin)
router.delete('/test-cases/:testCaseId', authCheck, requireAdmin, deleteTestCase);

export default router;

