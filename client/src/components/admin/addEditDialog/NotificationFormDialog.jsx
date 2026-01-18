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

const NotificationFormDialog = ({
    open,
    onOpenChange,
    editingNotification,
    formData,
    onFormChange,
    onSave,
    saving = false,
}) => {
    const handleChange = (field, value) => {
        onFormChange({ ...formData, [field]: value });
    };

    const handleSaveClick = async () => {
        // Client-side validation
        if (!formData.title?.trim()) {
            return { success: false, error: 'กรุณากรอกหัวข้อแจ้งเตือน' };
        }
        // Note: Message is mostly required but let's allow empty if needed, logic depends on requirement. 
        // Assuming simple title/message.

        const result = await onSave();
        return result;
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

