import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { UserButton } from '@clerk/clerk-react';
import { fetchAllUsers, updateUserRole, deleteUser } from '../../services/adminService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Loader } from '@/components/ui/loader';
import { Search, Eye, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserDetailsModal from '@/components/shared/UserDetailsModal';
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog';

const UserManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getToken } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 5,
  });

  useEffect(() => {
    loadUsers();
  }, [page, searchQuery]);

  const loadUsers = async () => {
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
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(getToken, userId, newRole);
      await loadUsers();
    } catch (err) {
      alert('Failed to update user role');
    }
  };

  const handleViewDetails = (userItem) => {
    setSelectedUser(userItem);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteClick = (userItem) => {
    setUserToDelete(userItem);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      const userId = userToDelete.user_id || userToDelete.id;
      await deleteUser(getToken, userId);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      await loadUsers();
    } catch (err) {
      alert('Failed to delete user: ' + (err.message || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteDialogChange = (open) => {
    if (!deleting) {
      setDeleteDialogOpen(open);
      if (!open) {
        setUserToDelete(null);
      }
    }
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const totalPages = pagination.totalPages;
    const currentPage = page;

    // Always show first page
    if (currentPage > 3) {
      pages.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (currentPage > 4) {
        pages.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    // Show pages around current page
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Always show last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        pages.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4 p-4 border-t">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {pages}
            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageChange(Math.min(pagination.totalPages, page + 1))}
                className={page === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <p className="text-sm text-muted-foreground text-center">
          แสดง {((page - 1) * rowsPerPage) + 1}-{Math.min(page * rowsPerPage, pagination.total)} จาก {pagination.total} รายการ
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/admin')}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                <p className="text-gray-600 mt-1">Manage users and their roles</p>
              </div>
            </div>
            <UserButton afterSignOutUrl="/login" />
          </div>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">{error}</p>
            <p className="text-sm text-yellow-600 mt-2">
              Note: You may need to create the /api/users endpoint on the backend.
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="ค้นหาผู้ใช้ (username, email, name)..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader className="mx-auto mb-4" />
              <div className="text-lg text-gray-600">Loading users...</div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-lg text-gray-600">
                {searchQuery ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'No users found'}
              </div>
              {searchQuery && (
                <p className="text-sm text-gray-500 mt-2">
                  ลองค้นหาด้วยคำอื่น
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((userItem) => (
                      <tr key={userItem.user_id || userItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {userItem.profile_image || userItem.profileImageUrl ? (
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={
                                    (userItem.profile_image || userItem.profileImageUrl).startsWith('http')
                                      ? (userItem.profile_image || userItem.profileImageUrl)
                                      : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}${userItem.profile_image || userItem.profileImageUrl}`
                                  }
                                  alt=""
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500">
                                    {userItem.username?.[0] || userItem.email?.[0] || 'U'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {userItem.username || userItem.firstName || 'User'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{userItem.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={userItem.role === 'admin' ? 'secondary' : 'default'}>
                            {userItem.role || 'user'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={userItem.is_active !== false ? 'default' : 'destructive'}>
                            {userItem.is_active !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(userItem)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              ดูข้อมูล
                            </Button>
                            <select
                              value={userItem.role || 'user'}
                              onChange={(e) => handleRoleChange(userItem.user_id || userItem.id, e.target.value)}
                              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              
              {renderPagination()}
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
        description={
          <>
            คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้{' '}
            <strong>{userToDelete?.username || userToDelete?.email}</strong>?
            <br />
            <br />
            การกระทำนี้ไม่สามารถยกเลิกได้ และจะลบข้อมูลผู้ใช้ทั้งหมดรวมถึงข้อมูลที่เกี่ยวข้อง
          </>
        }
        deleting={deleting}
      />
    </div>
  );
};

export default UserManagement;
