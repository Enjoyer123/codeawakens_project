const notificationService = require("../services/notificationService");
const { parsePagination } = require("../utils/pagination");

exports.getAllNotifications = async (req, res) => {
  try {
    const paginationData = parsePagination(req.query);
    const result = await notificationService.getAllNotifications(paginationData);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching notifications",
    });
  }
};

exports.getNotificationById = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.notificationId);
    const result = await notificationService.getNotificationById(notificationId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching notification:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching notification",
    });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const result = await notificationService.createNotification(req.body);
    
    res.status(201).json({
      message: "Notification created successfully",
      notification: result,
    });
  } catch (error) {
    console.error("Error creating notification:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error creating notification",
    });
  }
};

exports.updateNotification = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.notificationId);
    const result = await notificationService.updateNotification(notificationId, req.body);
    
    res.status(200).json({
      message: "Notification updated successfully",
      notification: result,
    });
  } catch (error) {
    console.error("Error updating notification:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error updating notification",
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.notificationId);
    await notificationService.deleteNotification(notificationId);
    
    res.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting notification",
    });
  }
};

exports.getUserNotifications = async (req, res) => {
  const clerkUserId = req.user.id;
  console.log(`[NOTIFICATION] User ${clerkUserId} viewing notifications.`);
  
  try {
    const paginationData = parsePagination(req.query);
    const result = await notificationService.getUserNotifications(clerkUserId, paginationData, req.query);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching user notifications:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching user notifications",
    });
  }
};

exports.markAsRead = async (req, res) => {
  const clerkUserId = req.user.id;
  
  try {
    const notificationId = parseInt(req.params.notificationId);
    const result = await notificationService.markAsRead(notificationId, clerkUserId);
    
    res.status(200).json({
      message: "Notification marked as read successfully",
      status: result,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error marking notification as read",
    });
  }
};
