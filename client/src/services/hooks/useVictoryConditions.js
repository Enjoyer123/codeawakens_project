import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
    fetchAllVictoryConditions,
    getVictoryConditionById,
    createVictoryCondition,
    updateVictoryCondition,
    deleteVictoryCondition
} from '../victoryConditionService';

// Fetch all victory conditions
export const useVictoryConditions = (page = 1, limit = 10, search = '') => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['victoryConditions', page, limit, search],
        queryFn: () => fetchAllVictoryConditions(getToken, page, limit, search),
        enabled: !!getToken,
        staleTime: 0,
        gcTime: 0,
    });
};

// Fetch single victory condition
export const useVictoryCondition = (victoryConditionId) => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['victoryCondition', victoryConditionId],
        queryFn: () => getVictoryConditionById(getToken, victoryConditionId),
        enabled: !!getToken && !!victoryConditionId,
        staleTime: 0,
        gcTime: 0,
    });
};

// Create victory condition
export const useCreateVictoryCondition = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => createVictoryCondition(getToken, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['victoryConditions'] });
        },
    });
};

// Update victory condition
export const useUpdateVictoryCondition = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ victoryConditionId, data }) => updateVictoryCondition(getToken, victoryConditionId, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['victoryConditions'] });
            queryClient.invalidateQueries({ queryKey: ['victoryCondition', variables.victoryConditionId] });
        },
    });
};

// Delete victory condition
export const useDeleteVictoryCondition = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (victoryConditionId) => deleteVictoryCondition(getToken, victoryConditionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['victoryConditions'] });
        },
    });
};
