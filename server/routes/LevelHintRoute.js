const express = require("express");
const router = express.Router();
const authCheck = require("../middleware/authCheck");
const requireAdmin = require("../middleware/requireAdmin");
const { uploadMiddleware } = require("../middleware/levelHintUpload");

const {
  getAllLevelHints,
  getHintsByLevelId,
  createLevelHint,
  updateLevelHint,
  deleteLevelHint,
  uploadHintImage,
  deleteHintImage,
} = require("../controllers/levelHintController");

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

module.exports = router;


