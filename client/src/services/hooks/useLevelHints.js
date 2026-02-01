import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
    fetchHintsByLevel,
    createLevelHint,
    updateLevelHint,
    deleteLevelHint,
    uploadHintImage,
    deleteHintImage
} from '../levelHintService';

// Fetch hints by level
export const useLevelHints = (levelId) => {
    const { getToken } = useAuth();
    const numericLevelId = parseInt(levelId, 10);

    return useQuery({
        queryKey: ['levelHints', numericLevelId],
        queryFn: () => fetchHintsByLevel(getToken, numericLevelId),
        enabled: !!getToken && !!numericLevelId,
        staleTime: 0,
        gcTime: 0,
    });
};

// Create hint
export const useCreateLevelHint = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => createLevelHint(getToken, data),
        onSuccess: (data, variables) => {
            // variables.level_id should be present
            if (variables.level_id) {
                queryClient.invalidateQueries({ queryKey: ['levelHints', variables.level_id] });
            }
        },
    });
};

// Update hint
export const useUpdateLevelHint = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ hintId, data }) => updateLevelHint(getToken, hintId, data),
        onSuccess: (data, variables) => {
            if (variables.data.level_id) {
                queryClient.invalidateQueries({ queryKey: ['levelHints', variables.data.level_id] });
            }
        },
    });
};

// Delete hint
export const useDeleteLevelHint = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (hintId) => deleteLevelHint(getToken, hintId),
        onSuccess: (data, variables) => {
            // We can't easily know level_id from hintId unless passed or returned.
            // Invalidating all 'levelHints' is safer but broader.
            // Or we rely on component to invalidate or refetch?
            // Best practice: return parent ID from API or invalidating all is acceptable for admin panel.
            queryClient.invalidateQueries({ queryKey: ['levelHints'] });
        },
    });
};

// Upload hint image
export const useUploadHintImage = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ hintId, file }) => uploadHintImage(getToken, hintId, file),
        onSuccess: (data, variables) => {
            // Invalidate hints to show new image
            queryClient.invalidateQueries({ queryKey: ['levelHints'] });
        },
    });
};

// Delete hint image
export const useDeleteHintImage = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (imageId) => deleteHintImage(getToken, imageId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['levelHints'] });
        },
    });
};
