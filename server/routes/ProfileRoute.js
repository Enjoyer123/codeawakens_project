const express = require("express");
const router = express.Router();
const authCheck = require("../middleware/authCheck");
const { uploadMiddleware } = require("../middleware/upload");

const {
  checkProfile,
  updateUsername,
  uploadProfileImage,
  deleteProfileImage,
  getUserByClerkId,
  saveUserProgress,
  checkAndAwardRewards
} = require("../controllers/profileController");

router.get("/check-profile", authCheck, checkProfile);
router.get("/user", authCheck, getUserByClerkId);
router.put("/profile/username", authCheck, updateUsername);
router.post("/profile/image", authCheck, uploadMiddleware.single("profileImage"), uploadProfileImage);
router.delete("/profile/image", authCheck, deleteProfileImage);
router.post("/progress", authCheck, saveUserProgress);
router.post("/rewards/check", authCheck, checkAndAwardRewards);

module.exports = router;
