import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import requireAdmin from "../middleware/requireAdmin.js";

import {
  getAllBlocks,
  getBlockById,
  updateBlock,
  deleteBlock,
  createBlock,
  uploadBlockImage,
} from "../controllers/blockController.js";
import { blockUploadMiddleware } from "../middleware/blockUpload.js";

/**
 * @swagger
 * tags:
 *   name: Blocks
 *   description: Playable code block definitions
 */

/**
 * @swagger
 * /blocks/public:
 *   get:
 *     summary: View available blocks (user-facing)
 *     tags: [Blocks]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
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
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter blocks by category (e.g., 'movement', 'visuals', 'operators')
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by block name or keyword
 *     responses:
 *       200:
 *         description: Array of blocks & Pagination metadata.
 */
router.get("/blocks/public", authCheck, getAllBlocks);

/**
 * @swagger
 * /blocks:
 *   get:
 *     summary: Get all blocks (Admin)
 *     tags: [Blocks]
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
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter blocks by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by block name or keyword
 *     responses:
 *       200:
 *         description: Array of blocks & Pagination metadata.
 */
router.get("/blocks", authCheck, requireAdmin, getAllBlocks);

/**
 * @swagger
 * /blocks/{blockId}:
 *   get:
 *     summary: Get specific block by ID (Admin)
 *     tags: [Blocks]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: blockId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Block data.
 */
router.get("/blocks/:blockId", authCheck, requireAdmin, getBlockById);

/**
 * @swagger
 * /blocks:
 *   post:
 *     summary: Create a new block schema (Admin)
 *     tags: [Blocks]
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
 *               block_name:
 *                 type: string
 *               category:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Block created.
 */
router.post("/blocks", authCheck, requireAdmin, createBlock);

/**
 * @swagger
 * /blocks/{blockId}:
 *   put:
 *     summary: Update an existing block (Admin)
 *     tags: [Blocks]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: blockId
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
 *               block_name:
 *                 type: string
 *               category:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Block updated.
 */
router.put("/blocks/:blockId", authCheck, requireAdmin, updateBlock);

/**
 * @swagger
 * /blocks/{blockId}:
 *   delete:
 *     summary: Delete a block (Admin)
 *     tags: [Blocks]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: blockId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Block deleted.
 */
router.delete("/blocks/:blockId", authCheck, requireAdmin, deleteBlock);

/**
 * @swagger
 * /blocks/upload-image:
 *   post:
 *     summary: Upload aesthetic block image (Admin)
 *     tags: [Blocks]
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
router.post("/blocks/upload-image", authCheck, requireAdmin, blockUploadMiddleware.single("image"), uploadBlockImage);

export default router;

