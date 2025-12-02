import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllLevelCategories,
  createLevelCategory,
  updateLevelCategory,
  deleteLevelCategory,
} from '../../../services/levelCategoryService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import PaginationControls from '@/components/shared/pagination/PaginationControls';
import { LoadingState, EmptyState } from '@/components/admin/tableStates/DataTableStates';
import LevelCategoryFormDialog from '@/components/admin/addEditDialog/LevelCategoryFormDialog';
import { usePagination } from '@/hooks/usePagination';
import { createDeleteErrorMessage } from '@/utils/errorHandler';

const LevelCategoryManagement = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);
  const [levelCategories, setLevelCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 10,
  });

  // Level Category form states
  const [levelCategoryDialogOpen, setLevelCategoryDialogOpen] = useState(false);
  const [editingLevelCategory, setEditingLevelCategory] = useState(null);
  const [levelCategoryForm, setLevelCategoryForm] = useState({
    category_name: '',
    description: '',
    item_enable: false,
    item: null,
    difficulty_order: 1,
    color_code: '#4CAF50',
    block_key: null,
  });
  const [saveError, setSaveError] = useState(null);

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [levelCategoryToDelete, setLevelCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const loadLevelCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllLevelCategories(
        getToken,
        page,
        rowsPerPage,
        searchQuery
      );
      setLevelCategories(data.levelCategories || []);
      setPagination(data.pagination || {
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
      });
    } catch (err) {
      setError('Failed to load level categories. ' + (err.message || ''));
      setLevelCategories([]);
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
    loadLevelCategories();
  }, [loadLevelCategories]);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    handlePageChange(1);
  }, [handlePageChange]);

  const handleOpenLevelCategoryDialog = useCallback((levelCategory = null) => {
    if (levelCategory) {
      setEditingLevelCategory(levelCategory);
      // Convert block_key to comma-separated format for easier editing
      let blockKeyDisplay = '';
      if (levelCategory.block_key) {
        if (Array.isArray(levelCategory.block_key)) {
          blockKeyDisplay = levelCategory.block_key.join(', ');
        } else if (typeof levelCategory.block_key === 'object') {
          // If it's an object, convert to JSON string
          blockKeyDisplay = JSON.stringify(levelCategory.block_key, null, 2);
        } else {
          blockKeyDisplay = String(levelCategory.block_key);
        }
      }

      setLevelCategoryForm({
        category_name: levelCategory.category_name,
        description: levelCategory.description || '',
        item_enable: levelCategory.item_enable || false,
        item: levelCategory.item,
        difficulty_order: levelCategory.difficulty_order,
        color_code: levelCategory.color_code || '#4CAF50',
        block_key: blockKeyDisplay,
      });
    } else {
      setEditingLevelCategory(null);
      // Get max difficulty_order to suggest next order
      const maxOrder = levelCategories.length > 0
        ? Math.max(...levelCategories.map(c => c.difficulty_order))
        : 0;
      setLevelCategoryForm({
        category_name: '',
        description: '',
        item_enable: false,
        item: null,
        difficulty_order: maxOrder + 1,
        color_code: '#4CAF50',
        block_key: '',
      });
    }
    setSaveError(null);
    setLevelCategoryDialogOpen(true);
  }, [levelCategories]);

  const handleCloseLevelCategoryDialog = useCallback(() => {
    setLevelCategoryDialogOpen(false);
    setEditingLevelCategory(null);
    setSaveError(null);
    setLevelCategoryForm({
      category_name: '',
      description: '',
      item_enable: false,
      item: null,
      difficulty_order: 1,
      color_code: '#4CAF50',
      block_key: null,
    });
  }, []);

  const handleSaveLevelCategory = useCallback(async () => {
    setSaveError(null);

    // Handle block_key - support both comma-separated and JSON format
    let blockKeyValue = null;
    if (levelCategoryForm.block_key && levelCategoryForm.block_key.trim()) {
      const trimmedValue = levelCategoryForm.block_key.trim();
      
      // Try to parse as JSON first
      try {
        blockKeyValue = JSON.parse(trimmedValue);
      } catch (jsonError) {
        // If not valid JSON, treat as comma-separated string
        // Split by comma and trim each item
        const items = trimmedValue
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
        
        if (items.length > 0) {
          blockKeyValue = items;
        } else {
          blockKeyValue = null;
        }
      }
    }

    const formData = {
      ...levelCategoryForm,
      category_name: levelCategoryForm.category_name.trim(),
      description: levelCategoryForm.description.trim(),
      color_code: levelCategoryForm.color_code.trim(),
      item: levelCategoryForm.item || null,
      difficulty_order: parseInt(levelCategoryForm.difficulty_order),
      block_key: blockKeyValue,
    };

    try {
      if (editingLevelCategory) {
        await updateLevelCategory(
          getToken,
          editingLevelCategory.category_id,
          formData
        );
      } else {
        await createLevelCategory(getToken, formData);
      }
      handleCloseLevelCategoryDialog();
      await loadLevelCategories();
      return { success: true };
    } catch (err) {
      const errorMessage = 'ไม่สามารถบันทึก level category ได้: ' +
        (err.message || 'Unknown error');
      setSaveError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [
    levelCategoryForm,
    editingLevelCategory,
    getToken,
    handleCloseLevelCategoryDialog,
    loadLevelCategories,
  ]);

  const handleDeleteClick = useCallback((levelCategory) => {
    setLevelCategoryToDelete(levelCategory);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!levelCategoryToDelete) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteLevelCategory(
        getToken,
        levelCategoryToDelete.category_id
      );
      setDeleteDialogOpen(false);
      setLevelCategoryToDelete(null);
      await loadLevelCategories();
    } catch (err) {
      const errorMessage = createDeleteErrorMessage('level category', err);
      setDeleteError(errorMessage);
    } finally {
      setDeleting(false);
    }
  }, [levelCategoryToDelete, getToken, loadLevelCategories]);

  const handleDeleteDialogChange = useCallback((open) => {
    if (!deleting) {
      setDeleteDialogOpen(open);
      if (!open) {
        setLevelCategoryToDelete(null);
        setDeleteError(null);
      }
    }
  }, [deleting]);

  const getDeleteDescription = (categoryName) =>
    `คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ "${categoryName}"? ` +
    'การกระทำนี้ไม่สามารถยกเลิกได้';

  const tableHeaderClassName =
    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const tableCellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
  const actionsCellClassName = 'px-6 py-4 whitespace-nowrap text-sm font-medium';
  const colorSwatchClassName = 'w-6 h-6 rounded border border-gray-300';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title="Level Category Management"
          subtitle="จัดการหมวดหมู่ระดับ"
          onAddClick={() => handleOpenLevelCategoryDialog()}
          addButtonText="เพิ่มหมวดหมู่"
        />

        <ErrorAlert message={error} />
        <ErrorAlert message={saveError} />
        <ErrorAlert message={deleteError} />

        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="ค้นหาหมวดหมู่ (name, description)..."
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <LoadingState message="Loading level categories..." />
          ) : levelCategories.length === 0 ? (
            <EmptyState
              message="ไม่พบข้อมูลหมวดหมู่"
              searchQuery={searchQuery}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={tableHeaderClassName}>Category ID</th>
                      <th className={tableHeaderClassName}>Category Name</th>
                      <th className={tableHeaderClassName}>Description</th>
                      <th className={tableHeaderClassName}>Item Enable</th>
                      <th className={tableHeaderClassName}>Difficulty Order</th>
                      <th className={tableHeaderClassName}>Color Code</th>
                      <th className={tableHeaderClassName}>Block Key</th>
                      <th className={tableHeaderClassName}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {levelCategories.map((category) => (
                      <tr key={category.category_id} className="hover:bg-gray-50">
                        <td className={tableCellClassName}>
                          {category.category_id}
                        </td>
                        <td className={`${tableCellClassName} font-medium`}>
                          {category.category_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {category.description}
                        </td>
                        <td className={tableCellClassName}>
                          <Badge
                            variant={category.item_enable ? 'default' : 'secondary'}
                          >
                            {category.item_enable ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </td>
                        <td className={tableCellClassName}>
                          {category.difficulty_order}
                        </td>
                        <td className={tableCellClassName}>
                          <div className="flex items-center gap-2">
                            <div
                              className={colorSwatchClassName}
                              style={{ backgroundColor: category.color_code }}
                            />
                            <span className="text-sm text-gray-600">
                              {category.color_code}
                            </span>
                          </div>
                        </td>
                        <td className={tableCellClassName}>
                          {category.block_key ? (
                            <div className="max-w-xs">
                              <Badge variant="secondary" className="text-xs">
                                {Array.isArray(category.block_key)
                                  ? `${category.block_key.length} items`
                                  : typeof category.block_key === 'object'
                                  ? Object.keys(category.block_key).length > 0
                                    ? `${Object.keys(category.block_key).length} keys`
                                    : 'Empty'
                                  : 'Set'}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                {JSON.stringify(category.block_key).substring(0, 50)}
                                {JSON.stringify(category.block_key).length > 50 ? '...' : ''}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className={actionsCellClassName}>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenLevelCategoryDialog(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(category)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
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

        <LevelCategoryFormDialog
          open={levelCategoryDialogOpen}
          onOpenChange={handleCloseLevelCategoryDialog}
          editingLevelCategory={editingLevelCategory}
          formData={levelCategoryForm}
          onFormChange={setLevelCategoryForm}
          onSave={handleSaveLevelCategory}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteDialogChange}
          onConfirm={handleDeleteConfirm}
          title="ยืนยันการลบหมวดหมู่"
          description={getDeleteDescription(levelCategoryToDelete?.category_name)}
          confirmText="ลบ"
          cancelText="ยกเลิก"
          isLoading={deleting}
        />
      </div>
    </div>
  );
};

export default LevelCategoryManagement;
