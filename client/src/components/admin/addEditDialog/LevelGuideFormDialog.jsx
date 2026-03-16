import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCreateGuide, useUpdateGuide } from '../../../services/hooks/useLevelGuides';

const LevelGuideFormDialog = ({ open, onOpenChange, editingGuide, numericLevelId, onClose }) => {
  const createGuideMutation = useCreateGuide();
  const updateGuideMutation = useUpdateGuide();

  const [guideForm, setGuideForm] = useState({
    title: '',
    description: '',
    display_order: 0,
    is_active: true,
  });
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (open) {
      if (editingGuide) {
        setGuideForm({
          title: editingGuide.title || '',
          description: editingGuide.description || '',
          display_order: editingGuide.display_order || 0,
          is_active: editingGuide.is_active !== undefined ? editingGuide.is_active : true,
        });
      } else {
        setGuideForm({
          title: '',
          description: '',
          display_order: 0,
          is_active: true,
        });
      }
      setSaveError(null);
    }
  }, [open, editingGuide]);

  const handleSaveGuide = useCallback(async () => {
    setSaveError(null);

    if (!guideForm.title.trim()) {
      setSaveError('กรุณากรอกชื่อ Guide (Title)');
      return;
    }

    const formData = {
      level_id: numericLevelId,
      title: guideForm.title.trim(),
      description: guideForm.description?.trim() || null,
      display_order: parseInt(guideForm.display_order) || 0,
      is_active: guideForm.is_active === true || guideForm.is_active === 'true',
    };

    try {
      if (editingGuide) {
        await updateGuideMutation.mutateAsync({
          guideId: editingGuide.guide_id,
          data: formData
        });
      } else {
        await createGuideMutation.mutateAsync(formData);
      }
      onClose();
    } catch (err) {
      setSaveError('ไม่สามารถบันทึก guide ได้: ' + (err.message || 'Unknown error'));
    }
  }, [guideForm, editingGuide, numericLevelId, onClose, updateGuideMutation, createGuideMutation]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingGuide ? 'แก้ไข Guide' : 'เพิ่ม Guide ใหม่'}
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
              value={guideForm.title}
              onChange={e => setGuideForm({ ...guideForm, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              rows={3}
              value={guideForm.description}
              onChange={e => setGuideForm({ ...guideForm, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={guideForm.display_order}
                onChange={e => setGuideForm({ ...guideForm, display_order: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                id="guide-active"
                type="checkbox"
                checked={guideForm.is_active}
                onChange={e => setGuideForm({ ...guideForm, is_active: e.target.checked })}
              />
              <label htmlFor="guide-active" className="text-sm">Active</label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={handleSaveGuide}>
            <Plus className="h-4 w-4 mr-2" />
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LevelGuideFormDialog;
