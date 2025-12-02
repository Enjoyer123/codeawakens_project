const express = require("express");
const router = express.Router();
const authCheck = require("../middleware/authCheck");
const requireAdmin = require("../middleware/requireAdmin");
const { uploadMiddleware } = require("../middleware/weaponUpload");

const {
  getAllWeapons,
  getWeaponById,
  createWeapon,
  updateWeapon,
  deleteWeapon,
  addWeaponImage,
  updateWeaponImage,
  deleteWeaponImage,
} = require("../controllers/weaponController");

// Weapon CRUD routes
router.get("/weapons", authCheck, requireAdmin, getAllWeapons);
router.get("/weapons/:weaponId", authCheck, requireAdmin, getWeaponById);
router.post("/weapons", authCheck, requireAdmin, createWeapon);
router.put("/weapons/:weaponId", authCheck, requireAdmin, updateWeapon);
router.delete("/weapons/:weaponId", authCheck, requireAdmin, deleteWeapon);

// Weapon image routes
router.post(
  "/weapons/:weaponId/images",
  authCheck,
  requireAdmin,
  uploadMiddleware.single("image"),
  addWeaponImage
);
router.put(
  "/weapons/images/:imageId",
  authCheck,
  requireAdmin,
  uploadMiddleware.single("image"),
  updateWeaponImage
);
router.delete("/weapons/images/:imageId", authCheck, requireAdmin, deleteWeaponImage);

module.exports = router;

