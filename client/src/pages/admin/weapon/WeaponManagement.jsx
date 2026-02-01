import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  useWeapons,
  useCreateWeapon,
  useUpdateWeapon,
  useDeleteWeapon,
  useAddWeaponImage,
  useDeleteWeaponImage,
} from '../../../services/hooks/useWeapons';
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
  const [searchQuery, setSearchQuery] = useState('');

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
  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [weaponToDelete, setWeaponToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // TanStack Query Hooks
  const {
    data: weaponsData,
    isLoading: loading,
    isError,
    error: queryError
  } = useWeapons(page, rowsPerPage, searchQuery);

  const createWeaponMutation = useCreateWeapon();
  const updateWeaponMutation = useUpdateWeapon();
  const deleteWeaponMutation = useDeleteWeapon();
  const addImageMutation = useAddWeaponImage();
  const deleteImageMutation = useDeleteWeaponImage();

  // Derived state from query data
  const weapons = weaponsData?.weapons || [];
  const pagination = weaponsData?.pagination || {
    total: 0,
    totalPages: 0,
    page: 1,
    limit: rowsPerPage,
  };

  // Error handling
  const error = isError ? (queryError?.message || 'Failed to load weapons') : null;

  // Sync selectedWeapon with fresh data when weapons list updates (e.g. after adding image)
  useEffect(() => {
    if (selectedWeapon) {
      const updated = weapons.find(w => w.weapon_id === selectedWeapon.weapon_id);
      if (updated && updated !== selectedWeapon) {
        setSelectedWeapon(updated);
      }
    }
  }, [weapons, selectedWeapon]);


  // Manual loadWeapons is removed as useQuery handles it

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
        await updateWeaponMutation.mutateAsync({
          weaponId: editingWeapon.weapon_id,
          weaponData: weaponForm
        });
      } else {
        await createWeaponMutation.mutateAsync(weaponForm);
      }
      handleCloseWeaponDialog();
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  }, [weaponForm, editingWeapon, updateWeaponMutation, createWeaponMutation, handleCloseWeaponDialog]);

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

    // Validation: Only 1 image for type 'weapon'
    if (imageForm.type_animation === 'weapon') {
      const hasWeaponImage = selectedWeapon.weapon_images?.some(img => img.type_animation === 'weapon');
      if (hasWeaponImage) {
        setImageError('สามารถเพิ่มรูปภาพอาวุธ (Type: Weapon) ได้เพียง 1 รูปเท่านั้น (หากต้องการเปลี่ยน ให้ลบรูปเดิมออกก่อน)');
        return;
      }
    }

    try {
      setUploadingImage(true);
      setImageError(null);

      await addImageMutation.mutateAsync({
        weaponId: selectedWeapon.weapon_id,
        imageFile: imageForm.imageFile,
        imageData: {
          type_file: imageForm.type_file,
          type_animation: imageForm.type_animation,
          frame: imageForm.frame,
          weapon_key: selectedWeapon.weapon_key,
        }
      });

      // No manual update needed, React Query invalidation handles it.
      // However, we might want to update selectedWeapon if the UI depends on it updating immediately within the dialog
      // But for now, let's rely on the list check or simple re-select if needed.
      // Note: selectedWeapon is local state. If the list updates, 'weapons' updates.
      // But 'selectedWeapon' object reference might stay stale.
      // To fix this proper, we should derive selectedWeapon from the new 'weapons' list or close dialog.
      // For this refactor, let's just clear the form.

      setImageForm({
        type_file: 'idle',
        type_animation: 'weapon',
        frame: 1,
        imageFile: null,
      });
      // Optionally re-sync selectedWeapon from fresh list if needed in next render?
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  }, [selectedWeapon, imageForm, addImageMutation]);

  const handleDeleteImage = useCallback(async (imageId) => {
    try {
      setDeletingImageId(imageId);
      setImageError(null);
      await deleteImageMutation.mutateAsync(imageId);
      // Invalidation happens in hook
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingImageId(null);
    }
  }, [deleteImageMutation]);

  const handleDeleteClick = useCallback((weapon) => {
    setWeaponToDelete(weapon);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!weaponToDelete) return;

    try {
      setDeleting(true);
      await deleteWeaponMutation.mutateAsync(weaponToDelete.weapon_id);
      setDeleteDialogOpen(false);
      setWeaponToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }, [weaponToDelete, deleteWeaponMutation]);

  const handleDeleteDialogChange = useCallback((open) => {
    if (!deleting) {
      setDeleteDialogOpen(open);
      if (!open) {
        setWeaponToDelete(null);
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
