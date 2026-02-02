import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { fetchAllTests, deleteTest } from '../../../services/testService';
import { useTests, useDeleteTest } from '../../../services/hooks/useTests';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TestTable from '@/components/admin/test/TestTable';
import TestCreateEditModal from '@/components/admin/test/TestCreateEditModal';

import PageError from '@/components/shared/Error/PageError';

const TestManagement = () => {
    const { getToken } = useAuth();

    const [activeTab, setActiveTab] = useState('PreTest');
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog States
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTest, setEditingTest] = useState(null);

    // Delete States
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [testToDelete, setTestToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // TanStack Query Hooks
    const {
        data: testsData,
        isLoading: loading,
        isError,
        error: queryError
    } = useTests(); // Fetches all tests by default

    if (isError) {
        return <PageError message={queryError?.message} title="Failed to load tests" />;
    }

    const deleteTestMutation = useDeleteTest();

    // Derived State
    // The API fetchAllTests might return array directly or object { tests: [] }.
    // Looking at service: return await response.json().
    // Looking at service code again: fetchAllTests logic is complex, checks type param.
    // If used without type, returns all?
    // In TestManagement original code: fetchAllTests(getToken). 
    // And TestService: export const fetchAllTests = async (getToken, type = '') ...
    // ... const url = type ? ... : .../admin/all
    // So it returns all tests.
    // Assuming structure is array based on `setTests(data)`.
    const tests = Array.isArray(testsData) ? testsData : (testsData?.tests || []);

    const filteredTests = tests.filter(t =>
        t.test_type === activeTab &&
        (t.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleOpenDialog = (test = null) => {
        setEditingTest(test);
        setDialogOpen(true);
    };

    const handleDeleteClick = (test) => {
        setTestToDelete(test);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!testToDelete) return;
        try {
            setDeleting(true);
            await deleteTestMutation.mutateAsync(testToDelete.test_id);
            setDeleteDialogOpen(false);
            setTestToDelete(null);
        } catch (err) {
            console.error(err);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <AdminPageHeader
                    title="Test Management"
                    subtitle="Manage Pre-Test and Post-Test Questions"
                    onAddClick={() => handleOpenDialog()}
                    addButtonText="Add Question"
                />

                <Tabs defaultValue="PreTest" value={activeTab} onValueChange={setActiveTab} className="mt-6">
                    <TabsList>
                        <TabsTrigger value="PreTest">Pre-Test</TabsTrigger>
                        <TabsTrigger value="PostTest">Post-Test</TabsTrigger>
                    </TabsList>

                    <div className="mt-4">
                        <SearchInput
                            defaultValue={searchQuery}
                            onSearch={setSearchQuery}
                            placeholder="Search questions..."
                        />
                    </div>

                    <TabsContent value={activeTab} className="mt-4">
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            {loading ? <LoadingState /> : filteredTests.length === 0 ? <EmptyState message="No questions found." /> : (
                                <TestTable
                                    tests={filteredTests}
                                    onEdit={handleOpenDialog}
                                    onDelete={handleDeleteClick}
                                />
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Create/Edit Dialog */}
                <TestCreateEditModal
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    testToEdit={editingTest}
                    activeTab={activeTab}
                    onSuccess={() => {
                        // Query invalidation handles refresh
                    }}
                />

                <DeleteConfirmDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={handleDeleteConfirm}
                    deleting={deleting}
                    itemName="this question"
                />
            </div>
        </div>
    );
};

export default TestManagement;
