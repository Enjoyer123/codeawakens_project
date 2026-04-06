import apiClient from './apiClient';

export const fetchDashboardStats = async (getToken) => {
    try {
        return await apiClient.get(getToken, '/dashboard/stats');
    } catch (error) {
        console.error(error);
        return null; // Keep existing error handling semantics
    }
};

export const fetchLevelStats = async (getToken) => {
    try {
        return await apiClient.get(getToken, '/dashboard/levels');
    } catch (error) {
        console.error(error);
        return []; // Keep existing error handling semantics
    }
};

export const fetchUserStats = async (getToken) => {
    try {
        return await apiClient.get(getToken, '/dashboard/users');
    } catch (error) {
        console.error(error);
        return { skillDistribution: [] }; // Keep existing error handling semantics
    }
};

export const fetchTestStats = async (getToken) => {
    try {
        return await apiClient.get(getToken, '/dashboard/tests');
    } catch (error) {
        console.error(error);
        return []; // Keep existing error handling semantics
    }
};
