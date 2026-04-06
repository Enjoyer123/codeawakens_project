import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import requireAdmin from "../middleware/requireAdmin.js";
import { uploadMiddleware } from "../middleware/rewardUpload.js";

import {
  getAllRewards,
  getRewardById,
  createReward,
  updateReward,
  deleteReward,
  getLevelsForReward,
  uploadRewardFrame,
  deleteRewardFrame,
} from "../controllers/rewardController.js";

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

export default router;

