import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormInput from '@/components/shared/FormInput';
import FormCheckbox from '@/components/shared/FormCheckbox';

const LevelCategoryFormDialog = ({
  open,
  onOpenChange,
  editingLevelCategory,
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
    if (!formData.category_name?.trim()) {
      return { success: false, error: 'กรุณากรอก Category Name' };
    }
    if (!formData.description?.trim()) {
      return { success: false, error: 'กรุณากรอก Description' };
    }
    if (!formData.difficulty_order || formData.difficulty_order < 1) {
      return { success: false, error: 'กรุณากรอก Difficulty Order (ต้องมากกว่า 0)' };
    }
    if (!formData.color_code?.trim()) {
      return { success: false, error: 'กรุณากรอก Color Code' };
    }

    const result = await onSave();
    return result;
  };

  const dialogTitle = editingLevelCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่';
  const dialogDescription = editingLevelCategory
    ? 'แก้ไขข้อมูลหมวดหมู่'
    : 'กรอกข้อมูลหมวดหมู่ใหม่';

  const dialogContentClassName = 'max-w-2xl max-h-[90vh] overflow-y-auto';
  const colorInputClassName = 'w-16 h-10';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogContentClassName}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <FormInput
            label="Category Name"
            name="category_name"
            value={formData.category_name}
            onChange={(e) => handleChange('category_name', e.target.value)}
            placeholder="เช่น Basic"
            required
          />
          <FormInput
            label="Description"
            name="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="เช่น เรียนรู้การเคลื่อนที่และการใช้คำสั่งพื้นฐาน"
            required
          />
          <FormInput
            label="Difficulty Order"
            name="difficulty_order"
            type="number"
            min="1"
            value={formData.difficulty_order}
            onChange={(e) => handleChange('difficulty_order', parseInt(e.target.value) || 1)}
            placeholder="เช่น 1"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color Code <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={formData.color_code}
                onChange={(e) => handleChange('color_code', e.target.value)}
                className={colorInputClassName}
              />
              <Input
                value={formData.color_code}
                onChange={(e) => handleChange('color_code', e.target.value)}
                placeholder="#4CAF50"
              />
            </div>
          </div>
          <FormCheckbox
            label="Item Enable"
            name="item_enable"
            checked={formData.item_enable}
            onChange={(e) => handleChange('item_enable', e.target.checked)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSaveClick} disabled={saving}>
            {editingLevelCategory ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LevelCategoryFormDialog;

