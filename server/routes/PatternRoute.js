const express = require("express");
const router = express.Router();
const authCheck = require("../middleware/authCheck");
const requireAdmin = require("../middleware/requireAdmin");

const {
  createPattern,
  getAllPatterns,
  getPatternById,
  updatePattern,
  deletePattern,
  getPatternTypes,
  unlockPattern,
} = require("../controllers/patternController");

// Pattern CRUD routes
router.get("/patterns", authCheck, getAllPatterns);
router.get("/patterns/types", authCheck, getPatternTypes);
router.get("/patterns/:patternId", authCheck, getPatternById);
router.post("/patterns", authCheck, requireAdmin, createPattern);
router.put("/patterns/:patternId", authCheck, requireAdmin, updatePattern);
router.put("/patterns/:patternId/unlock", authCheck, requireAdmin, unlockPattern);
router.delete("/patterns/:patternId", authCheck, requireAdmin, deletePattern);

module.exports = router;

