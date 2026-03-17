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
import FormInput from '@/components/admin/formFields/FormInput';
import FormCheckbox from '@/components/admin/formFields/FormCheckbox';
import { useUpdateVictoryCondition } from '@/services/hooks/useVictoryConditions';

const VictoryConditionFormDialog = ({
  open,
  onOpenChange,
  editingVictoryCondition,
}) => {
  // Mutations
  const { mutateAsync: updateVictoryConditionAsync } = useUpdateVictoryCondition();

  // Internal Form State
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    check: '',
    is_available: true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Sync state when dialog opens or editingVictoryCondition changes
  useEffect(() => {
    if (open) {
      setError(null);
      if (editingVictoryCondition) {
        setFormData({
          type: editingVictoryCondition.type,
          description: editingVictoryCondition.description || '',
          check: editingVictoryCondition.check || '',
          is_available: editingVictoryCondition.is_available,
        });
      } else {
        setFormData({
          type: '',
          description: '',
          check: '',
          is_available: true,
        });
      }
    }
  }, [open, editingVictoryCondition]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = async () => {
    // Client-side validation
    setError(null);
    if (!formData.type?.trim()) {
      setError('กรุณากรอก Type');
      return;
    }
    if (!formData.description?.trim()) {
      setError('กรุณากรอก Description');
      return;
    }
    if (!formData.check?.trim()) {
      setError('กรุณากรอก Check');
      return;
    }

    try {
      setSaving(true);
      
      const payload = {
        ...formData,
        type: formData.type.trim(),
        description: formData.description.trim(),
        check: formData.check.trim(),
      };

      if (editingVictoryCondition) {
        await updateVictoryConditionAsync({
          victoryConditionId: editingVictoryCondition.victory_condition_id,
          data: payload
        });
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'บันทึกเงื่อนไขชัยชนะไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
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

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}

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
            disabled={!!editingVictoryCondition}
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

