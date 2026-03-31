import React, { useMemo, useRef, useEffect } from 'react';
import { buildPseudocodeLines, findPseudocodeLine } from '../../../gameutils/shared/hint/pseudoMatcher';

import Editor, { useMonaco } from '@monaco-editor/react';

const getPseudoHeader = (currentLevel) => {
  if (!currentLevel) return '';

  const funcName = currentLevel.function_name?.toUpperCase()
    || currentLevel.test_cases?.[0]?.function_name?.toUpperCase()
    || currentLevel.level_test_cases?.[0]?.function_name?.toUpperCase()
    || currentLevel.algo_data?.type?.toUpperCase()
    || '';

  let coreParams = '';

  if (['DFS', 'BFS', 'DIJ', 'PRIM', 'KRUSKAL'].includes(funcName)) {
    coreParams = ` * @param {Array} graph - โครงสร้างกราฟ (Adjacency List)
 * @param {Number} start - Node เริ่มต้น
 * @param {Number} goal - Node เป้าหมาย (ถ้ามี)
 * @param {Array} visited - ตัวแปรระบบ: รายการ Node ที่เคยแวะแล้ว`;
  } else if (funcName === 'SOLVE' || funcName === 'NQUEEN') {
    coreParams = ` * @param {Number} row - แถวปัจจุบันที่กำลังจะวางหมาก
 * @param {Array} board - ตัวแปรอ้างอิงระบบ: ตำแหน่งหมากควีน
 * @param {Number} n - ขนาดของกระดาน (NxN)`;
  } else if (funcName === 'COINCHANGE') {
    coreParams = ` * @param {Number} amount/monster_power - ยอดรวมหรือพลังชีวิตมอนสเตอร์
 * @param {Array} coins/warriors - รายการเหรียญหรือพลังนักรบแต่ละคน
 * @param {Number} index - (แบ็คแทร็ก) ตำแหน่งการค้นหาปัจจุบัน`;
  } else if (funcName === 'SUBSETSUM') {
    coreParams = ` * @param {Array} arr - รายการตัวเลขเป้าหมาย
 * @param {Number} target_sum - ผลรวมเป้าหมายที่ต้องการทอน/ตรวจสอบ
 * @param {Array} warriors - รายการอาร์เรย์ของนักรบ (ถ้าเล่นด่านต่อสู้)
 * @param {Number} n - จำนวนไอเทม/นักรบทั้งหมด`;
  } else if (funcName === 'KNAPSACK') {
    coreParams = ` * @param {Number} capacity - ความจุสูงสุด (เช่น น้ำหนักเป้)
 * @param {Array} weights - น้ำหนักของไอเทมแต่ละชิ้น
 * @param {Array} values - มูลค่าของไอเทมแต่ละชิ้น
 * @param {Number} n - จำนวนไอเทมทั้งหมด`;
  } else if (funcName === 'MAXCAPACITY' || funcName === 'EMEI') {
    coreParams = ` * @param {Number} tourists - จำนวนนักท่องเที่ยวทั้งหมด
 * @param {Number} start - Node เริ่มต้น (รถบัส)
 * @param {Number} end - Node สิ้นสุด (ยอดเขา)
 * @param {Array} edges - รายการเส้นทางเดินป่าเชื่อมต่อกัน
 * @param {Number} n - จำนวนจุดแวะพัก/โหนดทั้งหมด`;
  } else {
    coreParams = ` * @param {Object} input - ข้อมูล input ของด่าน
 * @param {Array} map - ตัวแปรอ้างอิงระบบ: แผนที่ (ถ้ามี)
 * @param {Array} warrior - ตัวแปรอ้างอิงระบบ: นักรบ (ถ้ามี)`;
  }

  return `/**
 * Function: ${funcName || 'Main'}
 * 
 * @param {*} primaryResult - ผลลัพธ์จากการรันระบบภาพเสมือน
 * @param {Array} testCases - Test Cases ของด่านจากแพลตฟอร์ม
 * @returns {Array} result - ผลลัพธ์ที่นำไปรันการแสดงผล
${coreParams}
 */\n\n`;
};

const PseudocodePanel = ({ pattern, matchedSteps = 0, selectedBlockType = null, currentLevel = null }) => {
  const monaco = useMonaco();
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);

  const allLines = useMemo(
    () => buildPseudocodeLines(pattern, matchedSteps),
    [pattern, matchedSteps]
  );

  const headerText = useMemo(() => getPseudoHeader(currentLevel), [currentLevel]);

  const fullText = useMemo(() => {
    return headerText + allLines.map(l => l.text).join('\n');
  }, [headerText, allLines]);

  const highlight = useMemo(() => {
    if (!selectedBlockType || !allLines.length) return null;
    return findPseudocodeLine(selectedBlockType, allLines);
  }, [selectedBlockType, allLines]);

  // หาว่าบรรทัดไหนถูกเลือกจริงๆ ใน flat array
  const activeLineIndex = useMemo(() => {
    if (!highlight) return -1;
    const idx = allLines.findIndex(
      (l) => l.stepIndex === highlight.stepIndex && l.lineIndex === highlight.lineIndex
    );
    return idx; // 0-indexed
  }, [highlight, allLines]);

  // ลบและอัปเดต highlight lines ใน Monaco
  useEffect(() => {
    if (!editorRef.current || !monaco) return;

    let newDecorations = [];

    if (activeLineIndex >= 0) {
      // Offset line number based on the dynamic header's line count
      const headerLineCount = headerText.split('\n').length - 1;
      const lineNum = activeLineIndex + 1 + headerLineCount; // Monaco is 1-indexed

      newDecorations = [
        {
          range: new monaco.Range(lineNum, 1, lineNum, 1),
          options: {
            isWholeLine: true,
            className: 'bg-yellow-400/20 shadow-[inset_4px_0_0_#facc15] transition-colors',
            inlineClassName: 'text-yellow-200 font-bold',
            linesDecorationsClassName: 'bg-yellow-400 opacity-80'
          }
        }
      ];

      // Auto scroll
      editorRef.current.revealLineInCenter(lineNum);
    }

    // อัปเดตไฮไลต์ (ถ้าเป็น [] มันจะเคลียร์อันเก่าทิ้งอัตโนมัติ)
    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, newDecorations);

  }, [activeLineIndex, monaco]);

  if (!allLines.length) return null;

  return (
    <div className="flex flex-col h-full bg-[#0d0b1e]/95 border-b border-purple-900/40 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-purple-900/40 bg-[#12103a]/80">
        <span className="text-[10px] font-bold tracking-widest text-purple-300 uppercase">
          Pseudocode
        </span>
        <div className="flex gap-1 ml-auto">
          {pattern?.hints?.map((_, i) => {
            const state = i < matchedSteps ? 'done' : i === matchedSteps ? 'active' : 'future';
            return (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${state === 'done' ? 'bg-emerald-400' : state === 'active' ? 'bg-yellow-300 animate-pulse' : 'bg-gray-700'
                  }`}
              />
            );
          })}
        </div>
      </div>

      {/* Monaco Editor สำหรับแสดง Pseudocode แบบสวยๆ */}
      <div className="flex-1 bg-[#0f111a] relative">
        <Editor
          height="100%"
          defaultLanguage="pascal"
          value={fullText}
          theme="vs-dark"
          options={{
            readOnly: true,
            fontSize: 12,
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'off',
            fontFamily: '"Fira Code", monospace',
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'none',
            matchBrackets: 'never',
            contextmenu: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true
          }}
          onMount={(editor, m) => {
            editorRef.current = editor;

            // ใช้ Theme เหมือนกับหน้าโค้ด เพื่อความกลมกลืน
            m.editor.defineTheme('pseudocode-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [],
              colors: {
                'editor.background': '#0f111a',
                'editorLineNumber.foreground': '#4f46e5',
                'editorLineNumber.activeForeground': '#a5b4fc',
              }
            });
            m.editor.setTheme('pseudocode-dark');
          }}
        />
      </div>
    </div>
  );
};

export default PseudocodePanel;
