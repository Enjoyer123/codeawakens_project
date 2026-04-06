import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import {
  getTestsByType,
  submitTest,
  getAllTests,
  createTest,
  updateTest,
  deleteTest,
  deleteTestChoice,
  uploadTestImage,
  uploadChoiceImage
} from "../controllers/testController.js";
import { uploadMiddleware } from "../middleware/testUpload.js";
import { choiceUploadMiddleware } from "../middleware/testChoiceUpload.js";
import requireAdmin from "../middleware/requireAdmin.js";

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

export default router;
