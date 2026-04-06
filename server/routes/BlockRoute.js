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

// Public route for viewing blocks (user-facing)
router.get("/blocks/public", authCheck, getAllBlocks);

// Block CRUD routes (admin only)
router.get("/blocks", authCheck, requireAdmin, getAllBlocks);
router.get("/blocks/:blockId", authCheck, requireAdmin, getBlockById);
router.post("/blocks", authCheck, requireAdmin, createBlock);
router.put("/blocks/:blockId", authCheck, requireAdmin, updateBlock);
router.delete("/blocks/:blockId", authCheck, requireAdmin, deleteBlock);
router.post("/blocks/upload-image", authCheck, requireAdmin, blockUploadMiddleware.single("image"), uploadBlockImage);

export default router;

