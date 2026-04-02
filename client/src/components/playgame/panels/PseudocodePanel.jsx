import React, { useMemo, useRef, useEffect } from 'react';
import { buildPseudocodeLines, findPseudocodeLine } from '../../../gameutils/shared/hint/pseudoMatcher';

import Editor, { useMonaco } from '@monaco-editor/react';

// Removed hardcoded getPseudoHeader. The header is now defined by the admin in PseudocodeEditor.

const PseudocodePanel = ({ pattern, matchedSteps = 0, selectedBlockType = null, currentLevel = null }) => {
  const monaco = useMonaco();
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);

  const allLines = useMemo(
    () => buildPseudocodeLines(pattern, matchedSteps),
    [pattern, matchedSteps]
  );

  const fullText = useMemo(() => {
    return allLines.map(l => l.text).join('\n');
  }, [allLines]);

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
      // Offset line number based on array
      const lineNum = activeLineIndex + 1; // Monaco is 1-indexed

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
