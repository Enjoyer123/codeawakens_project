import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import requireAdmin from "../middleware/requireAdmin.js";
import { uploadMiddleware } from "../middleware/rewardUpload.js";

import {
  getAllRewards,
  getRewardById,
  createReward,
  updateReward,
  deleteReward,
  getLevelsForReward,
  uploadRewardFrame,
  deleteRewardFrame,
} from "../controllers/rewardController.js";

/**
 * @swagger
 * tags:
 *   name: Rewards
 *   description: Unlockable rewards management
 */

/**
 * @swagger
 * /rewards:
 *   get:
 *     summary: Get all available rewards (Admin)
 *     tags: [Rewards]
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
 *         description: Rewards mapping list & pagination metadata.
 */
router.get("/rewards", authCheck, requireAdmin, getAllRewards);
/**
 * @swagger
 * /rewards/levels:
 *   get:
 *     summary: Get prerequisite levels for rewards mapping (Admin)
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     responses:
 *       200:
 *         description: Levels for rewards mapping.
 */
router.get("/rewards/levels", authCheck, requireAdmin, getLevelsForReward);

/**
 * @swagger
 * /rewards/{rewardId}:
 *   get:
 *     summary: Get specific reward details (Admin)
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: rewardId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reward data.
 */
router.get("/rewards/:rewardId", authCheck, requireAdmin, getRewardById);

/**
 * @swagger
 * /rewards:
 *   post:
 *     summary: Create a new reward (Admin)
 *     tags: [Rewards]
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
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [badge, title, frame, character_skin, logic_theme]
 *     responses:
 *       201:
 *         description: Reward created.
 */
router.post("/rewards", authCheck, requireAdmin, createReward);

/**
 * @swagger
 * /rewards/{rewardId}:
 *   put:
 *     summary: Update a reward (Admin)
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: rewardId
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
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reward updated.
 */
router.put("/rewards/:rewardId", authCheck, requireAdmin, updateReward);

/**
 * @swagger
 * /rewards/{rewardId}:
 *   delete:
 *     summary: Delete a reward (Admin)
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: rewardId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reward deleted.
 */
router.delete("/rewards/:rewardId", authCheck, requireAdmin, deleteReward);

/**
 * @swagger
 * /rewards/{rewardId}/frames:
 *   post:
 *     summary: Upload a reward frame image (Admin)
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: rewardId
 *         required: true
 *         schema:
 *           type: integer
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
 *         description: Uploaded reward frame.
 */
router.post(
  "/rewards/:rewardId/frames",
  authCheck,
  requireAdmin,
  uploadMiddleware.single("image"),
  uploadRewardFrame
);

/**
 * @swagger
 * /rewards/{rewardId}/frames:
 *   delete:
 *     summary: Delete a reward frame image (Admin)
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: rewardId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Deleted reward frame.
 */
router.delete("/rewards/:rewardId/frames", authCheck, requireAdmin, deleteRewardFrame);

export default router;

