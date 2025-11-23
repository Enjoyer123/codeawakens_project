import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllLevels,
  createLevel,
  updateLevel,
  deleteLevel,
  fetchAllCategories,
  fetchLevelsForPrerequisite,
} from '../../../services/levelService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import PaginationControls from '@/components/shared/pagination/PaginationControls';
import { LoadingState, EmptyState } from '@/components/admin/tableStates/DataTableStates';
import { usePagination } from '@/hooks/usePagination';
import { createDeleteErrorMessage } from '@/utils/errorHandler';

const LevelManagement = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);
  const [levels, setLevels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [prerequisiteLevels, setPrerequisiteLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 10,
  });

  // Level form states
  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [levelForm, setLevelForm] = useState({
    category_id: '',
    level_name: '',
    description: '',
    difficulty_level: 1,
    difficulty: 'easy',
    is_unlocked: false,
    required_level_id: '',
    textcode: false,
    background_image: '',
  });
  const [saveError, setSaveError] = useState(null);

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const loadLevels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllLevels(getToken, page, rowsPerPage, searchQuery);
      setLevels(data.levels || []);
      setPagination(data.pagination || {
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
      });
    } catch (err) {
      setError('Failed to load levels. ' + (err.message || ''));
      setLevels([]);
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

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchAllCategories(getToken);
      setCategories(data || []);
    } catch (err) {
      // Silently fail - categories are optional
    }
  }, [getToken]);

  const loadPrerequisiteLevels = useCallback(async () => {
    try {
      const data = await fetchLevelsForPrerequisite(getToken);
      setPrerequisiteLevels(data || []);
    } catch (err) {
      // Silently fail - prerequisite levels are optional
    }
  }, [getToken]);

  useEffect(() => {
    loadLevels();
    loadCategories();
    loadPrerequisiteLevels();
  }, [loadLevels, loadCategories, loadPrerequisiteLevels]);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    handlePageChange(1);
  }, [handlePageChange]);

  const handleOpenLevelDialog = useCallback((level = null) => {
    if (level) {
      setEditingLevel(level);
      setLevelForm({
        category_id: level.category_id.toString(),
        level_name: level.level_name,
        description: level.description || '',
        difficulty_level: level.difficulty_level,
        difficulty: level.difficulty,
        is_unlocked: level.is_unlocked,
        required_level_id: level.required_level_id
          ? level.required_level_id.toString()
          : '',
        textcode: level.textcode,
        background_image: level.background_image,
      });
    } else {
      setEditingLevel(null);
      setLevelForm({
        category_id: '',
        level_name: '',
        description: '',
        difficulty_level: 1,
        difficulty: 'easy',
        is_unlocked: false,
        required_level_id: '',
        textcode: false,
        background_image: '',
      });
    }
    setSaveError(null);
    setLevelDialogOpen(true);
  }, []);

  const handleCloseLevelDialog = useCallback(() => {
    setLevelDialogOpen(false);
    setEditingLevel(null);
    setSaveError(null);
    setLevelForm({
      category_id: '',
      level_name: '',
      description: '',
      difficulty_level: 1,
      difficulty: 'easy',
      is_unlocked: false,
      required_level_id: '',
      textcode: false,
      background_image: '',
    });
  }, []);

  const handleSaveLevel = useCallback(async () => {
    setSaveError(null);

    try {
      const formData = {
        ...levelForm,
        category_id: parseInt(levelForm.category_id),
        difficulty_level: parseInt(levelForm.difficulty_level),
        required_level_id: levelForm.required_level_id
          ? parseInt(levelForm.required_level_id)
          : null,
      };

      if (editingLevel) {
        await updateLevel(getToken, editingLevel.level_id, formData);
      } else {
        await createLevel(getToken, formData);
      }
      handleCloseLevelDialog();
      await loadLevels();
      return { success: true };
    } catch (err) {
      const errorMessage = 'ไม่สามารถบันทึกด่านได้: ' + (err.message || 'Unknown error');
      setSaveError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [levelForm, editingLevel, getToken, handleCloseLevelDialog, loadLevels]);

  const handleDeleteClick = useCallback((level) => {
    setLevelToDelete(level);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!levelToDelete) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteLevel(getToken, levelToDelete.level_id);
      setDeleteDialogOpen(false);
      setLevelToDelete(null);
      await loadLevels();
    } catch (err) {
      const errorMessage = createDeleteErrorMessage('level', err);
      setDeleteError(errorMessage);
    } finally {
      setDeleting(false);
    }
  }, [levelToDelete, getToken, loadLevels]);

  const handleDeleteDialogChange = useCallback((open) => {
    if (!deleting) {
      setDeleteDialogOpen(open);
      if (!open) {
        setLevelToDelete(null);
        setDeleteError(null);
      }
    }
  }, [deleting]);

  const getDeleteDescription = (levelName) => (
    <>
      คุณแน่ใจหรือไม่ว่าต้องการลบด่าน <strong>{levelName}</strong>?
      <br />
      <br />
      การกระทำนี้ไม่สามารถยกเลิกได้ และจะลบข้อมูลด่านทั้งหมดรวมถึงข้อมูลที่เกี่ยวข้อง
    </>
  );

  const tableHeaderClassName =
    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const tableCellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
  const actionsCellClassName = 'px-6 py-4 whitespace-nowrap text-sm font-medium';
  const searchPlaceholder = 'ค้นหาด่าน (ชื่อ, คำอธิบาย)...';
  const selectClassName =
    'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title="Level Management"
          subtitle="จัดการด่าน"
          onAddClick={() => navigate('/admin/levels/create')}
          addButtonText="เพิ่มด่าน"
        />

        <ErrorAlert message={error} />
        <ErrorAlert message={saveError} />
        <ErrorAlert message={deleteError} />

        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <LoadingState message="Loading levels..." />
          ) : levels.length === 0 ? (
            <EmptyState
              message="ไม่พบด่านที่ค้นหา"
              searchQuery={searchQuery}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={tableHeaderClassName}>Level</th>
                      <th className={tableHeaderClassName}>Category</th>
                      <th className={tableHeaderClassName}>Difficulty</th>
                      <th className={tableHeaderClassName}>Status</th>
                      <th className={tableHeaderClassName}>Creator</th>
                      <th className={tableHeaderClassName}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {levels.map((level) => (
                      <tr key={level.level_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {level.level_name}
                            </div>
                            {level.description && (
                              <div className="text-sm text-gray-500">
                                {level.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className={tableCellClassName}>
                          {level.category && (
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: level.category.color_code || '#gray',
                                color: level.category.color_code || '#gray'
                              }}
                            >
                              {level.category.category_name}
                            </Badge>
                          )}
                        </td>
                        <td className={tableCellClassName}>
                          <div className="text-sm text-gray-900">
                            <Badge variant="secondary">{level.difficulty}</Badge>
                            <span className="ml-2 text-gray-500">
                              ({level.difficulty_level})
                            </span>
                          </div>
                        </td>
                        <td className={tableCellClassName}>
                          <div className="flex flex-col gap-1">
                            <Badge variant={level.is_unlocked ? 'default' : 'secondary'}>
                              {level.is_unlocked ? 'Unlocked' : 'Locked'}
                            </Badge>
                            <Badge variant={level.textcode ? 'default' : 'outline'}>
                              {level.textcode ? 'Text Code' : 'Blockly'}
                            </Badge>
                          </div>
                        </td>
                        <td className={tableCellClassName}>
                          {level.creator?.username || 'Unknown'}
                        </td>
                        <td className={actionsCellClassName}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/levels/${level.level_id}/edit`)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              แก้ไข
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(level)}
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

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        onConfirm={handleDeleteConfirm}
        itemName={levelToDelete?.level_name}
        title="ยืนยันการลบด่าน"
        description={getDeleteDescription(levelToDelete?.level_name)}
        deleting={deleting}
      />
    </div>
  );
};

export default LevelManagement;
