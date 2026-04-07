import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import requireAdmin from "../middleware/requireAdmin.js";
import { uploadMiddleware } from "../middleware/guideUpload.js";

import {
  getAllGuides,
  getGuideById,
  createGuide,
  updateGuide,
  deleteGuide,
  getLevelsForGuide,
  uploadGuideImage,
  deleteGuideImage,
  getGuidesByLevel,
} from "../controllers/guideController.js";

/**
 * @swagger
 * tags:
 *   name: Guides
 *   description: Tutorial and gameplay manual system
 */

/**
 * @swagger
 * /guides:
 *   get:
 *     summary: Get all guides (Admin)
 *     tags: [Guides]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
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
 *     responses:
 *       200:
 *         description: Array of game guides & pagination metadata.
 */
router.get("/guides", authCheck, requireAdmin, getAllGuides);

/**
 * @swagger
 * /guides/level/{levelId}:
 *   get:
 *     summary: Get guides specific to a level (Admin)
 *     tags: [Guides]
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
 *         description: Level guides.
 */
router.get("/guides/level/:levelId", authCheck, requireAdmin, getGuidesByLevel);

/**
 * @swagger
 * /guides/levels:
 *   get:
 *     summary: Fetch levels that map to guides (Admin)
 *     tags: [Guides]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     responses:
 *       200:
 *         description: Level mappings for guides.
 */
router.get("/guides/levels", authCheck, requireAdmin, getLevelsForGuide);

/**
 * @swagger
 * /guides/{guideId}:
 *   get:
 *     summary: Get specific guide by ID (Admin)
 *     tags: [Guides]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: guideId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Guide details.
 */
router.get("/guides/:guideId", authCheck, requireAdmin, getGuideById);

/**
 * @swagger
 * /guides:
 *   post:
 *     summary: Create a new tutorial guide (Admin)
 *     tags: [Guides]
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
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Guide created.
 */
router.post("/guides", authCheck, requireAdmin, createGuide);

/**
 * @swagger
 * /guides/{guideId}:
 *   put:
 *     summary: Update an existing guide (Admin)
 *     tags: [Guides]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: guideId
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
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Guide updated.
 */
router.put("/guides/:guideId", authCheck, requireAdmin, updateGuide);

/**
 * @swagger
 * /guides/{guideId}:
 *   delete:
 *     summary: Delete a guide (Admin)
 *     tags: [Guides]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: guideId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Guide deleted.
 */
router.delete("/guides/:guideId", authCheck, requireAdmin, deleteGuide);

/**
 * @swagger
 * /guides/{guideId}/images:
 *   post:
 *     summary: Upload an image asset for a guide (Admin)
 *     tags: [Guides]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: guideId
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
 *         description: Guide image uploaded.
 */
router.post(
  "/guides/:guideId/images",
  authCheck,
  requireAdmin,
  uploadMiddleware.single("image"),
  uploadGuideImage
);

/**
 * @swagger
 * /guides/images/{imageId}:
 *   delete:
 *     summary: Remove an image asset from a guide (Admin)
 *     tags: [Guides]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Guide image deleted.
 */
router.delete("/guides/images/:imageId", authCheck, requireAdmin, deleteGuideImage);

export default router;

