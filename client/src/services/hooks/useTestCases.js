import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
    fetchTestCasesByLevel,
    createTestCase,
    updateTestCase,
    deleteTestCase
} from '../testCaseService';

// Fetch test cases by level
export const useTestCasesByLevel = (levelId) => {
    const { getToken } = useAuth();
    const numericLevelId = parseInt(levelId, 10);

    return useQuery({
        queryKey: ['testCases', numericLevelId],
        queryFn: () => fetchTestCasesByLevel(getToken, numericLevelId),
        enabled: !!getToken && !!numericLevelId,
        staleTime: 0,
        gcTime: 0,
    });
};

// Create test case
export const useCreateTestCase = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => createTestCase(getToken, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['testCases', variables.level_id] });
        },
    });
};

// Update test case
export const useUpdateTestCase = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ testCaseId, data }) => updateTestCase(getToken, testCaseId, data),
        onSuccess: (data, variables) => {
            // Need level_id to invalidate list. 
            // If API returns level_id, use data.level_id. 
            // Or pass level_id in variables if strictly needed.
            // Assuming variables.data.level_id exists or we invalidate all 'testCases'?
            // Safer to invalidate specific level if known.
            if (variables.data.level_id) {
                queryClient.invalidateQueries({ queryKey: ['testCases', variables.data.level_id] });
            } else {
                // Fallback: This might be expensive if we don't know level_id, 
                // but typically update payload includes it or we can pass it as extra var.
                // In TestCaseManagement, we have levelId.
            }
        },
    });
};

// Delete test case
export const useDeleteTestCase = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (testCaseId) => deleteTestCase(getToken, testCaseId),
        onSuccess: (data, variables) => {
            // We need to invalidate the list. 
            // Ideally we'd know the levelId. 
            // In TestCaseManagement, we'll likely refetch or invalidate directly with known levelId.
            // Here we can't easily know levelId just from testCaseId deletion unless response returns it.
            // Let's assume response might have it, or caller invalidates manually if needed.
            // But better: use onSuccess in the component to invalidate specific level list.
            // Or simply invalidate all 'testCases' which is suboptimal but safe.
            queryClient.invalidateQueries({ queryKey: ['testCases'] });
        },
    });
};
