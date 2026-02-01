import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { UserButton } from '@clerk/clerk-react';

import {
  useUsers,
  useUpdateUserRole,
  useDeleteUser,
  useResetUserTestScore
} from '../../../services/hooks/useAdmin';

import UserTestResultModal from '@/components/admin/modals/UserTestResultModal';
import UserDetailsModal from '@/components/shared/userDetailProfile/UserDetailsModal';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import PaginationControls from '@/components/shared/pagination/PaginationControls';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import { usePagination } from '@/hooks/usePagination';
import { createDeleteErrorMessage } from '@/utils/errorHandler';
import UserTable from '@/components/admin/user/UserTable';

const UserManagement = () => {
  const { getToken } = useAuth();
  const { page, rowsPerPage, handlePageChange } = usePagination(1, 5);
  const [searchQuery, setSearchQuery] = useState('');

  // TanStack Query Hooks
  const {
    data: usersData,
    isLoading: loading,
    isError,
    error: queryError
  } = useUsers(page, rowsPerPage, searchQuery);

  const users = usersData?.users || [];
  const pagination = usersData?.pagination || {
    total: 0,
    totalPages: 0,
    page: 1,
    limit: rowsPerPage,
  };

  // Mutations
  const { mutateAsync: updateUserRoleAsync } = useUpdateUserRole();
  const { mutateAsync: deleteUserAsync, isPending: deleting } = useDeleteUser();
  const { mutateAsync: resetScoreAsync } = useResetUserTestScore();

  // Local UI State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [roleError, setRoleError] = useState(null);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState(null);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    handlePageChange(1);
  }, [handlePageChange]);

  const handleRoleChange = useCallback(async (userId, newRole) => {
    try {
      setRoleError(null);
      await updateUserRoleAsync({ userId, role: newRole });
      // Query invalidation handles refresh
    } catch (err) {
      setRoleError('Failed to update user role: ' + (err.message || 'Unknown error'));
    }
  }, [updateUserRoleAsync]);

  const handleViewDetails = useCallback((userItem) => {
    setSelectedUser(userItem);
    setModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((userItem) => {
    setUserToDelete(userItem);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!userToDelete) return;

    try {
      setDeleteError(null);
      const userId = userToDelete.user_id || userToDelete.id;
      await deleteUserAsync(userId);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      // Query invalidation handles refresh
    } catch (err) {
      const errorMessage = createDeleteErrorMessage('user', err);
      setDeleteError(errorMessage);
    }
  }, [userToDelete, deleteUserAsync]);

  const handleResetScore = async (userId, type) => {
    if (!window.confirm(`Are you sure you want to reset the ${type}-test score for this user?`)) return;
    try {
      await resetScoreAsync({ userId, type });
      alert(`Reset ${type}-test score successfully`);
      // Query invalidation handles refresh
    } catch (err) {
      alert('Failed to reset: ' + err.message);
    }
  };

  const handleViewHistory = (user) => {
    setSelectedUserForHistory(user);
    // Modal will handle fetching using useUserTestHistory hook
    setHistoryModalOpen(true);
  };

  const handleDeleteDialogChange = useCallback((open) => {
    if (!deleting) {
      setDeleteDialogOpen(open);
      if (!open) {
        setUserToDelete(null);
        setDeleteError(null);
      }
    }
  }, [deleting]);

  const getDeleteDescription = (userName) => (
    <>
      คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ <strong>{userName}</strong>?
      <br />
      <br />
      การกระทำนี้ไม่สามารถยกเลิกได้ และจะลบข้อมูลผู้ใช้ทั้งหมดรวมถึงข้อมูลที่เกี่ยวข้อง
    </>
  );

  const searchPlaceholder = 'ค้นหาผู้ใช้ (username, email, name)...';
  const error = isError ? (queryError?.message || 'Failed to load users') : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title="User Management"
          subtitle="Manage users and their roles"
        />

        <ErrorAlert message={error} />
        <ErrorAlert message={roleError} />
        <ErrorAlert message={deleteError} />

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">{error}</p>
            <p className="text-sm text-yellow-600 mt-2">
              Note: You may need to create the /api/users endpoint on the backend.
            </p>
          </div>
        )}

        <SearchInput
          defaultValue={searchQuery}
          onSearch={handleSearchChange}
          placeholder={searchPlaceholder}
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <LoadingState message="Loading users..." />
          ) : users.length === 0 ? (
            <EmptyState
              message="ไม่พบผู้ใช้ที่ค้นหา"
              searchQuery={searchQuery}
            />
          ) : (
            <>
              <UserTable
                users={users}
                onRoleChange={handleRoleChange}
                onViewDetails={handleViewDetails}
                onViewHistory={handleViewHistory}
                onDelete={handleDeleteClick}
                onResetScore={handleResetScore}
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

      <UserDetailsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        userId={selectedUser?.user_id || selectedUser?.id}
        userName={selectedUser?.username || selectedUser?.email}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        onConfirm={handleDeleteConfirm}
        itemName={userToDelete?.username || userToDelete?.email}
        title="ยืนยันการลบผู้ใช้"
        description={getDeleteDescription(
          userToDelete?.username || userToDelete?.email
        )}
        deleting={deleting}
      />

      <UserTestResultModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        user={selectedUserForHistory}
      // testHistory prop removed - modal handles fetching
      />
    </div>
  );
};

export default UserManagement;
