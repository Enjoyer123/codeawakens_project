import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import { uploadMiddleware } from "../middleware/upload.js";

import {
  checkProfile,
  updateUsername,
  uploadProfileImage,
  deleteProfileImage,
  getUserByClerkId,
  saveUserProgress,
  checkAndAwardRewards
} from "../controllers/profileController.js";

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile and progression management
 */

/**
 * @swagger
 * /profile/check-profile:
 *   get:
 *     summary: Check and create user profile
 *     description: Checks if the user exists based on Clerk token. If not, auto-creates the user.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
 *     responses:
 *       200:
 *         description: Profile object returned (either newly created or fetched).
 */
router.get("/profile/check-profile", authCheck, checkProfile);

/**
 * @swagger
 * /profile/user:
 *   get:
 *     summary: Get current authenticated user details
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
 *     responses:
 *       200:
 *         description: Full user profile including stats and weapons.
 */
router.get("/profile/user", authCheck, getUserByClerkId);

/**
 * @swagger
 * /profile/username:
 *   put:
 *     summary: Update profile username
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Username updated successfully.
 */
router.put("/profile/username", authCheck, updateUsername);

/**
 * @swagger
 * /profile/image:
 *   post:
 *     summary: Upload profile avatar
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully.
 */
router.post("/profile/image", authCheck, uploadMiddleware.single("profileImage"), uploadProfileImage);

/**
 * @swagger
 * /profile/image:
 *   delete:
 *     summary: Remove profile avatar
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
 *     responses:
 *       200:
 *         description: Image removed successfully.
 */
router.delete("/profile/image", authCheck, deleteProfileImage);

/**
 * @swagger
 * /profile/progress:
 *   post:
 *     summary: Save gameplay progress
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               level_id:
 *                 type: integer
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Progress saved and evaluated securely.
 */
router.post("/profile/progress", authCheck, saveUserProgress);

/**
 * @swagger
 * /profile/rewards/check:
 *   post:
 *     summary: Check and award unlocked objects based on database progression
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               level_id:
 *                 type: integer
 *                 description: The level ID to check rewards for
 *     responses:
 *       200:
 *         description: List of newly awarded rewards (Security patched to ignore arbitrary frontend scores).
 */
router.post("/profile/rewards/check", authCheck, checkAndAwardRewards);

export default router;
