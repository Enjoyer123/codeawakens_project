import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
    fetchAllUsers,
    updateUserRole,
    deleteUser,
    resetUserTestScore,
    fetchUserTestHistory,
    getUserDetails
} from '../adminService';

// Fetch all users
export const useUsers = (page = 1, limit = 5, search = '') => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['users', page, limit, search],
        queryFn: () => fetchAllUsers(getToken, page, limit, search),
        enabled: !!getToken,
        staleTime: 0,
        gcTime: 0,
    });
};

// Update user role
export const useUpdateUserRole = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, role }) => updateUserRole(getToken, userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['userDetails'] });
        },
    });
};

// Delete user
export const useDeleteUser = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId) => deleteUser(getToken, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
};

// Reset user test score
export const useResetUserTestScore = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, type }) => resetUserTestScore(getToken, userId, type),
        onSuccess: (data, variables) => {
            // Invalidate users list as scores might be shown there? 
            // Or user details?
            // Assuming users list doesn't show test scores deeply, but maybe it does.
            // Invalidating 'users' is safe.
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
};

// Fetch user test history
export const useUserTestHistory = (userId) => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['userTestHistory', userId],
        queryFn: () => fetchUserTestHistory(getToken, userId),
        enabled: !!userId && !!getToken,
        staleTime: 0,
        gcTime: 0,
    });
};

// Get user details
export const useUserDetails = (userId) => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['userDetails', userId],
        queryFn: () => getUserDetails(getToken, userId),
        enabled: !!userId && !!getToken,
        staleTime: 0,
        gcTime: 0,
    });
};
