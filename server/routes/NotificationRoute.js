import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import requireAdmin from "../middleware/requireAdmin.js";

import {
    getAllNotifications,
    getNotificationById,
    createNotification,
    updateNotification,
    deleteNotification,
    getUserNotifications,
    markAsRead,
} from "../controllers/notificationController.js";

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all notifications (Admin)
 *     tags: [Notifications]
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
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword
 *     responses:
 *       200:
 *         description: Notifications list & pagination metadata.
 */
router.get("/notifications", authCheck, requireAdmin, getAllNotifications);
/**
 * @swagger
 * /notifications/{notificationId}:
 *   get:
 *     summary: Get a specific notification by ID (Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification details.
 */
router.get("/notifications/:notificationId", authCheck, requireAdmin, getNotificationById);

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Create a system-wide or user-specific notification (Admin)
 *     tags: [Notifications]
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
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               is_global:
 *                 type: boolean
 *               user_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Notification created.
 */
router.post("/notifications", authCheck, requireAdmin, createNotification);

/**
 * @swagger
 * /notifications/{notificationId}:
 *   put:
 *     summary: Update an existing notification (Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
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
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notification updated.
 */
router.put("/notifications/:notificationId", authCheck, requireAdmin, updateNotification);

/**
 * @swagger
 * /notifications/{notificationId}:
 *   delete:
 *     summary: Delete a notification (Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - devAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification deleted.
 */
router.delete("/notifications/:notificationId", authCheck, requireAdmin, deleteNotification);

/**
 * @swagger
 * /user/notifications:
 *   get:
 *     summary: Get authenticated user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
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
 *         description: Items per page
 *     responses:
 *       200:
 *         description: User notifications list & pagination metadata.
 */
router.get("/user/notifications", authCheck, getUserNotifications);

/**
 * @swagger
 * /user/notifications/{notificationId}/read:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - devUserAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification marked as read.
 */
router.put("/user/notifications/:notificationId/read", authCheck, markAsRead);

export default router;
