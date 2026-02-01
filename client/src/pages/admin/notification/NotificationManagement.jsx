import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import PaginationControls from '@/components/shared/pagination/PaginationControls';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import NotificationFormDialog from '@/components/admin/addEditDialog/NotificationFormDialog';
import NotificationTable from '@/components/admin/notification/NotificationTable';
import { usePagination } from '@/hooks/usePagination';
import { createDeleteErrorMessage } from '@/utils/errorHandler';
import {
    useNotifications,
    useCreateNotification,
    useUpdateNotification,
    useDeleteNotification
} from '@/services/hooks/useNotifications';

const NotificationManagement = () => {
    const { getToken } = useAuth();
    const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);
    const [searchQuery, setSearchQuery] = useState('');

    // TanStack Query Hooks
    const {
        data: notificationsData,
        isLoading: loading,
        isError,
        error: queryError
    } = useNotifications(page, rowsPerPage, searchQuery);

    const notifications = notificationsData?.notifications || [];
    const pagination = notificationsData?.pagination || {
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
    };

    // Mutations
    const { mutateAsync: createNotificationAsync } = useCreateNotification();
    const { mutateAsync: updateNotificationAsync } = useUpdateNotification();
    const { mutateAsync: deleteNotificationAsync, isPending: deleting } = useDeleteNotification();

    // Notification form states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingNotification, setEditingNotification] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        expires_at: '',
        is_active: false,
    });
    const [saveError, setSaveError] = useState(null);

    // Delete states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState(null);

    const handleSearchChange = useCallback((value) => {
        setSearchQuery(value);
        handlePageChange(1);
    }, [handlePageChange]);

    const handleOpenDialog = useCallback((notification = null) => {
        if (notification) {
            setEditingNotification(notification);
            // Format date for datetime-local input (YYYY-MM-DDThh:mm)
            let expiresAtStr = '';
            if (notification.expires_at) {
                const d = new Date(notification.expires_at);
                const offset = d.getTimezoneOffset() * 60000;
                expiresAtStr = new Date(d.getTime() - offset).toISOString().slice(0, 16);
            }

            setFormData({
                title: notification.title,
                message: notification.message || '',
                expires_at: expiresAtStr,
                is_active: notification.is_active,
            });
        } else {
            setEditingNotification(null);
            setFormData({
                title: '',
                message: '',
                expires_at: '',
                is_active: false,
            });
        }
        setSaveError(null);
        setDialogOpen(true);
    }, []);

    const handleCloseDialog = useCallback(() => {
        setDialogOpen(false);
        setEditingNotification(null);
        setSaveError(null);
        setFormData({
            title: '',
            message: '',
            expires_at: '',
            is_active: false,
        });
    }, []);

    const handleSave = useCallback(async () => {
        setSaveError(null);

        try {
            if (editingNotification) {
                await updateNotificationAsync({
                    notificationId: editingNotification.notification_id,
                    notificationData: formData
                });
            } else {
                await createNotificationAsync(formData);
            }
            handleCloseDialog();
            return { success: true };
        } catch (err) {
            const errorMessage = 'ไม่สามารถบันทึกข้อมูลได้: ' + (err.message || 'Unknown error');
            setSaveError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, [formData, editingNotification, updateNotificationAsync, createNotificationAsync, handleCloseDialog]);

    const handleDeleteClick = useCallback((item) => {
        setItemToDelete(item);
        setDeleteError(null);
        setDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!itemToDelete) return;

        try {
            setDeleteError(null);
            await deleteNotificationAsync(itemToDelete.notification_id);
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        } catch (err) {
            const errorMessage = createDeleteErrorMessage('notification', err);
            setDeleteError(errorMessage);
        }
    }, [itemToDelete, deleteNotificationAsync]);

    const handleDeleteDialogChange = useCallback((open) => {
        if (!deleting) {
            setDeleteDialogOpen(open);
            if (!open) {
                setItemToDelete(null);
                setDeleteError(null);
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
            // Optional: Show success toast
        } catch (err) {
            console.error("Failed to send notification:", err);
            alert('Failed to send notification: ' + (err.message || 'Unknown error'));
        }
    };

    const getDeleteDescription = (title) =>
        `คุณแน่ใจหรือไม่ว่าต้องการลบแจ้งเตือน "${title}"? การกระทำนี้ไม่สามารถยกเลิกได้`;

    const error = isError ? (queryError?.message || 'Failed to load notifications') : null;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <AdminPageHeader
                    title="Notification Management"
                    subtitle="จัดการการแจ้งเตือน"
                    onAddClick={() => handleOpenDialog()}
                    addButtonText="เพิ่มแจ้งเตือน"
                />

                <ErrorAlert message={error} />
                <ErrorAlert message={saveError} />
                <ErrorAlert message={deleteError} />

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
                    formData={formData}
                    onFormChange={setFormData}
                    onSave={handleSave}
                />

                <DeleteConfirmDialog
                    open={deleteDialogOpen}
                    onOpenChange={handleDeleteDialogChange}
                    onConfirm={handleDeleteConfirm}
                    title="ยืนยันการลบแจ้งเตือน"
                    description={getDeleteDescription(itemToDelete?.title)}
                    confirmText="ลบ"
                    cancelText="ยกเลิก"
                    isLoading={deleting}
                />
            </div>
        </div>
    );
};
export default NotificationManagement;
