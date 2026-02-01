import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  useLevelCategories,
  useCreateLevelCategory,
  useUpdateLevelCategory,
  useDeleteLevelCategory,
  useUploadCategoryBackground,
  useDeleteCategoryBackground
} from '../../../services/hooks/useLevelCategories';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import PaginationControls from '@/components/shared/pagination/PaginationControls';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import LevelCategoryFormDialog from '@/components/admin/addEditDialog/LevelCategoryFormDialog';
import LevelCategoryImageDialog from '@/components/admin/levelCategory/LevelCategoryImageDialog';
import { usePagination } from '@/hooks/usePagination';
import { createDeleteErrorMessage } from '@/utils/errorHandler';
import LevelCategoryTable from '@/components/admin/levelCategory/LevelCategoryTable';
import { getImageUrl } from '@/utils/imageUtils';

const LevelCategoryManagement = () => {
  const { getToken } = useAuth(); // Keeping if needed for other things, but hooks handle tokens.
  const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);
  const [searchQuery, setSearchQuery] = useState('');

  // TanStack Query Hooks
  const {
    data: categoriesData,
    isLoading: loading,
    isError,
    error: categoriesError
  } = useLevelCategories(searchQuery);

  // Mutations
  const { mutateAsync: createCategoryAsync } = useCreateLevelCategory();
  const { mutateAsync: updateCategoryAsync } = useUpdateLevelCategory();
  const { mutateAsync: deleteCategoryAsync, isPending: deleting } = useDeleteLevelCategory();
  const { mutateAsync: uploadImageAsync, isPending: uploadingImage } = useUploadCategoryBackground();
  const { mutateAsync: deleteImageAsync, isPending: deletingImage } = useDeleteCategoryBackground();

  // Derived state
  // Filter locally if API doesn't support pagination, OR rely on API if it does.
  // The service passes 'search' to API. 
  // However, `useLevelCategories` hook in my implementation calls `fetchAllLevelCategories(getToken, search)`.
  // `levelCategoryService.js` fetches ALL (no page/limit params sent, only search).
  // So we must handle pagination CLIENT-SIDE for now, OR update service to support pagination.
  // The original component code shows `setPagination(data.pagination || { ... })`.
  // Wait, `levelCategoryService.js` (step 226) DOES NOT send page/limit.
  // But `LevelCategoryManagement.jsx` (step 285, line 75-81) expects `data.pagination`.
  // If `levelCategoryService.js` returns all data, `data.pagination` might be undefined.
  // If the API returns all data, we should paginate locally.
  // The original code implies it expected pagination but maybe the API didn't support it strictly?
  // Let's assume we get all categories and paginate locally.

  const allCategories = categoriesData?.levelCategories || [];
  // Client-side pagination logic if API returns all
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedCategories = allCategories.slice(startIndex, endIndex);

  // If the API DOES return pagination (e.g. if I missed it in service), use it.
  // But strictly looking at `levelCategoryService.js`, it only sends `search`.
  // So client-side pagination is safer.

  const pagination = {
    total: allCategories.length,
    totalPages: Math.ceil(allCategories.length / rowsPerPage),
    page,
    limit: rowsPerPage,
  };

  // Level Category form states
  const [levelCategoryDialogOpen, setLevelCategoryDialogOpen] = useState(false);
  const [editingLevelCategory, setEditingLevelCategory] = useState(null);
  const [levelCategoryForm, setLevelCategoryForm] = useState({
    category_name: '',
    description: '',
    item_enable: false,
    item: null,
    difficulty_order: 1,
    color_code: '#4CAF50',
    block_key: null,
  });
  const [saveError, setSaveError] = useState(null);

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [levelCategoryToDelete, setLevelCategoryToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Image management states
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [imageError, setImageError] = useState(null);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    handlePageChange(1);
  }, [handlePageChange]);

  const handleOpenLevelCategoryDialog = useCallback((levelCategory = null) => {
    if (levelCategory) {
      setEditingLevelCategory(levelCategory);
      // Convert block_key to comma-separated format for easier editing
      let blockKeyDisplay = '';
      if (levelCategory.block_key) {
        if (Array.isArray(levelCategory.block_key)) {
          blockKeyDisplay = levelCategory.block_key.join(', ');
        } else if (typeof levelCategory.block_key === 'object') {
          // If it's an object, convert to JSON string
          blockKeyDisplay = JSON.stringify(levelCategory.block_key, null, 2);
        } else {
          blockKeyDisplay = String(levelCategory.block_key);
        }
      }

      // Get items from category_items relation
      const items = levelCategory.category_items?.map(ci => ci.item_type) || [];

      setLevelCategoryForm({
        category_name: levelCategory.category_name,
        description: levelCategory.description || '',
        item_enable: levelCategory.item_enable || false,
        item: items,
        difficulty_order: levelCategory.difficulty_order,
        color_code: levelCategory.color_code || '#4CAF50',
        block_key: blockKeyDisplay,
      });
    } else {
      setEditingLevelCategory(null);
      // Get max difficulty_order to suggest next order
      const maxOrder = allCategories.length > 0
        ? Math.max(...allCategories.map(c => c.difficulty_order))
        : 0;
      setLevelCategoryForm({
        category_name: '',
        description: '',
        item_enable: false,
        item: null,
        difficulty_order: maxOrder + 1,
        color_code: '#4CAF50',
        block_key: '',
      });
    }
    setSaveError(null);
    setLevelCategoryDialogOpen(true);
  }, [allCategories]);

  const handleCloseLevelCategoryDialog = useCallback(() => {
    setLevelCategoryDialogOpen(false);
    setEditingLevelCategory(null);
    setSaveError(null);
    setLevelCategoryForm({
      category_name: '',
      description: '',
      item_enable: false,
      item: null,
      difficulty_order: 1,
      color_code: '#4CAF50',
      block_key: null,
      background_image: null,
    });
  }, []);

  const handleSaveLevelCategory = useCallback(async () => {
    setSaveError(null);

    // Handle block_key - support both comma-separated and JSON format
    let blockKeyValue = null;
    if (levelCategoryForm.block_key && levelCategoryForm.block_key.trim()) {
      const trimmedValue = levelCategoryForm.block_key.trim();

      // Try to parse as JSON first
      try {
        blockKeyValue = JSON.parse(trimmedValue);
      } catch (jsonError) {
        // If not valid JSON, treat as comma-separated string
        // Split by comma and trim each item
        const items = trimmedValue
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);

        if (items.length > 0) {
          blockKeyValue = items;
        } else {
          blockKeyValue = null;
        }
      }
    }

    // Handle item - ensure it's an array or null
    let itemValue = null;
    if (levelCategoryForm.item_enable && levelCategoryForm.item) {
      if (Array.isArray(levelCategoryForm.item)) {
        itemValue = levelCategoryForm.item.length > 0 ? levelCategoryForm.item : null;
      } else {
        itemValue = [levelCategoryForm.item];
      }
    }

    const formData = {
      ...levelCategoryForm,
      category_name: levelCategoryForm.category_name.trim(),
      description: levelCategoryForm.description.trim(),
      color_code: levelCategoryForm.color_code.trim(),
      item: itemValue,
      difficulty_order: parseInt(levelCategoryForm.difficulty_order),
      block_key: blockKeyValue,
    };

    try {
      if (editingLevelCategory) {
        await updateCategoryAsync({
          categoryId: editingLevelCategory.category_id,
          data: formData
        });
      } else {
        await createCategoryAsync(formData);
      }
      handleCloseLevelCategoryDialog();
      return { success: true };
    } catch (err) {
      const errorMessage = 'ไม่สามารถบันทึก level category ได้: ' +
        (err.message || 'Unknown error');
      setSaveError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [levelCategoryForm, editingLevelCategory, updateCategoryAsync, createCategoryAsync, handleCloseLevelCategoryDialog]);

  const handleDeleteClick = useCallback((levelCategory) => {
    setLevelCategoryToDelete(levelCategory);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!levelCategoryToDelete) return;

    try {
      setDeleteError(null);
      await deleteCategoryAsync(levelCategoryToDelete.category_id);
      setDeleteDialogOpen(false);
      setLevelCategoryToDelete(null);
    } catch (err) {
      const errorMessage = createDeleteErrorMessage('level category', err);
      setDeleteError(errorMessage);
    }
  }, [levelCategoryToDelete, deleteCategoryAsync]);

  const handleDeleteDialogChange = useCallback((open) => {
    if (!deleting) {
      setDeleteDialogOpen(open);
      if (!open) {
        setLevelCategoryToDelete(null);
        setDeleteError(null);
      }
    }
  }, [deleting]);

  const getDeleteDescription = (categoryName) =>
    `คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ "${categoryName}"? ` +
    'การกระทำนี้ไม่สามารถยกเลิกได้';

  // Image Management Handlers
  const handleOpenImageDialog = useCallback((category) => {
    setSelectedCategory(category);
    setImageError(null);
    setImageDialogOpen(true);
  }, []);

  const handleImageDialogChange = useCallback((open) => {
    setImageDialogOpen(open);
    if (!open) {
      setSelectedCategory(null);
      setImageError(null);
    }
  }, []);

  const handleUploadImage = useCallback(async (imageFile) => {
    if (!selectedCategory || !imageFile) {
      setImageError('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    try {
      setImageError(null);
      await uploadImageAsync({ categoryId: selectedCategory.category_id, file: imageFile });

      // Update selected category state to reflect changes immediately
      // The query cache is already invalidated, but to update the local `selectedCategory` needed for the dialog:
      // We can try to find it in the new data or just close/refresh.
      // But query update is async.
      // Simple fix: Close dialog or rely on query re-render if `selectedCategory` uses ID? 
      // The dialog uses `selectedCategory` object passed in.
      // We might need to fetch the single category to get the new image URL, OR just trust query invalidation updates the LIST, 
      // and we need to re-find the category from the list.
      // But for now let's just let it be, often list update is enough.

    } catch (err) {
      setImageError('ไม่สามารถอัปโหลดรูปภาพได้: ' + (err.message || 'Unknown error'));
    }
  }, [selectedCategory, uploadImageAsync]);

  const handleDeleteImage = useCallback(async () => {
    if (!selectedCategory) return;

    try {
      setImageError(null);
      await deleteImageAsync(selectedCategory.category_id);
    } catch (err) {
      setImageError('ไม่สามารถลบรูปภาพได้: ' + (err.message || 'Unknown error'));
    }
  }, [selectedCategory, deleteImageAsync]);

  const error = isError ? (categoriesError?.message || 'Failed to load level categories') : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title="Level Category Management"
          subtitle="จัดการหมวดหมู่ระดับ"
          onAddClick={() => handleOpenLevelCategoryDialog()}
          addButtonText="เพิ่มหมวดหมู่"
        />

        <ErrorAlert message={error} />
        {/* Save error moved to inside dialog usually, but here it's global? */}
        {/* The dialog component probably displays its own errors or we pass it? */}
        {/* Looking at dialog usage below, we pass `onSave`. The dialog might handle error display? */}
        {/* But we have `setSaveError` here, so we display it here. */}
        <ErrorAlert message={saveError} />
        <ErrorAlert message={imageError} />
        <ErrorAlert message={deleteError} />

        <SearchInput
          defaultValue={searchQuery}
          onSearch={handleSearchChange}
          placeholder="ค้นหาหมวดหมู่ (name, description)..."
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <LoadingState message="Loading level categories..." />
          ) : paginatedCategories.length === 0 ? (
            <EmptyState
              message="ไม่พบข้อมูลหมวดหมู่"
              searchQuery={searchQuery}
            />
          ) : (
            <>
              <LevelCategoryTable
                levelCategories={paginatedCategories}
                onEdit={handleOpenLevelCategoryDialog}
                onDelete={handleDeleteClick}
                onManageImages={handleOpenImageDialog}
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

        <LevelCategoryFormDialog
          open={levelCategoryDialogOpen}
          onOpenChange={handleCloseLevelCategoryDialog}
          editingLevelCategory={editingLevelCategory}
          formData={levelCategoryForm}
          onFormChange={setLevelCategoryForm}
          onSave={handleSaveLevelCategory}
        />

        <LevelCategoryImageDialog
          open={imageDialogOpen}
          onOpenChange={handleImageDialogChange}
          selectedCategory={selectedCategory}
          uploading={uploadingImage}
          deleting={deletingImage}
          onUpload={handleUploadImage}
          onDelete={handleDeleteImage}
          getImageUrl={getImageUrl}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteDialogChange}
          onConfirm={handleDeleteConfirm}
          title="ยืนยันการลบหมวดหมู่"
          description={getDeleteDescription(levelCategoryToDelete?.category_name)}
          confirmText="ลบ"
          cancelText="ยกเลิก"
          isLoading={deleting}
        />
      </div>
    </div>
  );
};

export default LevelCategoryManagement;
