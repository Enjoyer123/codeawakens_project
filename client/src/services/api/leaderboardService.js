import { API_BASE_URL } from '../../config/apiConfig';

export const fetchLeaderboard = async (getToken) => {
    try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/leaderboard`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to fetch leaderboard' }));
            throw new Error(errorData.message || 'Failed to fetch leaderboard');
        }

        const json = await response.json();
        return json.data;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        throw error;
    }
};
