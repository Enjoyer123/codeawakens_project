import { useState, useCallback } from 'react';
import { toast } from 'sonner';

import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import PaginationControls from '@/components/shared/pagination/PaginationControls';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import RewardImageDialog from '@/components/admin/imageDialog/RewardImageDialog';
import RewardFormDialog from '@/components/admin/addEditDialog/RewardFormDialog';
import { usePagination } from '@/hooks/usePagination';
import { useImageDialog } from '@/hooks/useImageDialog';
import { getImageUrl } from '@/utils/imageUtils';

import RewardTable from '../../../components/admin/reward/RewardTable';
import {
  useRewards,
  useReward,
  useRewardLevels,
  useDeleteReward,
} from '@/services/hooks/useRewards';

import PageError from '@/components/shared/Error/PageError';

const RewardManagement = () => {
  const navigate = useNavigate();
  const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);
  const [searchQuery, setSearchQuery] = useState('');

  // TanStack Query Hooks
  const {
    data: rewardsData,
    isLoading: loading,
    isError,
    error: queryError
  } = useRewards(page, rowsPerPage, searchQuery);

  if (isError) {
    return <PageError message={queryError?.message} title="Failed to load rewards" />;
  }

  const { data: levelsData } = useRewardLevels();
  const levels = levelsData || [];

  const rewards = rewardsData?.rewards || [];
  const pagination = rewardsData?.pagination || {
    total: 0,
    totalPages: 0,
    page: 1,
    limit: rowsPerPage,
  };

  // Mutations
  const { mutateAsync: deleteRewardAsync, isPending: deleting } = useDeleteReward();

  // Reward form states
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rewardToDelete, setRewardToDelete] = useState(null);

  // Image management states
  const imageDialog = useImageDialog(rewards, 'reward_id');


  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    handlePageChange(1);
  }, [handlePageChange]);

  const handleOpenRewardDialog = useCallback((reward = null) => {
    setEditingReward(reward);
    setRewardDialogOpen(true);
  }, []);

  const handleCloseRewardDialog = useCallback(() => {
    setRewardDialogOpen(false);
    setEditingReward(null);
  }, []);

  const handleDeleteClick = useCallback((reward) => {
    setRewardToDelete(reward);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!rewardToDelete) return;

    try {
      await deleteRewardAsync(rewardToDelete.reward_id);
      setDeleteDialogOpen(false);
      setRewardToDelete(null);
    } catch (err) {
      console.error(err);
    }
  }, [rewardToDelete, deleteRewardAsync]);

  const handleDeleteDialogChange = useCallback((open) => {
    if (!deleting) {
      setDeleteDialogOpen(open);
      if (!open) {
        setRewardToDelete(null);
      }
    }
  }, [deleting]);

  const handleOpenImageDialog = useCallback((reward) => {
    imageDialog.openDialog(reward);
  }, [imageDialog]);

  const handleImageDialogChange = useCallback((open) => {
    imageDialog.closeDialog(open);
  }, [imageDialog]);




  // useReward fetches fresh data to keep the dialog updated when images change
  const { data: activeRewardData } = useReward(imageDialog.selectedId);
  const dialogReward = activeRewardData || imageDialog.dialogItem;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title="Reward Management"
          subtitle="จัดการรางวัล"
          onAddClick={() => handleOpenRewardDialog()}
          addButtonText="เพิ่มรางวัล"
        />

        <ErrorAlert message={imageDialog.error} />

        <SearchInput
          defaultValue={searchQuery}
          onSearch={handleSearchChange}
          placeholder="ค้นหารางวัล (ชื่อ, คำอธิบาย)..."
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <LoadingState message="Loading rewards..." />
          ) : rewards.length === 0 ? (
            <EmptyState
              message="ไม่พบรางวัลที่ค้นหา"
              searchQuery={searchQuery}
            />
          ) : (
            <>
              <RewardTable
                rewards={rewards}
                onEdit={handleOpenRewardDialog}
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

        <RewardFormDialog
          open={rewardDialogOpen}
          onOpenChange={handleCloseRewardDialog}
          editingReward={editingReward}
          levels={levels}
        />

        <RewardImageDialog
          open={imageDialog.isOpen}
          onOpenChange={handleImageDialogChange}
          selectedReward={dialogReward}
          getImageUrl={getImageUrl}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteDialogChange}
          onConfirm={handleDeleteConfirm}
          itemName={rewardToDelete?.reward_name}
          title="ยืนยันการลบรางวัล"
          deleting={deleting}
        />
      </div>
    </div>
  );
};

export default RewardManagement;
