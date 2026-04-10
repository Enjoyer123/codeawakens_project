import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import requireAdmin from "../middleware/requireAdmin.js";

import { uploadMiddleware } from "../middleware/rewardUpload.js";

import {
  getAllLevelCategories,
  getLevelCategoryById,
  createLevelCategory,
  updateLevelCategory,
  deleteLevelCategory,
  uploadCategoryBackground,
  deleteCategoryBackground,
  updateLevelCategoryCoordinates, // Added this import
} from "../controllers/levelCategoryController.js";

/**
 * @swagger
 * tags:
 *   name: Level Categories
 *   description: Level groups and island regions
 */

/**
 * @swagger
 * /level-categories:
 *   get:
 *     summary: Get all level categories
 *     description: Includes related levels for registered users
 *     tags: [Level Categories]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search category name
 *     responses:
 *       200:
 *         description: List of level categories.
 */
router.get("/level-categories", authCheck, getAllLevelCategories);

/**
 * @swagger
 * /level-categories/{categoryId}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Level Categories]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category details.
 */
router.get("/level-categories/:categoryId", authCheck, getLevelCategoryById);
/**
 * @swagger
 * /level-categories:
 *   post:
 *     summary: Create a new level category (Admin)
 *     tags: [Level Categories]
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
 *               order:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Category created.
 */
router.post("/level-categories", authCheck, requireAdmin, createLevelCategory);

/**
 * @swagger
 * /level-categories/coordinates/{categoryId}:
 *   put:
 *     summary: Update level category map coordinates
 *     tags: [Level Categories]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
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
 *         description: Coordinates updated.
 */
router.put("/level-categories/coordinates/:categoryId", authCheck, requireAdmin, updateLevelCategoryCoordinates);

/**
 * @swagger
 * /level-categories/{categoryId}:
 *   put:
 *     summary: Update level category details (Admin)
 *     tags: [Level Categories]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
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
 *               order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Category updated.
 */
router.put("/level-categories/:categoryId", authCheck, requireAdmin, updateLevelCategory);

/**
 * @swagger
 * /level-categories/{categoryId}:
 *   delete:
 *     summary: Delete a level category (Admin)
 *     tags: [Level Categories]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category deleted.
 */
router.delete("/level-categories/:categoryId", authCheck, requireAdmin, deleteLevelCategory);

/**
 * @swagger
 * /level-categories/{categoryId}/background:
 *   post:
 *     summary: Upload category background image (Admin)
 *     tags: [Level Categories]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
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
 *         description: Background image uploaded.
 */
router.post(
  "/level-categories/:categoryId/background",
  authCheck,
  requireAdmin,
  uploadMiddleware.single("image"),
  uploadCategoryBackground
);

/**
 * @swagger
 * /level-categories/{categoryId}/background:
 *   delete:
 *     summary: Delete category background image (Admin)
 *     tags: [Level Categories]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Background image deleted.
 */
router.delete("/level-categories/:categoryId/background", authCheck, requireAdmin, deleteCategoryBackground);

export default router;

