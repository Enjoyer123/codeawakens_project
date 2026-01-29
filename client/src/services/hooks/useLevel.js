import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { fetchLevelById, updateLevel } from '../levelService';

// Fetch single level
export const useLevel = (levelId) => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['level', levelId],
        queryFn: () => fetchLevelById(getToken, levelId),
        enabled: !!levelId && !!getToken, // Only fetch if ID and auth are available
        staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    });
};

// Update level
export const useUpdateLevel = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ levelId, levelData }) => updateLevel(getToken, levelId, levelData),
        onSuccess: (data, variables) => {
            // Invalidate the cache to force refetch on next access
            queryClient.invalidateQueries({ queryKey: ['level', variables.levelId] });
            // OR update the cache directly if the API returns the updated object
            // queryClient.setQueryData(['level', variables.levelId], data);
        },
    });
};
