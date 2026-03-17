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
import FormSelect from '@/components/admin/formFields/FormSelect';
import { useCreateWeapon, useUpdateWeapon } from '@/services/hooks/useWeapons';

const weaponTypes = [
  { value: 'melee', label: 'Melee' },
  { value: 'ranged', label: 'Ranged' },
  { value: 'magic', label: 'Magic' },
  { value: 'special', label: 'Special' },
];

const WeaponFormDialog = ({
  open,
  onOpenChange,
  editingWeapon,
}) => {
  // Mutations
  const { mutateAsync: createWeaponAsync } = useCreateWeapon();
  const { mutateAsync: updateWeaponAsync } = useUpdateWeapon();

  // Internal Form State
  const [formData, setFormData] = useState({
    weapon_key: '',
    weapon_name: '',
    description: '',
    combat_power: 0,
    weapon_type: 'melee',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Sync state when dialog opens or editingWeapon changes
  useEffect(() => {
    if (open) {
      setError(null);
      if (editingWeapon) {
        setFormData({
          weapon_key: editingWeapon.weapon_key,
          weapon_name: editingWeapon.weapon_name,
          description: editingWeapon.description || '',
          combat_power: editingWeapon.combat_power || 0,
          weapon_type: editingWeapon.weapon_type,
        });
      } else {
        setFormData({
          weapon_key: '',
          weapon_name: '',
          description: '',
          combat_power: 0,
          weapon_type: 'melee',
        });
      }
    }
  }, [open, editingWeapon]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = async () => {
    setError(null);
    try {
      setSaving(true);
      if (editingWeapon) {
        await updateWeaponAsync({
          weaponId: editingWeapon.weapon_id,
          weaponData: formData
        });
      } else {
        await createWeaponAsync(formData);
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'บันทึกอาวุธไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const dialogTitle = editingWeapon ? 'แก้ไขอาวุธ' : 'เพิ่มอาวุธใหม่';
  const dialogDescription = editingWeapon
    ? 'แก้ไขข้อมูลอาวุธ'
    : 'กรอกข้อมูลอาวุธใหม่';

  const dialogContentClassName = 'max-w-2xl max-h-[90vh] overflow-y-auto';
  const gridClassName = 'grid grid-cols-2 gap-4';
  const disabledNoteClassName = 'text-xs text-gray-500 mt-1';

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
          <div>
            <FormInput
              label="Weapon Key"
              name="weapon_key"
              value={formData.weapon_key}
              onChange={(e) => handleChange('weapon_key', e.target.value)}
              placeholder="stick, sword, magic_sword"
              disabled={!!editingWeapon}
              required
            />
            {editingWeapon && (
              <p className={disabledNoteClassName}>
                ไม่สามารถแก้ไขได้หลังจากสร้างแล้ว
              </p>
            )}
          </div>
          <FormInput
            label="Weapon Name"
            name="weapon_name"
            value={formData.weapon_name}
            onChange={(e) => handleChange('weapon_name', e.target.value)}
            placeholder="มือเปล่า"
            required
          />
          <FormInput
            label="Description"
            name="description"
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="อาวุธพื้นฐานสำหรับผู้เริ่มต้น"
          />
          <div className={gridClassName}>
            <FormInput
              label="Combat Power"
              name="combat_power"
              type="number"
              value={formData.combat_power}
              onChange={(e) => handleChange('combat_power', parseInt(e.target.value) || 0)}
            />
          </div>
          <FormSelect
            label="Weapon Type"
            name="weapon_type"
            value={formData.weapon_type}
            onChange={(e) => handleChange('weapon_type', e.target.value)}
            options={weaponTypes}
            required
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSaveClick} disabled={saving}>
            {editingWeapon ? 'บันทึก' : 'เพิ่ม'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WeaponFormDialog;

