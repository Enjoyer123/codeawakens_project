import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCreateLevelHint, useUpdateLevelHint } from '../../../services/hooks/useLevelHints';

const LevelHintFormDialog = ({ open, onOpenChange, editingHint, numericLevelId, onClose }) => {
  const createHintMutation = useCreateLevelHint();
  const updateHintMutation = useUpdateLevelHint();

  const [hintForm, setHintForm] = useState({
    title: '',
    description: '',
    display_order: 0,
    is_active: true,
  });
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (open) {
      if (editingHint) {
        setHintForm({
          title: editingHint.title || '',
          description: editingHint.description || '',
          display_order: editingHint.display_order || 0,
          is_active: editingHint.is_active !== undefined ? editingHint.is_active : true,
        });
      } else {
        setHintForm({
          title: '',
          description: '',
          display_order: 0,
          is_active: true,
        });
      }
      setSaveError(null);
    }
  }, [open, editingHint]);

  const handleSaveHint = useCallback(async () => {
    setSaveError(null);

    if (!hintForm.title.trim()) {
      setSaveError('กรุณากรอกชื่อ Hint');
      return;
    }

    const payload = {
      level_id: numericLevelId,
      title: hintForm.title.trim(),
      description: hintForm.description?.trim() || null,
      display_order: parseInt(hintForm.display_order) || 0,
      is_active: hintForm.is_active === true || hintForm.is_active === 'true',
    };

    try {
      if (editingHint) {
        await updateHintMutation.mutateAsync({
          hintId: editingHint.hint_id,
          data: payload
        });
      } else {
        await createHintMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setSaveError('ไม่สามารถบันทึก hint ได้: ' + (err.message || 'Unknown error'));
    }
  }, [editingHint, hintForm, numericLevelId, onClose, updateHintMutation, createHintMutation]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingHint ? 'แก้ไข Hint' : 'เพิ่ม Hint ใหม่'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {saveError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {saveError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={hintForm.title}
              onChange={e => setHintForm({ ...hintForm, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              rows={3}
              value={hintForm.description}
              onChange={e => setHintForm({ ...hintForm, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={hintForm.display_order}
                onChange={e =>
                  setHintForm({ ...hintForm, display_order: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                id="hint-active"
                type="checkbox"
                checked={hintForm.is_active}
                onChange={e =>
                  setHintForm({ ...hintForm, is_active: e.target.checked })
                }
              />
              <label htmlFor="hint-active" className="text-sm">
                Active
              </label>
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            * อัปโหลดรูปสำหรับ Hint จะเพิ่มในขั้นถัดไป (ตอนนี้รองรับข้อความก่อน)
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={handleSaveHint}>
            <Plus className="h-4 w-4 mr-2" />
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LevelHintFormDialog;
