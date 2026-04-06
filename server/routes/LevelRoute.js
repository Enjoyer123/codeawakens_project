import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import requireAdmin from "../middleware/requireAdmin.js";
import { uploadMiddleware } from "../middleware/levelUpload.js";
import { uploadLevelBackgroundImage } from "../controllers/levelController.js";

import {
  getAllLevels,
  getLevelById,
  createLevel,
  updateLevel,
  deleteLevel,
  getAllCategories,
  getLevelsForPrerequisite,
  unlockLevel,
  updateLevelCoordinates,
} from "../controllers/levelController.js";

// Level CRUD routes
router.get("/levels", authCheck, getAllLevels);
router.get("/levels/categories", authCheck, getAllCategories);
router.get("/levels/prerequisites", authCheck, requireAdmin, getLevelsForPrerequisite);
router.get("/levels/:levelId", authCheck, getLevelById);
router.post("/levels", authCheck, requireAdmin, createLevel);
router.post("/levels/upload-background", authCheck, requireAdmin, uploadMiddleware.single('backgroundImage'), uploadLevelBackgroundImage);
// Update level coordinates
router.put("/levels/coordinates/:levelId", authCheck, requireAdmin, updateLevelCoordinates); // Added this route
// Update level
router.put("/levels/:levelId", authCheck, requireAdmin, updateLevel);
router.put("/levels/:levelId/unlock", authCheck, requireAdmin, unlockLevel);
router.delete("/levels/:levelId", authCheck, requireAdmin, deleteLevel);

export default router;
