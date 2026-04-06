const prisma = require("../models/prisma");
const { buildPaginationResponse } = require("../utils/pagination");

async function getAllNotifications({ page, limit, search, skip }) {
  let where = {};
  if (search.trim()) {
    const s = search.toLowerCase();
    where = { OR: [{ title: { contains: s, mode: "insensitive" } }, { message: { contains: s, mode: "insensitive" } }] };
  }
  const total = await prisma.notification.count({ where });
  const notifications = await prisma.notification.findMany({
    where, orderBy: { created_at: "desc" }, skip, take: limit,
    include: { creator: { select: { username: true, email: true } }, _count: { select: { user_notifications: true } } },
  });
  return { notifications, pagination: buildPaginationResponse(page, limit, total) };
}

async function getNotificationById(notificationId) {
  const notification = await prisma.notification.findUnique({
    where: { notification_id: notificationId },
    include: { creator: { select: { username: true, email: true } } },
  });
  if (!notification) { const err = new Error("Notification not found"); err.status = 404; throw err; }
  return notification;
}

async function createNotification(data, clerkId) {
  if (!data.title) { const err = new Error("Title is required"); err.status = 400; throw err; }
  const user = await prisma.user.findUnique({ where: { clerk_user_id: clerkId }, select: { user_id: true } });
  if (!user) { const err = new Error("User not found"); err.status = 404; throw err; }

  return prisma.notification.create({
    data: { title: data.title, message: data.message, is_active: data.is_active ?? true, expires_at: data.expires_at ? new Date(data.expires_at) : null, created_by: user.user_id },
  });
}

async function updateNotification(notificationId, data) {
  const existing = await prisma.notification.findUnique({ where: { notification_id: notificationId } });
  if (!existing) { const err = new Error("Notification not found"); err.status = 404; throw err; }

  return prisma.notification.update({
    where: { notification_id: notificationId },
    data: { title: data.title, message: data.message, is_active: data.is_active, expires_at: data.expires_at ? new Date(data.expires_at) : null },
  });
}

async function deleteNotification(notificationId) {
  const notification = await prisma.notification.findUnique({ where: { notification_id: notificationId } });
  if (!notification) { const err = new Error("Notification not found"); err.status = 404; throw err; }
  await prisma.userNotification.deleteMany({ where: { notification_id: notificationId } });
  await prisma.notification.delete({ where: { notification_id: notificationId } });
}

async function getUserNotifications(clerkId) {
  const user = await prisma.user.findUnique({ where: { clerk_user_id: clerkId }, select: { user_id: true } });
  if (!user) return { notifications: [], unreadCount: 0 };

  const now = new Date();
  const activeNotifications = await prisma.notification.findMany({
    where: { is_active: true, OR: [{ expires_at: null }, { expires_at: { gt: now } }] },
    orderBy: { created_at: "desc" },
    include: { user_notifications: { where: { user_id: user.user_id }, select: { is_read: true } } },
  });

  const notifications = activeNotifications.map((n) => {
    const userNotification = n.user_notifications[0];
    return { ...n, is_read: userNotification ? userNotification.is_read : false, user_notifications: undefined };
  });

  return { notifications, unreadCount: notifications.filter((n) => !n.is_read).length };
}

async function markAsRead(clerkId, notificationId) {
  const user = await prisma.user.findUnique({ where: { clerk_user_id: clerkId }, select: { user_id: true } });
  if (!user) { const err = new Error("User not found"); err.status = 404; throw err; }

  await prisma.userNotification.upsert({
    where: { notification_id_user_id: { notification_id: notificationId, user_id: user.user_id } },
    update: { is_read: true },
    create: { notification_id: notificationId, user_id: user.user_id, is_read: true },
  });
}

module.exports = { getAllNotifications, getNotificationById, createNotification, updateNotification, deleteNotification, getUserNotifications, markAsRead };
