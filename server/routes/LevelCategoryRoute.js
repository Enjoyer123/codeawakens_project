const express = require("express");
const router = express.Router();
const authCheck = require("../middleware/authCheck");
const requireAdmin = require("../middleware/requireAdmin");

const { uploadMiddleware } = require("../middleware/rewardUpload");

const {
  getAllLevelCategories,
  getLevelCategoryById,
  createLevelCategory,
  updateLevelCategory,
  deleteLevelCategory,
  uploadCategoryBackground,
  deleteCategoryBackground,
} = require("../controllers/levelCategoryController");

// Level Category CRUD routes
router.get("/level-categories", authCheck, getAllLevelCategories);
router.get("/level-categories/:categoryId", authCheck, getLevelCategoryById);
router.post("/level-categories", authCheck, requireAdmin, createLevelCategory);
router.put("/level-categories/:categoryId", authCheck, requireAdmin, updateLevelCategory);
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

module.exports = router;

