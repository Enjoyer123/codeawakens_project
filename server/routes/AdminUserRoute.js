import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import requireAdmin from "../middleware/requireAdmin.js";

import {
  getAllUsers,
  updateUserRole,
  getUserDetails,

  deleteUser,
  resetUserTestScore,
  getUserTestHistory
} from "../controllers/adminUserController.js";

/**
 * @swagger
 * tags:
 *   name: Admin Users
 *   description: Administrator user management and moderation
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users with their roles (Admin)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page (default 5)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by username or email
 *     responses:
 *       200:
 *         description: Array of users & pagination metadata.
 */
router.get("/users", authCheck, requireAdmin, getAllUsers);
/**
 * @swagger
 * /users/{userId}/details:
 *   get:
 *     summary: Get detailed information of a specific user
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Clerk User ID
 *     responses:
 *       200:
 *         description: User details object.
 */
router.get("/users/:userId/details", authCheck, requireAdmin, getUserDetails);

/**
 * @swagger
 * /users/{userId}/role:
 *   put:
 *     summary: Update a user's role (e.g. user to admin)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: User role updated successfully.
 */
router.put("/users/:userId/role", authCheck, requireAdmin, updateUserRole);

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     summary: Delete a user permanently
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully.
 */
router.delete("/users/:userId", authCheck, requireAdmin, deleteUser);

/**
 * @swagger
 * /users/{userId}/reset-test:
 *   post:
 *     summary: Reset a user's pre-test or post-test score
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               testType:
 *                 type: string
 *                 enum: [PreTest, PostTest]
 *     responses:
 *       200:
 *         description: Test score reset successfully.
 */
router.post("/users/:userId/reset-test", authCheck, requireAdmin, resetUserTestScore);

/**
 * @swagger
 * /users/{userId}/tests:
 *   get:
 *     summary: Get a user's test history
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of test history records.
 */
router.get("/users/:userId/tests", authCheck, requireAdmin, getUserTestHistory);

export default router;
