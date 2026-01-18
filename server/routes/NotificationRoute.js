const express = require("express");
const router = express.Router();
const authCheck = require("../middleware/authCheck");
const requireAdmin = require("../middleware/requireAdmin");

const {
    getAllNotifications,
    getNotificationById,
    createNotification,
    updateNotification,
    deleteNotification,
    getUserNotifications,
    markAsRead,
} = require("../controllers/notificationController");

// Notification CRUD routes (Admin)
router.get("/notifications", authCheck, requireAdmin, getAllNotifications);
router.get("/notifications/:notificationId", authCheck, requireAdmin, getNotificationById);
router.post("/notifications", authCheck, requireAdmin, createNotification);
router.put("/notifications/:notificationId", authCheck, requireAdmin, updateNotification);
router.delete("/notifications/:notificationId", authCheck, requireAdmin, deleteNotification);

// User Notification Routes
router.get("/user/notifications", authCheck, getUserNotifications);
router.put("/user/notifications/:notificationId/read", authCheck, markAsRead);

module.exports = router;
