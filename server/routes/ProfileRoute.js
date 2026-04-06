import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import { uploadMiddleware } from "../middleware/upload.js";

import {
  checkProfile,
  updateUsername,
  uploadProfileImage,
  deleteProfileImage,
  getUserByClerkId,
  saveUserProgress,
  checkAndAwardRewards
} from "../controllers/profileController.js";

router.get("/profile/check-profile", authCheck, checkProfile);
router.get("/profile/user", authCheck, getUserByClerkId);
router.put("/profile/username", authCheck, updateUsername);
router.post("/profile/image", authCheck, uploadMiddleware.single("profileImage"), uploadProfileImage);
router.delete("/profile/image", authCheck, deleteProfileImage);
router.post("/profile/progress", authCheck, saveUserProgress);
router.post("/profile/rewards/check", authCheck, checkAndAwardRewards);

export default router;
