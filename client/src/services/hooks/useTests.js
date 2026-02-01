import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
    fetchAllTests,
    fetchTestsByType,
    createTest,
    updateTest,
    deleteTest,
    submitTest,
    deleteTestChoice,
    uploadTestImage,
    uploadChoiceImage
} from '../testService';

// --- Admin Hooks ---

// Fetch all tests (Admin)
// If type is provided, filters by type.
export const useTests = (type = '') => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['tests', 'admin', type],
        queryFn: () => fetchAllTests(getToken, type),
        enabled: !!getToken,
    });
};

// Create Test
export const useCreateTest = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (testData) => createTest(getToken, testData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tests', 'admin'] });
        },
    });
};

// Update Test
export const useUpdateTest = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, testData }) => updateTest(getToken, id, testData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tests', 'admin'] });
        },
    });
};

// Delete Test
export const useDeleteTest = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => deleteTest(getToken, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tests', 'admin'] });
        },
    });
};

// Delete Test Choice
export const useDeleteTestChoice = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => deleteTestChoice(getToken, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tests', 'admin'] });
        },
    });
};

// Upload Test Image
export const useUploadTestImage = () => {
    const { getToken } = useAuth();

    return useMutation({
        mutationFn: (file) => uploadTestImage(getToken, file),
    });
};

// Upload Choice Image
export const useUploadChoiceImage = () => {
    const { getToken } = useAuth();

    return useMutation({
        mutationFn: (file) => uploadChoiceImage(getToken, file),
    });
};

// --- User/Player Hooks ---

// Fetch tests by type for generic usage (Admin or User if needed, though fetchTestsByType is logic specific)
// Note: The service fetchTestsByType hits /api/tests/:type which might return diff structure than admin/all
export const useTestsByType = (type) => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['tests', 'byType', type],
        queryFn: () => fetchTestsByType(getToken, type),
        enabled: !!getToken && !!type,
    });
};

// Submit Test
export const useSubmitTest = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ type, answers }) => submitTest(getToken, type, answers),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
        },
    });
};
