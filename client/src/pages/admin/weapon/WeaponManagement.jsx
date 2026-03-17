import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
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

import WeaponTable from '@/components/admin/weapon/WeaponTable';

import PageError from '@/components/shared/Error/PageError';

const WeaponManagement = () => {
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
    weapon_type: 'melee',
  });
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedWeaponId, setSelectedWeaponId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageForm, setImageForm] = useState({
    type_file: 'idle',
    type_animation: 'weapon',
    frame: 1,
    imageFile: null,
  });
  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [weaponToDelete, setWeaponToDelete] = useState(null);

  const [imageError, setImageError] = useState(null); // Added this as it seemed missing based on usage

  // TanStack Query Hooks
  const {
    data: weaponsData,
    isLoading: loading,
    isError,
    error: queryError
  } = useWeapons(page, rowsPerPage, searchQuery);

  if (isError) {
    return <PageError message={queryError?.message} title="Failed to load weapons" />;
  }

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


  const dialogWeapon = useMemo(() => {
    return selectedWeaponId && weapons ? weapons.find(w => w.weapon_id === selectedWeaponId) : null;
  }, [selectedWeaponId, weapons]);


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
        weapon_type: weapon.weapon_type,
      });
    } else {
      setEditingWeapon(null);
      setWeaponForm({
        weapon_key: '',
        weapon_name: '',
        description: '',
        combat_power: 0,
        weapon_type: 'melee',
      });
    }

    setWeaponDialogOpen(true);
  }, []);

  const handleCloseWeaponDialog = useCallback(() => {
    setWeaponDialogOpen(false);
    setEditingWeapon(null);

    setWeaponForm({
      weapon_key: '',
      weapon_name: '',
      description: '',
      combat_power: 0,
      weapon_type: 'melee',
    });
  }, []);

  const handleSaveWeapon = useCallback(async () => {


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
      toast.error(err.message || 'บันทึกอาวุธไม่สำเร็จ');
      return { success: false, error: err.message };
    }
  }, [weaponForm, editingWeapon, updateWeaponMutation, createWeaponMutation, handleCloseWeaponDialog]);

  const handleOpenImageDialog = useCallback((weapon) => {
    setSelectedWeaponId(weapon.weapon_id); // Changed to setSelectedWeaponId
    setImageForm({
      type_file: 'idle',
      type_animation: 'weapon',
      frame: 1,
      imageFile: null,
    });
    setImageError(null);
    setImageDialogOpen(true);
  }, []);

  const handleImageDialogChange = useCallback((open) => {
    setImageDialogOpen(open);
    if (!open) {
      setSelectedWeaponId(null); // Changed to setSelectedWeaponId
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
    if (!selectedWeaponId || !imageForm.imageFile) { // Changed to selectedWeaponId
      setImageError('กรุณาเลือกไฟล์รูปภาพ'); // Simplified message as weapon is now implied by selectedWeaponId
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
      const hasWeaponImage = dialogWeapon?.weapon_images?.some(img => img.type_animation === 'weapon'); // Use dialogWeapon
      if (hasWeaponImage) {
        setImageError('สามารถเพิ่มรูปภาพอาวุธ (Type: Weapon) ได้เพียง 1 รูปเท่านั้น (หากต้องการเปลี่ยน ให้ลบรูปเดิมออกก่อน)');
        return;
      }
    }

    try {
      setUploadingImage(true);
      setImageError(null);

      await addImageMutation.mutateAsync({
        weaponId: selectedWeaponId, // Changed to selectedWeaponId
        imageFile: imageForm.imageFile,
        imageData: {
          type_file: imageForm.type_file,
          type_animation: imageForm.type_animation,
          frame: imageForm.frame,
          weapon_key: dialogWeapon?.weapon_key, // Use dialogWeapon
        }
      });

      // React Query invalidation handles list refresh; reset form

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
  }, [selectedWeaponId, imageForm, addImageMutation]);

  const handleDeleteImage = useCallback(async (imageId) => {
    try {
      setImageError(null);
      await deleteImageMutation.mutateAsync(imageId);
      // Invalidation happens in hook
    } catch (err) {
      console.error(err);
    }
  }, [deleteImageMutation]);

  const handleDeleteClick = useCallback((weapon) => {
    setWeaponToDelete(weapon);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!weaponToDelete) return;

    try {
      await deleteWeaponMutation.mutateAsync(weaponToDelete.weapon_id);
      setDeleteDialogOpen(false);
      setWeaponToDelete(null);
    } catch (err) {
      console.error(err);
    }
  }, [weaponToDelete, deleteWeaponMutation]);

  const handleDeleteDialogChange = useCallback((open) => {
    if (!deleteWeaponMutation.isPending) {
      setDeleteDialogOpen(open);
      if (!open) {
        setWeaponToDelete(null);
      }
    }
  }, [deleteWeaponMutation.isPending]);



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

        <ErrorAlert message={imageError} />

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
          selectedWeapon={dialogWeapon}
          imageForm={imageForm}
          onImageFormChange={setImageForm}
          isUploading={uploadingImage}
          isDeleting={deleteImageMutation.isPending}
          onAddImage={handleAddImage}
          onDeleteImage={handleDeleteImage}
          getImageUrl={getImageUrl}
          error={imageError}
        />

        <DeleteConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => handleDeleteDialogChange(false)}
          onConfirm={handleDeleteConfirm}
          title="Confirm Deletion"
          description={`Are you sure you want to delete the weapon "${weaponToDelete?.weapon_name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          isConfirming={deleteWeaponMutation.isPending}
        />
      </div>
    </div>
  );
};

export default WeaponManagement;
