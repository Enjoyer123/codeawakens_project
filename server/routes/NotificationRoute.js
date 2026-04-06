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

// Notification CRUD routes (Admin)
router.get("/notifications", authCheck, requireAdmin, getAllNotifications);
router.get("/notifications/:notificationId", authCheck, requireAdmin, getNotificationById);
router.post("/notifications", authCheck, requireAdmin, createNotification);
router.put("/notifications/:notificationId", authCheck, requireAdmin, updateNotification);
router.delete("/notifications/:notificationId", authCheck, requireAdmin, deleteNotification);

// User Notification Routes
router.get("/user/notifications", authCheck, getUserNotifications);
router.put("/user/notifications/:notificationId/read", authCheck, markAsRead);

export default router;
