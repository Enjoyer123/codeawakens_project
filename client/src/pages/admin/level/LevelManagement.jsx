import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  useLevels,
  useDeleteLevel
} from '../../../services/hooks/useLevel';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import PaginationControls from '@/components/shared/pagination/PaginationControls';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import { usePagination } from '@/hooks/usePagination';
import { createDeleteErrorMessage } from '@/utils/errorHandler';
import PatternListDialog from '../../../components/admin/pattern/PatternListDialog';
import LevelTable from '@/components/admin/level/LevelTable';

const LevelManagement = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth(); // Still needed for auth context if any, or maybe not if hooks handle it. Hooks handle it.
  // Actually useLevel hooks use useAuth internally. So getToken is not needed here unless passed to something else.
  // But LevelTable might not need it.

  const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);
  const [searchQuery, setSearchQuery] = useState('');

  // Use TanStack Query
  const {
    data: levelsData,
    isLoading: loading,
    isError,
    error: levelsError
  } = useLevels(page, rowsPerPage, searchQuery);

  const levels = levelsData?.levels || [];
  const pagination = levelsData?.pagination || {
    total: 0,
    totalPages: 0,
    page: 1,
    limit: rowsPerPage,
  };

  const { mutateAsync: deleteLevelAsync, isPending: deleting } = useDeleteLevel();

  // Dialog states
  const [patternListDialogOpen, setPatternListDialogOpen] = useState(false);
  const [selectedLevelForPatterns, setSelectedLevelForPatterns] = useState(null);

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState(null);

  // Handle Search
  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    handlePageChange(1);
  }, [handlePageChange]);

  // Handle Delete
  const handleDeleteClick = useCallback((level) => {
    setLevelToDelete(level);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!levelToDelete) return;

    try {
      await deleteLevelAsync(levelToDelete.level_id);
      setDeleteDialogOpen(false);
      setLevelToDelete(null);
      // Query automatically invalidated by mutation hook
    } catch (err) {
      // Global error handler will show toast
      console.error(err);
    }
  }, [levelToDelete, deleteLevelAsync]);

  const handleDeleteDialogChange = useCallback((open) => {
    if (!deleting) {
      setDeleteDialogOpen(open);
      if (!open) {
        setLevelToDelete(null);
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

  const searchPlaceholder = 'ค้นหาด่าน (ชื่อ, คำอธิบาย)...';
  const error = isError ? (levelsError?.message || 'Failed to load levels') : null;

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


        <SearchInput
          defaultValue={searchQuery}
          onSearch={handleSearchChange}
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
              <LevelTable
                levels={levels}
                onDelete={handleDeleteClick}
                onViewPatterns={(level) => {
                  setSelectedLevelForPatterns({ id: level.level_id, name: level.level_name });
                  setPatternListDialogOpen(true);
                }}
                onNavigate={navigate}
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

      {selectedLevelForPatterns && (
        <PatternListDialog
          open={patternListDialogOpen}
          onOpenChange={setPatternListDialogOpen}
          levelId={selectedLevelForPatterns.id}
          levelName={selectedLevelForPatterns.name}
        />
      )}
    </div>
  );
};

export default LevelManagement;
