import React, { useMemo, useRef, useEffect, useState } from 'react';
import { buildPseudocodeLines, findPseudocodeLine } from '../../../gameutils/shared/hint/pseudoMatcher';
import { ScrollText, ChevronUp } from 'lucide-react';

/**
 * PseudocodePanel — Visor Dropdown (Simple)
 * - กดปุ่ม Pseudocode หรือ กดที่ block → เปิด
 * - กดลูกศรหุบ → ปิด
 */

const PseudocodePanel = ({ pattern, matchedSteps = 0, selectedBlockType = null }) => {
  const [isOpen, setIsOpen] = useState(true);
  const highlightRef = useRef(null);

  // ─── Data ────────────────────────────────────────────────────────
  const allLines = useMemo(
    () => buildPseudocodeLines(pattern, matchedSteps),
    [pattern, matchedSteps]
  );

  // ดึง target analysis จาก hint สุดท้ายเพื่อใช้ diff กับ workspace (สำหรับ floating blocks)
  const targetAnalysis = useMemo(() => {
    if (!pattern?.hints?.length) return null;
    const lastHint = pattern.hints[pattern.hints.length - 1];
    return lastHint?._cachedAnalysis || null;
  }, [pattern]);

  const highlight = useMemo(() => {
    if (!selectedBlockType || !allLines.length) return null;
    const context = selectedBlockType.isFloating && targetAnalysis
      ? { targetAnalysis }
      : null;
    return findPseudocodeLine(selectedBlockType, allLines, context);
  }, [selectedBlockType, allLines, targetAnalysis]);

  const activeLineIndex = useMemo(() => {
    if (!highlight) return -1;
    return allLines.findIndex(
      (l) => l.stepIndex === highlight.stepIndex && l.lineIndex === highlight.lineIndex
    );
  }, [highlight, allLines]);

  // กดที่ block → เปิด panel อัตโนมัติ
  // useEffect(() => {
  //   if (activeLineIndex >= 0) setIsOpen(true);
  // }, [activeLineIndex]);

  // Auto-scroll highlighted line
  useEffect(() => {
    if (activeLineIndex >= 0 && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLineIndex]);

  if (!allLines.length) return null;

  // ─── Step dots ───────────────────────────────────────────────────
  const stepDots = pattern?.hints?.map((_, i) => {
    const state = i < matchedSteps ? 'done' : i === matchedSteps ? 'active' : 'future';
    return (
      <div
        key={i}
        className={`w-2 h-2 rounded-full transition-all duration-300 ${state === 'done'
          ? 'bg-emerald-400'
          : state === 'active'
            ? 'bg-yellow-400 animate-pulse'
            : 'bg-purple-900 border border-purple-700/50'
          }`}
      />
    );
  });

  // ─── ยุบ (Collapsed) ─────────────────────────────────────────────
  if (!isOpen) {
    return (
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <button
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto flex items-center gap-3 px-6 py-1.5 rounded-b-lg
            bg-black border-b border-x border-gray-700
            hover:bg-gray-900 transition-colors duration-200 shadow-lg cursor-pointer"
        >
          <ScrollText size={14} className="text-green-500" />
          <span className="text-[10px] font-bold tracking-widest text-gray-300 uppercase mt-0.5">
            Pseudocode
          </span>
          <div className="flex gap-1.5 items-center ml-2">{stepDots}</div>
        </button>
      </div>
    );
  }

  // ─── ขยาย (Expanded) ─────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes visorDrop {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        .visor-enter { animation: visorDrop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .pseudo-scrollbar::-webkit-scrollbar { width: 6px; }
        .pseudo-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .pseudo-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .pseudo-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>

      <div
        className="absolute top-0 left-0 right-0 z-20 w-full visor-enter"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="w-full bg-black border-b border-gray-700 flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-2 border-b border-gray-800 bg-gray-950 shrink-0">
            <div className="flex items-center gap-3">
              <ScrollText size={14} className="text-green-500" />
              <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mt-0.5">
                Pseudocode
              </span>
              <div className="flex gap-1.5 ml-3">{stepDots}</div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
              title="ซ่อน"
            >
              <ChevronUp size={16} />
            </button>
          </div>

          {/* Code */}
          <div className="max-h-[30vh] overflow-y-auto py-3 px-6 pseudo-scrollbar">
            <div className="font-mono text-[13px] leading-relaxed">
              {allLines.map((line, idx) => {
                const isActive = idx === activeLineIndex;
                const isEmpty = !line.text?.trim();

                return (
                  <div
                    key={idx}
                    ref={isActive ? highlightRef : null}
                    className={`flex items-start rounded
                      ${isActive ? 'bg-green-950 border-l-2 border-green-400' : 'border-l-2 border-transparent hover:bg-gray-900'}
                      ${isEmpty && !isActive ? 'h-4' : ''}
                    `}
                  >
                    <div className={`w-8 shrink-0 text-right pr-3 select-none text-[11px] pt-0.5
                      ${isActive ? 'text-green-400' : 'text-gray-600'}`}
                    >
                      {idx + 1}
                    </div>
                    <div className={`flex-1 whitespace-pre py-0.5
                      ${isActive ? 'text-green-300 font-semibold' : 'text-gray-200'}
                    `}>
                      {line.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default PseudocodePanel;
