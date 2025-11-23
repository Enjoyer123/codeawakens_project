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
  formData,
  onFormChange,
  onSave,
  saving = false,
}) => {
  const handleChange = (field, value) => {
    onFormChange({ ...formData, [field]: value });
  };

  const handleSaveClick = async () => {
    const result = await onSave();
    return result;
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
            placeholder="🏭 ไม้เท้าเก่า"
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
            <FormInput
              label="Emoji"
              name="emoji"
              value={formData.emoji || ''}
              onChange={(e) => handleChange('emoji', e.target.value)}
              placeholder="🏭"
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

