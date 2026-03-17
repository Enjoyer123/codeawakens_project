import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import SearchInput from '@/components/admin/formFields/SearchInput';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import {
  useLevelGuides,
  useDeleteGuide,
  useUploadGuideImage,
  useDeleteGuideImage
} from '../../../services/hooks/useLevelGuides';
import { useLevel } from '../../../services/hooks/useLevel';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import GuideImageDialog from '@/components/admin/imageDialog/GuideImageDialog';
import { useImageDialog } from '@/hooks/useImageDialog';
import { getImageUrl } from '@/utils/imageUtils';
import LevelGuideTable from '@/components/admin/level/tables/LevelGuideTable';
import LevelGuideFormDialog from '@/components/admin/addEditDialog/LevelGuideFormDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import PageError from '@/components/shared/Error/PageError';

const LevelGuideManagement = () => {
  const { levelId } = useParams();
  const numericLevelId = parseInt(levelId, 10);

  // TanStack Query Hooks
  const { data: level } = useLevel(numericLevelId);
  const {
    data: guidesData,
    isLoading: loading,
    isError,
    error: queryError
  } = useLevelGuides(numericLevelId);

  if (isError) {
    return <PageError message={queryError?.message} title="Failed to load guides" />;
  }

  const deleteGuideMutation = useDeleteGuide();
  const uploadImageMutation = useUploadGuideImage();
  const deleteImageMutation = useDeleteGuideImage();

  // Derived State
  const guides = guidesData || [];
  const [searchQuery, setSearchQuery] = useState('');

  const [guideDialogOpen, setGuideDialogOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [guideToDelete, setGuideToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Image management states
  const imageDialog = useImageDialog(guidesData, 'guide_id');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  // No manual load effects

  const handleOpenGuideDialog = useCallback((guide = null) => {
    setEditingGuide(guide || null);
    setGuideDialogOpen(true);
  }, []);

  const handleCloseGuideDialog = useCallback(() => {
    setGuideDialogOpen(false);
    setEditingGuide(null);
  }, []);

  const handleDeleteClick = useCallback((guide) => {
    setGuideToDelete(guide);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!guideToDelete) return;
    try {
      setDeleteError(null);
      await deleteGuideMutation.mutateAsync(guideToDelete.guide_id);
      setDeleteDialogOpen(false);
      setGuideToDelete(null);
    } catch (err) {
      setDeleteError('ไม่สามารถลบ guide ได้: ' + (err.message || 'Unknown error'));
    }
  }, [guideToDelete, deleteGuideMutation]);

  const handleOpenImageDialog = useCallback((guide) => {
    imageDialog.openDialog(guide);
    setImageFile(null);
  }, [imageDialog]);

  const handleImageDialogChange = useCallback((open) => {
    imageDialog.closeDialog(open);
    if (!open) {
      setImageFile(null);
      setUploadingImage(false);
    }
  }, [imageDialog]);

  const handleImageFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    setImageFile(file || null);
  }, []);

  const handleAddImage = useCallback(async () => {
    if (!imageDialog.selectedId || !imageFile) {
      imageDialog.setError('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    try {
      setUploadingImage(true);
      imageDialog.setError(null);
      await uploadImageMutation.mutateAsync({
        guideId: imageDialog.selectedId,
        file: imageFile
      });

      // Same as in Hints, we rely on TanStack Query invalidation.
      // But selectedGuideId is local, which is fine since dialogGuide derives from guidesData

      setImageFile(null);
      const input = document.getElementById('guide-image-input');
      if (input) input.value = '';
    } catch (err) {
      imageDialog.setError('ไม่สามารถอัปโหลดรูปภาพได้: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingImage(false);
    }
  }, [imageDialog.selectedId, imageFile, uploadImageMutation, imageDialog]);

  const handleDeleteImage = useCallback(async (imageId) => {
    try {
      imageDialog.setError(null);
      await deleteImageMutation.mutateAsync(imageId);
    } catch (err) {
      imageDialog.setError('ไม่สามารถลบรูปภาพได้: ' + (err.message || 'Unknown error'));
    }
  }, [deleteImageMutation, imageDialog]);

  const filteredGuides = guides.filter(g =>
    (g.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title={`Guides: ${level?.level_name || levelId}`}
          subtitle="จัดการคำแนะนำ (Guides) ของด่านนี้"
          backPath={`/admin/levels`}
          onAddClick={() => handleOpenGuideDialog()}
          addButtonText="เพิ่ม Guide"
        />

        <ErrorAlert message={deleteError} />
        <ErrorAlert message={imageDialog.error} />

        <SearchInput
          defaultValue={searchQuery}
          onSearch={setSearchQuery}
          placeholder="ค้นหา Guide..."
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4">
          {loading ? (
            <LoadingState message="Loading guides..." />
          ) : filteredGuides.length === 0 ? (
            <EmptyState message="ยังไม่มี Guide สำหรับด่านนี้" />
          ) : (
            <LevelGuideTable
              guides={filteredGuides}
              onEdit={handleOpenGuideDialog}
              onDelete={handleDeleteClick}
              onManageImages={handleOpenImageDialog}
            />
          )}
        </div>

        <LevelGuideFormDialog
          open={guideDialogOpen}
          onOpenChange={setGuideDialogOpen}
          editingGuide={editingGuide}
          numericLevelId={numericLevelId}
          onClose={handleCloseGuideDialog}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => !deleteGuideMutation.isPending && setDeleteDialogOpen(open)}
          onConfirm={handleDeleteConfirm}
          itemName={guideToDelete?.title}
          title="ยืนยันการลบ Guide"
          description={`คุณต้องการลบคำแนะนำ "${guideToDelete?.title}" ใช่หรือไม่? ฟาดฟันนี้ไม่สามารถย้อนกลับได้`}
          confirmText="ลบ Guide"
          cancelText="ยกเลิก"
          variant="destructive"
          isConfirming={deleteGuideMutation.isPending}
          error={deleteError}
        />

        <GuideImageDialog
          open={imageDialog.isOpen}
          onOpenChange={handleImageDialogChange}
          selectedGuide={imageDialog.dialogItem}
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

export default LevelGuideManagement;
