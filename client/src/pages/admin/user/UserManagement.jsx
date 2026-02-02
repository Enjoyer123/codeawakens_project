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

import PageError from '@/components/shared/Error/PageError';

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

  if (isError) {
    return <PageError message={queryError?.message} title="Failed to load users" />;
  }

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

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState(null);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    handlePageChange(1);
  }, [handlePageChange]);

  const handleRoleChange = useCallback(async (userId, newRole) => {
    try {
      await updateUserRoleAsync({ userId, role: newRole });
      // Query invalidation handles refresh
    } catch (err) {
      console.error(err);
    }
  }, [updateUserRoleAsync]);

  const handleViewDetails = useCallback((userItem) => {
    setSelectedUser(userItem);
    setModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((userItem) => {
    setUserToDelete(userItem);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!userToDelete) return;

    try {
      const userId = userToDelete.user_id || userToDelete.id;
      await deleteUserAsync(userId);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      // Query invalidation handles refresh
    } catch (err) {
      console.error(err);
    }
  }, [userToDelete, deleteUserAsync]);

  const handleResetScore = (userId, type) => {
    setResetTarget({ userId, type });
    setResetDialogOpen(true);
  };

  const handleResetConfirm = async () => {
    if (!resetTarget) return;
    try {
      await resetScoreAsync(resetTarget);
      // alert(`Reset ${resetTarget.type}-test score successfully`); // Removed alert for cleaner UX, standard dialog closes on success usually
      setResetTarget(null);
      setResetDialogOpen(false);
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
      }
    }
  }, [deleting]);

  const handleResetDialogChange = useCallback((open) => {
    setResetDialogOpen(open);
    if (!open) setResetTarget(null);
  }, []);

  const searchPlaceholder = 'ค้นหาผู้ใช้ (username, email, name)...';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title="User Management"
          subtitle="Manage users and their roles"
        />

        <SearchInput
          defaultValue={searchQuery}
          onSearch={handleSearchChange}
          placeholder={searchPlaceholder}
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <LoadingState message="Loading users..." />
          ) : usersData?.users?.length === 0 ? (
            <EmptyState
              message="ไม่พบผู้ใช้ที่ค้นหา"
              searchQuery={searchQuery}
            />
          ) : (
            <>
              <UserTable
                users={usersData?.users || []}
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
        deleting={deleting}
      />

      <DeleteConfirmDialog
        open={resetDialogOpen}
        onOpenChange={handleResetDialogChange}
        onConfirm={handleResetConfirm}
        itemName={`คะแนน ${resetTarget?.type || ''} ของผู้ใช้นี้`}
        title="ยืนยันการรีเซ็ตคะแนน"
        confirmText="รีเซ็ต"
        deleting={false} // Reset mutation state if available around?
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
