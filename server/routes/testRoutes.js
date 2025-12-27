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
  uploadTestImage
} = require("../controllers/testController");
const { uploadMiddleware } = require("../middleware/testUpload");
const requireAdmin = require("../middleware/requireAdmin");

// Public/User routes
router.get("/:type", authCheck, getTestsByType);
router.post("/submit", authCheck, submitTest);

// Admin routes
router.get("/admin/all", authCheck, requireAdmin, getAllTests);
router.post("/", authCheck, requireAdmin, createTest);
router.put("/:id", authCheck, requireAdmin, updateTest);
router.delete("/:id", authCheck, requireAdmin, deleteTest);
router.delete("/choices/:id", authCheck, requireAdmin, deleteTestChoice);

router.post("/upload-image", authCheck, requireAdmin, uploadMiddleware.single("image"), uploadTestImage);

module.exports = router;
