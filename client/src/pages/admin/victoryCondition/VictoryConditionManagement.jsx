import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useVictoryConditions,
  useCreateVictoryCondition,
  useUpdateVictoryCondition,
  useDeleteVictoryCondition,
} from '../../../services/hooks/useVictoryConditions';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import PaginationControls from '@/components/shared/pagination/PaginationControls';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import VictoryConditionFormDialog from '@/components/admin/addEditDialog/VictoryConditionFormDialog';
import VictoryConditionTable from '@/components/admin/victoryCondition/VictoryConditionTable';
import { usePagination } from '@/hooks/usePagination';
import { createDeleteErrorMessage } from '@/utils/errorHandler';

import PageError from '@/components/shared/Error/PageError';

const VictoryConditionManagement = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [victoryConditionDialogOpen, setVictoryConditionDialogOpen] = useState(false);
  const [editingVictoryCondition, setEditingVictoryCondition] = useState(null);
  const [victoryConditionForm, setVictoryConditionForm] = useState({
    type: '',
    description: '',
    check: '',
    is_available: true,
  });
  // Delete States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [victoryConditionToDelete, setVictoryConditionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // const [saveError, setSaveError] = useState(null);

  // TanStack Query Hooks
  const {
    data: victoryConditionsData,
    isLoading: loading,
    isError,
    error: queryError
  } = useVictoryConditions(page, rowsPerPage, searchQuery);

  if (isError) {
    return <PageError message={queryError?.message} title="Failed to load victory conditions" />;
  }

  const createVictoryConditionMutation = useCreateVictoryCondition();
  const updateVictoryConditionMutation = useUpdateVictoryCondition();
  const deleteVictoryConditionMutation = useDeleteVictoryCondition();

  // Derived State
  const victoryConditions = victoryConditionsData?.victoryConditions || [];
  const pagination = victoryConditionsData?.pagination || {
    total: 0,
    totalPages: 0,
    page: 1,
    limit: rowsPerPage,
  };

  const error = isError ? (queryError?.message || 'Failed to load victory conditions') : null;

  // No manual load effect needed

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    handlePageChange(1);
  }, [handlePageChange]);

  const handleOpenVictoryConditionDialog = useCallback((victoryCondition = null) => {
    if (victoryCondition) {
      setEditingVictoryCondition(victoryCondition);
      setVictoryConditionForm({
        type: victoryCondition.type,
        description: victoryCondition.description || '',
        check: victoryCondition.check || '',
        is_available: victoryCondition.is_available,
      });
    } else {
      setEditingVictoryCondition(null);
      setVictoryConditionForm({
        type: '',
        description: '',
        check: '',
        is_available: true,
      });
    }
    // setSaveError(null);
    setVictoryConditionDialogOpen(true);
  }, []);

  const handleCloseVictoryConditionDialog = useCallback(() => {
    setVictoryConditionDialogOpen(false);
    setEditingVictoryCondition(null);
    // setSaveError(null);
    setVictoryConditionForm({
      type: '',
      description: '',
      check: '',
      is_available: true,
    });
  }, []);

  const handleSaveVictoryCondition = useCallback(async () => {
    // setSaveError(null);

    const formData = {
      ...victoryConditionForm,
      type: victoryConditionForm.type.trim(),
      description: victoryConditionForm.description.trim(),
      check: victoryConditionForm.check.trim(),
    };

    try {
      if (editingVictoryCondition) {
        await updateVictoryConditionMutation.mutateAsync({
          victoryConditionId: editingVictoryCondition.victory_condition_id,
          data: formData
        });
      } else {
        await createVictoryConditionMutation.mutateAsync(formData);
      }
      handleCloseVictoryConditionDialog();
      return { success: true };
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'บันทึกเงื่อนไขชัยชนะไม่สำเร็จ');
      return { success: false, error: err.message };
    }
  }, [
    victoryConditionForm,
    editingVictoryCondition,
    updateVictoryConditionMutation,
    createVictoryConditionMutation,
    handleCloseVictoryConditionDialog,
  ]);

  const handleDeleteClick = useCallback((victoryCondition) => {
    setVictoryConditionToDelete(victoryCondition);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!victoryConditionToDelete) return;

    try {
      await deleteVictoryConditionMutation.mutateAsync(
        victoryConditionToDelete.victory_condition_id
      );
      setDeleteDialogOpen(false);
      setVictoryConditionToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }, [victoryConditionToDelete, deleteVictoryConditionMutation]);

  const handleDeleteDialogChange = useCallback((open) => {
    if (!deleting) {
      setDeleteDialogOpen(open);
      if (!open) {
        setVictoryConditionToDelete(null);
      }
    }
  }, [deleting]);



  const searchPlaceholder =
    'ค้นหาเงื่อนไขชัยชนะ (type, description, check)...';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title="Victory Condition Management"
          subtitle="จัดการเงื่อนไขชัยชนะ"
        />

        <SearchInput
          defaultValue={searchQuery}
          onSearch={handleSearchChange}
          placeholder={searchPlaceholder}
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <LoadingState message="Loading victory conditions..." />
          ) : victoryConditions.length === 0 ? (
            <EmptyState
              message="ไม่พบข้อมูลเงื่อนไขชัยชนะ"
              searchQuery={searchQuery}
            />
          ) : (
            <>
              <VictoryConditionTable
                victoryConditions={victoryConditions}
                onEdit={handleOpenVictoryConditionDialog}
                onDelete={handleDeleteClick}
              />
              <PaginationControls
                currentPage={page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                rowsPerPage={rowsPerPage}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>

        <VictoryConditionFormDialog
          open={victoryConditionDialogOpen}
          onOpenChange={handleCloseVictoryConditionDialog}
          editingVictoryCondition={editingVictoryCondition}
          formData={victoryConditionForm}
          onFormChange={setVictoryConditionForm}
          onSave={handleSaveVictoryCondition}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteDialogChange}
          onConfirm={handleDeleteConfirm}
          itemName={victoryConditionToDelete?.type}
          title="ยืนยันการลบเงื่อนไขชัยชนะ"
          deleting={deleting}
        />
      </div>
    </div>
  );
};

export default VictoryConditionManagement;
