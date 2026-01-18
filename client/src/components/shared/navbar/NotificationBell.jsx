import { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchUserNotifications, markNotificationAsRead } from '@/services/notificationService';
import { formatDate } from '@/utils/formatters';

const NotificationBell = () => {
    const { getToken, userId } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        try {
            const data = await fetchUserNotifications(getToken);
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchNotifications();
            // Optional: proper interval polling or socket could go here
            const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
            return () => clearInterval(interval);
        }
    }, [userId, getToken]);

    const handleRead = async (notification) => {
        if (notification.is_read) return;

        try {
            // Optimistic update
            const updatedNotifications = notifications.map(n =>
                n.notification_id === notification.notification_id
                    ? { ...n, is_read: true }
                    : n
            );
            setNotifications(updatedNotifications);
            setUnreadCount(prev => Math.max(0, prev - 1));

            await markNotificationAsRead(getToken, notification.notification_id);
            // Re-fetch to be sure sync is correct or just trust optimistic
        } catch (error) {
            console.error("Failed to mark as read:", error);
            // Revert on error
            fetchNotifications();
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button className="relative p-2 text-gray-400 hover:text-white transition-colors focus:outline-none rounded-full hover:bg-gray-700">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
                            <Bell className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <button
                                    key={notification.notification_id}
                                    onClick={() => handleRead(notification)}
                                    className={`flex flex-col items-start w-full p-4 text-left transition-colors border-b last:border-0 hover:bg-muted/50 ${!notification.is_read ? 'bg-blue-50/50' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between w-full gap-2 mb-1">
                                        <span className={`text-sm font-medium ${!notification.is_read ? 'text-primary' : ''}`}>
                                            {notification.title}
                                        </span>
                                        {!notification.is_read && (
                                            <span className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
                                        {notification.message}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground">
                                        {formatDate(notification.created_at)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};

export default NotificationBell;
