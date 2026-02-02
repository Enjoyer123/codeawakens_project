const express = require("express");
const router = express.Router();
const authCheck = require("../middleware/authCheck");
const requireAdmin = require("../middleware/requireAdmin");
const { uploadMiddleware } = require("../middleware/levelUpload");
const { uploadLevelBackgroundImage } = require("../controllers/levelController");

const {
  getAllLevels,
  getLevelById,
  createLevel,
  updateLevel,
  deleteLevel,
  getAllCategories,
  getLevelsForPrerequisite,
  unlockLevel,
  updateLevelCoordinates,
} = require("../controllers/levelController");

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

module.exports = router;
