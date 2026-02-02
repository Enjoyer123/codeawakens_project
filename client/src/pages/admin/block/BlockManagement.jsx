import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/clerk-react'; // Still needed? Hooks handle token? Yes, but maybe unused here.
import { useNavigate } from 'react-router-dom';

import {
  useBlocks,
  useUpdateBlock,
  useDeleteBlock,
  useUploadBlockImage
} from '../../../services/hooks/useBlocks';

import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import PaginationControls from '@/components/shared/pagination/PaginationControls';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import BlockFormDialog from '@/components/admin/addEditDialog/BlockFormDialog';
import { usePagination } from '@/hooks/usePagination';
import { createDeleteErrorMessage } from '@/utils/errorHandler';
import BlockTable from '@/components/admin/block/BlockTable';
import { getImageUrl } from '@/utils/imageUtils';

import PageError from '@/components/shared/Error/PageError';

const BlockManagement = () => {
  // const navigate = useNavigate(); // unused?
  const { getToken } = useAuth(); // Hooks use token internally, but maybe we keep for consistency.
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
    return <PageError message={blocksError?.message} title="Failed to load blocks" />;
  }

  const blocks = blocksData?.blocks || [];
  const pagination = blocksData?.pagination || {
    total: 0,
    totalPages: 0,
    page: 1,
    limit: rowsPerPage,
  };

  // Mutations
  const { mutateAsync: updateBlockAsync } = useUpdateBlock();
  const { mutateAsync: deleteBlockAsync, isPending: deleting } = useDeleteBlock();
  const { mutateAsync: uploadImageAsync } = useUploadBlockImage();

  // Block form states
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [blockForm, setBlockForm] = useState({
    block_key: '',
    block_name: '',
    description: '',
    category: 'movement',
    blockly_type: '',
    is_available: true,
    syntax_example: '',
  });
  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState(null);
  // const [saveError, setSaveError] = useState(null);

  // Image states
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    handlePageChange(1);
  }, [handlePageChange]);

  const handleOpenBlockDialog = useCallback((block = null) => {
    if (block) {
      setEditingBlock(block);
      setBlockForm({
        block_key: block.block_key,
        block_name: block.block_name,
        description: block.description || '',
        category: block.category,
        blockly_type: block.blockly_type || '',
        is_available: block.is_available,
        syntax_example: block.syntax_example || '',
      });
      setSelectedImage(null);
      setImagePreview(getImageUrl(block.block_image));
      setBlockDialogOpen(true);
    }
    // If block is null (add mode), do nothing as we only allow edit
  }, []);

  const handleCloseBlockDialog = useCallback(() => {
    setBlockDialogOpen(false);
    setEditingBlock(null);
    setBlockForm({
      block_key: '',
      block_name: '',
      description: '',
      category: 'movement',
      blockly_type: '',
      is_available: true,
      syntax_example: '',
    });
    setSelectedImage(null);
    setImagePreview(null);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setBlockForm({ ...blockForm, block_image: '' });
  };

  const handleSaveBlock = useCallback(async () => {
    // setSaveError(null);

    const formData = {
      ...blockForm,
      block_key: blockForm.block_key.trim(),
      block_name: blockForm.block_name.trim(),
      description: blockForm.description?.trim() || null,
      blockly_type: blockForm.blockly_type?.trim() || null,
      syntax_example: blockForm.syntax_example?.trim() || null,
    };

    try {
      if (editingBlock) {
        // Upload image if selected
        let imagePath = blockForm.block_image;
        if (selectedImage) {
          const uploadResult = await uploadImageAsync(selectedImage);
          imagePath = uploadResult.path;
        }

        const dataToSave = {
          ...formData,
          block_image: imagePath
        };

        await updateBlockAsync({
          blockId: editingBlock.block_id,
          blockData: dataToSave
        });
        handleCloseBlockDialog();
        // Query invalidation handles refresh
        return { success: true };
      }
      return { success: false, error: 'Create block is not allowed' };
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'บันทึกบล็อกไม่สำเร็จ');
      return { success: false, error: err.message };
    }
  }, [blockForm, editingBlock, uploadImageAsync, updateBlockAsync, handleCloseBlockDialog, selectedImage]);

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
        // Removed onAddClick and addButtonText to disable adding blocks
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
          formData={blockForm}
          onFormChange={setBlockForm}
          onSave={handleSaveBlock}
          selectedImage={selectedImage}
          imagePreview={imagePreview}
          onImageChange={handleImageChange}
          onImageRemove={handleImageRemove}
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
