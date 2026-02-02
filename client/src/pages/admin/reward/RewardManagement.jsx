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
import RewardImageDialog from '../../../components/admin/reward/RewardImageDialog';
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
    is_automatic: false,
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
        is_automatic: reward.is_automatic,
      });
    } else {
      setEditingReward(null);
      setRewardForm({
        level_id: '',
        reward_type: 'weapon',
        reward_name: '',
        description: '',
        required_score: 0,
        is_automatic: false,
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
      is_automatic: false,
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

      // Update local selectedReward state to reflect changes immediately in dialog
      // Since useUploadRewardFrame invalidates 'rewards', the main list updates.
      // But selectedReward is local state. We might need to sync it.
      // Easiest is to let the user close/reopen or trust that image URL will work if predictable?
      // Actually, standard pattern is to re-fetch or update local state.
      // Since we rely on invalidation, let's just minimal update if possible or ignore if dialog uses props?
      // Dialog uses selectedReward. So we need to update it.
      // We can use the data returned from mutation to update selectedReward!

      // But wait, mutation returns what the API returns.
      // Let's assume API returns updated reward or frame info.
      // If not, we might need a separate query for single reward to verify strict sync,
      // OR just updating the timestamp on the image URL if usage is based on predictable URLs.

      // For now, let's trust that invalidation updates the list, but selectedReward is STALE.
      // We need to re-fetch the specific reward or update selectedReward state.
      // Since useRewards is paginated, finding it in new data might be tricky if page changes (unlikely here).

      // A trick: The dialog only needs to know it's done. 
      // If the dialog re-renders from `rewards` list finding, that works.
      // But `selectedReward` is a copy.
      // Let's manually update `selectedReward` or re-fetch it.
      // Since we don't have useReward(id) active here for the selected one, simple manual patch?

      // Quick fix: Since we can't easily get the fresh reward object without a query,
      // we might want to close and reopen or just accept it?
      // Actually, `uploadRewardFrame` API usually returns updated reward structure?
      // Let's check service... yes returns data.

      // Let's assume we can't easily patch deeply nested frame structure without knowing API response format perfectly.
      // I'll leave it as is, but maybe add a refetch via queryClient if critical?
      // Actually, if I invalidate 'rewards', the `rewardsData` updates.
      // But `selectedReward` state does NOT update automatically.
      // So I should watch `rewardsData` and update `selectedReward` if it exists?
      // Or cleaner: `handleUploadFrame` can fetch fresh reward data via `queryClient.fetchQuery`?
      // Let's try to update selectedReward with what we know or just toggle loading.

      // Better yet: make the Dialog fetch its own data using `useReward` hook!
      // But that requires refactoring Dialog wrapper or component.

      // For now, I will add a listener logic or just manual checking.
      // Actually, in the old code:
      // const data = await fetchAllRewards(...)
      // const updatedReward = data.rewards?.find(...)
      // setSelectedReward(updatedReward);

      // I can duplicate that logic using `queryClient`?
      // Or just close/reopen? No, bad UX.
      // I'll stick to not updating it perfectly unless I add `useReward` for `selectedReward`.
      // Actually, adding `useReward(selectedReward?.reward_id)` is easy and proper!

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


  // HACK: To update selectedReward when keys invalidate
  // This is a bit dirty but works for this specific interaction without deep refactor
  // If `selectedReward` is set, we can try to find it in `rewards` list if it's there.
  // But `rewards` only has current page.
  // If we really want live updates in dialog, passing `rewardId` to dialog and letting it fetch is best.
  // But for now, let's rely on simple state update if api returns it, or just ignore live update if visuals don't break.
  // (Frames usually update via URL timestamp or similar?)
  // Let's modify `handleUploadFrame` to partially mock update if needed or just leave as is.
  // The User will close dialog eventually.

  // Real Solution: Use `useReward` for the active selected reward to keep it fresh!
  const { data: activeRewardData } = useReward(selectedReward?.reward_id);
  // When activeRewardData changes, update selectedReward?
  // Or just pass activeRewardData to the dialog instead of selectedReward state?
  // Yes! Pass `activeRewardData || selectedReward` to dialog.

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
