import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import { usePagination } from '@/hooks/usePagination';
import PaginationControls from '@/components/shared/pagination/PaginationControls';
import SearchInput from '@/components/admin/formFields/SearchInput';
import { Plus } from 'lucide-react';
import {
  useLevelHints,
  useCreateLevelHint,
  useUpdateLevelHint,
  useDeleteLevelHint,
  useUploadHintImage,
  useDeleteHintImage
} from '../../../services/hooks/useLevelHints';
import { useLevel } from '../../../services/hooks/useLevel';
import LevelHintImageDialog from '../../../components/admin/level/LevelHintImageDialog';
import { getImageUrl } from '@/utils/imageUtils';
import LevelHintTable from '@/components/admin/level/LevelHintTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const LevelHintManagement = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { levelId } = useParams();
  const numericLevelId = parseInt(levelId, 10);

  const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);

  // TanStack Query Hooks
  const { data: level } = useLevel(numericLevelId);
  const {
    data: hintsData,
    isLoading: loading,
    isError,
    error: queryError
  } = useLevelHints(numericLevelId);

  const createHintMutation = useCreateLevelHint();
  const updateHintMutation = useUpdateLevelHint();
  const deleteHintMutation = useDeleteLevelHint();
  const uploadImageMutation = useUploadHintImage();
  const deleteImageMutation = useDeleteHintImage();

  // Derived State
  const allHints = hintsData || [];
  const error = isError ? (queryError?.message || 'Failed to load hints') : null;

  // Client-side filtering & pagination
  const { filteredHints, pagination } = (() => {
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
  })();

  const [searchQuery, setSearchQuery] = useState('');


  const [hintDialogOpen, setHintDialogOpen] = useState(false);
  const [editingHint, setEditingHint] = useState(null);
  const [hintForm, setHintForm] = useState({
    title: '',
    description: '',
    display_order: 0,
    is_active: true,
  });
  const [saveError, setSaveError] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hintToDelete, setHintToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // image dialog state
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedHint, setSelectedHint] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [imageError, setImageError] = useState(null);

  // No manual load effects needed

  const handleSearchChange = useCallback(
    (value) => {
      setSearchQuery(value);
      handlePageChange(1);
    },
    [handlePageChange]
  );

  const handleOpenHintDialog = useCallback((hint = null) => {
    if (hint) {
      setEditingHint(hint);
      setHintForm({
        title: hint.title || '',
        description: hint.description || '',
        display_order: hint.display_order || 0,
        is_active: hint.is_active,
      });
    } else {
      setEditingHint(null);
      setHintForm({
        title: '',
        description: '',
        display_order: 0,
        is_active: true,
      });
    }
    setSaveError(null);
    setHintDialogOpen(true);
  }, []);

  const handleCloseHintDialog = useCallback(() => {
    setHintDialogOpen(false);
    setEditingHint(null);
    setSaveError(null);
    setHintForm({
      title: '',
      description: '',
      display_order: 0,
      is_active: true,
    });
  }, []);

  const handleSaveHint = useCallback(async () => {
    setSaveError(null);

    if (!hintForm.title.trim()) {
      const msg = 'กรุณากรอกชื่อ Hint';
      setSaveError(msg);
      return { success: false, error: msg };
    }

    const payload = {
      level_id: numericLevelId,
      title: hintForm.title.trim(),
      description: hintForm.description?.trim() || null,
      display_order: parseInt(hintForm.display_order) || 0,
      is_active: hintForm.is_active === true || hintForm.is_active === 'true',
    };

    try {
      if (editingHint) {
        await updateHintMutation.mutateAsync({
          hintId: editingHint.hint_id,
          data: payload
        });
      } else {
        await createHintMutation.mutateAsync(payload);
      }
      handleCloseHintDialog();
      return { success: true };
    } catch (err) {
      const msg = 'ไม่สามารถบันทึก hint ได้: ' + (err.message || 'Unknown error');
      setSaveError(msg);
      return { success: false, error: msg };
    }
  }, [editingHint, hintForm, numericLevelId, handleCloseHintDialog, updateHintMutation, createHintMutation]);

  const handleDeleteClick = useCallback((hint) => {
    setHintToDelete(hint);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!hintToDelete) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteHintMutation.mutateAsync(hintToDelete.hint_id);
      setDeleteDialogOpen(false);
      setHintToDelete(null);
    } catch (err) {
      setDeleteError('ไม่สามารถลบ hint ได้: ' + (err.message || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  }, [hintToDelete, deleteHintMutation]);

  const handleDeleteDialogChange = useCallback(
    (open) => {
      if (!deleting) {
        setDeleteDialogOpen(open);
        if (!open) {
          setHintToDelete(null);
          setDeleteError(null);
        }
      }
    },
    [deleting]
  );

  const handleOpenImageDialog = useCallback((hint) => {
    setSelectedHint(hint);
    setImageFile(null);
    setImageError(null);
    setImageDialogOpen(true);
  }, []);

  const handleImageDialogChange = useCallback((open) => {
    setImageDialogOpen(open);
    if (!open) {
      setSelectedHint(null);
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
    if (!selectedHint || !imageFile) {
      setImageError('กรุณาเลือก Hint และไฟล์รูปภาพ');
      return;
    }

    try {
      setUploadingImage(true);
      setImageError(null);

      await uploadImageMutation.mutateAsync({
        hintId: selectedHint.hint_id,
        file: imageFile
      });

      // Refetch updated hint to get image URL for UI
      // Since we invalidated query, hintsData will update.
      // But selectedHint is local state. We need to sync it.
      // We can use a side effect or find it from hintsData
      // For now, simpler to just clear inputs and let user re-open checks if needed, 
      // OR re-find from hintsData if the dialog stays open.
      // The original logic re-fetched manually.
      // Here, React Query will update hintsData. 
      // We can update selectedHint in a useEffect or just let it be if the dialog relies on selectedHint.

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
  }, [selectedHint, imageFile, uploadImageMutation]);

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

  // Sync selectedHint with hintsData when it changes (for image dialog updates)
  useEffect(() => {
    if (selectedHint && hintsData) {
      const updated = hintsData.find(h => h.hint_id === selectedHint.hint_id);
      if (updated) {
        setSelectedHint(updated);
      }
    }
  }, [hintsData, selectedHint]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title={`Hints for Level: ${level?.level_name || levelId}`}
          subtitle="จัดการ Hint ของด่านนี้ (ใช้แสดงระหว่างเล่น)"
          backPath={`/admin/levels/${numericLevelId}/edit`}
          onAddClick={() => handleOpenHintDialog()}
          addButtonText="เพิ่ม Hint"
        />

        <ErrorAlert message={error} />
        <ErrorAlert message={saveError} />
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

        {/* Simple Hint Form Dialog (ใช้ Dialog ของ browser แทนเพื่อความเร็ว) */}
        <Dialog open={hintDialogOpen} onOpenChange={setHintDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingHint ? 'แก้ไข Hint' : 'เพิ่ม Hint ใหม่'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={hintForm.title}
                  onChange={e => setHintForm({ ...hintForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  rows={3}
                  value={hintForm.description}
                  onChange={e => setHintForm({ ...hintForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Display Order</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={hintForm.display_order}
                    onChange={e =>
                      setHintForm({ ...hintForm, display_order: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    id="hint-active"
                    type="checkbox"
                    checked={hintForm.is_active}
                    onChange={e =>
                      setHintForm({ ...hintForm, is_active: e.target.checked })
                    }
                  />
                  <label htmlFor="hint-active" className="text-sm">
                    Active
                  </label>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                * อัปโหลดรูปสำหรับ Hint จะเพิ่มในขั้นถัดไป (ตอนนี้รองรับข้อความก่อน)
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseHintDialog}>
                ยกเลิก
              </Button>
              <Button onClick={handleSaveHint}>
                <Plus className="h-4 w-4 mr-2" />
                บันทึก
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteDialogChange}
          onConfirm={handleDeleteConfirm}
          itemName={hintToDelete?.title}
          title="ยืนยันการลบ Hint"
          description={
            <>
              คุณแน่ใจหรือไม่ว่าต้องการลบ Hint <strong>{hintToDelete?.title}</strong>?
              <br />
              การกระทำนี้ไม่สามารถยกเลิกได้
            </>
          }
          deleting={deleting}
        />

        <LevelHintImageDialog
          open={imageDialogOpen}
          onOpenChange={handleImageDialogChange}
          selectedHint={selectedHint}
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

export default LevelHintManagement;


