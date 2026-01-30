import axios from 'axios';

import { API_BASE_URL } from '../config/apiConfig';

export const fetchAllNotifications = async (getToken, page = 1, limit = 10, search = '') => {
    const token = await getToken();
    try {
        const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
            params: { page, limit, search },
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getNotificationById = async (getToken, notificationId) => {
    const token = await getToken();
    try {
        const response = await axios.get(`${API_BASE_URL}/api/notifications/${notificationId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const createNotification = async (getToken, notificationData) => {
    const token = await getToken();
    try {
        const response = await axios.post(`${API_BASE_URL}/api/notifications`, notificationData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const updateNotification = async (getToken, notificationId, notificationData) => {
    const token = await getToken();
    try {
        const response = await axios.put(`${API_BASE_URL}/api/notifications/${notificationId}`, notificationData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const deleteNotification = async (getToken, notificationId) => {
    const token = await getToken();
    try {
        const response = await axios.delete(`${API_BASE_URL}/api/notifications/${notificationId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const fetchUserNotifications = async (getToken) => {
    const token = await getToken();
    try {
        const response = await axios.get(`${API_BASE_URL}/api/user/notifications`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const markNotificationAsRead = async (getToken, notificationId) => {
    const token = await getToken();
    try {
        const response = await axios.put(`${API_BASE_URL}/api/user/notifications/${notificationId}/read`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
