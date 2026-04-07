import express from "express";
const router = express.Router();
import { getTestCasesByLevel, createTestCase, updateTestCase, deleteTestCase } from "../controllers/testCaseController.js";
import authCheck from "../middleware/authCheck.js";
import requireAdmin from "../middleware/requireAdmin.js";

/**
 * @swagger
 * tags:
 *   name: Test Cases
 *   description: Algorithm validation criteria
 */

/**
 * @swagger
 * /test-cases/level/{levelId}:
 *   get:
 *     summary: Get all test cases for algorithm validation on a specific level
 *     tags: [Test Cases]
 *     parameters:
 *       - in: path
 *         name: levelId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Array of test cases.
 */
router.get('/test-cases/level/:levelId', getTestCasesByLevel);

/**
 * @swagger
 * /test-cases:
 *   post:
 *     summary: Create a new algorithm evaluation test case (Admin)
 *     tags: [Test Cases]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               level_id:
 *                 type: integer
 *               input:
 *                 type: string
 *               expected_output:
 *                 type: string
 *               is_hidden:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Test case created.
 */
router.post('/test-cases/', authCheck, requireAdmin, createTestCase);

/**
 * @swagger
 * /test-cases/{testCaseId}:
 *   put:
 *     summary: Update an existing test case (Admin)
 *     tags: [Test Cases]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: testCaseId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               input:
 *                 type: string
 *               expected_output:
 *                 type: string
 *               is_hidden:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Test case updated.
 */
router.put('/test-cases/:testCaseId', authCheck, requireAdmin, updateTestCase);

/**
 * @swagger
 * /test-cases/{testCaseId}:
 *   delete:
 *     summary: Delete a test case (Admin)
 *     tags: [Test Cases]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: testCaseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Test case deleted.
 */
router.delete('/test-cases/:testCaseId', authCheck, requireAdmin, deleteTestCase);

export default router;

