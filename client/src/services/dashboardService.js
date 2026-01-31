import { API_BASE_URL } from '../config/apiConfig';

export const fetchDashboardStats = async (getToken) => {
    try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch dashboard stats');
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const fetchLevelStats = async (getToken) => {
    try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/api/dashboard/levels`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch level stats');
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const fetchUserStats = async (getToken) => {
    try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/api/dashboard/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch user stats');
        return await response.json();
    } catch (error) {
        console.error(error);
        return { skillDistribution: [] };
    }
};

export const fetchTestStats = async (getToken) => {
    try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/api/dashboard/tests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch test stats');
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
};
