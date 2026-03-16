import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
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
import { getImageUrl } from '@/utils/imageUtils';
import LevelGuideTable from '@/components/admin/level/tables/LevelGuideTable';
import LevelGuideFormDialog from '@/components/admin/addEditDialog/LevelGuideFormDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import PageError from '@/components/shared/Error/PageError';

const LevelGuideManagement = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
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
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Image management states
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState(null);

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
      setDeleting(true);
      setDeleteError(null);
      await deleteGuideMutation.mutateAsync(guideToDelete.guide_id);
      setDeleteDialogOpen(false);
      setGuideToDelete(null);
    } catch (err) {
      setDeleteError('ไม่สามารถลบ guide ได้: ' + (err.message || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  }, [guideToDelete, deleteGuideMutation]);

  const handleOpenImageDialog = useCallback((guide) => {
    setSelectedGuide(guide);
    setImageFile(null);
    setImageError(null);
    setImageDialogOpen(true);
  }, []);

  const handleImageDialogChange = useCallback((open) => {
    setImageDialogOpen(open);
    if (!open) {
      setSelectedGuide(null);
      setImageFile(null);
      setUploadingImage(false);
      setDeletingImageId(null);
      setImageError(null);
    }
  }, []);

  const handleImageFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    setImageFile(file || null);
  }, []);

  const handleAddImage = useCallback(async () => {
    if (!selectedGuide || !imageFile) {
      setImageError('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    try {
      setUploadingImage(true);
      setImageError(null);
      await uploadImageMutation.mutateAsync({
        guideId: selectedGuide.guide_id,
        file: imageFile
      });

      // Same as in Hints, we rely on TanStack Query invalidation.
      // But selectedGuide is local, so we should update it or clear it.
      // Updating it via effect is better.

      setImageFile(null);
      const input = document.getElementById('guide-image-input');
      if (input) input.value = '';
    } catch (err) {
      setImageError('ไม่สามารถอัปโหลดรูปภาพได้: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingImage(false);
    }
  }, [selectedGuide, imageFile, uploadImageMutation]);

  const handleDeleteImage = useCallback(async (imageId) => {
    try {
      setDeletingImageId(imageId);
      setImageError(null);
      await deleteImageMutation.mutateAsync(imageId);
    } catch (err) {
      setImageError('ไม่สามารถลบรูปภาพได้: ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingImageId(null);
    }
  }, [deleteImageMutation]);

  // Sync selectedGuide with guidesData
  useEffect(() => {
    if (selectedGuide && guidesData) {
      const updated = guidesData.find(g => g.guide_id === selectedGuide.guide_id);
      if (updated) setSelectedGuide(updated);
    }
  }, [guidesData, selectedGuide]);

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
        <ErrorAlert message={imageError} />

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
          onOpenChange={(open) => !deleting && setDeleteDialogOpen(open)}
          onConfirm={handleDeleteConfirm}
          itemName={guideToDelete?.title}
          title="ยืนยันการลบ Guide"
          deleting={deleting}
        />

        <GuideImageDialog
          open={imageDialogOpen}
          onOpenChange={handleImageDialogChange}
          selectedGuide={selectedGuide}
          imageFile={imageFile}
          onImageFileChange={handleImageFileChange}
          uploadingImage={uploadingImage}
          deletingImageId={deletingImageId}
          onAddImage={handleAddImage}
          onDeleteImage={handleDeleteImage}
          getImageUrl={getImageUrl}
        />
      </div>
    </div>
  );
};

export default LevelGuideManagement;
