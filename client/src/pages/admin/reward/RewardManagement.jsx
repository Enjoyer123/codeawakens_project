import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Edit, Trash2, Image as ImageIcon, X } from 'lucide-react';
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminPageHeader from '@/components/shared/AdminPageHeader';
import SearchInput from '@/components/shared/SearchInput';
import ErrorAlert from '@/components/shared/ErrorAlert';
import PaginationControls from '@/components/shared/PaginationControls';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import RewardImageDialog from './RewardImageDialog';
const RewardManagement = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
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
    frame1: '',
    frame2: '',
    frame3: '',
    frame4: '',
    frame5: '',
  });

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rewardToDelete, setRewardToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Image management states
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [uploadingFrame, setUploadingFrame] = useState(null);
  const [deletingFrame, setDeletingFrame] = useState(null);

  useEffect(() => {
    loadRewards();
    loadLevels();
  }, [page, searchQuery]);

  const loadRewards = async () => {
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
  };

  const loadLevels = async () => {
    try {
      const data = await fetchLevelsForReward(getToken);
      setLevels(data || []);
    } catch (err) {
      // Silently fail - levels are optional
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleOpenRewardDialog = (reward = null) => {
    if (reward) {
      setEditingReward(reward);
      setRewardForm({
        level_id: reward.level_id.toString(),
        reward_type: reward.reward_type,
        reward_name: reward.reward_name,
        description: reward.description || '',
        reward_data: reward.reward_data ? JSON.stringify(reward.reward_data, null, 2) : '',
        required_score: reward.required_score,
        is_automatic: reward.is_automatic,
        frame1: reward.frame1 || '',
        frame2: reward.frame2 || '',
        frame3: reward.frame3 || '',
        frame4: reward.frame4 || '',
        frame5: reward.frame5 || '',
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
        frame1: '',
        frame2: '',
        frame3: '',
        frame4: '',
        frame5: '',
      });
    }
    setRewardDialogOpen(true);
  };

  const handleCloseRewardDialog = () => {
    setRewardDialogOpen(false);
    setEditingReward(null);
    setRewardForm({
      level_id: '',
      reward_type: 'weapon',
      reward_name: '',
      description: '',
      reward_data: '',
      required_score: 0,
      is_automatic: false,
      frame1: '',
      frame2: '',
      frame3: '',
      frame4: '',
      frame5: '',
    });
  };

  const handleSaveReward = async () => {
    try {
      // Validate reward_data JSON if provided
      let parsedRewardData = null;
      if (rewardForm.reward_data.trim()) {
        try {
          parsedRewardData = JSON.parse(rewardForm.reward_data);
        } catch (parseError) {
          alert('Invalid JSON format in reward_data: ' + parseError.message);
          return;
        }
      }

      const formData = {
        ...rewardForm,
        level_id: parseInt(rewardForm.level_id),
        required_score: parseInt(rewardForm.required_score),
        reward_data: parsedRewardData,
        frame1: rewardForm.frame1 || null,
        frame2: rewardForm.frame2 || null,
        frame3: rewardForm.frame3 || null,
        frame4: rewardForm.frame4 || null,
        frame5: rewardForm.frame5 || null,
      };

      if (editingReward) {
        await updateReward(getToken, editingReward.reward_id, formData);
      } else {
        await createReward(getToken, formData);
      }
      handleCloseRewardDialog();
      await loadRewards();
    } catch (err) {
      alert('ไม่สามารถบันทึก reward ได้: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteClick = (reward) => {
    setRewardToDelete(reward);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!rewardToDelete) return;

    try {
      setDeleting(true);
      await deleteReward(getToken, rewardToDelete.reward_id);
      setDeleteDialogOpen(false);
      setRewardToDelete(null);
      await loadRewards();
    } catch (err) {
      alert('ไม่สามารถลบ reward ได้: ' + (err.message || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteDialogChange = (open) => {
    if (!deleting) {
      setDeleteDialogOpen(open);
      if (!open) {
        setRewardToDelete(null);
      }
    }
  };

  const handleOpenImageDialog = (reward) => {
    setSelectedReward(reward);
    setImageDialogOpen(true);
  };

  const handleImageDialogChange = (open) => {
    setImageDialogOpen(open);
    if (!open) {
      setSelectedReward(null);
      setUploadingFrame(null);
      setDeletingFrame(null);
    }
  };

  const handleUploadFrame = async (frameNumber, imageFile) => {
    if (!selectedReward || !imageFile) {
      alert('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    try {
      setUploadingFrame(frameNumber);
      await uploadRewardFrame(getToken, selectedReward.reward_id, imageFile, frameNumber);
      await loadRewards();
      
      // Update selectedReward with fresh data
      const data = await fetchAllRewards(getToken, page, rowsPerPage, searchQuery);
      const updatedReward = data.rewards?.find(r => r.reward_id === selectedReward.reward_id);
      if (updatedReward) {
        setSelectedReward(updatedReward);
      }
    } catch (err) {
      alert('ไม่สามารถอัปโหลดรูปภาพได้: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingFrame(null);
    }
  };

  const handleDeleteFrame = async (frameNumber) => {
    if (!selectedReward) return;
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ Frame ${frameNumber}?`)) {
      return;
    }

    try {
      setDeletingFrame(frameNumber);
      await deleteRewardFrame(getToken, selectedReward.reward_id, frameNumber);
      await loadRewards();
      
      // Update selectedReward with fresh data
      const data = await fetchAllRewards(getToken, page, rowsPerPage, searchQuery);
      const updatedReward = data.rewards?.find(r => r.reward_id === selectedReward.reward_id);
      if (updatedReward) {
        setSelectedReward(updatedReward);
      }
    } catch (err) {
      alert('ไม่สามารถลบรูปภาพได้: ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingFrame(null);
    }
  };

  const getImageUrl = (pathFile) => {
    if (!pathFile) return null;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
    return `${baseUrl}${pathFile}`;
  };


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

        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
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
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reward
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Required Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Images
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rewards.map((reward) => (
                      <tr key={reward.reward_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {reward.reward_name}
                            </div>
                            {reward.description && (
                              <div className="text-sm text-gray-500">{reward.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {reward.level && (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {reward.level.level_name}
                              </div>
                              {reward.level.category && (
                                <div className="text-xs text-gray-500">
                                  {reward.level.category.category_name}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">{reward.reward_type}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{reward.required_score}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={reward.is_automatic ? 'default' : 'secondary'}>
                            {reward.is_automatic ? 'Automatic' : 'Manual'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            {(() => {
                              const frames = [
                                reward.frame1,
                                reward.frame2,
                                reward.frame3,
                                reward.frame4,
                                reward.frame5,
                              ].filter(Boolean);
                              
                              return frames.length > 0 ? (
                                <>
                                  <Badge variant="secondary">
                                    {frames.length} รูป
                                  </Badge>
                                  <div className="flex gap-1">
                                    {frames.slice(0, 3).map((frame, index) => (
                                      <img
                                        key={`frame${index + 1}`}
                                        src={getImageUrl(frame)}
                                        alt={`Frame ${index + 1}`}
                                        className="w-8 h-8 object-cover rounded border"
                                      />
                                    ))}
                                    {frames.length > 3 && (
                                      <div className="w-8 h-8 bg-gray-200 rounded border flex items-center justify-center text-xs">
                                        +{frames.length - 3}
                                      </div>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <span className="text-sm text-gray-400">ไม่มีรูป</span>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenImageDialog(reward)}
                            >
                              <ImageIcon className="h-4 w-4 mr-2" />
                              รูปภาพ
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenRewardDialog(reward)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              แก้ไข
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(reward)}
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
      </div>

      {/* Reward Add/Edit Dialog */}
      <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReward ? 'แก้ไขรางวัล' : 'เพิ่มรางวัลใหม่'}
            </DialogTitle>
            <DialogDescription>
              {editingReward ? 'แก้ไขข้อมูลรางวัล' : 'กรอกข้อมูลรางวัลใหม่'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Level *</label>
                <select
                  value={rewardForm.level_id}
                  onChange={(e) => setRewardForm({ ...rewardForm, level_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">เลือกด่าน</option>
                  {levels.map((level) => (
                    <option key={level.level_id} value={level.level_id}>
                      {level.level_name} {level.category && `(${level.category.category_name})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Reward Type *</label>
                <select
                  value={rewardForm.reward_type}
                  onChange={(e) => setRewardForm({ ...rewardForm, reward_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="weapon">Weapon</option>
                  <option value="block">Block</option>
                  <option value="badge">Badge</option>
                  <option value="experience">Experience</option>
                  <option value="coin">Coin</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Reward Name *</label>
              <Input
                value={rewardForm.reward_name}
                onChange={(e) => setRewardForm({ ...rewardForm, reward_name: e.target.value })}
                placeholder="ชื่อรางวัล"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={rewardForm.description}
                onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                placeholder="คำอธิบายรางวัล"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reward Data (JSON)</label>
              <textarea
                value={rewardForm.reward_data}
                onChange={(e) => setRewardForm({ ...rewardForm, reward_data: e.target.value })}
                placeholder='{"weapon_id": 1, "combat_power": 10}'
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">Format: JSON object (optional)</p>
            </div>
            <div>
              <label className="text-sm font-medium">Required Score *</label>
              <Input
                type="number"
                min="0"
                value={rewardForm.required_score}
                onChange={(e) => setRewardForm({ ...rewardForm, required_score: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_automatic"
                checked={rewardForm.is_automatic}
                onChange={(e) => setRewardForm({ ...rewardForm, is_automatic: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_automatic" className="text-sm font-medium">
                Is Automatic
              </label>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500">
                หมายเหตุ: สามารถอัปโหลดรูปภาพ Frame 1-5 ได้หลังจากสร้าง reward แล้ว โดยกดปุ่ม "รูปภาพ" ในตาราง
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseRewardDialog}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveReward}>
              {editingReward ? 'บันทึก' : 'เพิ่ม'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        description={
          <>
            คุณแน่ใจหรือไม่ว่าต้องการลบรางวัล{' '}
            <strong>{rewardToDelete?.reward_name}</strong>?
            <br />
            <br />
            การกระทำนี้ไม่สามารถยกเลิกได้ และจะลบข้อมูลรางวัลทั้งหมดรวมถึงข้อมูลที่เกี่ยวข้อง
          </>
        }
        deleting={deleting}
      />
    </div>
  );
};

export default RewardManagement;

