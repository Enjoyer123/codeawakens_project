import React, { useMemo, useRef, useEffect, useState } from 'react';
import { buildPseudocodeLines, findPseudocodeLine } from '../../../gameutils/shared/hint/pseudoMatcher';
import { ScrollText, ChevronUp, ChevronLeft } from 'lucide-react';

/**
 * PseudocodePanel — Visor Dropdown (Simple)
 * - กดปุ่ม Pseudocode หรือ กดที่ block → เปิด
 * - กดลูกศรหุบ → ปิด
 */

const PseudocodePanel = ({ pattern, matchedSteps = 0, selectedBlockType = null, difficulty = 'easy' }) => {
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
    const context = {
      targetAnalysis: targetAnalysis || null,
      difficulty
    };
    return findPseudocodeLine(selectedBlockType, allLines, context);
  }, [selectedBlockType, allLines, targetAnalysis, difficulty]);

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
      <div className="absolute top-0 bottom-0 left-0 z-20 flex items-center pointer-events-none">
        <button
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto flex flex-col items-center gap-2 px-1.5 py-6 rounded-r-lg
            bg-black border-r border-y border-gray-700
            hover:bg-gray-900 transition-colors duration-200 shadow-[4px_0_15px_rgba(0,0,0,0.5)] cursor-pointer"
        >
          <ScrollText size={16} className="text-green-500 mb-1" />
          <span
            className="text-[10px] font-bold tracking-widest text-gray-300 uppercase"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Pseudocode
          </span>
          <div className="flex flex-col gap-1.5 mt-2">{stepDots}</div>
        </button>
      </div>
    );
  }

  // ─── ขยาย (Expanded) ─────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes panelSlideOutLeft {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .panel-enter { animation: panelSlideOutLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .pseudo-scrollbar::-webkit-scrollbar { width: 6px; }
        .pseudo-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .pseudo-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .pseudo-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>

      <div
        className="absolute right-full z-[100] h-full w-[550px] overflow-x-auto panel-enter flex"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex-1 bg-black border-l border-r border-gray-700 flex flex-col h-full shadow-[-10px_0_30px_rgba(0,0,0,0.6)]">
          {/* Header */}
          <div className="flex items-center justify-start px-5 py-3 border-b border-gray-800 bg-gray-950 shrink-0">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
              title="ซ่อน"
            >
              <ChevronLeft size={18} className="rotate-180" /> {/* ปรับลูกศรให้ชี้ไปทางขวาเพื่อให้ความหมายว่าเก็บเข้าขวา */}
            </button>

            <div className="flex items-center gap-3">
              <ScrollText size={16} className="text-green-500" />
              <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mt-0.5">
                Pseudocode
              </span>
              <span className="text-[10px] font-mono bg-blue-900 border border-blue-500 text-blue-200 px-1.5 py-0.5 rounded ml-2">
                Diff: {difficulty}
              </span>
            </div>
          </div>

          {/* Code */}
          <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 py-4 px-6 pseudo-scrollbar">
            <div className="font-mono text-[14px] leading-loose min-w-max">
              {allLines.map((line, idx) => {
                const isActive = idx === activeLineIndex;

                let stateColor = 'text-gray-500';
                let bgClass = 'hover:bg-[#ffffff08]';
                let indicator = null;

                if (isActive) {
                  stateColor = 'text-white';
                  bgClass = 'bg-green-900 opacity-100 border-l-2 border-emerald-400 shadow-[inset_4px_0_0_0_rgba(52,211,153,1)]';
                } else if (line.isMatched) {
                  stateColor = 'text-gray-300';
                  bgClass = 'bg-[#ffffff05]';
                }

                return (
                  <div
                    key={idx}
                    ref={isActive ? highlightRef : null}
                    className={`relative flex px-3 py-1 -mx-3 rounded transition-colors duration-200 group ${bgClass}`}
                  >
                    <div className="w-8 shrink-0 text-right pr-4 text-gray-600 select-none">
                      {idx + 1}
                    </div>
                    {/* Prefix spacing for depth */}
                    <div className="flex-1 flex pointer-events-none">
                      {Array.from({ length: line.depth || 0 }).map((_, d) => (
                        <div key={d} className="w-6 border-l border-[#ffffff10] h-full" />
                      ))}
                      <div className={`whitespace-pre-wrap ${stateColor}`}>
                        {line.text}
                      </div>
                    </div>
                    {indicator}
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
