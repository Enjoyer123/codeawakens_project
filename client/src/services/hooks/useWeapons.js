import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
    fetchAllWeapons,
    fetchWeaponById,
    createWeapon,
    updateWeapon,
    deleteWeapon,
    addWeaponImage,
    updateWeaponImage,
    deleteWeaponImage
} from '../weaponService';

// Fetch all weapons
export const useWeapons = (page = 1, limit = 10, search = '') => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['weapons', page, limit, search],
        queryFn: () => fetchAllWeapons(getToken, page, limit, search),
        enabled: !!getToken,
        staleTime: 0,
        gcTime: 0,
    });
};

// Fetch single weapon
export const useWeapon = (weaponId) => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['weapon', weaponId],
        queryFn: () => fetchWeaponById(getToken, weaponId),
        enabled: !!getToken && !!weaponId,
        staleTime: 0,
        gcTime: 0,
    });
};

// Create weapon
export const useCreateWeapon = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (weaponData) => createWeapon(getToken, weaponData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['weapons'] });
        },
    });
};

// Update weapon
export const useUpdateWeapon = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ weaponId, weaponData }) => updateWeapon(getToken, weaponId, weaponData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['weapons'] });
            queryClient.invalidateQueries({ queryKey: ['weapon', variables.weaponId] });
        },
    });
};

// Delete weapon
export const useDeleteWeapon = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (weaponId) => deleteWeapon(getToken, weaponId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['weapons'] });
        },
    });
};

// Add weapon image
export const useAddWeaponImage = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ weaponId, imageFile, imageData }) => addWeaponImage(getToken, weaponId, imageFile, imageData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['weapon', variables.weaponId] });
            queryClient.invalidateQueries({ queryKey: ['weapons'] });
        },
    });
};

// Update weapon image
export const useUpdateWeaponImage = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ imageId, imageFile, imageData }) => updateWeaponImage(getToken, imageId, imageFile, imageData),
        onSuccess: () => {
            // Hard to invalidate specific weapon without weaponId in return or context. 
            // Ideally we should return weaponId or invalidate all weapons/weapon. 
            // For now, let's invalidate 'weapons' to be safe or rely on manual refetch if needed.
            // Or assume the variable passed in might have weaponId context if we change signature? 
            // The service signature is (imageId, file, data). Data might have it?
            queryClient.invalidateQueries({ queryKey: ['weapons'] });
        },
    });
};

// Delete weapon image
export const useDeleteWeaponImage = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (imageId) => deleteWeaponImage(getToken, imageId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['weapons'] });
        },
    });
};
