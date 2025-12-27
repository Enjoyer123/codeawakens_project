// Subset Sum State Table Component
// Shows DP table steps (i, j) for Subset Sum in a controlled, step-by-step playback UI.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getCurrentGameState, setCurrentGameState } from '../../gameutils/utils/gameUtils';

// NOTE: we intentionally avoid any "jump to end" behavior for UX.
// The runner can request faster playback by setting subsetSumState.playback.requestedSpeedMs / requestedIsPlaying.

const SubsetSumStateTable = ({ currentLevel }) => {
  const [localTable, setLocalTable] = useState(null);
  const [steps, setSteps] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMs, setSpeedMs] = useState(250);
  const [currentStep, setCurrentStep] = useState(null);
  const resetIdRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const subsetSumData = useMemo(() => {
    return currentLevel?.subsetSumData || null;
  }, [currentLevel]);

  useEffect(() => {
    setIsVisible(!!subsetSumData);
  }, [subsetSumData]);

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const gameState = getCurrentGameState();
      const ss = gameState?.subsetSumState;
      if (!ss) return;

      if (ss.resetId !== undefined && ss.resetId !== resetIdRef.current) {
        resetIdRef.current = ss.resetId;
        const warriors = Array.isArray(subsetSumData?.warriors) ? subsetSumData.warriors : [];
        const targetSum = Number(subsetSumData?.target_sum ?? 0) || 0;
        const rows = Math.max(1, warriors.length);
        const cols = Math.max(1, targetSum + 1);
        setLocalTable(Array.from({ length: rows }, () => Array.from({ length: cols }, () => null)));
        setSteps(Array.isArray(ss.steps) ? ss.steps : []);
        setCursor(0);
        setCurrentStep(null);
        // Always resume playback on a new run so Victory-wait works consistently
        setIsPlaying(true);
        return;
      }

      if (Array.isArray(ss.steps)) setSteps(ss.steps);

      const pb = ss?.playback;

      // Handle playback control requests from runner (e.g. accelerate to finish before victory)
      if (pb && (pb.requestedSpeedMs !== undefined || pb.requestedIsPlaying !== undefined)) {
        const nextSpeed = pb.requestedSpeedMs !== undefined ? Number(pb.requestedSpeedMs) : null;
        const nextIsPlaying = pb.requestedIsPlaying !== undefined ? !!pb.requestedIsPlaying : null;

        if (nextSpeed !== null && Number.isFinite(nextSpeed) && nextSpeed > 0) setSpeedMs(nextSpeed);
        if (nextIsPlaying !== null) setIsPlaying(nextIsPlaying);

        try {
          setCurrentGameState({
            subsetSumState: {
              ...ss,
              playback: {
                ...(pb || {}),
                requestedSpeedMs: undefined,
                requestedIsPlaying: undefined,
              }
            }
          });
        } catch (e) { /* ignore */ }
      }
    }, 100);
    return () => clearInterval(updateInterval);
  }, [subsetSumData]);

  // Sync playback metadata into game state so the runner can wait/jump reliably.
  useEffect(() => {
    if (!isVisible) return;
    try {
      const gameState = getCurrentGameState();
      const ss = gameState?.subsetSumState || {};
      setCurrentGameState({
        subsetSumState: {
          ...ss,
          playback: {
            ...(ss.playback || {}),
            cursor,
            isPlaying,
            speedMs,
            total: steps.length,
          }
        }
      });
    } catch (e) { /* ignore */ }
  }, [isVisible, cursor, isPlaying, speedMs, steps.length]);

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
        // Only write to the table when the step has a concrete boolean value.
        // If step.value is null, it's a "visit/highlight" step only.
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

  if (!isVisible || !subsetSumData) return null;

  const warriors = Array.isArray(subsetSumData.warriors) ? subsetSumData.warriors : [];
  const targetSum = Number(subsetSumData.target_sum ?? 0) || 0;
  const rows = Math.max(1, warriors.length);
  const cols = Math.max(1, targetSum + 1);
  const safeTable = Array.isArray(localTable) ? localTable : Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));

  return (
    <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-90 border-2 border-yellow-500 rounded-lg p-3 z-[9999] max-w-[520px]" style={{ position: 'absolute' }}>
      <div className="text-yellow-400 font-bold text-sm mb-2 flex items-center gap-2">
        <span>📊 Subset Sum Table (i, sum)</span>
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
            min="50"
            max="800"
            step="50"
            value={speedMs}
            onChange={(e) => setSpeedMs(Number(e.target.value))}
          />
          <span className="text-xs text-gray-300 font-mono">{speedMs}ms</span>
        </div>
        <div className="text-xs text-gray-300 font-mono">
          {Math.min(cursor, steps.length)} / {steps.length}
        </div>
      </div>

      {currentStep && (
        <div className="mb-2 text-xs text-gray-200">
          <span className="text-yellow-300 font-mono">
            cell: [{currentStep.i}][{currentStep.j}] = {currentStep.value === null ? '·' : (currentStep.value ? 'T' : 'F')}
          </span>
        </div>
      )}

      <div className="bg-gray-800 rounded p-2 overflow-auto max-h-[260px]">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="border border-gray-700 px-2 py-1 text-gray-200 bg-gray-900 sticky top-0">i \\ sum</th>
              {Array.from({ length: cols }, (_, j) => (
                <th key={j} className="border border-gray-700 px-2 py-1 text-blue-200 bg-gray-900 sticky top-0">
                  {j}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {safeTable.map((row, i) => (
              <tr key={i}>
                <td className="border border-gray-700 px-2 py-1 text-gray-200 bg-gray-900 whitespace-nowrap">
                  {i}: {String(warriors[i] ?? '')}
                </td>
                {row.map((cell, j) => {
                  const isActive = currentStep && currentStep.i === i && currentStep.j === j;
                  const display = cell === null || cell === undefined ? '·' : (cell ? 'T' : 'F');
                  return (
                    <td
                      key={j}
                      className={[
                        "border border-gray-700 px-2 py-1 text-center font-mono min-w-[26px]",
                        isActive ? "bg-yellow-300 text-black font-bold" : "bg-gray-800 text-gray-100",
                      ].join(' ')}
                    >
                      {display}
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

export default SubsetSumStateTable;


