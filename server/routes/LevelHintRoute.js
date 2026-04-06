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

// Admin CRUD for level hints
router.get("/level-hints", authCheck, requireAdmin, getAllLevelHints);
router.get(
  "/levels/:levelId/hints",
  authCheck,
  requireAdmin,
  getHintsByLevelId
);
router.post("/level-hints", authCheck, requireAdmin, createLevelHint);
router.put("/level-hints/:hintId", authCheck, requireAdmin, updateLevelHint);
router.delete("/level-hints/:hintId", authCheck, requireAdmin, deleteLevelHint);

// Hint image routes
router.post(
  "/level-hints/:hintId/images",
  authCheck,
  requireAdmin,
  uploadMiddleware.single("image"),
  uploadHintImage
);
router.delete(
  "/level-hints/images/:imageId",
  authCheck,
  requireAdmin,
  deleteHintImage
);

export default router;


