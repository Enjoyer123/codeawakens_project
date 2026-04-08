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
import { Input } from '@/components/ui/input';
import FormInput from '@/components/admin/formFields/FormInput';
import FormCheckbox from '@/components/admin/formFields/FormCheckbox';
import { AVAILABLE_ITEMS } from '@/constants/itemTypes';
import { useCreateLevelCategory, useUpdateLevelCategory } from '@/services/hooks/useLevelCategories';

const LevelCategoryFormDialog = ({
  open,
  onOpenChange,
  editingLevelCategory,

}) => {
  // Mutations
  const { mutateAsync: createCategoryAsync } = useCreateLevelCategory();
  const { mutateAsync: updateCategoryAsync } = useUpdateLevelCategory();

  // Internal Form State
  const [formData, setFormData] = useState({
    category_name: '',
    description: '',
    item_enable: false,
    testcase_enable: false,
    pseudocode_enable: false,
    item: null,
    block_key: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Sync state when dialog opens or editingLevelCategory changes
  useEffect(() => {
    if (open) {
      setError(null);
      if (editingLevelCategory) {
        // Convert block_key to comma-separated format for easier editing
        let blockKeyDisplay = '';
        if (editingLevelCategory.block_key) {
          if (Array.isArray(editingLevelCategory.block_key)) {
            blockKeyDisplay = editingLevelCategory.block_key.join(', ');
          } else if (typeof editingLevelCategory.block_key === 'object') {
            blockKeyDisplay = JSON.stringify(editingLevelCategory.block_key, null, 2);
          } else {
            blockKeyDisplay = String(editingLevelCategory.block_key);
          }
        }

        const items = editingLevelCategory.category_items?.map(ci => ci.item_type) || [];

        setFormData({
          category_name: editingLevelCategory.category_name,
          description: editingLevelCategory.description || '',
          item_enable: items.length > 0,
          testcase_enable: editingLevelCategory.testcase_enable || false,
          pseudocode_enable: editingLevelCategory.pseudocode_enable || false,
          item: items,
          block_key: blockKeyDisplay,
        });
      } else {
        setFormData({
          category_name: '',
          description: '',
          item_enable: false,
          testcase_enable: false,
          pseudocode_enable: false,
          item: null,
          block_key: '',
        });
      }
    }
  }, [open, editingLevelCategory]);
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
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    console.log('🟡 [LevelCategoryFormDialog] handleSaveClick: formData', formData);
    setError(null);
    // Client-side validation
    if (!formData.category_name?.trim()) {
      setError('กรุณากรอก Topic Name');
      return;
    }
    if (!formData.description?.trim()) {
      setError('กรุณากรอก Description');
      return;
    }

    // Validate item if item_enable is true
    if (formData.item_enable && (!selectedItems || selectedItems.length === 0)) {
      setError('กรุณาเลือก item อย่างน้อย 1 รายการเมื่อเปิดใช้งาน Item Enable');
      return;
    }

    try {
      setSaving(true);
      
      // Handle block_key - support both comma-separated and JSON format
      let blockKeyValue = null;
      if (formData.block_key && formData.block_key.trim()) {
        const trimmedValue = formData.block_key.trim();

        // Try to parse as JSON first
        try {
          blockKeyValue = JSON.parse(trimmedValue);
        } catch (jsonError) {
          // If not valid JSON, treat as comma-separated string
          const items = trimmedValue
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0);

          if (items.length > 0) {
            blockKeyValue = items;
          }
        }
      }

      // Handle item - ensure it's an array or null
      let itemValue = null;
      if (formData.item_enable && selectedItems) {
        if (Array.isArray(selectedItems)) {
          itemValue = selectedItems.length > 0 ? selectedItems : null;
        } else {
          itemValue = [selectedItems];
        }
      }

      const payload = {
        ...formData,
        category_name: formData.category_name.trim(),
        description: formData.description.trim(),
        item: itemValue,
        block_key: blockKeyValue,
      };

      if (editingLevelCategory) {
        await updateCategoryAsync({
          categoryId: editingLevelCategory.category_id,
          data: payload
        });
        toast.success('อัปเดตหัวข้อสำเร็จ');
      } else {
        await createCategoryAsync(payload);
        toast.success('เพิ่มหัวข้อสำเร็จ');
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถบันทึก topic ได้: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const dialogTitle = editingLevelCategory ? 'แก้ไขหัวข้อ' : 'เพิ่มหัวข้อใหม่';
  const dialogDescription = editingLevelCategory
    ? 'แก้ไขข้อมูลหัวข้อ'
    : 'กรอกข้อมูลหัวข้อใหม่';

  const dialogContentClassName = 'max-w-2xl max-h-[90vh] overflow-y-auto';


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
            label="Topic Name"
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


          <FormCheckbox
            label="Item Enable"
            name="item_enable"
            checked={formData.item_enable}
            onChange={(e) => handleChange('item_enable', e.target.checked)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormCheckbox
              label="Test Case Enable"
              name="testcase_enable"
              checked={formData.testcase_enable}
              onChange={(e) => handleChange('testcase_enable', e.target.checked)}
              description="เปิดให้สามารถจัดการ Test Case ในด่านภายใต้หัวข้อนี้"
            />

            <FormCheckbox
              label="Pseudocode Enable"
              name="pseudocode_enable"
              checked={formData.pseudocode_enable}
              onChange={(e) => handleChange('pseudocode_enable', e.target.checked)}
              description="เปิดให้สร้าง Pseudocode ได้ (จำกัด 1 Pattern ต่อด่าน)"
            />
          </div>

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

