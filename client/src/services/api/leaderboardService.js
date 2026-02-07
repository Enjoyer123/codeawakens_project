import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

export const fetchLeaderboard = async (getToken) => {
    try {
        const token = await getToken();
        const config = {};
        if (token) {
            config.headers = {
                Authorization: `Bearer ${token}`,
            };
        }
        const response = await axios.get(`${API_BASE_URL}/leaderboard`, config);
        return response.data;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        throw error;
    }
};
