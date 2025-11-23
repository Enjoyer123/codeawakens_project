import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllVictoryConditions,
  createVictoryCondition,
  updateVictoryCondition,
  deleteVictoryCondition,
} from '../../../services/victoryConditionService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import PaginationControls from '@/components/shared/pagination/PaginationControls';
import { LoadingState, EmptyState } from '@/components/admin/tableStates/DataTableStates';
import VictoryConditionFormDialog from '@/components/admin/addEditDialog/VictoryConditionFormDialog';
import { usePagination } from '@/hooks/usePagination';
import { createDeleteErrorMessage } from '@/utils/errorHandler';

const VictoryConditionManagement = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);
  const [victoryConditions, setVictoryConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 10,
  });

  // Victory Condition form states
  const [victoryConditionDialogOpen, setVictoryConditionDialogOpen] = useState(false);
  const [editingVictoryCondition, setEditingVictoryCondition] = useState(null);
  const [victoryConditionForm, setVictoryConditionForm] = useState({
    type: '',
    description: '',
    check: '',
    is_available: true,
  });
  const [saveError, setSaveError] = useState(null);

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [victoryConditionToDelete, setVictoryConditionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const loadVictoryConditions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllVictoryConditions(
        getToken,
        page,
        rowsPerPage,
        searchQuery
      );
      setVictoryConditions(data.victoryConditions || []);
      setPagination(data.pagination || {
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
      });
    } catch (err) {
      setError('Failed to load victory conditions. ' + (err.message || ''));
      setVictoryConditions([]);
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
    loadVictoryConditions();
  }, [loadVictoryConditions]);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    handlePageChange(1);
  }, [handlePageChange]);

  const handleOpenVictoryConditionDialog = useCallback((victoryCondition = null) => {
    if (victoryCondition) {
      setEditingVictoryCondition(victoryCondition);
      setVictoryConditionForm({
        type: victoryCondition.type,
        description: victoryCondition.description || '',
        check: victoryCondition.check || '',
        is_available: victoryCondition.is_available,
      });
    } else {
      setEditingVictoryCondition(null);
      setVictoryConditionForm({
        type: '',
        description: '',
        check: '',
        is_available: true,
      });
    }
    setSaveError(null);
    setVictoryConditionDialogOpen(true);
  }, []);

  const handleCloseVictoryConditionDialog = useCallback(() => {
    setVictoryConditionDialogOpen(false);
    setEditingVictoryCondition(null);
    setSaveError(null);
    setVictoryConditionForm({
      type: '',
      description: '',
      check: '',
      is_available: true,
    });
  }, []);

  const handleSaveVictoryCondition = useCallback(async () => {
    setSaveError(null);

    const formData = {
      ...victoryConditionForm,
      type: victoryConditionForm.type.trim(),
      description: victoryConditionForm.description.trim(),
      check: victoryConditionForm.check.trim(),
    };

    try {
      if (editingVictoryCondition) {
        await updateVictoryCondition(
          getToken,
          editingVictoryCondition.victory_condition_id,
          formData
        );
      } else {
        await createVictoryCondition(getToken, formData);
      }
      handleCloseVictoryConditionDialog();
      await loadVictoryConditions();
      return { success: true };
    } catch (err) {
      const errorMessage = 'ไม่สามารถบันทึก victory condition ได้: ' +
        (err.message || 'Unknown error');
      setSaveError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [
    victoryConditionForm,
    editingVictoryCondition,
    getToken,
    handleCloseVictoryConditionDialog,
    loadVictoryConditions,
  ]);

  const handleDeleteClick = useCallback((victoryCondition) => {
    setVictoryConditionToDelete(victoryCondition);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!victoryConditionToDelete) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteVictoryCondition(
        getToken,
        victoryConditionToDelete.victory_condition_id
      );
      setDeleteDialogOpen(false);
      setVictoryConditionToDelete(null);
      await loadVictoryConditions();
    } catch (err) {
      const errorMessage = createDeleteErrorMessage('victory condition', err);
      setDeleteError(errorMessage);
    } finally {
      setDeleting(false);
    }
  }, [victoryConditionToDelete, getToken, loadVictoryConditions]);

  const handleDeleteDialogChange = useCallback((open) => {
    if (!deleting) {
      setDeleteDialogOpen(open);
      if (!open) {
        setVictoryConditionToDelete(null);
        setDeleteError(null);
      }
    }
  }, [deleting]);

  const getDeleteDescription = (type) =>
    `คุณแน่ใจหรือไม่ว่าต้องการลบเงื่อนไขชัยชนะ "${type}"? ` +
    'การกระทำนี้ไม่สามารถยกเลิกได้';

  const tableHeaderClassName =
    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const tableCellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
  const actionsCellClassName = 'px-6 py-4 whitespace-nowrap text-sm font-medium';
  const searchPlaceholder =
    'ค้นหาเงื่อนไขชัยชนะ (type, description, check)...';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title="Victory Condition Management"
          subtitle="จัดการเงื่อนไขชัยชนะ"
          onAddClick={() => handleOpenVictoryConditionDialog()}
          addButtonText="เพิ่มเงื่อนไขชัยชนะ"
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
            <LoadingState message="Loading victory conditions..." />
          ) : victoryConditions.length === 0 ? (
            <EmptyState
              message="ไม่พบข้อมูลเงื่อนไขชัยชนะ"
              searchQuery={searchQuery}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={tableHeaderClassName}>
                        Victory Condition ID
                      </th>
                      <th className={tableHeaderClassName}>Type</th>
                      <th className={tableHeaderClassName}>Description</th>
                      <th className={tableHeaderClassName}>Check</th>
                      <th className={tableHeaderClassName}>Available</th>
                      <th className={tableHeaderClassName}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {victoryConditions.map((victoryCondition) => (
                      <tr
                        key={victoryCondition.victory_condition_id}
                        className="hover:bg-gray-50"
                      >
                        <td className={tableCellClassName}>
                          {victoryCondition.victory_condition_id}
                        </td>
                        <td className={`${tableCellClassName} font-medium`}>
                          {victoryCondition.type}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {victoryCondition.description}
                        </td>
                        <td className={`${tableCellClassName} text-gray-500`}>
                          {victoryCondition.check}
                        </td>
                        <td className={tableCellClassName}>
                          <Badge
                            variant={victoryCondition.is_available ? 'default' : 'secondary'}
                          >
                            {victoryCondition.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </td>
                        <td className={actionsCellClassName}>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenVictoryConditionDialog(victoryCondition)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(victoryCondition)}
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

        <VictoryConditionFormDialog
          open={victoryConditionDialogOpen}
          onOpenChange={handleCloseVictoryConditionDialog}
          editingVictoryCondition={editingVictoryCondition}
          formData={victoryConditionForm}
          onFormChange={setVictoryConditionForm}
          onSave={handleSaveVictoryCondition}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteDialogChange}
          onConfirm={handleDeleteConfirm}
          title="ยืนยันการลบเงื่อนไขชัยชนะ"
          description={getDeleteDescription(victoryConditionToDelete?.type)}
          confirmText="ลบ"
          cancelText="ยกเลิก"
          isLoading={deleting}
        />
      </div>
    </div>
  );
};

export default VictoryConditionManagement;
