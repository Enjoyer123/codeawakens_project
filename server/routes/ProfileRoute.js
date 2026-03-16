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

router.get("/profile/check-profile", authCheck, checkProfile);
router.get("/profile/user", authCheck, getUserByClerkId);
router.put("/profile/username", authCheck, updateUsername);
router.post("/profile/image", authCheck, uploadMiddleware.single("profileImage"), uploadProfileImage);
router.delete("/profile/image", authCheck, deleteProfileImage);
router.post("/profile/progress", authCheck, saveUserProgress);
router.post("/profile/rewards/check", authCheck, checkAndAwardRewards);

module.exports = router;
