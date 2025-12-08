import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const PatternInfoForm = ({
  patternName,
  setPatternName,
  patternDescription,
  setPatternDescription,
  weaponId,
  setWeaponId,
  isEditMode,
  patternLoaded
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">ข้อมูลรูปแบบคำตอบ</h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="patternName">ชื่อรูปแบบ *</Label>
          <Input
            id="patternName"
            value={patternName || ''}
            onChange={(e) => setPatternName(e.target.value)}
            placeholder="เช่น: ใช้ loop เพื่อเก็บเหรียญ"
          />
          {isEditMode && !patternName && !patternLoaded && (
            <p className="text-xs text-gray-500 mt-1">กำลังโหลดข้อมูล...</p>
          )}
          {isEditMode && patternLoaded && (
            <p className="text-xs text-green-500 mt-1">✅ ข้อมูลถูกโหลดแล้ว (patternName: {patternName || 'ว่าง'})</p>
          )}
        </div>

        <div>
          <Label htmlFor="patternDescription">คำอธิบาย</Label>
          <Textarea
            id="patternDescription"
            value={patternDescription || ''}
            onChange={(e) => setPatternDescription(e.target.value)}
            placeholder="อธิบายรูปแบบคำตอบ..."
            rows={3}
          />
        </div>

        {/* ระบบจะประเมินอัตโนมัติเสมอ */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>ระบบประเมินอัตโนมัติ:</strong> ระบบจะประเมินระดับรูปแบบคำตอบอัตโนมัติตามประเภทด่านและบล็อกที่ใช้
          </p>
        </div>

        <div>
          <Label htmlFor="weaponId">อาวุธ (ไม่บังคับ)</Label>
          <Input
            id="weaponId"
            type="number"
            value={weaponId || ''}
            onChange={(e) => setWeaponId(e.target.value)}
            placeholder="ID อาวุธ"
          />
        </div>
      </div>
    </div>
  );
};

export default PatternInfoForm;
