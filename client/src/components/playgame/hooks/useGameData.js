import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { getUserByClerkId } from '../../../services/profileService';
import { fetchAllLevels } from '../../../services/levelService';

// Fetch user profile (which contains user_progress)
export const useUserProfile = () => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['userProfile'],
        queryFn: () => getUserByClerkId(getToken),
        enabled: !!getToken,
        staleTime: 1000 * 60 * 5, // 5 minutes (profile doesn't change often automatically)
        // However, we might want to invalidate this after level completion
    });
};

// Fetch all levels (for mapping IDs to data in history ?)
// GameCore fetches all levels to pass to something? 
// In GameCore it sets `setAllLevelsData`.
export const useAllLevels = () => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['allLevels'],
        queryFn: () => fetchAllLevels(getToken, 1, 1000), // Large limit
        enabled: !!getToken,
        staleTime: 1000 * 60 * 30, // 30 minutes (levels are static mostly)
    });
};

// Composite hook if needed, or just export these individual ones.
// GameCore used `fetchHistoryData` to get both.
export const useGameHistory = () => {
    const { data: userProfile } = useUserProfile();
    const { data: levelsData } = useAllLevels();

    return {
        userProgress: userProfile?.user_progress || [],
        allLevels: levelsData?.levels || [],
        loading: !userProfile || !levelsData
    };
};
