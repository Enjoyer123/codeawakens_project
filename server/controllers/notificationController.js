import * as notificationService from "../services/notificationService.js";
import { parsePagination } from "../utils/pagination.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export const getAllNotifications = async (req, res) => {
  try {
    const paginationData = parsePagination(req.query);
    const result = await notificationService.getAllNotifications(paginationData);
    
    sendSuccess(res, result, "Notifications fetched successfully");
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    sendError(res, error.message || "Error fetching notifications", error.status || 500);
  }
};

export const getNotificationById = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.notificationId);
    const result = await notificationService.getNotificationById(notificationId);
    
    sendSuccess(res, result, "Notification fetched successfully");
  } catch (error) {
    console.error("Error fetching notification:", error.message);
    sendError(res, error.message || "Error fetching notification", error.status || 500);
  }
};

export const createNotification = async (req, res) => {
  try {
    const result = await notificationService.createNotification(req.body);
    
    sendSuccess(res, { notification: result }, "Notification created successfully", 201);
  } catch (error) {
    console.error("Error creating notification:", error.message);
    sendError(res, error.message || "Error creating notification", error.status || 500);
  }
};

export const updateNotification = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.notificationId);
    const result = await notificationService.updateNotification(notificationId, req.body);
    
    sendSuccess(res, { notification: result }, "Notification updated successfully");
  } catch (error) {
    console.error("Error updating notification:", error.message);
    sendError(res, error.message || "Error updating notification", error.status || 500);
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.notificationId);
    await notificationService.deleteNotification(notificationId);
    
    sendSuccess(res, null, "Notification deleted successfully");
  } catch (error) {
    console.error("Error deleting notification:", error.message);
    sendError(res, error.message || "Error deleting notification", error.status || 500);
  }
};

export const getUserNotifications = async (req, res) => {
  const clerkUserId = req.user.id;
  console.log(`[NOTIFICATION] User ${clerkUserId} viewing notifications.`);
  
  try {
    const paginationData = parsePagination(req.query);
    const result = await notificationService.getUserNotifications(clerkUserId, paginationData, req.query);
    
    sendSuccess(res, result, "User notifications fetched successfully");
  } catch (error) {
    console.error("Error fetching user notifications:", error.message);
    sendError(res, error.message || "Error fetching user notifications", error.status || 500);
  }
};

export const markAsRead = async (req, res) => {
  const clerkUserId = req.user.id;
  
  try {
    const notificationId = parseInt(req.params.notificationId);
    const result = await notificationService.markAsRead(notificationId, clerkUserId);
    
    sendSuccess(res, { status: result }, "Notification marked as read successfully");
  } catch (error) {
    console.error("Error marking notification as read:", error.message);
    sendError(res, error.message || "Error marking notification as read", error.status || 500);
  }
};
