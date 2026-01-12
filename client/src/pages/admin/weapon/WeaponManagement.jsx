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
} from '../../../services/weaponService';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import PaginationControls from '@/components/shared/pagination/PaginationControls';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import WeaponImageDialog from '../../../components/admin/weapon/WeaponImageDialog';
import WeaponFormDialog from '@/components/admin/addEditDialog/WeaponFormDialog';
import { usePagination } from '@/hooks/usePagination';
import { getImageUrl } from '@/utils/imageUtils';
import { createDeleteErrorMessage } from '@/utils/errorHandler';
import WeaponTable from '@/components/admin/weapon/WeaponTable';

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
      
      await loadWeapons();

      const data = await fetchAllWeapons(getToken, page, rowsPerPage, searchQuery);
      const updatedWeapon = data.weapons?.find(w => w.weapon_id === selectedWeapon.weapon_id);
      if (updatedWeapon) {
        setSelectedWeapon(updatedWeapon);
      }

      setImageForm({
        type_file: 'idle',
        type_animation: 'weapon',
        frame: 1,
        imageFile: null,
      });
    } catch (err) {
      const errorMessage = err.message || 'Unknown error';
      setImageError('ไม่สามารถเพิ่มรูปภาพได้: ' + errorMessage);
    } finally {
      setUploadingImage(false);
    }
  }, [selectedWeapon, imageForm, getToken, loadWeapons, page, rowsPerPage, searchQuery]);

  const handleDeleteImage = useCallback(async (imageId) => {
    try {
      setDeletingImageId(imageId);
      setImageError(null);
      await deleteWeaponImage(getToken, imageId);

      await loadWeapons();

      if (selectedWeapon) {
        const data = await fetchAllWeapons(getToken, page, rowsPerPage, searchQuery);
        const updatedWeapon = data.weapons?.find(w => w.weapon_id === selectedWeapon.weapon_id);
        if (updatedWeapon) {
          setSelectedWeapon(updatedWeapon);
        }
      }
    } catch (err) {
      setImageError('ไม่สามารถลบรูปภาพได้: ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingImageId(null);
    }
  }, [selectedWeapon, getToken, loadWeapons, page, rowsPerPage, searchQuery]);

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
          defaultValue={searchQuery}
          onSearch={handleSearchChange}
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
              <WeaponTable
                weapons={weapons}
                onEdit={handleOpenWeaponDialog}
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
