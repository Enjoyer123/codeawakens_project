const express = require("express");
const router = express.Router();
const authCheck = require("../middleware/authCheck");
const requireAdmin = require("../middleware/requireAdmin");

const {
  getAllLevelCategories,
  getLevelCategoryById,
  createLevelCategory,
  updateLevelCategory,
  deleteLevelCategory,
} = require("../controllers/levelCategoryController");

// Level Category CRUD routes
router.get("/level-categories", authCheck, getAllLevelCategories);
router.get("/level-categories/:categoryId", authCheck, getLevelCategoryById);
router.post("/level-categories", authCheck, requireAdmin, createLevelCategory);
router.put("/level-categories/:categoryId", authCheck, requireAdmin, updateLevelCategory);
router.delete("/level-categories/:categoryId", authCheck, requireAdmin, deleteLevelCategory);

module.exports = router;

