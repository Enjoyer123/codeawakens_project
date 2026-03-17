import { useState, useCallback } from 'react';

import { toast } from 'sonner';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import PaginationControls from '@/components/shared/pagination/PaginationControls';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import NotificationFormDialog from '@/components/admin/addEditDialog/NotificationFormDialog';
import NotificationTable from '@/components/admin/notification/NotificationTable';
import { usePagination } from '@/hooks/usePagination';

import {
    useUpdateNotification,
    useDeleteNotification,
    useNotifications
} from '@/services/hooks/useNotifications';

import PageError from '@/components/shared/Error/PageError';

const NotificationManagement = () => {
    const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);
    const [searchQuery, setSearchQuery] = useState('');

    // TanStack Query Hooks
    const {
        data: notificationsData,
        isLoading: loading,
        isError,
        error: queryError
    } = useNotifications(page, rowsPerPage, searchQuery);

    if (isError) {
        return <PageError message={queryError?.message} title="Failed to load notifications" />;
    }

    const notifications = notificationsData?.notifications || [];
    const pagination = notificationsData?.pagination || {
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
    };

    // Mutations
    const { mutateAsync: updateNotificationAsync } = useUpdateNotification();
    const { mutateAsync: deleteNotificationAsync, isPending: deleting } = useDeleteNotification();

    // Notification form states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingNotification, setEditingNotification] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);


    const handleSearchChange = useCallback((value) => {
        setSearchQuery(value);
        handlePageChange(1);
    }, [handlePageChange]);

    const handleOpenDialog = useCallback((notification = null) => {
        setEditingNotification(notification);
        setDialogOpen(true);
    }, []);

    const handleCloseDialog = useCallback(() => {
        setDialogOpen(false);
        setEditingNotification(null);
    }, []);

    const handleDeleteClick = useCallback((item) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!itemToDelete) return;

        try {
            await deleteNotificationAsync(itemToDelete.notification_id);
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            toast.success('ลบแจ้งเตือนสำเร็จ');
        } catch (err) {
            console.error(err);
            toast.error('ไม่สามารถลบแจ้งเตือนได้: ' + (err.message || 'Unknown error'));
        }
    }, [itemToDelete, deleteNotificationAsync]);

    const handleDeleteDialogChange = useCallback((open) => {
        if (!deleting) {
            setDeleteDialogOpen(open);
            if (!open) {
                setItemToDelete(null);
            }
        }
    }, [deleting]);

    const handleSend = async (notification) => {
        try {
            // "Send" essentially means setting active to true
            await updateNotificationAsync({
                notificationId: notification.notification_id,
                notificationData: {
                    ...notification,
                    is_active: true
                }
            });
            toast.success('ส่งแจ้งเตือนสำเร็จ');
        } catch (err) {
            console.error("Failed to send notification:", err);
            toast.error('ส่งแจ้งเตือนไม่สำเร็จ: ' + (err.message || 'Unknown error'));
        }
    };



    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <AdminPageHeader
                    title="Notification Management"
                    subtitle="จัดการการแจ้งเตือน"
                    onAddClick={() => handleOpenDialog()}
                    addButtonText="เพิ่มแจ้งเตือน"
                />

                <SearchInput
                    defaultValue={searchQuery}
                    onSearch={handleSearchChange}
                    placeholder="ค้นหาแจ้งเตือน..."
                />

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {loading ? (
                        <LoadingState message="Loading notifications..." />
                    ) : notifications.length === 0 ? (
                        <EmptyState
                            message="ไม่พบข้อมูลการแจ้งเตือน"
                            searchQuery={searchQuery}
                        />
                    ) : (
                        <>
                            <NotificationTable
                                notifications={notifications}
                                onEdit={handleOpenDialog}
                                onDelete={handleDeleteClick}
                                onSend={handleSend}
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

                <NotificationFormDialog
                    open={dialogOpen}
                    onOpenChange={handleCloseDialog}
                    editingNotification={editingNotification}
                />

                <DeleteConfirmDialog
                    open={deleteDialogOpen}
                    onOpenChange={handleDeleteDialogChange}
                    onConfirm={handleDeleteConfirm}
                    itemName={itemToDelete?.title}
                    title="ยืนยันการลบแจ้งเตือน"
                    deleting={deleting}
                />
            </div>
        </div>
    );
};
export default NotificationManagement;
