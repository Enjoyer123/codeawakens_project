const express = require("express");
const router = express.Router();
const authCheck = require("../middleware/authCheck");
const {
  getTestsByType,
  submitTest,
  getAllTests,
  createTest,
  updateTest,
  deleteTest,
  deleteTestChoice,
  uploadTestImage,
  uploadChoiceImage
} = require("../controllers/testController");
const { uploadMiddleware } = require("../middleware/testUpload");
const { choiceUploadMiddleware } = require("../middleware/testChoiceUpload");
const requireAdmin = require("../middleware/requireAdmin");

// Public/User routes
router.get("/tests/:type", authCheck, getTestsByType);
router.post("/tests/submit", authCheck, submitTest);

// Admin routes
router.get("/tests/admin/all", authCheck, requireAdmin, getAllTests);
router.post("/tests/", authCheck, requireAdmin, createTest);
router.put("/tests/:id", authCheck, requireAdmin, updateTest);
router.delete("/tests/:id", authCheck, requireAdmin, deleteTest);
router.delete("/tests/choices/:id", authCheck, requireAdmin, deleteTestChoice);

router.post("/tests/upload-image", authCheck, requireAdmin, uploadMiddleware.single("image"), uploadTestImage);
router.post("/tests/upload-choice-image", authCheck, requireAdmin, choiceUploadMiddleware.single("image"), uploadChoiceImage);

module.exports = router;
