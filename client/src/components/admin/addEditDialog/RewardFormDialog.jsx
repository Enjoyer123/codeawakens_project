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
import FormSelect from '@/components/admin/formFields/FormSelect';
import FormCheckbox from '@/components/admin/formFields/FormCheckbox';
import FormTextarea from '@/components/admin/formFields/FormTextarea';

const rewardTypes = [
  { value: 'weapon', label: 'Weapon' },
  { value: 'block', label: 'Block' },
  { value: 'badge', label: 'Badge' },
  { value: 'experience', label: 'Experience' },
  { value: 'coin', label: 'Coin' },
];

const RewardFormDialog = ({
  open,
  onOpenChange,
  editingReward,
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

  const dialogTitle = editingReward ? 'แก้ไขรางวัล' : 'เพิ่มรางวัลใหม่';
  const dialogDescription = editingReward
    ? 'แก้ไขข้อมูลรางวัล'
    : 'กรอกข้อมูลรางวัลใหม่';

  const dialogContentClassName = 'max-w-4xl max-h-[90vh] overflow-y-auto';
  const gridClassName = 'grid grid-cols-2 gap-4';
  const noteClassName = 'text-xs text-gray-500 mt-1';
  const noteText = 'หมายเหตุ: สามารถอัปโหลดรูปภาพได้หลังจากสร้าง reward แล้ว โดยกดปุ่ม "รูปภาพ" ในตาราง';

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
          <div className={gridClassName}>
            <FormSelect
              label="Level"
              name="level_id"
              value={formData.level_id}
              onChange={(e) => handleChange('level_id', e.target.value)}
              options={levelOptions}
              placeholder="เลือกด่าน"
              required
            />
            <FormSelect
              label="Reward Type"
              name="reward_type"
              value={formData.reward_type}
              onChange={(e) => handleChange('reward_type', e.target.value)}
              options={rewardTypes}
              required
            />
          </div>
          <FormInput
            label="Reward Name"
            name="reward_name"
            value={formData.reward_name}
            onChange={(e) => handleChange('reward_name', e.target.value)}
            placeholder="ชื่อรางวัล"
            required
          />
          <FormInput
            label="Description"
            name="description"
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="คำอธิบายรางวัล"
          />
          <div>
            <FormTextarea
              label="Reward Data (JSON)"
              name="reward_data"
              value={formData.reward_data || ''}
              onChange={(e) => handleChange('reward_data', e.target.value)}
              placeholder='{"weapon_id": 1, "combat_power": 10}'
              rows={4}
              textareaClassName="font-mono"
            />
            <p className={noteClassName}>Format: JSON object (optional)</p>
          </div>
          <FormInput
            label="Required Score"
            name="required_score"
            type="number"
            min="0"
            value={formData.required_score}
            onChange={(e) => handleChange('required_score', parseInt(e.target.value) || 0)}
            required
          />
          <FormCheckbox
            label="Is Automatic"
            name="is_automatic"
            checked={formData.is_automatic}
            onChange={(e) => handleChange('is_automatic', e.target.checked)}
          />
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500">{noteText}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSaveClick} disabled={saving}>
            {editingReward ? 'บันทึก' : 'เพิ่ม'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RewardFormDialog;

