import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
    fetchAllBlocks,
    fetchPublicBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
    getBlockById,
    uploadBlockImage
} from '../blockService';

// Fetch public blocks (for non-admin users)
export const usePublicBlocks = (page = 1, limit = 10, search = '') => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['publicBlocks', page, limit, search],
        queryFn: () => fetchPublicBlocks(getToken, page, limit, search),
        enabled: !!getToken,
        staleTime: 0,
        gcTime: 0,
    });
};

// Fetch all blocks (admin only)
export const useBlocks = (page = 1, limit = 10, search = '') => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['blocks', page, limit, search],
        queryFn: () => fetchAllBlocks(getToken, page, limit, search),
        enabled: !!getToken,
        staleTime: 0,
        gcTime: 0,
    });
};

// Fetch single block
export const useBlock = (blockId) => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['block', blockId],
        queryFn: () => getBlockById(getToken, blockId),
        enabled: !!blockId && !!getToken,
        staleTime: 0,
        gcTime: 0,
    });
};

// Create block
export const useCreateBlock = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (blockData) => createBlock(getToken, blockData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocks'] });
        },
    });
};

// Update block
export const useUpdateBlock = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ blockId, blockData }) => updateBlock(getToken, blockId, blockData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['blocks'] });
            queryClient.invalidateQueries({ queryKey: ['block', variables.blockId] });
        },
    });
};

// Delete block
export const useDeleteBlock = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (blockId) => deleteBlock(getToken, blockId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocks'] });
        },
    });
};

// Upload block image
export const useUploadBlockImage = () => {
    const { getToken } = useAuth();
    // Usually invalidation happens when the block using this image is updated, 
    // or if the image upload returns a URL we use immediately.
    return useMutation({
        mutationFn: (file) => uploadBlockImage(getToken, file),
    });
};
