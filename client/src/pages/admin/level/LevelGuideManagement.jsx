import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchGuidesByLevel,
  createGuide,
  updateGuide,
  deleteGuide,
  uploadGuideImage,
  deleteGuideImage,
} from '../../../services/guideService';
import { fetchLevelById } from '../../../services/levelService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Image as ImageIcon, Plus } from 'lucide-react';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import { LoadingState, EmptyState } from '@/components/admin/tableStates/DataTableStates';
import GuideImageDialog from '../../../components/admin/guide/GuideImageDialog';
import { getImageUrl } from '@/utils/imageUtils';
import { createDeleteErrorMessage } from '@/utils/errorHandler';

const LevelGuideManagement = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { levelId } = useParams();
  const numericLevelId = parseInt(levelId, 10);

  const [level, setLevel] = useState(null);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  const loadLevel = useCallback(async () => {
    try {
      const data = await fetchLevelById(getToken, numericLevelId);
      setLevel(data);
    } catch (err) {
      console.error('Failed to load level', err);
    }
  }, [getToken, numericLevelId]);

  const loadGuides = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchGuidesByLevel(getToken, numericLevelId);
      setGuides(data || []);
    } catch (err) {
      setError('Failed to load guides. ' + (err.message || ''));
      setGuides([]);
    } finally {
      setLoading(false);
    }
  }, [getToken, numericLevelId]);

  useEffect(() => {
    loadLevel();
    loadGuides();
  }, [loadLevel, loadGuides]);

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
        await updateGuide(getToken, editingGuide.guide_id, formData);
      } else {
        await createGuide(getToken, formData);
      }
      handleCloseGuideDialog();
      await loadGuides();
    } catch (err) {
      const errorMessage = 'ไม่สามารถบันทึก guide ได้: ' + (err.message || 'Unknown error');
      setSaveError(errorMessage);
    }
  }, [guideForm, editingGuide, getToken, numericLevelId, handleCloseGuideDialog, loadGuides]);

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
      await deleteGuide(getToken, guideToDelete.guide_id);
      setDeleteDialogOpen(false);
      setGuideToDelete(null);
      await loadGuides();
    } catch (err) {
      const errorMessage = createDeleteErrorMessage('guide', err);
      setDeleteError(errorMessage);
    } finally {
      setDeleting(false);
    }
  }, [guideToDelete, getToken, loadGuides]);

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
      await uploadGuideImage(getToken, selectedGuide.guide_id, imageFile);
      await loadGuides();

      // Refresh selected guide
      const data = await fetchGuidesByLevel(getToken, numericLevelId);
      const updated = data.find(g => g.guide_id === selectedGuide.guide_id);
      if (updated) setSelectedGuide(updated);

      setImageFile(null);
      const input = document.getElementById('guide-image-input');
      if (input) input.value = '';
    } catch (err) {
      setImageError('ไม่สามารถอัปโหลดรูปภาพได้: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingImage(false);
    }
  }, [selectedGuide, imageFile, getToken, loadGuides, numericLevelId]);

  const handleDeleteImage = useCallback(async (imageId) => {
    try {
      setDeletingImageId(imageId);
      setImageError(null);
      await deleteGuideImage(getToken, imageId);
      await loadGuides();

      if (selectedGuide) {
        const updatedImages = selectedGuide.guide_images?.filter(
          img => img.guide_file_id !== parseInt(imageId)
        ) || [];
        setSelectedGuide({ ...selectedGuide, guide_images: updatedImages });
      }
    } catch (err) {
      setImageError('ไม่สามารถลบรูปภาพได้: ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingImageId(null);
    }
  }, [selectedGuide, getToken, loadGuides]);

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
          backPath="/admin/levels"
          onAddClick={() => handleOpenGuideDialog()}
          addButtonText="เพิ่ม Guide"
        />

        <ErrorAlert message={error} />
        <ErrorAlert message={deleteError} />
        <ErrorAlert message={saveError} />
        <ErrorAlert message={imageError} />

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="ค้นหา Guide..."
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4">
          {loading ? (
            <LoadingState message="Loading guides..." />
          ) : filteredGuides.length === 0 ? (
            <EmptyState message="ยังไม่มี Guide สำหรับด่านนี้" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Images</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGuides.map((guide) => (
                    <tr key={guide.guide_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{guide.title}</div>
                        {guide.description && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">{guide.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{guide.display_order}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={guide.is_active ? 'default' : 'secondary'}>
                          {guide.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {guide.guide_images && guide.guide_images.length > 0 ? (
                            <>
                              <Badge variant="secondary">{guide.guide_images.length}</Badge>
                              {guide.guide_images.slice(0, 2).map((img) => (
                                <img
                                  key={img.guide_file_id}
                                  src={getImageUrl(img.path_file)}
                                  className="w-8 h-8 object-cover rounded border"
                                  alt=""
                                />
                              ))}
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                           <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenImageDialog(guide)}
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            รูปภาพ
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenGuideDialog(guide)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            แก้ไข
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(guide)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            ลบ
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Dialog */}
        {guideDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold">
                {editingGuide ? 'แก้ไข Guide' : 'เพิ่ม Guide ใหม่'}
              </h2>
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
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleCloseGuideDialog}>ยกเลิก</Button>
                <Button onClick={handleSaveGuide}>
                  <Plus className="h-4 w-4 mr-2" />
                  บันทึก
                </Button>
              </div>
            </div>
          </div>
        )}

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => !deleting && setDeleteDialogOpen(open)}
          onConfirm={handleDeleteConfirm}
          itemName={guideToDelete?.title}
          title="ยืนยันการลบ Guide"
          description={
            <>
              คุณแน่ใจหรือไม่ว่าต้องการลบ Guide <strong>{guideToDelete?.title}</strong>?
            </>
          }
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
