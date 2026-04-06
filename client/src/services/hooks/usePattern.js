import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchPatternById,
    createPattern,
    updatePattern,
    fetchPatternTypes,
    fetchAllPatterns,
    deletePattern,
    unlockPattern,
    unlockLevel

} from '../api/patternService';
import { useAuth } from '@clerk/clerk-react';

// Hook for fetching all patterns (optionally filtered by levelId)
export const usePatterns = (levelId = null) => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['patterns', levelId], // Include levelId in key
        queryFn: async () => {
            return await fetchAllPatterns(getToken, 1, 100, levelId);
        },
        enabled: !!getToken, // Always enabled if token exists, fetching all or filtered
        staleTime: 0,
        gcTime: 0,
    });
};


// Hook for fetching pattern types
export const usePatternTypes = () => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['patternTypes'],
        queryFn: () => fetchPatternTypes(getToken),
        enabled: !!getToken,
        staleTime: 1000 * 60 * 60, // 1 hour (types rarely change)
    });
};

// Hook for fetching a single pattern
export const usePattern = (patternId) => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['pattern', patternId],
        queryFn: async () => {
            const data = await fetchPatternById(getToken, patternId);
            // Normalize: backend might return { pattern: ... } or just ...
            return data?.pattern || data;
        },
        enabled: !!patternId, // Only run if patternId is provided
        staleTime: 0,
        gcTime: 0,
    });
};

// Hook for creating a pattern
export const useCreatePattern = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ levelId, patternData }) => {
            // patternData already contains level_id
            return await createPattern(getToken, patternData);
        },
        onSuccess: (data, variables) => {
            // Invalidate level-related pattern lists
            queryClient.invalidateQueries({ queryKey: ['patterns'] });
            // Invalidate the level data itself because GameCore uses embedded patterns
            queryClient.invalidateQueries({ queryKey: ['level'] });
            queryClient.invalidateQueries({ queryKey: ['levels'] });
        }
    });
};

// Hook for updating a pattern
export const useUpdatePattern = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ patternId, patternData }) => {
            return await updatePattern(getToken, patternId, patternData);
        },
        onSuccess: (data, variables) => {
            // Update the cache for this specific pattern
            queryClient.invalidateQueries({ queryKey: ['pattern', variables.patternId] });
            // Invalidate the patterns list so the preview array gets fresh XML data
            queryClient.invalidateQueries({ queryKey: ['patterns'] });
            // Invalidate the level data itself because GameCore uses embedded patterns
            queryClient.invalidateQueries({ queryKey: ['level'] });
            queryClient.invalidateQueries({ queryKey: ['levels'] });
        }
    });
};

// Hook for deleting a pattern
export const useDeletePattern = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (patternId) => {
            return await deletePattern(getToken, patternId);
        },
        onSuccess: (data, variables) => {
            // Invalidate all pattern lists
            queryClient.invalidateQueries({ queryKey: ['patterns'] });
            // Invalidate levels since their pattern counts/data might change
            queryClient.invalidateQueries({ queryKey: ['level'] });
            queryClient.invalidateQueries({ queryKey: ['levels'] });
        }
    });
};

// Hook for unlocking a pattern
export const useUnlockPattern = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (patternId) => {
            return await unlockPattern(patternId, getToken);
        },
        onSuccess: (data, patternId) => {
            // Invalidate specific pattern and patterns list
            queryClient.invalidateQueries({ queryKey: ['pattern', patternId] });
            queryClient.invalidateQueries({ queryKey: ['patterns'] });
        }
    });
};

// Hook for unlocking a level
export const useUnlockLevel = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (levelId) => {
            return await unlockLevel(levelId, getToken);
        },
        onSuccess: (data, levelId) => {
            // Invalidate specific level and levels list
            queryClient.invalidateQueries({ queryKey: ['level', levelId] });
            queryClient.invalidateQueries({ queryKey: ['levels'] });
        }
    });
};
