import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import { usePagination } from '@/hooks/usePagination';
import PaginationControls from '@/components/shared/pagination/PaginationControls';
import {

  useLevelHints,
  useDeleteLevelHint,
  useUploadHintImage,
  useDeleteHintImage
} from '../../../services/hooks/useLevelHints';
import { useLevel } from '../../../services/hooks/useLevel';
import LevelHintImageDialog from '@/components/admin/imageDialog/LevelHintImageDialog';
import { getImageUrl } from '@/utils/imageUtils';
import LevelHintTable from '@/components/admin/level/tables/LevelHintTable';
import LevelHintFormDialog from '@/components/admin/addEditDialog/LevelHintFormDialog';

import PageError from '@/components/shared/Error/PageError';

const LevelHintManagement = () => {
  const { levelId } = useParams();
  const numericLevelId = parseInt(levelId, 10);

  // TanStack Query Hooks
  const { data: level } = useLevel(numericLevelId);
  const {
    data: hintsData,
    isLoading: loading,
    isError,
    error: queryError
  } = useLevelHints(numericLevelId);

  const deleteHintMutation = useDeleteLevelHint();
  const uploadImageMutation = useUploadHintImage();
  const deleteImageMutation = useDeleteHintImage();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);

  const [hintDialogOpen, setHintDialogOpen] = useState(false);
  const [editingHint, setEditingHint] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hintToDelete, setHintToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // image dialog state
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedHintId, setSelectedHintId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(null);

  if (isError) {
    return <PageError message={queryError?.message} title="Failed to load hints" />;
  }

  // Derived State
  const allHints = hintsData || [];

  // Client-side filtering & pagination
  const { filteredHints, pagination } = useMemo(() => {
    const filtered = searchQuery
      ? allHints.filter(h =>
        (h.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
      : allHints;

    const total = filtered.length;
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageItems = filtered.slice(start, end);

    return {
      filteredHints: pageItems,
      pagination: {
        total,
        totalPages: Math.max(1, Math.ceil(total / rowsPerPage)),
        page,
        limit: rowsPerPage,
      }
    };
  }, [allHints, searchQuery, page, rowsPerPage]);

  const handleSearchChange = useCallback(
    (value) => {
      setSearchQuery(value);
      handlePageChange(1);
    },
    [handlePageChange]
  );

  const handleOpenHintDialog = useCallback((hint = null) => {
    setEditingHint(hint || null);
    setHintDialogOpen(true);
  }, []);

  const handleCloseHintDialog = useCallback(() => {
    setHintDialogOpen(false);
    setEditingHint(null);
  }, []);

  const handleDeleteClick = useCallback((hint) => {
    setHintToDelete(hint);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!hintToDelete) return;
    try {
      setDeleteError(null);
      await deleteHintMutation.mutateAsync(hintToDelete.hint_id);
      setDeleteDialogOpen(false);
      setHintToDelete(null);
    } catch (err) {
      setDeleteError('ไม่สามารถลบ hint ได้: ' + (err.message || 'Unknown error'));
    }
  }, [hintToDelete, deleteHintMutation]);

  const handleDeleteDialogChange = useCallback(
    (open) => {
      if (!deleteHintMutation.isPending) {
        setDeleteDialogOpen(open);
        if (!open) {
          setHintToDelete(null);
          setDeleteError(null);
        }
      }
    },
    [deleteHintMutation.isPending]
  );

  const handleOpenImageDialog = useCallback((hint) => {
    setSelectedHintId(hint.hint_id);
    setImageFile(null);
    setImageError(null);
    setImageDialogOpen(true);
  }, []);

  const handleImageDialogChange = useCallback((open) => {
    setImageDialogOpen(open);
    if (!open) {
      setSelectedHintId(null);
      setImageFile(null);
      setUploadingImage(false);
      setImageError(null);
    }
  }, []);

  const handleImageFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    setImageFile(file || null);
  }, []);

  const handleAddImage = useCallback(async () => {
    if (!selectedHintId || !imageFile) {
      setImageError('กรุณาเลือก Hint และไฟล์รูปภาพ');
      return;
    }

    try {
      setUploadingImage(true);
      setImageError(null);

      await uploadImageMutation.mutateAsync({
        hintId: selectedHintId,
        file: imageFile
      });

      setImageFile(null);
      const input = document.getElementById('level-hint-image-input');
      if (input) {
        input.value = '';
      }
    } catch (err) {
      setImageError('ไม่สามารถอัปโหลดรูปภาพได้: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingImage(false);
    }
  }, [selectedHintId, imageFile, uploadImageMutation]);

  const handleDeleteImage = useCallback(async (imageId) => {
    try {
      setImageError(null);
      await deleteImageMutation.mutateAsync(imageId);
    } catch (err) {
      setImageError('ไม่สามารถลบรูปภาพได้: ' + (err.message || 'Unknown error'));
    }
  }, [deleteImageMutation]);

  // Derived dialogHint from the freshest hintsData
  const dialogHint = useMemo(() => {
    return selectedHintId && allHints ? allHints.find(h => h.hint_id === selectedHintId) : null;
  }, [selectedHintId, allHints]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title={`Hints for Level: ${level?.level_name || levelId}`}
          subtitle="จัดการ Hint ของด่านนี้ (ใช้แสดงระหว่างเล่น)"
          backPath={`/admin/levels`}
          onAddClick={() => handleOpenHintDialog()}
          addButtonText="เพิ่ม Hint"
        />

        <ErrorAlert message={deleteError} />
        <ErrorAlert message={imageError} />

        <SearchInput
          defaultValue={searchQuery}
          onSearch={handleSearchChange}
          placeholder="ค้นหา Hint (ชื่อ, คำอธิบาย)..."
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4">
          {loading ? (
            <LoadingState message="Loading hints..." />
          ) : pagination.total === 0 ? (
            <EmptyState
              message="ยังไม่มี Hint สำหรับด่านนี้"
              searchQuery={searchQuery}
            />
          ) : (
            <>
              <LevelHintTable
                hints={filteredHints}
                onEdit={handleOpenHintDialog}
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

        <LevelHintFormDialog
          open={hintDialogOpen}
          onOpenChange={setHintDialogOpen}
          editingHint={editingHint}
          numericLevelId={numericLevelId}
          onClose={handleCloseHintDialog}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteDialogChange}
          onConfirm={handleDeleteConfirm}
          itemName={hintToDelete?.title}
          title="ยืนยันการลบ Hint"
          isConfirming={deleteHintMutation.isPending}
          error={deleteError}
        />

        <LevelHintImageDialog
          open={imageDialogOpen}
          onOpenChange={handleImageDialogChange}
          selectedHint={dialogHint}
          imageFile={imageFile}
          onImageFileChange={handleImageFileChange}
          isUploading={uploadingImage}
          isDeleting={deleteImageMutation.isPending}
          onAddImage={handleAddImage}
          onDeleteImage={handleDeleteImage}
          getImageUrl={getImageUrl}
        />
      </div>
    </div>
  );
};

export default LevelHintManagement;
