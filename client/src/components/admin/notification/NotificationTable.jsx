import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Send } from 'lucide-react';
import { formatDate } from '@/utils/formatters'; // Assuming this exists or I'll use simple format

const NotificationTable = ({ notifications, onEdit, onDelete, onSend }) => {
    const tableHeaderClassName =
        'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
    const tableCellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
    const actionsCellClassName = 'px-6 py-4 whitespace-nowrap text-sm font-medium';

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className={tableHeaderClassName}>ID</th>
                        <th className={tableHeaderClassName}>Title</th>
                        <th className={tableHeaderClassName}>Message</th>
                        <th className={tableHeaderClassName}>Created By</th>
                        <th className={tableHeaderClassName}>Expires At</th>
                        <th className={tableHeaderClassName}>Status</th>
                        <th className={tableHeaderClassName}>Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {notifications.map((notification) => (
                        <tr key={notification.notification_id} className="hover:bg-gray-50">
                            <td className={tableCellClassName}>{notification.notification_id}</td>
                            <td className={`${tableCellClassName} font-medium`}>
                                {notification.title}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                {notification.message}
                            </td>
                            <td className={tableCellClassName}>
                                {notification.creator?.username || '-'}
                            </td>
                            <td className={tableCellClassName}>
                                {notification.expires_at ? new Date(notification.expires_at).toLocaleDateString() : '-'}
                            </td>
                            <td className={tableCellClassName}>
                                <Badge variant={notification.is_active ? 'default' : 'secondary'}>
                                    {notification.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </td>
                            <td className={actionsCellClassName}>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => onSend(notification)} title="Send">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => onEdit(notification)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onDelete(notification)}
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
    );
};

export default NotificationTable;
