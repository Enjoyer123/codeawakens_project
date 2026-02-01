import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
    fetchAllRewards,
    fetchLevelsForReward,
    fetchRewardById,
    createReward,
    updateReward,
    deleteReward,
    uploadRewardFrame,
    deleteRewardFrame
} from '../rewardService';

// Fetch all rewards
export const useRewards = (page = 1, limit = 10, search = '') => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['rewards', page, limit, search],
        queryFn: () => fetchAllRewards(getToken, page, limit, search),
        enabled: !!getToken,
        staleTime: 0,
        gcTime: 0,
    });
};

// Fetch levels for reward dropdown
export const useRewardLevels = () => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['rewardLevels'],
        queryFn: () => fetchLevelsForReward(getToken),
        enabled: !!getToken,
        staleTime: 1000 * 60 * 5, // Levels don't change often, keep for 5 mins
    });
};

// Fetch single reward
export const useReward = (rewardId) => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['reward', rewardId],
        queryFn: () => fetchRewardById(getToken, rewardId),
        enabled: !!getToken && !!rewardId,
        staleTime: 0,
        gcTime: 0,
    });
};

// Create reward
export const useCreateReward = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (rewardData) => createReward(getToken, rewardData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rewards'] });
        },
    });
};

// Update reward
export const useUpdateReward = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ rewardId, rewardData }) => updateReward(getToken, rewardId, rewardData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['rewards'] });
            queryClient.invalidateQueries({ queryKey: ['reward', variables.rewardId] });
        },
    });
};

// Delete reward
export const useDeleteReward = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (rewardId) => deleteReward(getToken, rewardId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rewards'] });
        },
    });
};

// Upload reward frame
export const useUploadRewardFrame = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ rewardId, imageFile, frameNumber }) => uploadRewardFrame(getToken, rewardId, imageFile, frameNumber),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['rewards'] });
            queryClient.invalidateQueries({ queryKey: ['reward', variables.rewardId] });
        },
    });
};

// Delete reward frame
export const useDeleteRewardFrame = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ rewardId, frameNumber }) => deleteRewardFrame(getToken, rewardId, frameNumber),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['rewards'] });
            queryClient.invalidateQueries({ queryKey: ['reward', variables.rewardId] });
        },
    });
};
