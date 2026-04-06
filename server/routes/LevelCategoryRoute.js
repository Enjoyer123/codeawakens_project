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

// Level Category CRUD routes
router.get("/level-categories", authCheck, getAllLevelCategories);
router.get("/level-categories/:categoryId", authCheck, getLevelCategoryById);
router.post("/level-categories", authCheck, requireAdmin, createLevelCategory);
// Update level category coordinates
router.put("/level-categories/coordinates/:categoryId", authCheck, updateLevelCategoryCoordinates); // Changed path to match existing style
// Update level category
router.put("/level-categories/:categoryId", authCheck, requireAdmin, updateLevelCategory); // Reverted path and requireAdmin to original, used imported function
router.delete("/level-categories/:categoryId", authCheck, requireAdmin, deleteLevelCategory);

// Category background image routes
router.post(
  "/level-categories/:categoryId/background",
  authCheck,
  requireAdmin,
  uploadMiddleware.single("image"),
  uploadCategoryBackground
);
router.delete("/level-categories/:categoryId/background", authCheck, requireAdmin, deleteCategoryBackground);

export default router;

