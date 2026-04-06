import apiClient from './apiClient';

export const fetchAllNotifications = async (getToken, page = 1, limit = 10, search = '') => {
    try {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (search.trim()) params.append('search', search);

        return await apiClient.get(getToken, `/notifications?${params.toString()}`);
    } catch (error) { throw error; }
};

export const getNotificationById = async (getToken, notificationId) => {
    try {
        return await apiClient.get(getToken, `/notifications/${notificationId}`);
    } catch (error) { throw error; }
};

export const createNotification = async (getToken, notificationData) => {
    try {
        return await apiClient.post(getToken, '/notifications', notificationData);
    } catch (error) { throw error; }
};

export const updateNotification = async (getToken, notificationId, notificationData) => {
    try {
        return await apiClient.put(getToken, `/notifications/${notificationId}`, notificationData);
    } catch (error) { throw error; }
};

export const deleteNotification = async (getToken, notificationId) => {
    try {
        return await apiClient.delete(getToken, `/notifications/${notificationId}`);
    } catch (error) { throw error; }
};

export const fetchUserNotifications = async (getToken) => {
    try {
        return await apiClient.get(getToken, '/user/notifications');
    } catch (error) { throw error; }
};

export const markNotificationAsRead = async (getToken, notificationId) => {
    try {
        return await apiClient.put(getToken, `/user/notifications/${notificationId}/read`, {});
    } catch (error) { throw error; }
};
