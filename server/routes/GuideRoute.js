const express = require("express");
const router = express.Router();
const authCheck = require("../middleware/authCheck");
const requireAdmin = require("../middleware/requireAdmin");
const { uploadMiddleware } = require("../middleware/guideUpload");

const {
  getAllGuides,
  getGuideById,
  createGuide,
  updateGuide,
  deleteGuide,
  getLevelsForGuide,
  uploadGuideImage,
  deleteGuideImage,
} = require("../controllers/guideController");

// Guide CRUD routes
router.get("/guides", authCheck, requireAdmin, getAllGuides);
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

module.exports = router;

