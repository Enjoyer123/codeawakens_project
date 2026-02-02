import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  useLevelGuides,
  useCreateGuide,
  useUpdateGuide,
  useDeleteGuide,
  useUploadGuideImage,
  useDeleteGuideImage
} from '../../../services/hooks/useLevelGuides';
import { useLevel } from '../../../services/hooks/useLevel';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import GuideImageDialog from '../../../components/admin/guide/GuideImageDialog';
import { getImageUrl } from '@/utils/imageUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createDeleteErrorMessage } from '@/utils/errorHandler';
import LevelGuideTable from '@/components/admin/level/LevelGuideTable';

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

  const createGuideMutation = useCreateGuide();
  const updateGuideMutation = useUpdateGuide();
  const deleteGuideMutation = useDeleteGuide();
  const uploadImageMutation = useUploadGuideImage();
  const deleteImageMutation = useDeleteGuideImage();

  // Derived State
  const guides = guidesData || [];
  const [searchQuery, setSearchQuery] = useState('');

  // Guide form states
  const [guideDialogOpen, setGuideDialogOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const [guideForm, setGuideForm] = useState({
    title: '',
    description: '',
    display_order: 0,
    is_active: true,
  });
  const [saveError, setSaveError] = useState(null);

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
    if (guide) {
      setEditingGuide(guide);
      setGuideForm({
        title: guide.title,
        description: guide.description || '',
        display_order: guide.display_order,
        is_active: guide.is_active,
      });
    } else {
      setEditingGuide(null);
      setGuideForm({
        title: '',
        description: '',
        display_order: 0,
        is_active: true,
      });
    }
    setSaveError(null);
    setGuideDialogOpen(true);
  }, []);

  const handleCloseGuideDialog = useCallback(() => {
    setGuideDialogOpen(false);
    setEditingGuide(null);
    setSaveError(null);
    setGuideForm({
      title: '',
      description: '',
      display_order: 0,
      is_active: true,
    });
  }, []);

  const handleSaveGuide = useCallback(async () => {
    setSaveError(null);

    if (!guideForm.title.trim()) {
      const errorMessage = 'กรุณากรอกชื่อ Guide (Title)';
      setSaveError(errorMessage);
      return;
    }

    const formData = {
      level_id: numericLevelId,
      title: guideForm.title.trim(),
      description: guideForm.description?.trim() || null,
      display_order: parseInt(guideForm.display_order) || 0,
      is_active: guideForm.is_active === true || guideForm.is_active === 'true',
    };

    try {
      if (editingGuide) {
        await updateGuideMutation.mutateAsync({
          guideId: editingGuide.guide_id,
          data: formData
        });
      } else {
        await createGuideMutation.mutateAsync(formData);
      }
      handleCloseGuideDialog();
    } catch (err) {
      const errorMessage = 'ไม่สามารถบันทึก guide ได้: ' + (err.message || 'Unknown error');
      setSaveError(errorMessage);
    }
  }, [guideForm, editingGuide, numericLevelId, handleCloseGuideDialog, updateGuideMutation, createGuideMutation]);

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
      const errorMessage = createDeleteErrorMessage('guide', err);
      setDeleteError(errorMessage);
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
          backPath={`/admin/levels/${numericLevelId}/edit`}
          onAddClick={() => handleOpenGuideDialog()}
          addButtonText="เพิ่ม Guide"
        />

        <ErrorAlert message={deleteError} />
        <ErrorAlert message={saveError} />
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

        {/* Create/Edit Dialog */}
        {/* Create/Edit Dialog */}
        <Dialog open={guideDialogOpen} onOpenChange={setGuideDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingGuide ? 'แก้ไข Guide' : 'เพิ่ม Guide ใหม่'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={guideForm.title}
                  onChange={e => setGuideForm({ ...guideForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  rows={3}
                  value={guideForm.description}
                  onChange={e => setGuideForm({ ...guideForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Display Order</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={guideForm.display_order}
                    onChange={e => setGuideForm({ ...guideForm, display_order: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    id="guide-active"
                    type="checkbox"
                    checked={guideForm.is_active}
                    onChange={e => setGuideForm({ ...guideForm, is_active: e.target.checked })}
                  />
                  <label htmlFor="guide-active" className="text-sm">Active</label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseGuideDialog}>ยกเลิก</Button>
              <Button onClick={handleSaveGuide}>
                <Plus className="h-4 w-4 mr-2" />
                บันทึก
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
