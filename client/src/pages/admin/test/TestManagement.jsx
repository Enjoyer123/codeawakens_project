import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { fetchAllTests, deleteTest } from '../../../services/testService';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TestTable from '@/components/admin/test/TestTable';
import TestCreateEditModal from '@/components/admin/test/TestCreateEditModal';

const TestManagement = () => {
    const { getToken } = useAuth();

    const [activeTab, setActiveTab] = useState('PreTest');
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog States
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTest, setEditingTest] = useState(null);

    // Delete States
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [testToDelete, setTestToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const loadTests = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchAllTests(getToken);
            setTests(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        loadTests();
    }, [loadTests]);

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
            await deleteTest(getToken, testToDelete.test_id);
            setDeleteDialogOpen(false);
            setTestToDelete(null);
            loadTests();
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

                <ErrorAlert message={error} />

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
                    onSuccess={loadTests}
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
