import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import requireAdmin from "../middleware/requireAdmin.js";
import { uploadMiddleware } from "../middleware/guideUpload.js";

import {
  getAllGuides,
  getGuideById,
  createGuide,
  updateGuide,
  deleteGuide,
  getLevelsForGuide,
  uploadGuideImage,
  deleteGuideImage,
  getGuidesByLevel,
} from "../controllers/guideController.js";

// Guide CRUD routes
router.get("/guides", authCheck, requireAdmin, getAllGuides);
router.get("/guides/level/:levelId", authCheck, requireAdmin, getGuidesByLevel);
router.get("/guides/levels", authCheck, requireAdmin, getLevelsForGuide);
router.get("/guides/:guideId", authCheck, requireAdmin, getGuideById);
router.post("/guides", authCheck, requireAdmin, createGuide);
router.put("/guides/:guideId", authCheck, requireAdmin, updateGuide);
router.delete("/guides/:guideId", authCheck, requireAdmin, deleteGuide);

// Guide image routes
router.post(
  "/guides/:guideId/images",
  authCheck,
  requireAdmin,
  uploadMiddleware.single("image"),
  uploadGuideImage
);
router.delete("/guides/images/:imageId", authCheck, requireAdmin, deleteGuideImage);

export default router;

