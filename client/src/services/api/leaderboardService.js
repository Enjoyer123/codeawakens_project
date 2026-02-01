import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

export const fetchLeaderboard = async (getToken) => {
    const token = await getToken();
    const response = await axios.get(`${API_BASE_URL}/api/leaderboard`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};
