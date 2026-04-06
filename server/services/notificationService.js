import * as notifRepo from "../models/notificationModel.js";
import { buildPaginationResponse } from "../utils/pagination.js";

export const getAllNotifications = async ({ page, limit, search, skip }) => {
  let where = {};
  if (search.trim()) {
    const s = search.toLowerCase();
    where = { OR: [{ title: { contains: s, mode: "insensitive" } }, { message: { contains: s, mode: "insensitive" } }] };
  }
  const total = await notifRepo.countNotifications(where);
  const notifications = await notifRepo.findManyNotifications(where, skip, limit);
  return { notifications, pagination: buildPaginationResponse(page, limit, total) };
}

export const getNotificationById = async (notificationId) => {
  const notification = await notifRepo.findNotificationById(notificationId);
  if (!notification) { const err = new Error("Notification not found"); err.status = 404; throw err; }
  return notification;
}

export const createNotification = async (data, clerkId) => {
  if (!data.title) { const err = new Error("Title is required"); err.status = 400; throw err; }
  const user = await notifRepo.findUserByClerkId(clerkId);
  if (!user) { const err = new Error("User not found"); err.status = 404; throw err; }

  return notifRepo.createNotification({  title: data.title, message: data.message, is_active: data.is_active ?? true, expires_at: data.expires_at ? new Date(data.expires_at) : null, created_by: user.user_id  });
}

export const updateNotification = async (notificationId, data) => {
  const existing = await notifRepo.findSimpleNotificationById(notificationId);
  if (!existing) { const err = new Error("Notification not found"); err.status = 404; throw err; }

  return notifRepo.updateNotification(notificationId, {  title: data.title, message: data.message, is_active: data.is_active, expires_at: data.expires_at ? new Date(data.expires_at) : null  });
}

export const deleteNotification = async (notificationId) => {
  const notification = await notifRepo.findSimpleNotificationById(notificationId);
  if (!notification) { const err = new Error("Notification not found"); err.status = 404; throw err; }
  await notifRepo.deleteUserNotifications(notificationId);
  await notifRepo.deleteNotification(notificationId);
}

export const getUserNotifications = async (clerkId) => {
  const user = await notifRepo.findUserByClerkId(clerkId);
  if (!user) return { notifications: [], unreadCount: 0 };

  const now = new Date();
  const activeNotifications = await notifRepo.findActiveNotifications(user.user_id, now);

  const notifications = activeNotifications.map((n) => {
    const userNotification = n.user_notifications[0];
    return { ...n, is_read: userNotification ? userNotification.is_read : false, user_notifications: undefined };
  });

  return { notifications, unreadCount: notifications.filter((n) => !n.is_read).length };
}

export const markAsRead = async (clerkId, notificationId) => {
  const user = await notifRepo.findUserByClerkId(clerkId);
  if (!user) { const err = new Error("User not found"); err.status = 404; throw err; }

  await notifRepo.upsertUserNotification(notificationId, user.user_id);
}


