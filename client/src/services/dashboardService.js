import { API_BASE_URL } from '../config/apiConfig';

export const fetchDashboardStats = async (getToken) => {
    try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch dashboard stats');
        const json = await response.json();
        return json.data;
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const fetchLevelStats = async (getToken) => {
    try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/dashboard/levels`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch level stats');
        const json = await response.json();
        return json.data;
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const fetchUserStats = async (getToken) => {
    try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/dashboard/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch user stats');
        const json = await response.json();
        return json.data;
    } catch (error) {
        console.error(error);
        return { skillDistribution: [] };
    }
};

export const fetchTestStats = async (getToken) => {
    try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/dashboard/tests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch test stats');
        const json = await response.json();
        return json.data;
    } catch (error) {
        console.error(error);
        return [];
    }
};
