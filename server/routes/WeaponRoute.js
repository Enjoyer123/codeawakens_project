import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import requireAdmin from "../middleware/requireAdmin.js";
import { uploadMiddleware } from "../middleware/weaponUpload.js";

import {
  getAllWeapons,
  getWeaponById,
  createWeapon,
  updateWeapon,
  deleteWeapon,
  addWeaponImage,
  updateWeaponImage,
  deleteWeaponImage,
} from "../controllers/weaponController.js";

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

export default router;

