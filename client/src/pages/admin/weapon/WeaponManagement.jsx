import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
  useWeapons,
  useDeleteWeapon,
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
import { useImageDialog } from '@/hooks/useImageDialog';
import { getImageUrl } from '@/utils/imageUtils';

import WeaponTable from '@/components/admin/weapon/WeaponTable';

import PageError from '@/components/shared/Error/PageError';

const WeaponManagement = () => {
  const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);
  const [searchQuery, setSearchQuery] = useState('');

  // Weapon form states
  const [weaponDialogOpen, setWeaponDialogOpen] = useState(false);
  const [editingWeapon, setEditingWeapon] = useState(null);


  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [weaponToDelete, setWeaponToDelete] = useState(null);

  // TanStack Query Hooks
  const {
    data: weaponsData,
    isLoading: loading,
    isError,
    error: queryError
  } = useWeapons(page, rowsPerPage, searchQuery);
  const imageDialog = useImageDialog(weaponsData?.weapons || [], 'weapon_id');
  if (isError) {
    return <PageError message={queryError?.message} title="Failed to load weapons" />;
  }

  const deleteWeaponMutation = useDeleteWeapon();

  // Derived state from query data
  const weapons = weaponsData?.weapons || [];
  const pagination = weaponsData?.pagination || {
    total: 0,
    totalPages: 0,
    page: 1,
    limit: rowsPerPage,
  };


  // Manual loadWeapons is removed as useQuery handles it

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    handlePageChange(1);
  }, [handlePageChange]);

  const handleOpenWeaponDialog = useCallback((weapon = null) => {
    setEditingWeapon(weapon);
    setWeaponDialogOpen(true);
  }, []);

  const handleCloseWeaponDialog = useCallback(() => {
    setWeaponDialogOpen(false);
    setEditingWeapon(null);
  }, []);

  const handleOpenImageDialog = useCallback((weapon) => {
    imageDialog.openDialog(weapon);
  }, [imageDialog]);

  const handleImageDialogChange = useCallback((open) => {
    imageDialog.closeDialog(open);
  }, [imageDialog]);

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
      toast.success('ลบอาวุธสำเร็จ');
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

        <SearchInput
          defaultValue={searchQuery}
          onSearch={handleSearchChange}
          placeholder={searchPlaceholder}
        />

        <ErrorAlert message={imageDialog.error} />

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
        />

        <WeaponImageDialog
          open={imageDialog.isOpen}
          onOpenChange={handleImageDialogChange}
          selectedWeapon={imageDialog.dialogItem}
          getImageUrl={getImageUrl}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => handleDeleteDialogChange(open)}
          onConfirm={handleDeleteConfirm}
          title="ยืนยันการลบอาวุธ"
          itemName={weaponToDelete?.weapon_name}
          description={`คุณต้องการลบอาวุธ "${weaponToDelete?.weapon_name}" ใช่หรือไม่? การลบนี้ไม่สามารถย้อนกลับได้`}
          confirmText="ลบ"
          cancelText="ยกเลิก"
          deleting={deleteWeaponMutation.isPending}
        />

      </div>
    </div>
  );
};

export default WeaponManagement;
