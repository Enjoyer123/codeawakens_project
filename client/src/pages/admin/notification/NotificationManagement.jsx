import { useState, useCallback, useEffect } from 'react';
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
    fetchAllNotifications,
    createNotification,
    updateNotification,
    deleteNotification
} from '@/services/notificationService';

const NotificationManagement = () => {
    const { getToken } = useAuth();
    const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 0,
        page: 1,
        limit: 10,
    });

    // Notification form states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingNotification, setEditingNotification] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        expires_at: '',
        is_active: true,
    });
    const [saveError, setSaveError] = useState(null);

    // Delete states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchAllNotifications(getToken, page, rowsPerPage, searchQuery);
            setNotifications(data.notifications || []);
            setPagination(data.pagination || {
                total: 0,
                totalPages: 0,
                page: 1,
                limit: rowsPerPage,
            });
        } catch (err) {
            setError('Failed to load notifications. ' + (err.message || ''));
            setNotifications([]);
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

    // Load data when page or search changes
    useEffect(() => {
        loadData();
    }, [loadData]);

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
                // Adjust to local time string format manually or use library if strictly consistent
                // Simple slice for ISO might be UTC, so be careful. 
                // For simplicity here, let's assume we just want to set it if it exists.
                // Correct implementation usually handles timezone offset.
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
                is_active: true,
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
            is_active: true,
        });
    }, []);

    const handleSave = useCallback(async () => {
        setSaveError(null);

        try {
            if (editingNotification) {
                await updateNotification(getToken, editingNotification.notification_id, formData);
            } else {
                await createNotification(getToken, formData);
            }
            handleCloseDialog();
            await loadData();
            return { success: true };
        } catch (err) {
            const errorMessage = 'ไม่สามารถบันทึกข้อมูลได้: ' + (err.message || 'Unknown error');
            setSaveError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, [formData, editingNotification, getToken, handleCloseDialog, loadData]);

    const handleDeleteClick = useCallback((item) => {
        setItemToDelete(item);
        setDeleteError(null);
        setDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!itemToDelete) return;

        try {
            setDeleting(true);
            setDeleteError(null);
            await deleteNotification(getToken, itemToDelete.notification_id);
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            await loadData();
        } catch (err) {
            const errorMessage = createDeleteErrorMessage('notification', err);
            setDeleteError(errorMessage);
        } finally {
            setDeleting(false);
        }
    }, [itemToDelete, getToken, loadData]);

    const handleDeleteDialogChange = useCallback((open) => {
        if (!deleting) {
            setDeleteDialogOpen(open);
            if (!open) {
                setItemToDelete(null);
                setDeleteError(null);
            }
        }
    }, [deleting]);

    const handleSend = (notification) => {
        // Placeholder for sending notification functionality
        console.log("Send notification clicked:", notification);
        alert(`Send feature for notification "${notification.title}" is not implemented yet.`);
    };

    const getDeleteDescription = (title) =>
        `คุณแน่ใจหรือไม่ว่าต้องการลบแจ้งเตือน "${title}"? การกระทำนี้ไม่สามารถยกเลิกได้`;

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
