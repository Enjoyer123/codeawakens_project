import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import requireAdmin from "../middleware/requireAdmin.js";
import { uploadMiddleware } from "../middleware/levelUpload.js";
import { uploadLevelBackgroundImage } from "../controllers/levelController.js";

import {
  getAllLevels,
  getLevelById,
  createLevel,
  updateLevel,
  deleteLevel,
  getAllCategories,
  getLevelsForPrerequisite,
  unlockLevel,
  updateLevelCoordinates,
} from "../controllers/levelController.js";

/**
 * @swagger
 * tags:
 *   name: Levels
 *   description: Individual level configuration and fetching
 */

/**
 * @swagger
 * /levels:
 *   get:
 *     summary: Get all levels details
 *     tags: [Levels]
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
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *     responses:
 *       200:
 *         description: List of levels & pagination metadata.
 */
router.get("/levels", authCheck, getAllLevels);
/**
 * @swagger
 * /levels/categories:
 *   get:
 *     summary: Get all structural categories (Admin/Prerequisite check)
 *     tags: [Levels]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
 *     responses:
 *       200:
 *         description: Master list of level categories.
 */
router.get("/levels/categories", authCheck, getAllCategories);

/**
 * @swagger
 * /levels/prerequisites:
 *   get:
 *     summary: Get short list of levels for setting as prerequisite (Admin)
 *     tags: [Levels]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     responses:
 *       200:
 *         description: Key-value mapped prerequisite levels.
 */
router.get("/levels/prerequisites", authCheck, requireAdmin, getLevelsForPrerequisite);

/**
 * @swagger
 * /levels/{levelId}:
 *   get:
 *     summary: Get specific level metadata and gameplay configuration
 *     tags: [Levels]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
 *     parameters:
 *       - in: path
 *         name: levelId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: admin
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Set to "true" to get full admin view with editable details
 *     responses:
 *       200:
 *         description: Complete level data mapping.
 */
router.get("/levels/:levelId", authCheck, getLevelById);

/**
 * @swagger
 * /levels:
 *   post:
 *     summary: Create a new custom algorithm/code level (Admin)
 *     tags: [Levels]
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
 *               title:
 *                 type: string
 *               category_id:
 *                 type: integer
 *               order:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [Code, Block]
 *     responses:
 *       201:
 *         description: New level drafted successfully.
 */
router.post("/levels", authCheck, requireAdmin, createLevel);

/**
 * @swagger
 * /levels/upload-background:
 *   post:
 *     summary: Upload aesthetic background for level rendering (Admin)
 *     tags: [Levels]
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
 *               backgroundImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Upload string generated.
 */
router.post("/levels/upload-background", authCheck, requireAdmin, uploadMiddleware.single('backgroundImage'), uploadLevelBackgroundImage);

/**
 * @swagger
 * /levels/coordinates/{levelId}:
 *   put:
 *     summary: Update x, y positioning of level node on map (Admin)
 *     tags: [Levels]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: levelId
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
 *               position_x:
 *                 type: number
 *               position_y:
 *                 type: number
 *     responses:
 *       200:
 *         description: Map positioning updated.
 */
router.put("/levels/coordinates/:levelId", authCheck, requireAdmin, updateLevelCoordinates); 

/**
 * @swagger
 * /levels/{levelId}:
 *   put:
 *     summary: Commit full structural update to map configs/blocks (Admin)
 *     tags: [Levels]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: levelId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Level transaction commited successfully.
 */
router.put("/levels/:levelId", authCheck, requireAdmin, updateLevel);

/**
 * @swagger
 * /levels/{levelId}/unlock:
 *   put:
 *     summary: Force unlock or toggle level lock state (Admin)
 *     tags: [Levels]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: levelId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Level lock state toggled.
 */
router.put("/levels/:levelId/unlock", authCheck, requireAdmin, unlockLevel);

/**
 * @swagger
 * /levels/{levelId}:
 *   delete:
 *     summary: Permanently eradicate level (Admin)
 *     tags: [Levels]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: levelId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Destruction complete.
 */
router.delete("/levels/:levelId", authCheck, requireAdmin, deleteLevel);

export default router;
