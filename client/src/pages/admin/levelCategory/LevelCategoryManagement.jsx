import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  useLevelCategories,
  useDeleteLevelCategory,
} from '../../../services/hooks/useLevelCategories';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import PaginationControls from '@/components/shared/pagination/PaginationControls';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import LevelCategoryFormDialog from '@/components/admin/addEditDialog/LevelCategoryFormDialog';
import LevelCategoryImageDialog from '@/components/admin/imageDialog/LevelCategoryImageDialog';
import { usePagination } from '@/hooks/usePagination';

import LevelCategoryTable from '@/components/admin/levelCategory/LevelCategoryTable';
import { getImageUrl } from '@/utils/imageUtils';

import PageError from '@/components/shared/Error/PageError';

const LevelCategoryManagement = () => {
  const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);
  const [searchQuery, setSearchQuery] = useState('');

  // TanStack Query Hooks
  const {
    data: categoriesData,
    isLoading: loading,
    isError,
    error: categoriesError
  } = useLevelCategories(searchQuery);

  if (isError) {
    return <PageError message={categoriesError?.message} title="Failed to load topics" />;
  }

  // Mutations
  const { mutateAsync: deleteCategoryAsync, isPending: deleting } = useDeleteLevelCategory();

  // Client-side pagination (API returns all categories)
  const allCategories = categoriesData?.levelCategories || [];
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedCategories = allCategories.slice(startIndex, endIndex);


  const pagination = {
    total: allCategories.length,
    totalPages: Math.ceil(allCategories.length / rowsPerPage),
    page,
    limit: rowsPerPage,
  };

  // Level Category form states
  const [levelCategoryDialogOpen, setLevelCategoryDialogOpen] = useState(false);
  const [editingLevelCategory, setEditingLevelCategory] = useState(null);

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [levelCategoryToDelete, setLevelCategoryToDelete] = useState(null);

  // Image management states
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [imageError, setImageError] = useState(null);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    handlePageChange(1);
  }, [handlePageChange]);

  const handleOpenLevelCategoryDialog = useCallback((levelCategory = null) => {
    setEditingLevelCategory(levelCategory);
    setLevelCategoryDialogOpen(true);
  }, []);

  const handleCloseLevelCategoryDialog = useCallback(() => {
    setLevelCategoryDialogOpen(false);
    setEditingLevelCategory(null);
  }, []);

  const handleDeleteClick = useCallback((levelCategory) => {
    setLevelCategoryToDelete(levelCategory);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!levelCategoryToDelete) return;

    try {
      await deleteCategoryAsync(levelCategoryToDelete.category_id);
      setDeleteDialogOpen(false);
      setLevelCategoryToDelete(null);
      toast.success('ลบหัวข้อสำเร็จ');
    } catch (err) {
      console.error(err);
    }
  }, [levelCategoryToDelete, deleteCategoryAsync]);

  const handleDeleteDialogChange = useCallback((open) => {
    if (!deleting) {
      setDeleteDialogOpen(open);
      if (!open) {
        setLevelCategoryToDelete(null);
      }
    }
  }, [deleting]);



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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title="Topic Management"
          subtitle="จัดการหัวข้อการเรียนรู้"
          onAddClick={() => handleOpenLevelCategoryDialog()}
          addButtonText="เพิ่มหัวข้อ"
        />

        <ErrorAlert message={imageError} />

        <SearchInput
          defaultValue={searchQuery}
          onSearch={handleSearchChange}
          placeholder="ค้นหาหัวข้อ (name, description)..."
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <LoadingState message="Loading topics..." />
          ) : paginatedCategories.length === 0 ? (
            <EmptyState
              message="ไม่พบข้อมูลหัวข้อ"
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
        />

        <LevelCategoryImageDialog
          open={imageDialogOpen}
          onOpenChange={handleImageDialogChange}
          selectedCategory={selectedCategory}
          getImageUrl={getImageUrl}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteDialogChange}
          onConfirm={handleDeleteConfirm}
          itemName={levelCategoryToDelete?.category_name}
          title="ยืนยันการลบหัวข้อ"
          deleting={deleting}
        />
      </div>
    </div>
  );
};

export default LevelCategoryManagement;
