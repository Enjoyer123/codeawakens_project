import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import requireAdmin from "../middleware/requireAdmin.js";
import { uploadMiddleware } from "../middleware/levelHintUpload.js";

import {
  getAllLevelHints,
  getHintsByLevelId,
  createLevelHint,
  updateLevelHint,
  deleteLevelHint,
  uploadHintImage,
  deleteHintImage,
} from "../controllers/levelHintController.js";

/**
 * @swagger
 * tags:
 *   name: Level Hints
 *   description: Management of logic hints and clues for levels
 */

/**
 * @swagger
 * /level-hints:
 *   get:
 *     summary: Get all hints deployed across levels (Admin)
 *     tags: [Level Hints]
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
 *         description: Array of hints & pagination metadata.
 */
router.get("/level-hints", authCheck, requireAdmin, getAllLevelHints);

/**
 * @swagger
 * /levels/{levelId}/hints:
 *   get:
 *     summary: Fetch hints attached to a specific level (Admin)
 *     tags: [Level Hints]
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
 *         description: Array of hints.
 */
router.get(
  "/levels/:levelId/hints",
  authCheck,
  requireAdmin,
  getHintsByLevelId
);

/**
 * @swagger
 * /level-hints:
 *   post:
 *     summary: Create a new hint for a level (Admin)
 *     tags: [Level Hints]
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
 *         description: Hint created.
 */
router.post("/level-hints", authCheck, requireAdmin, createLevelHint);

/**
 * @swagger
 * /level-hints/{hintId}:
 *   put:
 *     summary: Update an existing hint text (Admin)
 *     tags: [Level Hints]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: hintId
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
 *         description: Hint updated.
 */
router.put("/level-hints/:hintId", authCheck, requireAdmin, updateLevelHint);

/**
 * @swagger
 * /level-hints/{hintId}:
 *   delete:
 *     summary: Delete a hint from a level (Admin)
 *     tags: [Level Hints]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: hintId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Hint deleted.
 */
router.delete("/level-hints/:hintId", authCheck, requireAdmin, deleteLevelHint);

/**
 * @swagger
 * /level-hints/{hintId}/images:
 *   post:
 *     summary: Attachment image to hint (Admin)
 *     tags: [Level Hints]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: hintId
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
 *         description: Image uploaded and attached to hint.
 */
router.post(
  "/level-hints/:hintId/images",
  authCheck,
  requireAdmin,
  uploadMiddleware.single("image"),
  uploadHintImage
);

/**
 * @swagger
 * /level-hints/images/{imageId}:
 *   delete:
 *     summary: Delete a hint image attachment (Admin)
 *     tags: [Level Hints]
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
 *         description: Image file deleted.
 */
router.delete(
  "/level-hints/images/:imageId",
  authCheck,
  requireAdmin,
  deleteHintImage
);

export default router;


