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

const VictoryConditionFormDialog = ({
  open,
  onOpenChange,
  editingVictoryCondition,
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
    if (!formData.type?.trim()) {
      return { success: false, error: 'กรุณากรอก Type' };
    }
    if (!formData.description?.trim()) {
      return { success: false, error: 'กรุณากรอก Description' };
    }
    if (!formData.check?.trim()) {
      return { success: false, error: 'กรุณากรอก Check' };
    }

    const result = await onSave();
    return result;
  };

  const dialogTitle = editingVictoryCondition
    ? 'แก้ไขเงื่อนไขชัยชนะ'
    : 'เพิ่มเงื่อนไขชัยชนะใหม่';
  const dialogDescription = editingVictoryCondition
    ? 'แก้ไขข้อมูลเงื่อนไขชัยชนะ'
    : 'กรอกข้อมูลเงื่อนไขชัยชนะใหม่';

  const dialogContentClassName = 'max-w-2xl max-h-[90vh] overflow-y-auto';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogContentClassName}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <FormInput
            label="Type"
            name="type"
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            placeholder="เช่น reach_goal"
            required
          />
          <FormInput
            label="Description"
            name="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="เช่น ไปถึง Node เป้าหมาย"
            required
          />
          <FormInput
            label="Check"
            name="check"
            value={formData.check}
            onChange={(e) => handleChange('check', e.target.value)}
            placeholder="เช่น goalReached"
            required
          />
          <FormCheckbox
            label="Available"
            name="is_available"
            checked={formData.is_available}
            onChange={(e) => handleChange('is_available', e.target.checked)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSaveClick} disabled={saving}>
            {editingVictoryCondition ? 'บันทึกการแก้ไข' : 'เพิ่มเงื่อนไขชัยชนะ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VictoryConditionFormDialog;

