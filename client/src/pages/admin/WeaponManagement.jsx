import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllWeapons,
  createWeapon,
  updateWeapon,
  deleteWeapon,
  addWeaponImage,
  deleteWeaponImage,
} from '../../services/weaponService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import PaginationControls from '@/components/shared/pagination/PaginationControls';
import { LoadingState, EmptyState } from '@/components/admin/tableStates/DataTableStates';
import WeaponImageDialog from '../../components/admin/weapon/WeaponImageDialog';
import WeaponFormDialog from '@/components/admin/addEditDialog/WeaponFormDialog';
import { usePagination } from '@/hooks/usePagination';
import { getImageUrl } from '@/utils/imageUtils';
import { createDeleteErrorMessage } from '@/utils/errorHandler';

const WeaponManagement = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);
  const [weapons, setWeapons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 10,
  });

  // Weapon form states
  const [weaponDialogOpen, setWeaponDialogOpen] = useState(false);
  const [editingWeapon, setEditingWeapon] = useState(null);
  const [weaponForm, setWeaponForm] = useState({
    weapon_key: '',
    weapon_name: '',
    description: '',
    combat_power: 0,
    emoji: '',
    weapon_type: 'melee',
  });
  const [saveError, setSaveError] = useState(null);

  // Image management states
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [imageForm, setImageForm] = useState({
    type_file: 'idle',
    type_animation: 'weapon',
    frame: 1,
    imageFile: null,
  });
  const [imageError, setImageError] = useState(null);

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [weaponToDelete, setWeaponToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const loadWeapons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllWeapons(getToken, page, rowsPerPage, searchQuery);
      setWeapons(data.weapons || []);
      setPagination(data.pagination || {
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
      });
    } catch (err) {
      setError('Failed to load weapons. ' + (err.message || ''));
      setWeapons([]);
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

  useEffect(() => {
    loadWeapons();
  }, [loadWeapons]);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    handlePageChange(1);
  }, [handlePageChange]);

  const handleOpenWeaponDialog = useCallback((weapon = null) => {
    if (weapon) {
      setEditingWeapon(weapon);
      setWeaponForm({
        weapon_key: weapon.weapon_key,
        weapon_name: weapon.weapon_name,
        description: weapon.description || '',
        combat_power: weapon.combat_power || 0,
        emoji: weapon.emoji || '',
        weapon_type: weapon.weapon_type,
      });
    } else {
      setEditingWeapon(null);
      setWeaponForm({
        weapon_key: '',
        weapon_name: '',
        description: '',
        combat_power: 0,
        emoji: '',
        weapon_type: 'melee',
      });
    }
    setSaveError(null);
    setWeaponDialogOpen(true);
  }, []);

  const handleCloseWeaponDialog = useCallback(() => {
    setWeaponDialogOpen(false);
    setEditingWeapon(null);
    setSaveError(null);
    setWeaponForm({
      weapon_key: '',
      weapon_name: '',
      description: '',
      combat_power: 0,
      emoji: '',
      weapon_type: 'melee',
    });
  }, []);

  const handleSaveWeapon = useCallback(async () => {
    setSaveError(null);

    try {
      if (editingWeapon) {
        await updateWeapon(getToken, editingWeapon.weapon_id, weaponForm);
      } else {
        await createWeapon(getToken, weaponForm);
      }
      handleCloseWeaponDialog();
      await loadWeapons();
      return { success: true };
    } catch (err) {
      const errorMessage = 'Failed to save weapon: ' + (err.message || 'Unknown error');
      setSaveError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [weaponForm, editingWeapon, getToken, handleCloseWeaponDialog, loadWeapons]);

  const handleOpenImageDialog = useCallback((weapon) => {
    setSelectedWeapon(weapon);
    setImageError(null);
    setImageForm({
      type_file: 'idle',
      type_animation: 'weapon',
      frame: 1,
      imageFile: null,
    });
    setImageDialogOpen(true);
  }, []);

  const handleImageDialogChange = useCallback((open) => {
    setImageDialogOpen(open);
    if (!open) {
      setSelectedWeapon(null);
      setImageError(null);
      setImageForm({
        type_file: 'idle',
        type_animation: 'weapon',
        frame: 1,
        imageFile: null,
      });
    }
  }, []);

  const handleAddImage = useCallback(async () => {
    if (!selectedWeapon || !imageForm.imageFile) {
      setImageError('กรุณาเลือกอาวุธและไฟล์รูปภาพ');
      return;
    }

    if (!imageForm.type_file || !imageForm.type_animation || !imageForm.frame) {
      setImageError('กรุณากรอกข้อมูลให้ครบถ้วน: Type File, Type Animation, และ Frame');
      return;
    }

    if (imageForm.frame < 1) {
      setImageError('Frame ต้องมากกว่าหรือเท่ากับ 1');
      return;
    }

    try {
      setUploadingImage(true);
      setImageError(null);
      await addWeaponImage(getToken, selectedWeapon.weapon_id, imageForm.imageFile, {
        type_file: imageForm.type_file,
        type_animation: imageForm.type_animation,
        frame: imageForm.frame,
        weapon_key: selectedWeapon.weapon_key,
      });
      setImageForm({
        type_file: 'idle',
        type_animation: 'weapon',
        frame: 1,
        imageFile: null,
      });
      await loadWeapons();
      handleImageDialogChange(false);
    } catch (err) {
      const errorMessage = err.message || 'Unknown error';
      setImageError('ไม่สามารถเพิ่มรูปภาพได้: ' + errorMessage);
    } finally {
      setUploadingImage(false);
    }
  }, [selectedWeapon, imageForm, getToken, loadWeapons, handleImageDialogChange]);

  const handleDeleteImage = useCallback(async (imageId) => {
    try {
      setDeletingImageId(imageId);
      setImageError(null);
      await deleteWeaponImage(getToken, imageId);

      if (selectedWeapon) {
        const updatedImages = selectedWeapon.weapon_images?.filter(
          img => img.file_id !== parseInt(imageId)
        ) || [];
        setSelectedWeapon({
          ...selectedWeapon,
          weapon_images: updatedImages
        });
      }

      const data = await fetchAllWeapons(getToken, page, rowsPerPage, searchQuery);
      setWeapons(data.weapons || []);
      setPagination(data.pagination || {
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
      });
    } catch (err) {
      setImageError('ไม่สามารถลบรูปภาพได้: ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingImageId(null);
    }
  }, [selectedWeapon, getToken, page, rowsPerPage, searchQuery]);

  const handleDeleteClick = useCallback((weapon) => {
    setWeaponToDelete(weapon);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!weaponToDelete) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteWeapon(getToken, weaponToDelete.weapon_id);
      setDeleteDialogOpen(false);
      setWeaponToDelete(null);
      await loadWeapons();
    } catch (err) {
      const errorMessage = createDeleteErrorMessage('weapon', err);
      setDeleteError(errorMessage);
    } finally {
      setDeleting(false);
    }
  }, [weaponToDelete, getToken, loadWeapons]);

  const handleDeleteDialogChange = useCallback((open) => {
    if (!deleting) {
      setDeleteDialogOpen(open);
      if (!open) {
        setWeaponToDelete(null);
        setDeleteError(null);
      }
    }
  }, [deleting]);

  const getDeleteDescription = (weaponName) => (
    <>
      คุณแน่ใจหรือไม่ว่าต้องการลบอาวุธ <strong>{weaponName}</strong>?
      <br />
      <br />
      การกระทำนี้ไม่สามารถยกเลิกได้ และจะลบข้อมูลอาวุธทั้งหมดรวมถึงรูปภาพที่เกี่ยวข้อง
    </>
  );

  const tableHeaderClassName =
    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const tableCellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
  const actionsCellClassName = 'px-6 py-4 whitespace-nowrap text-sm font-medium';
  const searchPlaceholder = 'ค้นหาอาวุธ (ชื่อ, key, คำอธิบาย)...';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title="Weapon Management"
          subtitle="จัดการอาวุธและรูปภาพ"
          onAddClick={() => handleOpenWeaponDialog()}
          addButtonText="เพิ่มอาวุธ"
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
            <LoadingState message="Loading weapons..." />
          ) : weapons.length === 0 ? (
            <EmptyState
              message="ไม่พบอาวุธที่ค้นหา"
              searchQuery={searchQuery}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={tableHeaderClassName}>Weapon</th>
                      <th className={tableHeaderClassName}>Key</th>
                      <th className={tableHeaderClassName}>Type</th>
                      <th className={tableHeaderClassName}>Power</th>
                      <th className={tableHeaderClassName}>Images</th>
                      <th className={tableHeaderClassName}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weapons.map((weapon) => (
                      <tr key={weapon.weapon_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{weapon.emoji || '⚔️'}</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {weapon.weapon_name}
                              </div>
                              {weapon.description && (
                                <div className="text-sm text-gray-500">
                                  {weapon.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={tableCellClassName}>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {weapon.weapon_key}
                          </code>
                        </td>
                        <td className={tableCellClassName}>
                          <Badge variant="outline">{weapon.weapon_type}</Badge>
                        </td>
                        <td className={tableCellClassName}>
                          {weapon.combat_power}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            {weapon.weapon_images && weapon.weapon_images.length > 0 ? (
                              <>
                                <Badge variant="secondary">
                                  {weapon.weapon_images.length} รูป
                                </Badge>
                                <div className="flex gap-1">
                                  {weapon.weapon_images.slice(0, 3).map((img) => (
                                    <img
                                      key={img.file_id}
                                      src={getImageUrl(img.path_file)}
                                      alt=""
                                      className="w-8 h-8 object-cover rounded border"
                                    />
                                  ))}
                                  {weapon.weapon_images.length > 3 && (
                                    <div className="w-8 h-8 bg-gray-200 rounded border flex items-center justify-center text-xs">
                                      +{weapon.weapon_images.length - 3}
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
                              onClick={() => handleOpenImageDialog(weapon)}
                            >
                              <ImageIcon className="h-4 w-4 mr-2" />
                              รูปภาพ
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenWeaponDialog(weapon)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              แก้ไข
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(weapon)}
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

        <WeaponFormDialog
          open={weaponDialogOpen}
          onOpenChange={handleCloseWeaponDialog}
          editingWeapon={editingWeapon}
          formData={weaponForm}
          onFormChange={setWeaponForm}
          onSave={handleSaveWeapon}
        />

        <WeaponImageDialog
          open={imageDialogOpen}
          onOpenChange={handleImageDialogChange}
          selectedWeapon={selectedWeapon}
          imageForm={imageForm}
          onImageFormChange={setImageForm}
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
          itemName={weaponToDelete?.weapon_name}
          title="ยืนยันการลบอาวุธ"
          description={getDeleteDescription(weaponToDelete?.weapon_name)}
          deleting={deleting}
        />
      </div>
    </div>
  );
};

export default WeaponManagement;
