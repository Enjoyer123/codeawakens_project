import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
    fetchAllNotifications,
    getNotificationById,
    createNotification,
    updateNotification,
    deleteNotification,
    fetchUserNotifications,
    markNotificationAsRead
} from '../notificationService';

// Admin: Fetch all notifications
export const useNotifications = (page = 1, limit = 10, search = '') => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['notifications', page, limit, search],
        queryFn: () => fetchAllNotifications(getToken, page, limit, search),
        enabled: !!getToken,
        staleTime: 0,
        gcTime: 0,
    });
};

// Admin: Get Notification by ID
export const useNotification = (notificationId) => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['notification', notificationId],
        queryFn: () => getNotificationById(getToken, notificationId),
        enabled: !!getToken && !!notificationId,
        staleTime: 0,
        gcTime: 0,
    });
};

// Admin: Create Notification
export const useCreateNotification = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationData) => createNotification(getToken, notificationData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

// Admin: Update Notification
export const useUpdateNotification = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ notificationId, notificationData }) => updateNotification(getToken, notificationId, notificationData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notification', variables.notificationId] });
        },
    });
};

// Admin: Delete Notification
export const useDeleteNotification = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId) => deleteNotification(getToken, notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

// User: Fetch User Notifications
export const useUserNotifications = () => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['userNotifications'],
        queryFn: () => fetchUserNotifications(getToken),
        enabled: !!getToken,
        refetchInterval: 30000, // Poll every 30s as in original code
        staleTime: 1000 * 20, // 20s stale time
    });
};

// User: Mark as Read
export const useMarkNotificationAsRead = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId) => markNotificationAsRead(getToken, notificationId),
        onSuccess: () => {
            // We could optimistically update, but invalidating is safer
            queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
        },
        // We will implement optimistic updates in the component if needed, 
        // or here if we want to get fancy with onMutate.
        // For now, invalidation is sufficient.
    });
};
