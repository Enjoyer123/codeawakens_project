import apiClient from './apiClient';

export const fetchLeaderboard = async (getToken) => {
    try {
        return await apiClient.get(getToken, '/leaderboard');
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        throw error;
    }
};
