import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
    fetchUserProfile,
    updateUsername,
    uploadProfileImage,
    deleteProfileImage,
    getUserByClerkId,
    saveUserProgress,
    checkAndAwardRewards
} from '../profileService';

// Check User Profile (Check if exists)
export const useCheckUserProfile = () => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['checkUserProfile'],
        queryFn: () => fetchUserProfile(getToken),
        enabled: !!getToken,
        retry: false, // Don't retry if 404/new user
        staleTime: 0,
        gcTime: 0,
    });
};

// Get Full User Profile (By Clerk ID - for current user)
export const useProfile = () => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['userProfile'],
        queryFn: () => getUserByClerkId(getToken),
        enabled: !!getToken,
        staleTime: 0,
        gcTime: 0,
    });
};

// Update Username
export const useUpdateUsername = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (username) => updateUsername(getToken, username),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
            queryClient.invalidateQueries({ queryKey: ['checkUserProfile'] });
        },
    });
};

// Upload Profile Image
export const useUploadProfileImage = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file) => uploadProfileImage(getToken, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
        },
    });
};

// Delete Profile Image
export const useDeleteProfileImage = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => deleteProfileImage(getToken),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
        },
    });
};

// Save User Progress
export const useSaveUserProgress = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (progressData) => saveUserProgress(getToken, progressData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
            // Invalidate other queries if needed, e.g. level completion status
        },
    });
};

// Check and Award Rewards
export const useCheckRewards = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ levelId, totalScore }) => checkAndAwardRewards(getToken, levelId, totalScore),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] }); // Rewards might appear in profile
        },
    });
};
