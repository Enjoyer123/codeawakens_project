import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllBlocks,
  updateBlock,
  deleteBlock,
  uploadBlockImage,
} from '../../../services/blockService';
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

const BlockManagement = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 10,
  });

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
  const [saveError, setSaveError] = useState(null);

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Image states
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const loadBlocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllBlocks(getToken, page, rowsPerPage, searchQuery);
      setBlocks(data.blocks || []);
      setPagination(data.pagination || {
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
      });
    } catch (err) {
      setError('Failed to load blocks. ' + (err.message || ''));
      setBlocks([]);
      setPagination({
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
      });
    } finally {
      setLoading(false);
    }
  }, [getToken, page, rowsPerPage, searchQuery]);

  // Load blocks when page or search changes
  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

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
      setSaveError(null);
      setBlockDialogOpen(true);
    }
    // If block is null (add mode), do nothing as we only allow edit
  }, []);

  const handleCloseBlockDialog = useCallback(() => {
    setBlockDialogOpen(false);
    setEditingBlock(null);
    setSaveError(null);
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
    setSaveError(null);

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
          const uploadResult = await uploadBlockImage(getToken, selectedImage);
          imagePath = uploadResult.path;
        }

        const dataToSave = {
          ...formData,
          block_image: imagePath
        };

        await updateBlock(getToken, editingBlock.block_id, dataToSave);
        handleCloseBlockDialog();
        await loadBlocks();
        return { success: true };
      }
      return { success: false, error: 'Create block is not allowed' };
    } catch (err) {
      const errorMessage = 'ไม่สามารถบันทึก block ได้: ' + (err.message || 'Unknown error');
      setSaveError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [blockForm, editingBlock, getToken, handleCloseBlockDialog, loadBlocks, selectedImage]);

  const handleDeleteClick = useCallback((block) => {
    setBlockToDelete(block);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!blockToDelete) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteBlock(getToken, blockToDelete.block_id);
      setDeleteDialogOpen(false);
      setBlockToDelete(null);
      await loadBlocks();
    } catch (err) {
      const errorMessage = createDeleteErrorMessage('block', err);
      setDeleteError(errorMessage);
    } finally {
      setDeleting(false);
    }
  }, [blockToDelete, getToken, loadBlocks]);

  const handleDeleteDialogChange = useCallback((open) => {
    if (!deleting) {
      setDeleteDialogOpen(open);
      if (!open) {
        setBlockToDelete(null);
        setDeleteError(null);
      }
    }
  }, [deleting]);

  const getDeleteDescription = (blockName) =>
    `คุณแน่ใจหรือไม่ว่าต้องการลบบล็อก "${blockName}"? การกระทำนี้ไม่สามารถยกเลิกได้`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title="Block Management"
          subtitle="จัดการบล็อก"
        // Removed onAddClick and addButtonText to disable adding blocks
        />

        <ErrorAlert message={error} />
        <ErrorAlert message={saveError} />
        <ErrorAlert message={deleteError} />

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
          title="ยืนยันการลบบล็อก"
          description={getDeleteDescription(blockToDelete?.block_name)}
          confirmText="ลบ"
          cancelText="ยกเลิก"
          isLoading={deleting}
        />
      </div>
    </div>
  );
};

export default BlockManagement;
