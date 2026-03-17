import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  useVictoryConditions,
  useDeleteVictoryCondition,
} from '../../../services/hooks/useVictoryConditions';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import PaginationControls from '@/components/shared/pagination/PaginationControls';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import VictoryConditionFormDialog from '@/components/admin/addEditDialog/VictoryConditionFormDialog';
import VictoryConditionTable from '@/components/admin/victoryCondition/VictoryConditionTable';
import { usePagination } from '@/hooks/usePagination';


import PageError from '@/components/shared/Error/PageError';

const VictoryConditionManagement = () => {
  const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [victoryConditionDialogOpen, setVictoryConditionDialogOpen] = useState(false);
  const [editingVictoryCondition, setEditingVictoryCondition] = useState(null);

  // Delete States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [victoryConditionToDelete, setVictoryConditionToDelete] = useState(null);


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

  const deleteVictoryConditionMutation = useDeleteVictoryCondition();

  // Derived State
  const victoryConditions = victoryConditionsData?.victoryConditions || [];
  const pagination = victoryConditionsData?.pagination || {
    total: 0,
    totalPages: 0,
    page: 1,
    limit: rowsPerPage,
  };


  // No manual load effect needed

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    handlePageChange(1);
  }, [handlePageChange]);

  const handleOpenVictoryConditionDialog = useCallback((victoryCondition) => {
    setEditingVictoryCondition(victoryCondition);
    setVictoryConditionDialogOpen(true);
  }, []);

  const handleCloseVictoryConditionDialog = useCallback(() => {
    setVictoryConditionDialogOpen(false);
    setEditingVictoryCondition(null);
  }, []);

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
    }
  }, [victoryConditionToDelete, deleteVictoryConditionMutation]);

  const handleDeleteDialogChange = useCallback((open) => {
    if (!deleteVictoryConditionMutation.isPending) {
      setDeleteDialogOpen(open);
      if (!open) {
        setVictoryConditionToDelete(null);
      }
    }
  }, [deleteVictoryConditionMutation.isPending]);



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
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => handleDeleteDialogChange(open)}
          onConfirm={handleDeleteConfirm}
          title="ยืนยันการลบเงื่อนไขชัยชนะ"
          itemName={victoryConditionToDelete?.type}
          description={`คุณต้องการลบเงื่อนไขชัยชนะ "${victoryConditionToDelete?.type}" ใช่หรือไม่? ฟาดฟันนี้ไม่สามารถย้อนกลับได้`}
          confirmText="ลบ"
          cancelText="ยกเลิก"
          variant="destructive"
          deleting={deleteVictoryConditionMutation.isPending}
        />
      </div>
    </div>
  );
};

export default VictoryConditionManagement;
