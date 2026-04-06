import { API_BASE_URL } from '../config/apiConfig';

export const fetchAllNotifications = async (getToken, page = 1, limit = 10, search = '') => {
    try {
        const token = await getToken();
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (search.trim()) params.append('search', search);

        const response = await fetch(`${API_BASE_URL}/notifications?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to fetch notifications' }));
            throw new Error(errorData.message || 'Failed to fetch notifications');
        }

        const json = await response.json();
        return json.data;
    } catch (error) {
        throw error;
    }
};

export const getNotificationById = async (getToken, notificationId) => {
    try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to fetch notification' }));
            throw new Error(errorData.message || 'Failed to fetch notification');
        }

        const json = await response.json();
        return json.data;
    } catch (error) {
        throw error;
    }
};

export const createNotification = async (getToken, notificationData) => {
    try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(notificationData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to create notification' }));
            throw new Error(errorData.message || 'Failed to create notification');
        }

        const json = await response.json();
        return json.data;
    } catch (error) {
        throw error;
    }
};

export const updateNotification = async (getToken, notificationId, notificationData) => {
    try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(notificationData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to update notification' }));
            throw new Error(errorData.message || 'Failed to update notification');
        }

        const json = await response.json();
        return json.data;
    } catch (error) {
        throw error;
    }
};

export const deleteNotification = async (getToken, notificationId) => {
    try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to delete notification' }));
            throw new Error(errorData.message || 'Failed to delete notification');
        }

        const json = await response.json();
        return json.data;
    } catch (error) {
        throw error;
    }
};

export const fetchUserNotifications = async (getToken) => {
    try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/user/notifications`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to fetch user notifications' }));
            throw new Error(errorData.message || 'Failed to fetch user notifications');
        }

        const json = await response.json();
        return json.data;
    } catch (error) {
        throw error;
    }
};

export const markNotificationAsRead = async (getToken, notificationId) => {
    try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/user/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to mark notification as read' }));
            throw new Error(errorData.message || 'Failed to mark notification as read');
        }

        const json = await response.json();
        return json.data;
    } catch (error) {
        throw error;
    }
};
