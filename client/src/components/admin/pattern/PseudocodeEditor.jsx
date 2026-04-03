import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Wand2, Type, MessageSquarePlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Editor from '@monaco-editor/react';
import { generatePseudocodeFromWorkspace } from './pseudocodeGenerator';

/**
 * PseudocodeEditor (Monaco Edition)
 * ให้ Admin กรอก pseudocode ในแต่ละ Step พร้อม mapping กับ block.type
 */

// ─── Constants (สร้างครั้งเดียว ไม่ re-create ทุก render) ──────────
const MONACO_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 13,
  fontFamily: '"Fira Code", monospace',
  lineNumbersMinChars: 3,
  scrollBeyondLastLine: false,
  wordWrap: 'off',
  padding: { top: 8 },
  tabSize: 4,
  insertSpaces: true,
  autoIndent: 'none',
  detectIndentation: false,
};

// ─── MappingRow: memo component ลด re-render เมื่อแก้ type แค่แถวเดียว
const MappingRow = React.memo(({ line, index, onTypeChange }) => (
  <div
    className={`flex gap-3 items-center bg-white border border-gray-200 rounded-lg p-1.5 px-2 transition-all ${
      line.blockType ? 'border-l-4 border-l-blue-400' : 'hover:border-blue-300'
    }`}
  >
    <div className="w-8 shrink-0 text-center font-mono text-[11px] text-gray-400">
      {index + 1}
    </div>
    <div className="flex-1 overflow-hidden">
      <div className="font-mono text-[12px] text-gray-600 truncate opacity-70">
        {line.text || <span className="italic text-gray-300">(บรรทัดว่าง)</span>}
      </div>
    </div>
    <div className="w-[180px] shrink-0">
      <Input
        placeholder="เช่น controls_if"
        value={line.blockType || ''}
        onChange={(e) => onTypeChange(index, e.target.value)}
        className="h-8 text-[11px] font-mono border-gray-200 focus-visible:ring-blue-400 bg-blue-50/30 placeholder:text-gray-300"
      />
    </div>
  </div>
));

// ─── Main Component ────────────────────────────────────────────────
const PseudocodeEditor = ({ stepIndex, value = [], onChange, workspaceRef }) => {
  const [lines, setLines] = useState(Array.isArray(value) ? value : []);

  useEffect(() => {
    setLines(Array.isArray(value) ? value : []);
  }, [value]);

  // รวม Text จาก Array ให้เป็น String ก้อนเดียวสำหรับ Monaco
  const monacoValue = useMemo(() => lines.map(l => l.text).join('\n'), [lines]);

  // เมื่อพิมพ์ใน Monaco แทรกลบหรือเว้นบรรทัด ให้เช็ค Event เพื่อเลื่อน Block Type ด้วยความฉลาด
  const handleEditorChange = useCallback((newCode, event) => {
    let newTypes = [...lines.map(l => l.blockType || '')];

    if (event && event.changes) {
      // Sort changes in reverse order (bottom to top) to avoid shifting indexes during splice
      const sortedChanges = [...event.changes].sort((a, b) => b.range.startLineNumber - a.range.startLineNumber);

      sortedChanges.forEach(change => {
        const startIdx = change.range.startLineNumber - 1;
        const endIdx = change.range.endLineNumber - 1;
        const replacedCount = endIdx - startIdx + 1;
        const insertedLines = change.text.split('\n');
        const insertedCount = insertedLines.length;

        const affectedTypes = newTypes.slice(startIdx, startIdx + replacedCount);
        const firstNonEmptyType = affectedTypes.find(t => t !== '') || '';
        let typesToInsert = Array(insertedCount).fill('');

        if (replacedCount === 1) {
          // --- 1. SINGLE LINE SPLIT OR TYPE (ENTER / TYPING) ---
          if (insertedCount === 2 && change.text.trim() === '') {
            // Check if Enter at precisely the start of a non-empty line
            if (change.range.startColumn === 1) {
              // Push down: The original line's type moves to the new line
              typesToInsert = ['', firstNonEmptyType];
            } else {
              // Standard Enter: The first part keeps the type, new line is empty
              typesToInsert = [firstNonEmptyType, ''];
            }
          } else {
            // Typing characters or pasting: The base line holds the original type
            typesToInsert[0] = firstNonEmptyType;
          }
        } else {
          // --- 2. MULTI-LINE MERGE OR REPLACE (BACKSPACE / DELETE / PASTE-OVER) ---
          if (insertedCount > 0) {
            typesToInsert[0] = firstNonEmptyType;
          }
        }

        newTypes.splice(startIdx, replacedCount, ...typesToInsert);
      });
    }

    // Mapping กับ newCode อีกรอบเพื่อความชัวร์เรื่อง sync จำนวนบรรทัดขั้นสุดท้าย
    const newTextLines = (newCode || '').split('\n');
    const newObjects = newTextLines.map((text, i) => ({
      text,
      blockType: newTypes[i] || ''
    }));

    setLines(newObjects);
    onChange(newObjects);
  }, [lines, onChange]);

  // เมื่อแก้ Block Type ในช่องด้านล่าง — สร้าง object ใหม่แทน mutate โดยตรง
  const handleTypeChange = useCallback((index, newType) => {
    const newLines = lines.map((l, i) =>
      i === index ? { ...l, blockType: newType } : l
    );
    setLines(newLines);
    onChange(newLines);
  }, [lines, onChange]);

  // แทรกบรรทัด Comment เปล่าๆ แทรกไว้ด้านบนสุด (เพื่อไม่ให้ mapping ขยับพัง)
  const handleAddComment = useCallback(() => {
    const newLines = [{ text: '// พิมพ์คำอธิบาย...', blockType: '' }, ...lines];
    setLines(newLines);
    onChange(newLines);
  }, [lines, onChange]);

  // Auto-generate pseudocode จาก Blockly workspace
  const handleAutoGenerate = useCallback(() => {
    if (!workspaceRef?.current || !window.Blockly) {
      alert('ไม่พบ Workspace ปัจจุบัน');
      return;
    }

    const newLines = generatePseudocodeFromWorkspace(workspaceRef.current);

    if (newLines.length === 0) {
      alert('ไม่พบบล็อก โครงสร้าง หลักบนกระดานเลยครับ');
      return;
    }

    if (window.confirm(`สร้าง Pseudocode สำเร็จ (${newLines.length} บรรทัด)! ต้องการแทนที่ข้อมูลเดิมไหม?`)) {
      setLines(newLines);
      onChange(newLines);
    }
  }, [workspaceRef, onChange]);

  return (
    <div className="bg-white border rounded-xl shadow-sm flex flex-col h-full mt-4 mb-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b bg-gray-50/50 shrink-0">
        <div>
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 p-1 rounded-md">
              <Type size={18} />
            </span>
            Pseudocode Editor (Step {stepIndex + 1})
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">แก้โค้ดด้านบน แล้วใส่ Block Type ด้านล่าง</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddComment}
            className="gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm transition-all"
            title="เพิ่มบรรทัด Comment ด้านบนสุด"
          >
            <MessageSquarePlus size={14} />
            Add Comment
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoGenerate}
            className="gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 shadow-sm transition-all"
          >
            <Wand2 size={14} className="animate-pulse" />
            Auto-Gen จาก Block
          </Button>
        </div>
      </div>

      {/* Part 1: Monaco Code Editor */}
      <div className="border-b border-gray-200 h-[250px] shrink-0 relative bg-[#fffffe]">
        <div className="absolute top-0 left-0 right-0 bg-gray-100 px-3 py-1 border-b text-[10px] font-bold text-gray-500 flex justify-between z-10">
          <span>CODE EDITOR</span>
          <span className="font-normal">เขียนได้อย่างอิสระ (รองรับ Tab)</span>
        </div>
        <div className="pt-6 h-full">
          <Editor
            height="100%"
            defaultLanguage="pascal"
            value={monacoValue}
            onChange={handleEditorChange}
            options={MONACO_OPTIONS}
          />
        </div>
      </div>

      {/* Part 2: Block Type Mapping */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <div className="flex gap-3 px-2 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <div className="w-8 text-center shrink-0">#</div>
          <div className="flex-1">Pseudocode Preview</div>
          <div className="w-[180px] shrink-0">Block Type</div>
        </div>

        <div className="space-y-1.5 pb-8">
          {lines.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm italic border-2 border-dashed rounded-lg bg-white">
              พิมพ์โค้ดด้านบน หรือกด Auto-Gen เพื่อเริ่มการ Mapping
            </div>
          ) : (
            lines.map((line, idx) => (
              <MappingRow
                key={idx}
                line={line}
                index={idx}
                onTypeChange={handleTypeChange}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PseudocodeEditor;