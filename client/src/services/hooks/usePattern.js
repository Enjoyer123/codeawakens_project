import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchPatternById,
    createPattern,
    updatePattern,
    fetchPatternTypes
} from '../patternService';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Hook for fetching pattern types
export const usePatternTypes = () => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['patternTypes'],
        queryFn: async () => {
            const token = await getToken();
            const response = await fetch(`${API_BASE_URL}/api/patterns/types`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                return []; // Fail gracefully
            }
            return await response.json();
        },
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
        staleTime: 1000 * 60 * 5, // 5 minutes
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
            // Invalidate level-related pattern lists if any (optional)
            queryClient.invalidateQueries(['patterns', variables.levelId]);
            // Maybe invalidate checks later
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
            queryClient.invalidateQueries(['pattern', variables.patternId]);
        }
    });
};
