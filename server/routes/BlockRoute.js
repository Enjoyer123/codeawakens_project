const express = require("express");
const router = express.Router();
const authCheck = require("../middleware/authCheck");
const requireAdmin = require("../middleware/requireAdmin");

const {
  getAllBlocks,
  getBlockById,
  updateBlock,
  deleteBlock,
  uploadBlockImage,
} = require("../controllers/blockController");
const { blockUploadMiddleware } = require("../middleware/blockUpload");

// Public route for viewing blocks (user-facing)
router.get("/blocks/public", authCheck, getAllBlocks);

// Block CRUD routes (admin only)
router.get("/blocks", authCheck, requireAdmin, getAllBlocks);
router.get("/blocks/:blockId", authCheck, requireAdmin, getBlockById);
router.put("/blocks/:blockId", authCheck, requireAdmin, updateBlock);
router.delete("/blocks/:blockId", authCheck, requireAdmin, deleteBlock);
router.post("/blocks/upload-image", authCheck, requireAdmin, blockUploadMiddleware.single("image"), uploadBlockImage);

module.exports = router;

