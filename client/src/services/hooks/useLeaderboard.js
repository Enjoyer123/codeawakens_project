import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { fetchLeaderboard } from '../api/leaderboardService';

export const useLeaderboard = () => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['leaderboard'],
        queryFn: () => fetchLeaderboard(getToken),
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });
};
