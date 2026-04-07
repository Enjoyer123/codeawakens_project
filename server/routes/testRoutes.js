import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import {
  getTestsByType,
  submitTest,
  getAllTests,
  createTest,
  updateTest,
  deleteTest,
  deleteTestChoice,
  uploadTestImage,
  uploadChoiceImage
} from "../controllers/testController.js";
import { uploadMiddleware } from "../middleware/testUpload.js";
import { choiceUploadMiddleware } from "../middleware/testChoiceUpload.js";
import requireAdmin from "../middleware/requireAdmin.js";

/**
 * @swagger
 * tags:
 *   name: Tests
 *   description: Examination management (Pre-test / Post-test)
 */

/**
 * @swagger
 * /tests/{type}:
 *   get:
 *     summary: Get random questions for a specific test type
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pre, post]
 *       - in: query
 *         name: edit
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Set to "true" to include correct answers (admin edit mode)
 *     responses:
 *       200:
 *         description: Test questions data.
 */
router.get("/tests/:type", authCheck, getTestsByType);

/**
 * @swagger
 * /tests/submit:
 *   post:
 *     summary: Submit test answers for evaluation
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [pre, post]
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     test_id:
 *                       type: integer
 *                     choice_id:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Test evaluation results.
 */
router.post("/tests/submit", authCheck, submitTest);

/**
 * @swagger
 * /tests/admin/all:
 *   get:
 *     summary: Get all tests (Admin)
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     responses:
 *       200:
 *         description: List of all tests
 */
router.get("/tests/admin/all", authCheck, requireAdmin, getAllTests);
/**
 * @swagger
 * /tests:
 *   post:
 *     summary: Create a new test question (Admin)
 *     tags: [Tests]
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
 *               question:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [pre, post]
 *               choices:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                     is_correct:
 *                       type: boolean
 *     responses:
 *       201:
 *         description: Test question created.
 */
router.post("/tests/", authCheck, requireAdmin, createTest);

/**
 * @swagger
 * /tests/{id}:
 *   put:
 *     summary: Update an existing test question (Admin)
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               question:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [pre, post]
 *     responses:
 *       200:
 *         description: Test question updated.
 */
router.put("/tests/:id", authCheck, requireAdmin, updateTest);

/**
 * @swagger
 * /tests/{id}:
 *   delete:
 *     summary: Delete a test question (Admin)
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Test question deleted.
 */
router.delete("/tests/:id", authCheck, requireAdmin, deleteTest);

/**
 * @swagger
 * /tests/choices/{id}:
 *   delete:
 *     summary: Delete a specific choice from a test (Admin)
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Test choice deleted.
 */
router.delete("/tests/choices/:id", authCheck, requireAdmin, deleteTestChoice);

/**
 * @swagger
 * /tests/upload-image:
 *   post:
 *     summary: Upload an image asset for a test question (Admin)
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Upload metadata generated.
 */
router.post("/tests/upload-image", authCheck, requireAdmin, uploadMiddleware.single("image"), uploadTestImage);

/**
 * @swagger
 * /tests/upload-choice-image:
 *   post:
 *     summary: Upload an image asset for a test choice (Admin)
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Upload metadata generated.
 */
router.post("/tests/upload-choice-image", authCheck, requireAdmin, choiceUploadMiddleware.single("image"), uploadChoiceImage);

export default router;
