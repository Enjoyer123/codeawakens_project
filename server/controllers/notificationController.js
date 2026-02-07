const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all notifications with pagination and search
exports.getAllNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        let where = {};
        if (search.trim()) {
            const searchLower = search.toLowerCase();
            where = {
                OR: [
                    { title: { contains: searchLower, mode: 'insensitive' } },
                    { message: { contains: searchLower, mode: 'insensitive' } },
                ],
            };
        }

        const total = await prisma.notification.count({ where });

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: {
                created_at: "desc",
            },
            skip,
            take: limit,
            include: {
                creator: {
                    select: {
                        username: true,
                        email: true
                    }
                },
                _count: {
                    select: { user_notifications: true }
                }
            }
        });

        res.json({
            notifications,
            pagination: {
                total,
                totalPages: Math.ceil(total / limit),
                page,
                limit,
            },
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Error fetching notifications", error: error.message });
    }
};

// Get notification by ID
exports.getNotificationById = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await prisma.notification.findUnique({
            where: { notification_id: parseInt(notificationId) },
            include: {
                creator: {
                    select: {
                        username: true,
                        email: true
                    }
                }
            }
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({ notification });
    } catch (error) {
        console.error("Error fetching notification:", error);
        res.status(500).json({ message: "Error fetching notification", error: error.message });
    }
};

// Create notification
exports.createNotification = async (req, res) => {
    try {
        const { title, message, is_active, expires_at } = req.body;
        const clerkId = req.user.id; // From auth middleware (Clerk User)

        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }

        const user = await prisma.user.findUnique({
            where: { clerk_user_id: clerkId },
            select: { user_id: true }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log(`[ADMIN] Admin ${clerkId} creating notification "${title}".`);

        const notification = await prisma.notification.create({
            data: {
                title,
                message,
                is_active: is_active ?? true,
                expires_at: expires_at ? new Date(expires_at) : null,
                created_by: user.user_id
            },
        });

        console.log(`[ADMIN] Success: Notification ${notification.notification_id} created by Admin ${clerkId}.`);

        res.status(201).json({
            message: "Notification created successfully",
            notification,
        });
    } catch (error) {
        console.error("Error creating notification:", error);
        res.status(500).json({ message: "Error creating notification", error: error.message });
    }
};

// Update notification
exports.updateNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { title, message, is_active, expires_at } = req.body;

        const existingNotification = await prisma.notification.findUnique({
            where: { notification_id: parseInt(notificationId) }
        });

        if (!existingNotification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        const notification = await prisma.notification.update({
            where: { notification_id: parseInt(notificationId) },
            data: {
                title,
                message,
                is_active,
                expires_at: expires_at ? new Date(expires_at) : null, // Handle null explicitly if cleared
            },
        });

        res.json({
            message: "Notification updated successfully",
            notification,
        });
    } catch (error) {
        console.error("Error updating notification:", error);
        res.status(500).json({ message: "Error updating notification", error: error.message });
    }
};
// Delete notification
exports.deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;

        // Check if notification exists
        const notification = await prisma.notification.findUnique({
            where: { notification_id: parseInt(notificationId) }
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        const adminClerkId = req.user.id;
        console.log(`[ADMIN] Admin ${adminClerkId} deleting notification ${notificationId}.`);

        // Delete associated UserNotifications first to avoid FK constraint errors if cascade isn't automatic
        await prisma.userNotification.deleteMany({
            where: { notification_id: parseInt(notificationId) }
        });

        await prisma.notification.delete({
            where: { notification_id: parseInt(notificationId) },
        });

        console.log(`[ADMIN] Success: Notification ${notificationId} deleted by Admin ${adminClerkId}.`);

        res.json({
            message: "Notification deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ message: "Error deleting notification", error: error.message });
    }
};

// Get notifications for current user
exports.getUserNotifications = async (req, res) => {
    try {
        const clerkId = req.user.id;

        // Find internal user ID
        const user = await prisma.user.findUnique({
            where: { clerk_user_id: clerkId },
            select: { user_id: true }
        });

        if (!user) {
            return res.json({ notifications: [], unreadCount: 0 }); // Or 404, but empty list is safer for UI
        }

        const userId = user.user_id;
        const now = new Date();

        console.log(`[NOTIFICATION] User ${clerkId} viewing notifications.`);

        // Fetch all active notifications that haven't expired
        const activeNotifications = await prisma.notification.findMany({
            where: {
                is_active: true,
                OR: [
                    { expires_at: null },
                    { expires_at: { gt: now } }
                ]
            },
            orderBy: {
                created_at: 'desc',
            },
            include: {
                user_notifications: {
                    where: { user_id: userId },
                    select: { is_read: true }
                }
            }
        });

        // Transform to add is_read flag
        const notifications = activeNotifications.map(n => {
            const userNotification = n.user_notifications[0];
            return {
                ...n,
                is_read: userNotification ? userNotification.is_read : false,
                user_notifications: undefined // Remove internal relation data
            };
        });

        const unreadCount = notifications.filter(n => !n.is_read).length;

        res.json({
            notifications,
            unreadCount
        });

    } catch (error) {
        console.error("Error fetching user notifications:", error);
        res.status(500).json({ message: "Error fetching user notifications", error: error.message });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const clerkId = req.user.id;
        const { notificationId } = req.params;

        const user = await prisma.user.findUnique({
            where: { clerk_user_id: clerkId },
            select: { user_id: true }
        });

        if (!user) return res.status(404).json({ message: "User not found" });

        console.log(`[NOTIFICATION] User ${clerkId} marking notification ${notificationId} as read.`);

        // Upsert UserNotification record
        await prisma.userNotification.upsert({
            where: {
                notification_id_user_id: {
                    notification_id: parseInt(notificationId),
                    user_id: user.user_id
                }
            },
            update: {
                is_read: true,
                read_at: new Date()
            },
            create: {
                notification_id: parseInt(notificationId),
                user_id: user.user_id,
                is_read: true,
                read_at: new Date()
            }
        });

        res.json({ success: true });

    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ message: "Error marking notification as read", error: error.message });
    }
};
