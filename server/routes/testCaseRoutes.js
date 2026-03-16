const express = require('express');
const router = express.Router();
const testCaseController = require('../controllers/testCaseController');
const authCheck = require('../middleware/authCheck');
const requireAdmin = require('../middleware/requireAdmin');

// Get all test cases for a level (public - no auth needed)
router.get('/test-cases/level/:levelId', testCaseController.getTestCasesByLevel);

// Create a new test case (requires authentication and admin)
router.post('/test-cases/', authCheck, requireAdmin, testCaseController.createTestCase);

// Update a test case (requires authentication and admin)
router.put('/test-cases/:testCaseId', authCheck, requireAdmin, testCaseController.updateTestCase);

// Delete a test case (requires authentication and admin)
router.delete('/test-cases/:testCaseId', authCheck, requireAdmin, testCaseController.deleteTestCase);

module.exports = router;

