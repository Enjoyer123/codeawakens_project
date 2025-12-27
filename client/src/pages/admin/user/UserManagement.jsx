import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { UserButton } from '@clerk/clerk-react';
import { fetchAllUsers, updateUserRole, deleteUser, resetUserTestScore, fetchUserTestHistory } from '../../../services/adminService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2, FileText } from 'lucide-react';
import UserTestResultModal from '@/components/admin/modals/UserTestResultModal';
import UserDetailsModal from '@/components/shared/userDetailProfile/UserDetailsModal';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import PaginationControls from '@/components/shared/pagination/PaginationControls';
import { LoadingState, EmptyState } from '@/components/admin/tableStates/DataTableStates';
import { usePagination } from '@/hooks/usePagination';
import { getImageUrlSafe } from '@/utils/imageUtils';
import { createDeleteErrorMessage } from '@/utils/errorHandler';

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
      if(!window.confirm(`Are you sure you want to reset the ${type}-test score for this user?`)) return;
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

  const tableHeaderClassName =
    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const tableCellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
  const actionsCellClassName = 'px-6 py-4 whitespace-nowrap text-sm font-medium';
  const searchPlaceholder = 'ค้นหาผู้ใช้ (username, email, name)...';
  const selectClassName =
    'border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title="User Management"
          subtitle="Manage users and their roles"
          rightContent={<UserButton afterSignOutUrl="/login" />}
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
          value={searchQuery}
          onChange={handleSearchChange}
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
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={tableHeaderClassName}>User</th>
                      <th className={tableHeaderClassName}>Email</th>
                      <th className={tableHeaderClassName}>Role</th>
                      <th className={tableHeaderClassName}>Status</th>
                      <th className={tableHeaderClassName}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((userItem) => {
                      const profileImageUrl = getImageUrlSafe(
                        userItem.profile_image || userItem.profileImageUrl
                      );
                      const userName = userItem.username || userItem.firstName || 'User';
                      const userInitial = userItem.username?.[0] ||
                        userItem.email?.[0] || 'U';

                      return (
                        <tr key={userItem.user_id || userItem.id} className="hover:bg-gray-50">
                          <td className={tableCellClassName}>
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {profileImageUrl ? (
                                  <img
                                    className="h-10 w-10 rounded-full"
                                    src={profileImageUrl}
                                    alt=""
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-500">{userInitial}</span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {userName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className={tableCellClassName}>
                            {userItem.email}
                          </td>
                          <td className={tableCellClassName}>
                            <Badge variant={userItem.role === 'admin' ? 'secondary' : 'default'}>
                              {userItem.role || 'user'}
                            </Badge>
                          </td>
                          <td className={tableCellClassName}>
                            <Badge
                              variant={userItem.is_active !== false ? 'default' : 'destructive'}
                            >
                              {userItem.is_active !== false ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className={actionsCellClassName}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(userItem)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                ดูข้อมูล
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewHistory(userItem)}
                                title="View Test Results"
                              >
                                <FileText className="h-4 w-4 text-blue-600" />
                              </Button>
                              <select
                                value={userItem.role || 'user'}
                                onChange={(e) => handleRoleChange(
                                  userItem.user_id || userItem.id,
                                  e.target.value
                                )}
                                className={selectClassName}
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(userItem)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <div className="flex flex-col gap-1">
                                <Button variant="ghost" size="xs" onClick={() => handleResetScore(userItem.user_id, 'pre')} className="text-xs h-6">Reset Pre</Button>
                                <Button variant="ghost" size="xs" onClick={() => handleResetScore(userItem.user_id, 'post')} className="text-xs h-6">Reset Post</Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
