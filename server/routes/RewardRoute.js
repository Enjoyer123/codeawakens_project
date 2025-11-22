const express = require("express");
const router = express.Router();
const authCheck = require("../middleware/authCheck");
const requireAdmin = require("../middleware/requireAdmin");
const { uploadMiddleware } = require("../middleware/rewardUpload");

const {
  getAllRewards,
  getRewardById,
  createReward,
  updateReward,
  deleteReward,
  getLevelsForReward,
  uploadRewardFrame,
  deleteRewardFrame,
} = require("../controllers/rewardController");

// Reward CRUD routes
router.get("/rewards", authCheck, requireAdmin, getAllRewards);
router.get("/rewards/levels", authCheck, requireAdmin, getLevelsForReward);
router.get("/rewards/:rewardId", authCheck, requireAdmin, getRewardById);
router.post("/rewards", authCheck, requireAdmin, createReward);
router.put("/rewards/:rewardId", authCheck, requireAdmin, updateReward);
router.delete("/rewards/:rewardId", authCheck, requireAdmin, deleteReward);

// Reward frame image routes
router.post(
  "/rewards/:rewardId/frames",
  authCheck,
  requireAdmin,
  uploadMiddleware.single("image"),
  uploadRewardFrame
);
router.delete("/rewards/:rewardId/frames", authCheck, requireAdmin, deleteRewardFrame);

module.exports = router;

