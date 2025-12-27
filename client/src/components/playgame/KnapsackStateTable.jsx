// Knapsack State Table Component
// Shows DP/Memo table (i, j) for Knapsack in real-time (similar to DijkstraStateTable)

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getCurrentGameState, setCurrentGameState } from '../../gameutils/utils/gameUtils';

// NOTE: we intentionally avoid any "jump to end" behavior for UX.
// The runner can request faster playback by setting knapsackState.playback.requestedSpeedMs / requestedIsPlaying.

const KnapsackStateTable = ({ currentLevel }) => {
  const [localTable, setLocalTable] = useState(null);
  const [steps, setSteps] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMs, setSpeedMs] = useState(250);
  const [currentStep, setCurrentStep] = useState(null);
  const resetIdRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const knapsackData = useMemo(() => {
    return currentLevel?.knapsackData || null;
  }, [currentLevel]);

  useEffect(() => {
    // Show only when knapsackData exists
    setIsVisible(!!knapsackData);
  }, [knapsackData]);

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const gameState = getCurrentGameState();
      const ks = gameState?.knapsackState;
      if (!ks) return;

      // Reset handling
      if (ks.resetId !== undefined && ks.resetId !== resetIdRef.current) {
        resetIdRef.current = ks.resetId;
        const items = Array.isArray(knapsackData?.items) ? knapsackData.items : [];
        const capacity = Number(knapsackData?.capacity ?? 0) || 0;
        const rows = Math.max(1, items.length);
        const cols = Math.max(1, capacity + 1);
        setLocalTable(Array.from({ length: rows }, () => Array.from({ length: cols }, () => null)));
        setSteps(Array.isArray(ks.steps) ? ks.steps : []);
        setCursor(0);
        setCurrentStep(null);
        // Always resume playback on a new run so Victory-wait works consistently
        setIsPlaying(true);
        return;
      }

      if (Array.isArray(ks.steps)) setSteps(ks.steps);

      const pb = ks?.playback;

      // Handle playback control requests from runner (e.g. accelerate to finish before victory)
      if (pb && (pb.requestedSpeedMs !== undefined || pb.requestedIsPlaying !== undefined)) {
        const nextSpeed = pb.requestedSpeedMs !== undefined ? Number(pb.requestedSpeedMs) : null;
        const nextIsPlaying = pb.requestedIsPlaying !== undefined ? !!pb.requestedIsPlaying : null;

        if (nextSpeed !== null && Number.isFinite(nextSpeed) && nextSpeed > 0) setSpeedMs(nextSpeed);
        if (nextIsPlaying !== null) setIsPlaying(nextIsPlaying);

        try {
          setCurrentGameState({
            knapsackState: {
              ...ks,
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
  }, [knapsackData]);

  // Sync playback metadata into game state so the runner can wait/jump reliably.
  useEffect(() => {
    if (!isVisible) return;
    try {
      const gameState = getCurrentGameState();
      const ks = gameState?.knapsackState || {};
      setCurrentGameState({
        knapsackState: {
          ...ks,
          playback: {
            ...(ks.playback || {}),
            cursor,
            isPlaying,
            speedMs,
            total: steps.length,
          }
        }
      });
    } catch (e) { /* ignore */ }
  }, [isVisible, cursor, isPlaying, speedMs, steps.length]);

  // Playback loop: apply one step at a controlled speed
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
        if (next[step.i] && step.j >= 0 && step.j < next[step.i].length) {
          next[step.i][step.j] = step.value;
        }
        return next;
      });
      setCurrentStep(step);
      setCursor((c) => c + 1);
    }, speedMs);

    return () => clearTimeout(timer);
  }, [isVisible, isPlaying, localTable, cursor, steps, speedMs]);

  if (!isVisible || !knapsackData) return null;

  const items = Array.isArray(knapsackData.items) ? knapsackData.items : [];
  const capacity = Number(knapsackData.capacity ?? 0) || 0;

  // Fallback shape if table hasn't been created yet
  const rows = Math.max(1, items.length);
  const cols = Math.max(1, capacity + 1);
  const safeTable = Array.isArray(localTable) ? localTable : Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));

  return (
    <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-90 border-2 border-yellow-500 rounded-lg p-3 z-[9999] max-w-[520px]" style={{ position: 'absolute' }}>
      <div className="text-yellow-400 font-bold text-sm mb-2 flex items-center gap-2">
        <span>📊 Knapsack Table (i, j)</span>
      </div>

      {/* Controls */}
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
              if (next[step.i] && step.j >= 0 && step.j < next[step.i].length) {
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
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span className="text-yellow-300 font-mono">cell: [{currentStep.i}][{currentStep.j}] = {String(currentStep.value)}</span>
            {currentStep.valWithout !== undefined && <span className="text-gray-300 font-mono">without: {String(currentStep.valWithout)}</span>}
            {currentStep.valWith !== undefined && <span className="text-gray-300 font-mono">with: {String(currentStep.valWith)}</span>}
            {currentStep.chosen && <span className="text-green-300 font-mono">chosen: {currentStep.chosen}</span>}
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded p-2 overflow-auto max-h-[260px]">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="border border-gray-700 px-2 py-1 text-gray-200 bg-gray-900 sticky top-0">i \\ j</th>
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
                  {items[i]?.label || `item ${i}`} (w:{items[i]?.weight ?? '?'}, v:{items[i]?.price ?? '?'})
                </td>
                {row.map((cell, j) => {
                  const isActive = currentStep && currentStep.i === i && currentStep.j === j;
                  return (
                    <td
                      key={j}
                      className={[
                        "border border-gray-700 px-2 py-1 text-center font-mono min-w-[30px]",
                        isActive ? "bg-yellow-300 text-black font-bold" : "bg-gray-800 text-gray-100",
                      ].join(' ')}
                    >
                      {cell === null || cell === undefined ? '·' : String(cell)}
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

export default KnapsackStateTable;


