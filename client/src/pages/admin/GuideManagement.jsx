import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllGuides,
  createGuide,
  updateGuide,
  deleteGuide,
  fetchLevelsForGuide,
  uploadGuideImage,
  deleteGuideImage,
} from '../../services/guideService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog';
import AdminPageHeader from '@/components/shared/AdminPageHeader';
import SearchInput from '@/components/shared/SearchInput';
import ErrorAlert from '@/components/shared/ErrorAlert';
import PaginationControls from '@/components/shared/PaginationControls';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import GuideImageDialog from './guide/GuideImageDialog';
import GuideFormDialog from '@/components/admin/GuideFormDialog';
import { usePagination } from '@/hooks/usePagination';
import { getImageUrl } from '@/utils/imageUtils';
import { createDeleteErrorMessage } from '@/utils/errorHandler';

const GuideManagement = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);
  const [guides, setGuides] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 10,
  });

  // Guide form states
  const [guideDialogOpen, setGuideDialogOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const [guideForm, setGuideForm] = useState({
    level_id: '',
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

  const loadGuides = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllGuides(getToken, page, rowsPerPage, searchQuery);
      setGuides(data.guides || []);
      setPagination(data.pagination || {
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
      });
    } catch (err) {
      setError('Failed to load guides. ' + (err.message || ''));
      setGuides([]);
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

  const loadLevels = useCallback(async () => {
    try {
      const data = await fetchLevelsForGuide(getToken);
      setLevels(data || []);
    } catch (err) {
      // Silently fail - levels are optional
    }
  }, [getToken]);

  useEffect(() => {
    loadGuides();
    loadLevels();
  }, [loadGuides, loadLevels]);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    handlePageChange(1);
  }, [handlePageChange]);

  const handleOpenGuideDialog = useCallback((guide = null) => {
    if (guide) {
      setEditingGuide(guide);
      setGuideForm({
        level_id: guide.level_id.toString(),
        title: guide.title,
        description: guide.description || '',
        display_order: guide.display_order,
        is_active: guide.is_active,
      });
    } else {
      setEditingGuide(null);
      setGuideForm({
        level_id: '',
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
      level_id: '',
      title: '',
      description: '',
      display_order: 0,
      is_active: true,
    });
  }, []);

  const handleSaveGuide = useCallback(async () => {
    setSaveError(null);

    // Validate required fields
    if (!guideForm.level_id || !guideForm.title.trim()) {
      const errorMessage = 'กรุณากรอกข้อมูลให้ครบถ้วน: Level และ Title';
      setSaveError(errorMessage);
      return { success: false, error: errorMessage };
    }

    const formData = {
      level_id: parseInt(guideForm.level_id),
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
      return { success: true };
    } catch (err) {
      const errorMessage = 'ไม่สามารถบันทึก guide ได้: ' + (err.message || 'Unknown error');
      setSaveError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [guideForm, editingGuide, getToken, handleCloseGuideDialog, loadGuides]);

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

  const handleDeleteDialogChange = useCallback((open) => {
    if (!deleting) {
      setDeleteDialogOpen(open);
      if (!open) {
        setGuideToDelete(null);
        setDeleteError(null);
      }
    }
  }, [deleting]);

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
    const file = e.target.files[0];
    setImageFile(file || null);
  }, []);

  const handleAddImage = useCallback(async () => {
    if (!selectedGuide || !imageFile) {
      setImageError('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    if (!selectedGuide.guide_id) {
      setImageError('Guide ID ไม่ถูกต้อง');
      return;
    }

    try {
      setUploadingImage(true);
      setImageError(null);
      await uploadGuideImage(getToken, selectedGuide.guide_id, imageFile);

      await loadGuides();

      const data = await fetchAllGuides(getToken, page, rowsPerPage, searchQuery);
      const updatedGuide = data.guides?.find(g => g.guide_id === selectedGuide.guide_id);
      if (updatedGuide) {
        setSelectedGuide(updatedGuide);
      }

      setImageFile(null);
      const input = document.getElementById('guide-image-input');
      if (input) {
        input.value = '';
      }
    } catch (err) {
      const errorMessage = err.message || 'Unknown error';
      setImageError('ไม่สามารถอัปโหลดรูปภาพได้: ' + errorMessage);
    } finally {
      setUploadingImage(false);
    }
  }, [selectedGuide, imageFile, getToken, loadGuides, page, rowsPerPage, searchQuery]);

  const handleDeleteImage = useCallback(async (imageId) => {
    try {
      setDeletingImageId(imageId);
      setImageError(null);
      await deleteGuideImage(getToken, imageId);

      if (selectedGuide) {
        const updatedImages = selectedGuide.guide_images?.filter(
          img => img.guide_file_id !== parseInt(imageId)
        ) || [];
        setSelectedGuide({
          ...selectedGuide,
          guide_images: updatedImages
        });
      }

      await loadGuides();
    } catch (err) {
      setImageError('ไม่สามารถลบรูปภาพได้: ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingImageId(null);
    }
  }, [selectedGuide, getToken, loadGuides]);

  const getDeleteDescription = (title) => (
    <>
      คุณแน่ใจหรือไม่ว่าต้องการลบคำแนะนำ <strong>{title}</strong>?
      <br />
      <br />
      การกระทำนี้ไม่สามารถยกเลิกได้ และจะลบข้อมูลคำแนะนำทั้งหมดรวมถึงรูปภาพที่เกี่ยวข้อง
    </>
  );

  const tableHeaderClassName =
    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const tableCellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
  const actionsCellClassName = 'px-6 py-4 whitespace-nowrap text-sm font-medium';
  const searchPlaceholder = 'ค้นหาคำแนะนำ (ชื่อ, คำอธิบาย)...';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title="Guide Management"
          subtitle="จัดการคำแนะนำ"
          onAddClick={() => handleOpenGuideDialog()}
          addButtonText="เพิ่มคำแนะนำ"
        />

        <ErrorAlert message={error} />
        <ErrorAlert message={saveError} />
        <ErrorAlert message={imageError} />
        <ErrorAlert message={deleteError} />

        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <LoadingState message="Loading guides..." />
          ) : guides.length === 0 ? (
            <EmptyState
              message="ไม่พบคำแนะนำที่ค้นหา"
              searchQuery={searchQuery}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={tableHeaderClassName}>Guide</th>
                      <th className={tableHeaderClassName}>Level</th>
                      <th className={tableHeaderClassName}>Display Order</th>
                      <th className={tableHeaderClassName}>Status</th>
                      <th className={tableHeaderClassName}>Images</th>
                      <th className={tableHeaderClassName}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {guides.map((guide) => (
                      <tr key={guide.guide_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {guide.title}
                            </div>
                            {guide.description && (
                              <div className="text-sm text-gray-500">
                                {guide.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className={tableCellClassName}>
                          {guide.level && (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {guide.level.level_name}
                              </div>
                              {guide.level.category && (
                                <div className="text-xs text-gray-500">
                                  {guide.level.category.category_name}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className={tableCellClassName}>
                          {guide.display_order}
                        </td>
                        <td className={tableCellClassName}>
                          <Badge variant={guide.is_active ? 'default' : 'secondary'}>
                            {guide.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            {guide.guide_images && guide.guide_images.length > 0 ? (
                              <>
                                <Badge variant="secondary">
                                  {guide.guide_images.length} รูป
                                </Badge>
                                <div className="flex gap-1">
                                  {guide.guide_images.slice(0, 3).map((img) => (
                                    <img
                                      key={img.guide_file_id}
                                      src={getImageUrl(img.path_file)}
                                      alt=""
                                      className="w-8 h-8 object-cover rounded border"
                                    />
                                  ))}
                                  {guide.guide_images.length > 3 && (
                                    <div className="w-8 h-8 bg-gray-200 rounded border flex items-center justify-center text-xs">
                                      +{guide.guide_images.length - 3}
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <span className="text-sm text-gray-400">ไม่มีรูป</span>
                            )}
                          </div>
                        </td>
                        <td className={actionsCellClassName}>
                          <div className="flex items-center gap-2 flex-wrap">
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

        <GuideFormDialog
          open={guideDialogOpen}
          onOpenChange={handleCloseGuideDialog}
          editingGuide={editingGuide}
          formData={guideForm}
          onFormChange={setGuideForm}
          onSave={handleSaveGuide}
          levels={levels}
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

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteDialogChange}
          onConfirm={handleDeleteConfirm}
          itemName={guideToDelete?.title}
          title="ยืนยันการลบคำแนะนำ"
          description={getDeleteDescription(guideToDelete?.title)}
          deleting={deleting}
        />
      </div>
    </div>
  );
};

export default GuideManagement;
