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
import { fetchHintsByLevel, createLevelHint, updateLevelHint, deleteLevelHint, uploadHintImage, deleteHintImage } from '../../../services/levelHintService';
import { fetchLevelById } from '../../../services/levelService';
import LevelHintImageDialog from '../../../components/admin/level/LevelHintImageDialog';
import { getImageUrl } from '@/utils/imageUtils';
import LevelHintTable from '@/components/admin/level/LevelHintTable';

const LevelHintManagement = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { levelId } = useParams();
  const numericLevelId = parseInt(levelId, 10);

  const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);

  const [level, setLevel] = useState(null);
  const [hints, setHints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 10,
  });

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

  const loadLevel = useCallback(async () => {
    try {
      const data = await fetchLevelById(getToken, numericLevelId);
      setLevel(data);
    } catch (err) {
      // ไม่ critical สำหรับการจัดการ hint
    }
  }, [getToken, numericLevelId]);

  const loadHints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchHintsByLevel(getToken, numericLevelId);

      // client-side filter + pagination (เพราะ backend per-level routeยังไม่รองรับ pagination)
      const allHints = data || [];
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

      setHints(pageItems);
      setPagination({
        total,
        totalPages: Math.max(1, Math.ceil(total / rowsPerPage)),
        page,
        limit: rowsPerPage,
      });
    } catch (err) {
      setError('Failed to load hints. ' + (err.message || ''));
      setHints([]);
      setPagination({
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
      });
    } finally {
      setLoading(false);
    }
  }, [getToken, numericLevelId, page, rowsPerPage, searchQuery]);

  useEffect(() => {
    loadLevel();
  }, [loadLevel]);

  useEffect(() => {
    loadHints();
  }, [loadHints]);

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
        await updateLevelHint(getToken, editingHint.hint_id, payload);
      } else {
        await createLevelHint(getToken, payload);
      }
      handleCloseHintDialog();
      await loadHints();
      return { success: true };
    } catch (err) {
      const msg = 'ไม่สามารถบันทึก hint ได้: ' + (err.message || 'Unknown error');
      setSaveError(msg);
      return { success: false, error: msg };
    }
  }, [editingHint, getToken, hintForm, numericLevelId, handleCloseHintDialog, loadHints]);

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
      await deleteLevelHint(getToken, hintToDelete.hint_id);
      setDeleteDialogOpen(false);
      setHintToDelete(null);
      await loadHints();
    } catch (err) {
      setDeleteError('ไม่สามารถลบ hint ได้: ' + (err.message || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  }, [hintToDelete, getToken, loadHints]);

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
      await uploadHintImage(getToken, selectedHint.hint_id, imageFile);

      await loadHints();

      // รีเฟรช selectedHint จากข้อมูลล่าสุด
      const all = await fetchHintsByLevel(getToken, numericLevelId);
      const updated = all.find(h => h.hint_id === selectedHint.hint_id);
      if (updated) {
        setSelectedHint(updated);
      }

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
  }, [selectedHint, imageFile, getToken, loadHints, numericLevelId]);

  const handleDeleteImage = useCallback(async (imageId) => {
    try {
      setDeletingImageId(imageId);
      setImageError(null);
      await deleteHintImage(getToken, imageId);

      await loadHints();

      if (selectedHint) {
        const all = await fetchHintsByLevel(getToken, numericLevelId);
        const updated = all.find(h => h.hint_id === selectedHint.hint_id);
        if (updated) {
          setSelectedHint(updated);
        }
      }
    } catch (err) {
      setImageError('ไม่สามารถลบรูปภาพได้: ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingImageId(null);
    }
  }, [selectedHint, getToken, loadHints, numericLevelId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title={`Hints for Level: ${level?.level_name || levelId}`}
          subtitle="จัดการ Hint ของด่านนี้ (ใช้แสดงระหว่างเล่น)"
          backPath="/admin/levels"
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
                hints={hints}
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
        {hintDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold">
                {editingHint ? 'แก้ไข Hint' : 'เพิ่ม Hint ใหม่'}
              </h2>
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
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleCloseHintDialog}>
                  ยกเลิก
                </Button>
                <Button onClick={handleSaveHint}>
                  <Plus className="h-4 w-4 mr-2" />
                  บันทึก
                </Button>
              </div>
            </div>
          </div>
        )}

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


