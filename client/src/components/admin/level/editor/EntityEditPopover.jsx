import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EntityEditPopover = ({ entity, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (entity && isOpen) {
      setFormData(entity.data || {});
    }
  }, [entity, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (entity) {
      onSave(entity, formData);
    }
    onClose();
  };

  if (!entity) return null;

  const renderFields = () => {
    switch (entity.type) {
      case 'monster':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="name">ชื่อ Monster</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="hp">พลังชีวิต (HP)</Label>
                <Input
                  id="hp"
                  type="number"
                  value={formData.hp || 0}
                  onChange={(e) => handleChange('hp', Number(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="damage">พลังโจมตี</Label>
                <Input
                  id="damage"
                  type="number"
                  value={formData.damage || 0}
                  onChange={(e) => handleChange('damage', Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="detectionRange">ระยะมองเห็น</Label>
              <Input
                id="detectionRange"
                type="number"
                value={formData.detectionRange || 60}
                onChange={(e) => handleChange('detectionRange', Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label>ชนิด Monster</Label>
              <Select
                value={formData.type || 'vampire_1'}
                onValueChange={(val) => handleChange('type', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกชนิด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vampire_1">Vampire 1</SelectItem>
                  <SelectItem value="vampire_2">Vampire 2</SelectItem>
                  <SelectItem value="vampire_3">Vampire 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case 'coin':
        return (
          <div className="grid gap-2">
            <Label htmlFor="value">มูลค่าเหรียญ (คะแนน/เงิน)</Label>
            <Input
              id="value"
              type="number"
              value={formData.value || 0}
              onChange={(e) => handleChange('value', Number(e.target.value))}
            />
          </div>
        );

      case 'people':
        return (
          <div className="grid gap-2">
            <Label htmlFor="personName">ชื่อ NPC / ตัวละคร</Label>
            <Input
              id="personName"
              value={formData.personName || ''}
              onChange={(e) => handleChange('personName', e.target.value)}
            />
          </div>
        );

      case 'node':
        return (
          <div className="grid gap-2">
            <Label>ข้อมูลอัปเดตสำหรับ Node {entity.id}</Label>
            <p className="text-sm text-gray-500">
              ฟีเจอร์นี้สงวนไว้สำหรับการปรับแต่ง Node ในอนาคต
            </p>
          </div>
        );

      default:
        return <p>ไม่สามารถแก้ไข Object ชนิด นี้ได้</p>;
    }
  };

  const getTitle = () => {
    switch (entity.type) {
      case 'monster': return `แก้ไข Monster (ID: ${entity.data.id || 'N/A'})`;
      case 'coin': return `ตั้งค่า Coin (ID: ${entity.data.id || 'N/A'})`;
      case 'people': return `แก้ไข NPC (ID: ${entity.data.id || 'N/A'})`;
      case 'node': return `Node Info (ID: ${entity.id})`;
      default: return 'แก้ไข Object';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {renderFields()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            บันทึกการเปลี่ยนแปลง
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EntityEditPopover;
