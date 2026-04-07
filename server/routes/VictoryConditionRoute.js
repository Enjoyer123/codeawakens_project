import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import requireAdmin from "../middleware/requireAdmin.js";

import {
  getAllVictoryConditions,
  getVictoryConditionById,
  updateVictoryCondition,
  deleteVictoryCondition,
  createVictoryCondition,
} from "../controllers/victoryConditionController.js";

/**
 * @swagger
 * tags:
 *   name: Victory Conditions
 *   description: Win state evaluation criteria
 */

/**
 * @swagger
 * /victory-conditions:
 *   get:
 *     summary: Get all win condition templates (Admin)
 *     tags: [Victory Conditions]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword
 *     responses:
 *       200:
 *         description: Array of conditions & pagination metadata.
 */
router.get("/victory-conditions", authCheck, requireAdmin, getAllVictoryConditions);

/**
 * @swagger
 * /victory-conditions/{victoryConditionId}:
 *   get:
 *     summary: Get specific condition by ID (Admin)
 *     tags: [Victory Conditions]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: victoryConditionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Condition object.
 */
router.get("/victory-conditions/:victoryConditionId", authCheck, requireAdmin, getVictoryConditionById);

/**
 * @swagger
 * /victory-conditions:
 *   post:
 *     summary: Create a new victory condition (Admin)
 *     tags: [Victory Conditions]
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
 *               type:
 *                 type: string
 *               value:
 *                 type: string
 *     responses:
 *       201:
 *         description: Condition created.
 */
router.post("/victory-conditions", authCheck, requireAdmin, createVictoryCondition);

/**
 * @swagger
 * /victory-conditions/{victoryConditionId}:
 *   put:
 *     summary: Update an existing condition (Admin)
 *     tags: [Victory Conditions]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: victoryConditionId
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
 *               type:
 *                 type: string
 *               value:
 *                 type: string
 *     responses:
 *       200:
 *         description: Condition updated.
 */
router.put("/victory-conditions/:victoryConditionId", authCheck, requireAdmin, updateVictoryCondition);

/**
 * @swagger
 * /victory-conditions/{victoryConditionId}:
 *   delete:
 *     summary: Delete a victory condition (Admin)
 *     tags: [Victory Conditions]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: victoryConditionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Condition deleted.
 */
router.delete("/victory-conditions/:victoryConditionId", authCheck, requireAdmin, deleteVictoryCondition);

export default router;

