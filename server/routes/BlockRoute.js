const express = require("express");
const router = express.Router();
const authCheck = require("../middleware/authCheck");
const requireAdmin = require("../middleware/requireAdmin");

const {
  getAllBlocks,
  getBlockById,
  createBlock,
  updateBlock,
  deleteBlock,
} = require("../controllers/blockController");

// Block CRUD routes
router.get("/blocks", authCheck, requireAdmin, getAllBlocks);
router.get("/blocks/:blockId", authCheck, requireAdmin, getBlockById);
router.post("/blocks", authCheck, requireAdmin, createBlock);
router.put("/blocks/:blockId", authCheck, requireAdmin, updateBlock);
router.delete("/blocks/:blockId", authCheck, requireAdmin, deleteBlock);

module.exports = router;

