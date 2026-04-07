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
import FormSelect from '@/components/admin/formFields/FormSelect';
import FormCheckbox from '@/components/admin/formFields/FormCheckbox';
import FormTextarea from '@/components/admin/formFields/FormTextarea';
import { useCreateReward, useUpdateReward } from '@/services/hooks/useRewards';

const rewardTypes = [
  { value: 'badge', label: 'Badge' }
];

const RewardFormDialog = ({
  open,
  onOpenChange,
  editingReward,
  levels = [],
}) => {
  // Mutations
  const { mutateAsync: createRewardAsync } = useCreateReward();
  const { mutateAsync: updateRewardAsync } = useUpdateReward();

  // Internal Form State
  const [formData, setFormData] = useState({
    level_id: '',
    reward_type: 'badge',
    reward_name: '',
    description: '',
    required_score: 0,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Sync state when dialog opens or editingReward changes
  useEffect(() => {
    if (open) {
      setError(null);
      if (editingReward) {
        setFormData({
          level_id: editingReward.level_id.toString(),
          reward_type: editingReward.reward_type,
          reward_name: editingReward.reward_name,
          description: editingReward.description || '',
          required_score: editingReward.required_score,
        });
      } else {
        setFormData({
          level_id: '',
          reward_type: 'badge',
          reward_name: '',
          description: '',
          required_score: 0,
        });
      }
    }
  }, [open, editingReward]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = async () => {
    setError(null);
    try {
      setSaving(true);

      const payload = {
        ...formData,
        level_id: parseInt(formData.level_id),
        required_score: parseInt(formData.required_score),
      };

      if (editingReward) {
        await updateRewardAsync({
          rewardId: editingReward.reward_id,
          rewardData: payload
        });
        toast.success('อัปเดตรางวัลสำเร็จ');
      } else {
        await createRewardAsync(payload);
        toast.success('เพิ่มรางวัลสำเร็จ');
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'บันทึกรางวัลไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
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

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}

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
          <FormInput
            label="Required Score"
            name="required_score"
            type="number"
            min="0"
            value={formData.required_score}
            onChange={(e) => handleChange('required_score', parseInt(e.target.value) || 0)}
            required
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

