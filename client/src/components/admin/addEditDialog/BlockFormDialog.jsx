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

const blockCategories = [
  { value: 'movement', label: 'Movement' },
  { value: 'logic', label: 'Logic' },
  { value: 'conditions', label: 'Conditions' },
  { value: 'loops', label: 'Loops' },
  { value: 'functions', label: 'Functions' },
  { value: 'variables', label: 'Variables' },
  { value: 'operators', label: 'Operators' },
];

const BlockFormDialog = ({
  open,
  onOpenChange,
  editingBlock,
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
    if (!formData.block_key?.trim()) {
      return { success: false, error: 'กรุณากรอก Block Key' };
    }
    if (!formData.block_name?.trim()) {
      return { success: false, error: 'กรุณากรอก Block Name' };
    }
    if (!formData.category) {
      return { success: false, error: 'กรุณาเลือก Category' };
    }

    const result = await onSave();
    return result;
  };

  const dialogTitle = editingBlock ? 'แก้ไขบล็อก' : 'เพิ่มบล็อกใหม่';
  const dialogDescription = editingBlock
    ? 'แก้ไขข้อมูลบล็อก'
    : 'กรอกข้อมูลบล็อกใหม่';

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
            label="Block Key"
            name="block_key"
            value={formData.block_key}
            onChange={(e) => handleChange('block_key', e.target.value)}
            placeholder="เช่น move_forward"
            required
          />
          <FormInput
            label="Block Name"
            name="block_name"
            value={formData.block_name}
            onChange={(e) => handleChange('block_name', e.target.value)}
            placeholder="เช่น moveForward"
            required
          />
          <FormInput
            label="Description"
            name="description"
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="คำอธิบายบล็อก"
          />
          <FormSelect
            label="Category"
            name="category"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            options={blockCategories}
            required
          />
          <FormInput
            label="Blockly Type"
            name="blockly_type"
            value={formData.blockly_type || ''}
            onChange={(e) => handleChange('blockly_type', e.target.value)}
            placeholder="เช่น move_forward"
          />
          <FormInput
            label="Syntax Example"
            name="syntax_example"
            value={formData.syntax_example || ''}
            onChange={(e) => handleChange('syntax_example', e.target.value)}
            placeholder="เช่น moveForward()"
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
            {editingBlock ? 'บันทึกการแก้ไข' : 'เพิ่มบล็อก'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BlockFormDialog;

