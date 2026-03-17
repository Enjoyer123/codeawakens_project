import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Image as ImageIcon } from 'lucide-react';
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
import { getImageUrl } from '@/utils/imageUtils';
import { createDeleteErrorMessage } from '@/utils/errorHandler';
import RewardTable from '../../../components/admin/reward/RewardTable';
import {
  useRewards,
  useReward,
  useRewardLevels,
  useCreateReward,
  useUpdateReward,
  useDeleteReward,
  useUploadRewardFrame,
  useDeleteRewardFrame
} from '@/services/hooks/useRewards';

import PageError from '@/components/shared/Error/PageError';

const RewardManagement = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
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
  const { mutateAsync: createRewardAsync } = useCreateReward();
  const { mutateAsync: updateRewardAsync } = useUpdateReward();
  const { mutateAsync: deleteRewardAsync, isPending: deleting } = useDeleteReward();
  const { mutateAsync: uploadFrameAsync } = useUploadRewardFrame();
  const { mutateAsync: deleteFrameAsync } = useDeleteRewardFrame();

  // Reward form states
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [rewardForm, setRewardForm] = useState({
    level_id: '',
    reward_type: 'weapon',
    reward_name: '',
    description: '',
    required_score: 0,
  });

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rewardToDelete, setRewardToDelete] = useState(null);

  // Image management states
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [uploadingFrame, setUploadingFrame] = useState(null);
  const [deletingFrame, setDeletingFrame] = useState(null);

  // Error states
  const [imageError, setImageError] = useState(null);
  // const [saveError, setSaveError] = useState(null); // Removed in favor of toast

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    handlePageChange(1);
  }, [handlePageChange]);

  const handleOpenRewardDialog = useCallback((reward = null) => {
    if (reward) {
      setEditingReward(reward);
      setRewardForm({
        level_id: reward.level_id.toString(),
        reward_type: reward.reward_type,
        reward_name: reward.reward_name,
        description: reward.description || '',
        required_score: reward.required_score,
      });
    } else {
      setEditingReward(null);
      setRewardForm({
        level_id: '',
        reward_type: 'weapon',
        reward_name: '',
        description: '',
        required_score: 0,
      });
    }
    // setSaveError(null);
    setRewardDialogOpen(true);
  }, []);

  const handleCloseRewardDialog = useCallback(() => {
    setRewardDialogOpen(false);
    setEditingReward(null);
    // setSaveError(null);
    setRewardForm({
      level_id: '',
      reward_type: 'weapon',
      reward_name: '',
      description: '',
      required_score: 0,
    });
  }, []);

  const handleSaveReward = useCallback(async () => {
    const formData = {
      ...rewardForm,
      level_id: parseInt(rewardForm.level_id),
      required_score: parseInt(rewardForm.required_score),
    };

    try {
      if (editingReward) {
        await updateRewardAsync({ rewardId: editingReward.reward_id, rewardData: formData });
      } else {
        await createRewardAsync(formData);
      }
      handleCloseRewardDialog();
      return { success: true };
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'บันทึกรางวัลไม่สำเร็จ');
      return { success: false, error: err.message };
    }
  }, [rewardForm, editingReward, updateRewardAsync, createRewardAsync, handleCloseRewardDialog]);

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
    setSelectedReward(reward);
    setImageError(null);
    setImageDialogOpen(true);
  }, []);

  const handleImageDialogChange = useCallback((open) => {
    setImageDialogOpen(open);
    if (!open) {
      setSelectedReward(null);
      setUploadingFrame(null);
      setDeletingFrame(null);
      setImageError(null);
    }
  }, []);

  const handleUploadFrame = useCallback(async (frameNumber, imageFile) => {
    if (!selectedReward || !imageFile) {
      setImageError('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    try {
      setUploadingFrame(frameNumber);
      setImageError(null);
      await uploadFrameAsync({
        rewardId: selectedReward.reward_id,
        imageFile,
        frameNumber
      });

      // Data invalidation is handled by useUploadRewardFrame hook.
      // We rely on useReward in the dialog to fetch the fresh data.

    } catch (err) {
      setImageError('ไม่สามารถอัปโหลดรูปภาพได้: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingFrame(null);
    }
  }, [selectedReward, uploadFrameAsync]);

  const handleDeleteFrame = useCallback(async (frameNumber) => {
    if (!selectedReward) return;

    try {
      setDeletingFrame(frameNumber);
      setImageError(null);
      await deleteFrameAsync({
        rewardId: selectedReward.reward_id,
        frameNumber
      });
      // Same issue as upload: selectedReward is stale.
    } catch (err) {
      setImageError('ไม่สามารถลบรูปภาพได้: ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingFrame(null);
    }
  }, [selectedReward, deleteFrameAsync]);


  // useReward fetches fresh data to keep the dialog updated when images change
  const { data: activeRewardData } = useReward(selectedReward?.reward_id);

  const dialogReward = activeRewardData || selectedReward;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title="Reward Management"
          subtitle="จัดการรางวัล"
          onAddClick={() => handleOpenRewardDialog()}
          addButtonText="เพิ่มรางวัล"
        />

        <ErrorAlert message={imageError} />

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
          formData={rewardForm}
          onFormChange={setRewardForm}
          onSave={handleSaveReward}
          levels={levels}
        />

        <RewardImageDialog
          open={imageDialogOpen}
          onOpenChange={handleImageDialogChange}
          selectedReward={dialogReward}
          uploadingFrame={uploadingFrame}
          deletingFrame={deletingFrame}
          onUploadFrame={handleUploadFrame}
          onDeleteFrame={handleDeleteFrame}
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
