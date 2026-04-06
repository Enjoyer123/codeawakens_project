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

// Pattern CRUD routes
router.get("/patterns", authCheck, getAllPatterns);
router.get("/patterns/types", authCheck, getPatternTypes);
router.get("/patterns/:patternId", authCheck, getPatternById);
router.post("/patterns", authCheck, requireAdmin, createPattern);
router.put("/patterns/:patternId", authCheck, requireAdmin, updatePattern);
router.put("/patterns/:patternId/unlock", authCheck, requireAdmin, unlockPattern);
router.delete("/patterns/:patternId", authCheck, requireAdmin, deletePattern);

export default router;

