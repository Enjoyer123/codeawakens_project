import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
    fetchDashboardStats,
    fetchLevelStats,
    fetchUserStats,
    fetchTestStats
} from '../dashboardService';

// Dashboard Overview Stats
export const useDashboardStats = () => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: () => fetchDashboardStats(getToken),
        enabled: !!getToken,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
};

// Level Distribution Stats
export const useLevelStats = () => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['dashboard', 'levelStats'],
        queryFn: () => fetchLevelStats(getToken),
        enabled: !!getToken,
        staleTime: 5 * 60 * 1000,
    });
};

// User Skill Stats
export const useUserStats = () => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['dashboard', 'userStats'],
        queryFn: () => fetchUserStats(getToken),
        enabled: !!getToken,
        staleTime: 5 * 60 * 1000,
    });
};

// Test Performance Stats
export const useTestStats = () => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['dashboard', 'testStats'],
        queryFn: () => fetchTestStats(getToken),
        enabled: !!getToken,
        staleTime: 5 * 60 * 1000,
    });
};
