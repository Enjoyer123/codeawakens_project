import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
    fetchAllLevelCategories,
    createLevelCategory,
    updateLevelCategory,
    deleteLevelCategory,
    getLevelCategoryById,
    uploadCategoryBackground,
    deleteCategoryBackground
} from '../levelCategoryService';

// Fetch all level categories
export const useLevelCategories = (search = '') => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['levelCategories', search],
        queryFn: () => fetchAllLevelCategories(getToken, search),
        enabled: !!getToken,
        staleTime: 0, // Always fetch fresh data
        gcTime: 0,
    });
};

// Fetch single level category
export const useLevelCategory = (categoryId) => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['levelCategory', categoryId],
        queryFn: () => getLevelCategoryById(getToken, categoryId),
        enabled: !!categoryId && !!getToken,
        staleTime: 0,
        gcTime: 0,
    });
};

// Create level category
export const useCreateLevelCategory = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => createLevelCategory(getToken, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['levelCategories'] });
        },
    });
};

// Update level category
export const useUpdateLevelCategory = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ categoryId, data }) => updateLevelCategory(getToken, categoryId, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['levelCategories'] });
            queryClient.invalidateQueries({ queryKey: ['levelCategory', variables.categoryId] });
        },
    });
};

// Delete level category
export const useDeleteLevelCategory = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (categoryId) => deleteLevelCategory(getToken, categoryId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['levelCategories'] });
        },
    });
};

// Upload category background
export const useUploadCategoryBackground = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ categoryId, file }) => uploadCategoryBackground(getToken, categoryId, file),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['levelCategory', variables.categoryId] });
            queryClient.invalidateQueries({ queryKey: ['levelCategories'] });
        },
    });
};

// Delete category background
export const useDeleteCategoryBackground = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (categoryId) => deleteCategoryBackground(getToken, categoryId),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['levelCategory', variables.categoryId] });
            queryClient.invalidateQueries({ queryKey: ['levelCategories'] });
        },
    });
};
