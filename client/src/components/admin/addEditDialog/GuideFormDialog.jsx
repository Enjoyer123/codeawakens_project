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
import FormSelect from '@/components/admin/formFields/FormSelect';
import FormCheckbox from '@/components/admin/formFields/FormCheckbox';

const GuideFormDialog = ({
  open,
  onOpenChange,
  editingGuide,
  formData,
  onFormChange,
  onSave,
  levels = [],
  saving = false,
}) => {
  const handleChange = (field, value) => {
    onFormChange({ ...formData, [field]: value });
  };

  const handleSaveClick = async () => {
    const result = await onSave();
    return result;
  };

  const dialogTitle = editingGuide ? 'แก้ไขคำแนะนำ' : 'เพิ่มคำแนะนำใหม่';
  const dialogDescription = editingGuide
    ? 'แก้ไขข้อมูลคำแนะนำ'
    : 'กรอกข้อมูลคำแนะนำใหม่';

  const dialogContentClassName = 'max-w-2xl max-h-[90vh] overflow-y-auto';

  const levelOptions = levels.map((level) => ({
    value: level.level_id,
    label: `${level.level_name}${level.category ? ` (${level.category.category_name})` : ''}`,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogContentClassName}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <FormSelect
            label="Level"
            name="level_id"
            value={formData.level_id}
            onChange={(e) => handleChange('level_id', e.target.value)}
            options={levelOptions}
            placeholder="เลือกด่าน"
            required
          />
          <FormInput
            label="Title"
            name="title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="ชื่อคำแนะนำ"
            required
          />
          <FormInput
            label="Description"
            name="description"
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="คำอธิบายคำแนะนำ"
          />
          <FormInput
            label="Display Order"
            name="display_order"
            type="number"
            min="0"
            value={formData.display_order}
            onChange={(e) => handleChange('display_order', parseInt(e.target.value) || 0)}
          />
          <FormCheckbox
            label="Is Active"
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
            {editingGuide ? 'บันทึก' : 'เพิ่ม'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GuideFormDialog;

