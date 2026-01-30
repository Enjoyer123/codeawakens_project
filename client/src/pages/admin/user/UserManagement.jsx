import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { UserButton } from '@clerk/clerk-react';
import { fetchAllUsers, updateUserRole, deleteUser, resetUserTestScore, fetchUserTestHistory } from '../../../services/adminService';
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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [roleError, setRoleError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 5,
  });

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState(null);
  const [testHistory, setTestHistory] = useState([]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllUsers(getToken, page, rowsPerPage, searchQuery);
      setUsers(data.users || []);
      setPagination(data.pagination || {
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
      });
    } catch (err) {
      setError('Failed to load users. Please check if the API endpoint exists.');
      setUsers([]);
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
    loadUsers();
  }, [loadUsers]);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    handlePageChange(1);
  }, [handlePageChange]);

  const handleRoleChange = useCallback(async (userId, newRole) => {
    try {
      setRoleError(null);
      await updateUserRole(getToken, userId, newRole);
      await loadUsers();
    } catch (err) {
      setRoleError('Failed to update user role: ' + (err.message || 'Unknown error'));
    }
  }, [getToken, loadUsers]);

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
      setDeleting(true);
      setDeleteError(null);
      const userId = userToDelete.user_id || userToDelete.id;
      await deleteUser(getToken, userId);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      await loadUsers();
    } catch (err) {
      const errorMessage = createDeleteErrorMessage('user', err);
      setDeleteError(errorMessage);
    } finally {
      setDeleting(false);
    }
  }, [userToDelete, getToken, loadUsers]);

  const handleResetScore = async (userId, type) => {
    if (!window.confirm(`Are you sure you want to reset the ${type}-test score for this user?`)) return;
    try {
      await resetUserTestScore(getToken, userId, type);
      alert(`Reset ${type}-test score successfully`);
      loadUsers();
    } catch (err) {
      alert('Failed to reset: ' + err.message);
    }
  };

  const handleViewHistory = async (user) => {
    try {
      setSelectedUserForHistory(user);
      const history = await fetchUserTestHistory(getToken, user.user_id || user.id);
      setTestHistory(history);
      setHistoryModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch history:", err);
      alert("Failed to fetch test history");
    }
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
        testHistory={testHistory}
      />
    </div>
  );
};

export default UserManagement;
