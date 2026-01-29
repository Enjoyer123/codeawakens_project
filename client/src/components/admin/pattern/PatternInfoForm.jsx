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
  bigO,
  setBigO,
  isEditMode,
  patternLoaded,
  disabled = false
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
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
          />
        </div>

        <div className="relative">
          <Label htmlFor="bigO">Big-O Complexity (ไม่บังคับ)</Label>
          <select
            id="bigO"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            value={bigO || ''}
            onChange={(e) => setBigO(e.target.value || '')}
            disabled={disabled}
          >
            <option value="">-- ไม่ระบุ --</option>
            <option value="constant">O(1) - constant</option>
            <option value="log_n">O(log n) - logarithmic</option>
            <option value="n">O(n) - linear</option>
            <option value="n_log_n">O(n log n)</option>
            <option value="n2">O(n²) - quadratic</option>
            <option value="n3">O(n³) - cubic</option>
            <option value="pow2_n">O(2ⁿ) - exponential</option>
            <option value="factorial">O(n!) - factorial</option>
          </select>
        </div>

      </div>
    </div>
  );
};

export default PatternInfoForm;
