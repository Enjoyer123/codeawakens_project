import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
    fetchGuidesByLevel,
    createGuide,
    updateGuide,
    deleteGuide,
    uploadGuideImage,
    deleteGuideImage
} from '../guideService';

// Fetch guides by level
export const useLevelGuides = (levelId) => {
    const { getToken } = useAuth();
    const numericLevelId = parseInt(levelId, 10);

    return useQuery({
        queryKey: ['levelGuides', numericLevelId],
        queryFn: () => fetchGuidesByLevel(getToken, numericLevelId),
        enabled: !!getToken && !!numericLevelId,
        staleTime: 0,
        gcTime: 0,
    });
};

// Create guide
export const useCreateGuide = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => createGuide(getToken, data),
        onSuccess: (data, variables) => {
            if (variables.level_id) {
                queryClient.invalidateQueries({ queryKey: ['levelGuides', variables.level_id] });
            }
        },
    });
};

// Update guide
export const useUpdateGuide = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ guideId, data }) => updateGuide(getToken, guideId, data),
        onSuccess: (data, variables) => {
            if (variables.data.level_id) {
                queryClient.invalidateQueries({ queryKey: ['levelGuides', variables.data.level_id] });
            }
        },
    });
};

// Delete guide
export const useDeleteGuide = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (guideId) => deleteGuide(getToken, guideId),
        onSuccess: () => {
            // Invalidate all level guides as we might not know the levelId easily
            queryClient.invalidateQueries({ queryKey: ['levelGuides'] });
        },
    });
};

// Upload guide image
export const useUploadGuideImage = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ guideId, file }) => uploadGuideImage(getToken, guideId, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['levelGuides'] });
        },
    });
};

// Delete guide image
export const useDeleteGuideImage = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (imageId) => deleteGuideImage(getToken, imageId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['levelGuides'] });
        },
    });
};
