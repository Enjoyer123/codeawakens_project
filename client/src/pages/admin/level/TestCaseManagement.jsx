import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import { useTestCasesByLevel, useDeleteTestCase } from '../../../services/hooks/useTestCases';
import { useLevel } from '../../../services/hooks/useLevel';
import TestCaseTable from '@/components/admin/level/tables/TestCaseTable';
import TestCaseFormDialog from '@/components/admin/addEditDialog/TestCaseFormDialog';
import PageError from '@/components/shared/Error/PageError';

const TestCaseManagement = () => {

    const { levelId } = useParams();
    const numericLevelId = parseInt(levelId, 10);

    const { data: level } = useLevel(numericLevelId);
    const {
        data: testCasesData,
        isLoading: loading,
        isError,
        error: queryError
    } = useTestCasesByLevel(numericLevelId);

    if (isError) {
        return <PageError message={queryError?.message} title="Failed to load test cases" />;
    }

    const deleteTestCaseMutation = useDeleteTestCase();

    const testCases = testCasesData || [];

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingTestCase, setEditingTestCase] = useState(null);
    const [testCaseToDelete, setTestCaseToDelete] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleOpenDialog = useCallback((testCase = null) => {
        setEditingTestCase(testCase);
        setDialogOpen(true);
    }, []);

    const handleCloseDialog = useCallback(() => {
        setDialogOpen(false);
        setEditingTestCase(null);
    }, []);

    const handleDeleteClick = useCallback((testCase) => {
        setTestCaseToDelete(testCase);
        setDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!testCaseToDelete) return;
        try {
            await deleteTestCaseMutation.mutateAsync(testCaseToDelete.test_case_id);
            toast.success('ลบ Test Case สำเร็จ');
            setDeleteDialogOpen(false);
            setTestCaseToDelete(null);
        } catch (err) {
            toast.error('ไม่สามารถลบ Test Case ได้: ' + (err.message || 'Unknown error'));
        }
    }, [testCaseToDelete, deleteTestCaseMutation]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <AdminPageHeader
                    title={`Test Cases: ${level?.level_name || levelId}`}
                    subtitle="จัดการ Test Cases สำหรับการตรวจสอบความถูกต้องของโค้ด"
                    backPath={`/admin/levels`}
                    onAddClick={() => handleOpenDialog()}
                    addButtonText="เพิ่ม Test Case"
                />

                <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4">
                    {loading ? (
                        <LoadingState message="Loading test cases..." />
                    ) : testCases.length === 0 ? (
                        <EmptyState message="ยังไม่มี Test Case สำหรับด่านนี้" />
                    ) : (
                        <TestCaseTable
                            testCases={testCases}
                            onEdit={handleOpenDialog}
                            onDelete={handleDeleteClick}
                        />
                    )}
                </div>

                {/* Create/Edit Dialog */}
                <TestCaseFormDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    editingTestCase={editingTestCase}
                    numericLevelId={numericLevelId}
                    onClose={handleCloseDialog}
                />

                <DeleteConfirmDialog
                    open={deleteDialogOpen}
                    onOpenChange={(open) => {
                        if (!deleteTestCaseMutation.isPending) {
                            setDeleteDialogOpen(open);
                            setTestCaseToDelete(null);
                        }
                    }}
                    onConfirm={handleDeleteConfirm}
                    title="ยืนยันการลบ Test Case"
                    itemName={testCaseToDelete?.test_case_name}
                    description={`คุณต้องการลบ Test Case "${testCaseToDelete?.test_case_name}" ใช่หรือไม่? ฟาดฟันนี้ไม่สามารถย้อนกลับได้`}
                    confirmText="ลบ Test Case"
                    cancelText="ยกเลิก"
                    variant="destructive"
                    deleting={deleteTestCaseMutation.isPending}
                />
            </div>
        </div>
    );
};

export default TestCaseManagement;
