import { useState, useEffect } from 'react';
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
import FormInput from '@/components/admin/formFields/FormInput';
import FormCheckbox from '@/components/admin/formFields/FormCheckbox';
import { AVAILABLE_ITEMS } from '@/constants/itemTypes';

const LevelCategoryFormDialog = ({
  open,
  onOpenChange,
  editingLevelCategory,
  formData,
  onFormChange,
  onSave,
  saving = false,
}) => {
  // Parse item from formData
  const getSelectedItems = () => {
    if (!formData.item) return [];

    // ถ้าเป็น array อยู่แล้ว return เลย
    if (Array.isArray(formData.item)) {
      return formData.item;
    }

    // ถ้าเป็น string ให้ parse JSON
    if (typeof formData.item === 'string') {
      try {
        const parsed = JSON.parse(formData.item);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        return [];
      }
    }

    // ถ้าเป็น object เดียว
    return [formData.item];
  };

  const [selectedItems, setSelectedItems] = useState(getSelectedItems());

  // Update selectedItems when formData.item changes
  useEffect(() => {
    setSelectedItems(getSelectedItems());
  }, [formData.item]);

  const handleChange = (field, value) => {
    onFormChange({ ...formData, [field]: value });
  };

  const handleItemToggle = (itemValue) => {
    const newSelectedItems = selectedItems.includes(itemValue)
      ? selectedItems.filter(item => item !== itemValue)
      : [...selectedItems, itemValue];

    setSelectedItems(newSelectedItems);

    // Update formData.item
    handleChange('item', newSelectedItems.length > 0 ? newSelectedItems : null);
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

    // Validate item if item_enable is true
    if (formData.item_enable && (!selectedItems || selectedItems.length === 0)) {
      return { success: false, error: 'กรุณาเลือก item อย่างน้อย 1 รายการเมื่อเปิดใช้งาน Item Enable' };
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

          {formData.item_enable && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Items (เลือก item ที่ต้องการ enable)
              </label>
              <div className="space-y-2 border border-gray-300 rounded-md p-3 bg-gray-50">
                {AVAILABLE_ITEMS.map((item) => (
                  <label
                    key={item.value}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.value)}
                      onChange={() => handleItemToggle(item.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </label>
                ))}
                {selectedItems.length === 0 && (
                  <p className="text-xs text-gray-500 italic">
                    กรุณาเลือก item อย่างน้อย 1 รายการ
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                เลือก item ที่ต้องการให้สามารถวางได้ใน level ของ category นี้
              </p>
            </div>
          )}

          <div>
            <FormInput
              label="Block Key"
              name="block_key"
              value={formData.block_key || ''}
              onChange={(e) => handleChange('block_key', e.target.value)}
              placeholder='เช่น move_forward,hit'
            />
            <p className="text-xs text-gray-500 mt-1">
              สามารถกรอกแบบ comma-separated (เช่น: move_forward,hit) หรือ JSON format (เช่น: ["move_forward", "turn_left"])
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">หมายเหตุ:</span> สามารถอัปโหลดรูปภาพพื้นหลัง (Background Image) ได้หลังจากสร้างหมวดหมู่แล้ว โดยกดปุ่ม "รูปภาพ" ในตาราง
            </p>
          </div>
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

