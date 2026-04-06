import prisma from "./prisma.js";

export const countNotifications = async (where) => prisma.notification.count({ where });
export const findManyNotifications = async (where, skip, limit) => prisma.notification.findMany({ where, orderBy: { created_at: "desc" }, skip, take: limit, include: { creator: { select: { username: true, email: true } }, _count: { select: { user_notifications: true } } } });
export const findNotificationById = async (notificationId) => prisma.notification.findUnique({ where: { notification_id: notificationId }, include: { creator: { select: { username: true, email: true } } } });
export const findUserByClerkId = async (clerkId) => prisma.user.findUnique({ where: { clerk_user_id: clerkId }, select: { user_id: true } });
export const createNotification = async (data) => prisma.notification.create({ data });
export const updateNotification = async (notificationId, data) => prisma.notification.update({ where: { notification_id: notificationId }, data });
export const findSimpleNotificationById = async (notificationId) => prisma.notification.findUnique({ where: { notification_id: notificationId } });
export const deleteUserNotifications = async (notificationId) => prisma.userNotification.deleteMany({ where: { notification_id: notificationId } });
export const deleteNotification = async (notificationId) => prisma.notification.delete({ where: { notification_id: notificationId } });
export const findActiveNotifications = async (userId, now) => prisma.notification.findMany({ where: { is_active: true, OR: [{ expires_at: null }, { expires_at: { gt: now } }] }, orderBy: { created_at: "desc" }, include: { user_notifications: { where: { user_id: userId }, select: { is_read: true } } } });
export const upsertUserNotification = async (notificationId, userId) => prisma.userNotification.upsert({ where: { notification_id_user_id: { notification_id: notificationId, user_id: userId } }, update: { is_read: true }, create: { notification_id: notificationId, user_id: userId, is_read: true } });
