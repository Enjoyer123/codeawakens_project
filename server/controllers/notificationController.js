const notificationService = require("../services/notificationService");
const { parsePagination } = require("../utils/pagination");

exports.getAllNotifications = async (req, res) => {
  try { res.json(await notificationService.getAllNotifications(parsePagination(req.query))); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error fetching notifications" }); }
};
exports.getNotificationById = async (req, res) => {
  try { const notification = await notificationService.getNotificationById(parseInt(req.params.notificationId)); res.json({ notification }); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error fetching notification" }); }
};
exports.createNotification = async (req, res) => {
  const clerkId = req.user.id;
  console.log(`[ADMIN] Admin ${clerkId} creating notification "${req.body.title}".`);
  try {
    const notification = await notificationService.createNotification(req.body, clerkId);
    console.log(`[ADMIN] Success: Notification ${notification.notification_id} created by Admin ${clerkId}.`);
    res.status(201).json({ message: "Notification created successfully", notification });
  } catch (e) { res.status(e.status || 500).json({ message: e.message || "Error creating notification" }); }
};
exports.updateNotification = async (req, res) => {
  try {
    const notification = await notificationService.updateNotification(parseInt(req.params.notificationId), req.body);
    res.json({ message: "Notification updated successfully", notification });
  } catch (e) { res.status(e.status || 500).json({ message: e.message || "Error updating notification" }); }
};
exports.deleteNotification = async (req, res) => {
  const clerkId = req.user.id;
  const { notificationId } = req.params;
  console.log(`[ADMIN] Admin ${clerkId} deleting notification ${notificationId}.`);
  try {
    await notificationService.deleteNotification(parseInt(notificationId));
    console.log(`[ADMIN] Success: Notification ${notificationId} deleted by Admin ${clerkId}.`);
    res.json({ message: "Notification deleted successfully" });
  } catch (e) { res.status(e.status || 500).json({ message: e.message || "Error deleting notification" }); }
};
exports.getUserNotifications = async (req, res) => {
  const clerkId = req.user.id;
  console.log(`[NOTIFICATION] User ${clerkId} viewing notifications.`);
  try { res.json(await notificationService.getUserNotifications(clerkId)); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error fetching user notifications" }); }
};
exports.markAsRead = async (req, res) => {
  const clerkId = req.user.id;
  console.log(`[NOTIFICATION] User ${clerkId} marking notification ${req.params.notificationId} as read.`);
  try { await notificationService.markAsRead(clerkId, parseInt(req.params.notificationId)); res.json({ success: true }); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error marking notification as read" }); }
};
