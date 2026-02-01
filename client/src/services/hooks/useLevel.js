import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
    fetchLevelById,
    updateLevel,
    fetchAllLevels,
    createLevel,
    deleteLevel,
    uploadLevelBackgroundImage,
    fetchLevelsForPrerequisite,
    fetchAllCategories
} from '../levelService';

// Fetch single level
export const useLevel = (levelId) => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['level', levelId],
        queryFn: () => fetchLevelById(getToken, levelId),
        enabled: !!levelId && !!getToken, // Only fetch if ID and auth are available
        staleTime: 0, // Always fetch fresh data to avoid stale level issues during edits
        gcTime: 0, // Don't keep in cache when unused (prevents flash of old content)
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

// Fetch all levels (with pagination/search)
export const useLevels = (page = 1, limit = 10, search = '') => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['levels', page, limit, search],
        queryFn: () => fetchAllLevels(getToken, page, limit, search),
        enabled: !!getToken,
        staleTime: 0,
        gcTime: 0,
    });
};

// Create level
export const useCreateLevel = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (levelData) => createLevel(getToken, levelData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['levels'] });
        },
    });
};

// Delete level
export const useDeleteLevel = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (levelId) => deleteLevel(getToken, levelId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['levels'] });
        },
    });
};

// Upload background
export const useUploadLevelBackground = () => {
    const { getToken } = useAuth();
    // No specific cache to invalidate unless we know the level ID, usually handled in onSuccess of component
    return useMutation({
        mutationFn: (file) => uploadLevelBackgroundImage(getToken, file),
    });
};

// Fetch prerequisite levels (dropdown)
export const usePrerequisiteLevels = () => {
    const { getToken } = useAuth();
    return useQuery({
        queryKey: ['levels', 'prerequisites'],
        queryFn: () => fetchLevelsForPrerequisite(getToken),
        enabled: !!getToken,
        staleTime: 0,
    });
};

// Fetch categories for dropdown (from levelService endpoint)
export const useLevelCategoryOptions = () => {
    const { getToken } = useAuth();
    return useQuery({
        queryKey: ['levelCategories', 'options'],
        queryFn: () => fetchAllCategories(getToken),
        enabled: !!getToken,
        staleTime: 0,
    });
};
