// Ant DP State Table Component
// Shows a grid DP table (i, j) for applied dynamic levels like Ant Sugar Path.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getCurrentGameState, setCurrentGameState } from '../../gameutils/utils/gameUtils';

const AntDpStateTable = ({ currentLevel }) => {
  const [localTable, setLocalTable] = useState(null);
  const [steps, setSteps] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMs, setSpeedMs] = useState(250);
  const [currentStep, setCurrentStep] = useState(null);
  const resetIdRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [cellSize, setCellSize] = useState(44); // zoom-like control

  const applied = useMemo(() => currentLevel?.appliedData || null, [currentLevel]);
  const isAntDp = !!(applied && (applied.type === 'APPLIED_DYNAMIC_ANT' || applied.type === 'ANT_SUGAR_PATH' || applied.type === 'APPLIED_ANT'));
  const payload = applied?.payload || null;
  const sugarGrid = useMemo(() => (Array.isArray(payload?.sugarGrid) ? payload.sugarGrid : []), [payload]);
  const start = payload?.start || { r: 0, c: 0 };
  const goal = payload?.goal || null;

  useEffect(() => {
    // By default, Ant DP is rendered in Phaser (like N-Queen). Keep this React table as an optional debug panel.
    const debug = !!(payload?.visual?.showDebugTable);
    setIsVisible(isAntDp && debug);
  }, [isAntDp, payload]);

  const dims = useMemo(() => {
    const rows = Number(payload?.rows ?? 0) || (Array.isArray(sugarGrid) ? sugarGrid.length : 0) || 1;
    const cols = Number(payload?.cols ?? 0) || (Array.isArray(sugarGrid?.[0]) ? sugarGrid[0].length : 0) || 1;
    return { rows: Math.max(1, rows), cols: Math.max(1, cols) };
  }, [payload, sugarGrid]);

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const gameState = getCurrentGameState();
      const ds = gameState?.antDpState;
      if (!ds) return;

      if (ds.resetId !== undefined && ds.resetId !== resetIdRef.current) {
        resetIdRef.current = ds.resetId;
        setLocalTable(Array.from({ length: dims.rows }, () => Array.from({ length: dims.cols }, () => null)));
        setSteps(Array.isArray(ds.steps) ? ds.steps : []);
        setCursor(0);
        setCurrentStep(null);
        setIsPlaying(true);
        return;
      }

      if (Array.isArray(ds.steps)) setSteps(ds.steps);
    }, 100);
    return () => clearInterval(updateInterval);
  }, [dims.rows, dims.cols]);

  // Sync playback metadata into game state so the runner can wait reliably.
  useEffect(() => {
    if (!isVisible) return;
    try {
      const gameState = getCurrentGameState();
      const ds = gameState?.antDpState || {};
      setCurrentGameState({
        antDpState: {
          ...ds,
          playback: {
            ...(ds.playback || {}),
            cursor,
            isPlaying,
            speedMs,
            total: steps.length,
          }
        }
      });
    } catch (e) { /* ignore */ }
  }, [isVisible, cursor, isPlaying, speedMs, steps.length]);

  // Playback loop
  useEffect(() => {
    if (!isVisible) return;
    if (!isPlaying) return;
    if (!localTable) return;
    if (cursor >= steps.length) return;

    const timer = setTimeout(() => {
      const step = steps[cursor];
      if (!step) return;
      setLocalTable((prev) => {
        if (!prev) return prev;
        const next = prev.map(r => r.slice());
        // Only write when step.value is concrete (null is highlight/visit)
        if (step.value !== null && next[step.i] && step.j >= 0 && step.j < next[step.i].length) {
          next[step.i][step.j] = step.value;
        }
        return next;
      });
      setCurrentStep(step);
      setCursor((c) => c + 1);
    }, speedMs);

    return () => clearTimeout(timer);
  }, [isVisible, isPlaying, localTable, cursor, steps, speedMs]);

  if (!isVisible) return null;

  const safeTable = Array.isArray(localTable)
    ? localTable
    : Array.from({ length: dims.rows }, () => Array.from({ length: dims.cols }, () => null));

  return (
    <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-90 border-2 border-yellow-500 rounded-lg p-3 z-[9999] max-w-[860px]" style={{ position: 'absolute' }}>
      <div className="text-yellow-400 font-bold text-sm mb-2 flex items-center gap-2">
        <span>📊 Ant DP Table (sugar + dp)</span>
      </div>

      <div className="mb-2 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="px-2 py-1 rounded bg-yellow-600 hover:bg-yellow-700 text-black text-xs font-bold"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          onClick={() => {
            if (!localTable) return;
            if (cursor >= steps.length) return;
            const step = steps[cursor];
            if (!step) return;
            setLocalTable((prev) => {
              if (!prev) return prev;
              const next = prev.map(r => r.slice());
              if (step.value !== null && next[step.i] && step.j >= 0 && step.j < next[step.i].length) {
                next[step.i][step.j] = step.value;
              }
              return next;
            });
            setCurrentStep(step);
            setCursor((c) => c + 1);
            setIsPlaying(false);
          }}
          className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold"
        >
          ⏭ Step
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-200">speed</span>
          <input
            type="range"
            min="10"
            max="800"
            step="10"
            value={speedMs}
            onChange={(e) => setSpeedMs(Number(e.target.value))}
          />
          <span className="text-xs text-gray-300 font-mono">{speedMs}ms</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-200">cell</span>
          <input
            type="range"
            min="28"
            max="72"
            step="2"
            value={cellSize}
            onChange={(e) => setCellSize(Number(e.target.value))}
          />
          <span className="text-xs text-gray-300 font-mono">{cellSize}px</span>
        </div>
        <div className="text-xs text-gray-300 font-mono">
          {Math.min(cursor, steps.length)} / {steps.length}
        </div>
      </div>

      {currentStep && (
        <div className="mb-2 text-xs text-gray-200">
          <span className="text-yellow-300 font-mono">
            cell: [{currentStep.i}][{currentStep.j}] = {currentStep.value === null ? '·' : String(currentStep.value)}
          </span>
          {currentStep.meta?.from && (
            <span className="ml-2 text-gray-300 font-mono">
              from: {String(currentStep.meta.from)}
            </span>
          )}
        </div>
      )}

      <div className="bg-gray-800 rounded p-2 overflow-auto max-h-[420px]">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="border border-gray-700 px-2 py-1 text-gray-200 bg-gray-900 sticky top-0">i \\ j</th>
              {Array.from({ length: dims.cols }, (_, j) => (
                <th key={j} className="border border-gray-700 px-2 py-1 text-blue-200 bg-gray-900 sticky top-0">{j}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {safeTable.map((row, i) => (
              <tr key={i}>
                <td className="border border-gray-700 px-2 py-1 text-gray-200 bg-gray-900 whitespace-nowrap">{i}</td>
                {row.map((cell, j) => {
                  const isActive = currentStep && currentStep.i === i && currentStep.j === j;
                  const dpDisplay = (cell === null || cell === undefined) ? '·' : String(cell);
                  const sugar = (sugarGrid?.[i] && typeof sugarGrid[i][j] !== 'undefined') ? sugarGrid[i][j] : null;
                  const isStart = Number(start?.r) === i && Number(start?.c) === j;
                  const isGoal = goal ? (Number(goal?.r) === i && Number(goal?.c) === j) : (i === dims.rows - 1 && j === dims.cols - 1);

                  let arrow = '';
                  if (isActive && currentStep?.meta?.from) {
                    const from = String(currentStep.meta.from);
                    if (from === 'top') arrow = '↑';
                    else if (from === 'left') arrow = '←';
                    else if (from === 'diag') arrow = '↖';
                    else arrow = '•';
                  }

                  return (
                    <td
                      key={j}
                      className={[
                        "border border-gray-700 p-0 align-top",
                        isActive ? "bg-yellow-300 text-black" : "bg-gray-800 text-gray-100",
                      ].join(' ')}
                      style={{ width: cellSize, minWidth: cellSize, height: cellSize }}
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center leading-tight">
                        <div className="flex items-center gap-1">
                          {isStart && <span className={isActive ? "text-black text-[10px] font-bold" : "text-green-300 text-[10px] font-bold"}>S</span>}
                          {isGoal && <span className={isActive ? "text-black text-[10px] font-bold" : "text-red-300 text-[10px] font-bold"}>G</span>}
                          {arrow && <span className={isActive ? "text-black text-[10px] font-bold" : "text-yellow-300 text-[10px] font-bold"}>{arrow}</span>}
                        </div>
                        <div className={isActive ? "text-black text-[10px] font-mono opacity-80" : "text-gray-300 text-[10px] font-mono opacity-80"}>
                          {sugar === null ? ' ' : `s:${String(sugar)}`}
                        </div>
                        <div className={isActive ? "text-black text-[12px] font-mono font-bold" : "text-white text-[12px] font-mono font-bold"}>
                          {dpDisplay}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AntDpStateTable;


