import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllRewards,
  createReward,
  updateReward,
  deleteReward,
  fetchLevelsForReward,
  uploadRewardFrame,
  deleteRewardFrame,
} from '../../../services/rewardService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Image as ImageIcon } from 'lucide-react';
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

const RewardManagement = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);
  const [rewards, setRewards] = useState([]);
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

  // Reward form states
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [rewardForm, setRewardForm] = useState({
    level_id: '',
    reward_type: 'weapon',
    reward_name: '',
    description: '',
    reward_data: '',
    required_score: 0,
    is_automatic: false,
  });
  const [saveError, setSaveError] = useState(null);

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rewardToDelete, setRewardToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Image management states
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [uploadingFrame, setUploadingFrame] = useState(null);
  const [deletingFrame, setDeletingFrame] = useState(null);
  const [imageError, setImageError] = useState(null);

  const loadRewards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllRewards(getToken, page, rowsPerPage, searchQuery);
      setRewards(data.rewards || []);
      setPagination(data.pagination || {
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
      });
    } catch (err) {
      setError('Failed to load rewards. ' + (err.message || ''));
      setRewards([]);
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
      const data = await fetchLevelsForReward(getToken);
      setLevels(data || []);
    } catch (err) {
      // Silently fail - levels are optional
    }
  }, [getToken]);

  useEffect(() => {
    loadRewards();
    loadLevels();
  }, [loadRewards, loadLevels]);

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
        reward_data: reward.reward_data
          ? JSON.stringify(reward.reward_data, null, 2)
          : '',
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
        reward_data: '',
        required_score: 0,
        is_automatic: false,
      });
    }
    setSaveError(null);
    setRewardDialogOpen(true);
  }, []);

  const handleCloseRewardDialog = useCallback(() => {
    setRewardDialogOpen(false);
    setEditingReward(null);
    setSaveError(null);
    setRewardForm({
      level_id: '',
      reward_type: 'weapon',
      reward_name: '',
      description: '',
      reward_data: '',
      required_score: 0,
      is_automatic: false,
    });
  }, []);

  const handleSaveReward = useCallback(async () => {
    setSaveError(null);

    // Validate reward_data JSON if provided
    let parsedRewardData = null;
    if (rewardForm.reward_data.trim()) {
      try {
        parsedRewardData = JSON.parse(rewardForm.reward_data);
      } catch (parseError) {
        const errorMessage = 'Invalid JSON format in reward_data: ' + parseError.message;
        setSaveError(errorMessage);
        return { success: false, error: errorMessage };
      }
    }

    const formData = {
      ...rewardForm,
      level_id: parseInt(rewardForm.level_id),
      required_score: parseInt(rewardForm.required_score),
      reward_data: parsedRewardData,
    };

    try {
      if (editingReward) {
        await updateReward(getToken, editingReward.reward_id, formData);
      } else {
        await createReward(getToken, formData);
      }
      handleCloseRewardDialog();
      await loadRewards();
      return { success: true };
    } catch (err) {
      const errorMessage = 'ไม่สามารถบันทึก reward ได้: ' + (err.message || 'Unknown error');
      setSaveError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [rewardForm, editingReward, getToken, handleCloseRewardDialog, loadRewards]);

  const handleDeleteClick = useCallback((reward) => {
    setRewardToDelete(reward);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!rewardToDelete) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteReward(getToken, rewardToDelete.reward_id);
      setDeleteDialogOpen(false);
      setRewardToDelete(null);
      await loadRewards();
    } catch (err) {
      const errorMessage = createDeleteErrorMessage('reward', err);
      setDeleteError(errorMessage);
    } finally {
      setDeleting(false);
    }
  }, [rewardToDelete, getToken, loadRewards]);

  const handleDeleteDialogChange = useCallback((open) => {
    if (!deleting) {
      setDeleteDialogOpen(open);
      if (!open) {
        setRewardToDelete(null);
        setDeleteError(null);
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
      await uploadRewardFrame(getToken, selectedReward.reward_id, imageFile, frameNumber);
      await loadRewards();

      const data = await fetchAllRewards(getToken, page, rowsPerPage, searchQuery);
      const updatedReward = data.rewards?.find(r => r.reward_id === selectedReward.reward_id);
      if (updatedReward) {
        setSelectedReward(updatedReward);
      }
    } catch (err) {
      setImageError('ไม่สามารถอัปโหลดรูปภาพได้: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingFrame(null);
    }
  }, [selectedReward, getToken, loadRewards, page, rowsPerPage, searchQuery]);

  const handleDeleteFrame = useCallback(async (frameNumber) => {
    if (!selectedReward) return;

    try {
      setDeletingFrame(frameNumber);
      setImageError(null);
      await deleteRewardFrame(getToken, selectedReward.reward_id, frameNumber);
      await loadRewards();

      const data = await fetchAllRewards(getToken, page, rowsPerPage, searchQuery);
      const updatedReward = data.rewards?.find(r => r.reward_id === selectedReward.reward_id);
      if (updatedReward) {
        setSelectedReward(updatedReward);
      }
    } catch (err) {
      setImageError('ไม่สามารถลบรูปภาพได้: ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingFrame(null);
    }
  }, [selectedReward, getToken, loadRewards, page, rowsPerPage, searchQuery]);

  const getDeleteDescription = (rewardName) => (
    <>
      คุณแน่ใจหรือไม่ว่าต้องการลบรางวัล <strong>{rewardName}</strong>?
      <br />
      <br />
      การกระทำนี้ไม่สามารถยกเลิกได้ และจะลบข้อมูลรางวัลทั้งหมดรวมถึงข้อมูลที่เกี่ยวข้อง
    </>
  );

  const tableHeaderClassName =
    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const tableCellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
  const actionsCellClassName = 'px-6 py-4 whitespace-nowrap text-sm font-medium';
  const searchPlaceholder = 'ค้นหารางวัล (ชื่อ, คำอธิบาย)...';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title="Reward Management"
          subtitle="จัดการรางวัล"
          onAddClick={() => handleOpenRewardDialog()}
          addButtonText="เพิ่มรางวัล"
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
          selectedReward={selectedReward}
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
          description={getDeleteDescription(rewardToDelete?.reward_name)}
          deleting={deleting}
        />
      </div>
    </div>
  );
};

export default RewardManagement;
