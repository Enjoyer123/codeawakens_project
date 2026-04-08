import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import FormInput from '@/components/admin/formFields/FormInput';
import FormCheckbox from '@/components/admin/formFields/FormCheckbox';
import { useCreateNotification, useUpdateNotification } from '@/services/hooks/useNotifications';

const NotificationFormDialog = ({
    open,
    onOpenChange,
    editingNotification,
}) => {
    // Mutations
    const { mutateAsync: createNotificationAsync } = useCreateNotification();
    const { mutateAsync: updateNotificationAsync } = useUpdateNotification();

    // Internal Form State
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        expires_at: '',
        is_active: false,
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Sync state when dialog opens or editingNotification changes
    useEffect(() => {
        if (open) {
            setError(null);
            if (editingNotification) {
                // Format date for datetime-local input (YYYY-MM-DDThh:mm)
                let expiresAtStr = '';
                if (editingNotification.expires_at) {
                    const d = new Date(editingNotification.expires_at);
                    const offset = d.getTimezoneOffset() * 60000;
                    expiresAtStr = new Date(d.getTime() - offset).toISOString().slice(0, 16);
                }

                setFormData({
                    title: editingNotification.title,
                    message: editingNotification.message || '',
                    expires_at: expiresAtStr,
                    is_active: editingNotification.is_active,
                });
            } else {
                setFormData({
                    title: '',
                    message: '',
                    expires_at: '',
                    is_active: false,
                });
            }
        }
    }, [open, editingNotification]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSaveClick = async () => {
        // Client-side validation
        setError(null);
        if (!formData.title?.trim()) {
            setError('กรุณากรอกหัวข้อแจ้งเตือน');
            return;
        }
        
        try {
            setSaving(true);
            if (editingNotification) {
                const res = await updateNotificationAsync({
                    notificationId: editingNotification.notification_id,
                    notificationData: formData
                });
        toast.success(res?.message || 'อัปเดตแจ้งเตือนสำเร็จ');
            } else {
                const res = await createNotificationAsync(formData);
        toast.success(res?.message || 'สร้างแจ้งเตือนสำเร็จ');
            }
            onOpenChange(false);
        } catch (err) {
            console.error(err);
            setError(err.message || 'บันทึกแจ้งเตือนไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    const dialogTitle = editingNotification ? 'แก้ไขแจ้งเตือน' : 'เพิ่มแจ้งเตือนใหม่';
    const dialogDescription = editingNotification
        ? 'แก้ไขข้อมูลการแจ้งเตือน'
        : 'กรอกข้อมูลการแจ้งเตือนใหม่';

    const dialogContentClassName = 'max-w-xl max-h-[90vh] overflow-y-auto';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={dialogContentClassName}>
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                    <DialogDescription>{dialogDescription}</DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm border border-red-200">
                        {error}
                    </div>
                )}

                <div className="space-y-4 py-4">
                    <FormInput
                        label="หัวข้อ (Title)"
                        name="title"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="หัวข้อการแจ้งเตือน"
                        required
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            ข้อความ (Message)
                        </label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.message || ''}
                            onChange={(e) => handleChange('message', e.target.value)}
                            placeholder="รายละเอียดข้อความ"
                        />
                    </div>

                    <FormInput
                        label="วันหมดอายุ (Expires At)"
                        name="expires_at"
                        type="datetime-local"
                        value={formData.expires_at || ''}
                        onChange={(e) => handleChange('expires_at', e.target.value)}
                    />

                    <FormCheckbox
                        label="ใช้งาน (Active)"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={(e) => handleChange('is_active', e.target.checked)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        ยกเลิก
                    </Button>
                    <Button onClick={handleSaveClick} disabled={saving}>
                        {editingNotification ? 'บันทึกการแก้ไข' : 'สร้างแจ้งเตือน'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default NotificationFormDialog;

