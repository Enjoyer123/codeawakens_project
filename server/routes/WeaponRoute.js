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

/**
 * @swagger
 * tags:
 *   name: Weapons
 *   description: Robot weapon components configuration
 */

/**
 * @swagger
 * /weapons:
 *   get:
 *     summary: Get all weapons list
 *     tags: [Weapons]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword
 *     responses:
 *       200:
 *         description: Weapons data array & pagination metadata.
 */
router.get("/weapons", authCheck, getAllWeapons);

/**
 * @swagger
 * /weapons/{weaponId}:
 *   get:
 *     summary: Get specific weapon details
 *     tags: [Weapons]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
 *     parameters:
 *       - in: path
 *         name: weaponId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Weapon metadata and stats.
 */
router.get("/weapons/:weaponId", authCheck, getWeaponById);
/**
 * @swagger
 * /weapons:
 *   post:
 *     summary: Create a new weapon (Admin)
 *     tags: [Weapons]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               base_damage:
 *                 type: number
 *               attack_range:
 *                 type: number
 *               attack_speed:
 *                 type: number
 *               price:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Weapon created successfully.
 */
router.post("/weapons", authCheck, requireAdmin, createWeapon);

/**
 * @swagger
 * /weapons/{weaponId}:
 *   put:
 *     summary: Update an existing weapon (Admin)
 *     tags: [Weapons]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: weaponId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Weapon updated successfully.
 */
router.put("/weapons/:weaponId", authCheck, requireAdmin, updateWeapon);

/**
 * @swagger
 * /weapons/{weaponId}:
 *   delete:
 *     summary: Delete a weapon (Admin)
 *     tags: [Weapons]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: weaponId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Weapon deleted.
 */
router.delete("/weapons/:weaponId", authCheck, requireAdmin, deleteWeapon);

/**
 * @swagger
 * /weapons/{weaponId}/images:
 *   post:
 *     summary: Upload an image for a specific weapon (Admin)
 *     tags: [Weapons]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: weaponId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Weapon image uploaded.
 */
router.post(
  "/weapons/:weaponId/images",
  authCheck,
  requireAdmin,
  uploadMiddleware.single("image"),
  addWeaponImage
);

/**
 * @swagger
 * /weapons/images/{imageId}:
 *   put:
 *     summary: Replace an existing weapon image (Admin)
 *     tags: [Weapons]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Weapon image updated.
 */
router.put(
  "/weapons/images/:imageId",
  authCheck,
  requireAdmin,
  uploadMiddleware.single("image"),
  updateWeaponImage
);

/**
 * @swagger
 * /weapons/images/{imageId}:
 *   delete:
 *     summary: Delete a weapon image (Admin)
 *     tags: [Weapons]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Weapon image deleted.
 */
router.delete("/weapons/images/:imageId", authCheck, requireAdmin, deleteWeaponImage);

export default router;

