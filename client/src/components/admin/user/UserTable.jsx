import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2, FileText, ClipboardList } from 'lucide-react';
import { getImageUrlSafe } from '@/utils/imageUtils';

const UserTable = ({ users, onRoleChange, onViewDetails, onViewHistory, onDelete, onResetScore }) => {
  const tableHeaderClassName =
    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const tableCellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
  const actionsCellClassName = 'px-6 py-4 whitespace-nowrap text-sm font-medium';
  const selectClassName =
    'border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
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
              userItem.email?.[0] || 'U'; // Fallback initial

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
                <td className={tableCellClassName}>{userItem.email}</td>
                <td className={tableCellClassName}>
                  <Badge variant={userItem.role === 'admin' ? 'secondary' : 'default'}>
                    {userItem.role || 'user'}
                  </Badge>
                </td>
                <td className={tableCellClassName}>
                  <Badge variant={userItem.is_active !== false ? 'default' : 'destructive'}>
                    {userItem.is_active !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className={actionsCellClassName}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(userItem)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      ดูข้อมูล
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewHistory(userItem)}
                      title="View Test Results"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <ClipboardList className="h-4 w-4 mr-2" />
                      ผลสอบ
                    </Button>
                    <select
                      value={userItem.role || 'user'}
                      onChange={(e) =>
                        onRoleChange(userItem.user_id || userItem.id, e.target.value)
                      }
                      className={selectClassName}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(userItem)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onResetScore(userItem.user_id, 'pre')}
                        className="text-[10px] h-6 px-2 text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                        title="Reset Pre-Test Score"
                      >
                        Reset Pre
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onResetScore(userItem.user_id, 'post')}
                        className="text-[10px] h-6 px-2 text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                        title="Reset Post-Test Score"
                      >
                        Reset Post
                      </Button>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
