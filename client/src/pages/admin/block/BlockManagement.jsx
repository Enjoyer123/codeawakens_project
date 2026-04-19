import { useState, useCallback } from 'react';
import { toast } from 'sonner';


import {
  useBlocks,
  useDeleteBlock
} from '../../../services/hooks/useBlocks';

import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import PaginationControls from '@/components/shared/pagination/PaginationControls';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import BlockFormDialog from '@/components/admin/addEditDialog/BlockFormDialog';
import { usePagination } from '@/hooks/usePagination';

import BlockTable from '@/components/admin/block/BlockTable';

import PageError from '@/components/shared/Error/PageError';

const BlockManagement = () => {
  const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);
  const [searchQuery, setSearchQuery] = useState('');

  // TanStack Query
  const {
    data: blocksData,
    isLoading: loading,
    isError,
    error: blocksError
  } = useBlocks(page, rowsPerPage, searchQuery);

  if (isError) {
    return <PageError message={blocksError?.message} title="Failed to load blocks" statusCode={blocksError?.statusCode} />;
  }

  const blocks = blocksData?.blocks || [];
  const pagination = blocksData?.pagination || {
    total: 0,
    totalPages: 0,
    page: 1,
    limit: rowsPerPage,
  };

  // Mutations
  const { mutateAsync: deleteBlockAsync, isPending: deleting } = useDeleteBlock();

  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState(null);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    handlePageChange(1);
  }, [handlePageChange]);

  const handleOpenBlockDialog = useCallback((block = null) => {
    setEditingBlock(block);
    setBlockDialogOpen(true);
  }, []);

  const handleCloseBlockDialog = useCallback(() => {
    setBlockDialogOpen(false);
    setEditingBlock(null);
  }, []);

  const handleDeleteClick = useCallback((block) => {
    setBlockToDelete(block);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!blockToDelete) return;

    try {
      await deleteBlockAsync(blockToDelete.block_id);
      setDeleteDialogOpen(false);
      setBlockToDelete(null);
      // Query invalidation handles refresh
    } catch (err) {
      console.error(err);
    }
  }, [blockToDelete, deleteBlockAsync]);

  const handleDeleteDialogChange = useCallback((open) => {
    if (!deleting) {
      setDeleteDialogOpen(open);
      if (!open) {
        setBlockToDelete(null);
      }
    }
  }, [deleting]);



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title="Block Management"
          subtitle="จัดการบล็อก"
          onAddClick={() => handleOpenBlockDialog()}
          addButtonText="เพิ่มบล็อก"
        />

        <SearchInput
          defaultValue={searchQuery}
          onSearch={handleSearchChange}
          placeholder="ค้นหาบล็อก (key, name, description)..."
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <LoadingState message="Loading blocks..." />
          ) : blocks.length === 0 ? (
            <EmptyState
              message="ไม่พบข้อมูลบล็อก"
              searchQuery={searchQuery}
            />
          ) : (
            <>
              <BlockTable
                blocks={blocks}
                onEdit={handleOpenBlockDialog}
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

        <BlockFormDialog
          open={blockDialogOpen}
          onOpenChange={handleCloseBlockDialog}
          editingBlock={editingBlock}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteDialogChange}
          onConfirm={handleDeleteConfirm}
          itemName={blockToDelete?.block_name}
          title="ยืนยันการลบบล็อก"
          deleting={deleting}
        />
      </div>
    </div>
  );
};

export default BlockManagement;
