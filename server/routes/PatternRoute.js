import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import requireAdmin from "../middleware/requireAdmin.js";

import {
  createPattern,
  getAllPatterns,
  getPatternById,
  updatePattern,
  deletePattern,
  getPatternTypes,
  unlockPattern,
} from "../controllers/patternController.js";

/**
 * @swagger
 * tags:
 *   name: Patterns
 *   description: Map logic patterns and bullet-hell formations
 */

/**
 * @swagger
 * /patterns:
 *   get:
 *     summary: Get all patterns
 *     tags: [Patterns]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword
 *       - in: query
 *         name: level_id
 *         schema:
 *           type: integer
 *         description: Filter by level ID
 *     responses:
 *       200:
 *         description: Array of patterns & pagination metadata.
 */
router.get("/patterns", authCheck, getAllPatterns);

/**
 * @swagger
 * /patterns/types:
 *   get:
 *     summary: Get available pattern types/classes
 *     tags: [Patterns]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
 *     responses:
 *       200:
 *         description: List of types.
 */
router.get("/patterns/types", authCheck, getPatternTypes);

/**
 * @swagger
 * /patterns/{patternId}:
 *   get:
 *     summary: Get specific pattern config
 *     tags: [Patterns]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
 *     parameters:
 *       - in: path
 *         name: patternId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pattern details.
 */
router.get("/patterns/:patternId", authCheck, getPatternById);

/**
 * @swagger
 * /patterns:
 *   post:
 *     summary: Create a new pattern (Admin)
 *     tags: [Patterns]
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
 *               name:
 *                 type: string
 *               logic_string:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pattern created.
 */
router.post("/patterns", authCheck, requireAdmin, createPattern);

/**
 * @swagger
 * /patterns/{patternId}:
 *   put:
 *     summary: Update a pattern (Admin)
 *     tags: [Patterns]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: patternId
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
 *               name:
 *                 type: string
 *               logic_string:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pattern updated.
 */
router.put("/patterns/:patternId", authCheck, requireAdmin, updatePattern);

/**
 * @swagger
 * /patterns/{patternId}/unlock:
 *   put:
 *     summary: Toggle pattern unlock state (Admin)
 *     tags: [Patterns]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: patternId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lock toggled.
 */
router.put("/patterns/:patternId/unlock", authCheck, requireAdmin, unlockPattern);

/**
 * @swagger
 * /patterns/{patternId}:
 *   delete:
 *     summary: Delete a pattern (Admin)
 *     tags: [Patterns]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: patternId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pattern deleted.
 */
router.delete("/patterns/:patternId", authCheck, requireAdmin, deletePattern);

export default router;

