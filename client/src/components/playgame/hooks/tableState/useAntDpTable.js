import { useMemo, useState } from 'react';
import { useTablePlayback } from './useTablePlayback';

export const useAntDpTable = (currentLevel) => {
    const [cellSize, setCellSize] = useState(44);

    const applied = useMemo(() => currentLevel?.appliedData || null, [currentLevel]);
    // Check if level type matches Ant DP types
    const isAntDp = !!(applied && (applied.type === 'APPLIED_DYNAMIC_ANT' || applied.type === 'ANT_SUGAR_PATH' || applied.type === 'APPLIED_ANT'));

    // Use payload if available, but wrap it to act as "data" for playback
    const payload = applied?.payload || null;
    // We only show this table if it's ant dp AND debug flag is on (as per original logic)
    const shouldShow = isAntDp && !!(payload?.visual?.showDebugTable);

    // Create a wrapper object to pass to useTablePlayback as 'data'
    // We include payload so it can detect changes
    const tableData = useMemo(() => shouldShow ? { ...payload } : null, [shouldShow, payload]);

    const sugarGrid = useMemo(() => (Array.isArray(payload?.sugarGrid) ? payload.sugarGrid : []), [payload]);

    const dims = useMemo(() => {
        const rows = Number(payload?.rows ?? 0) || (Array.isArray(sugarGrid) ? sugarGrid.length : 0) || 1;
        const cols = Number(payload?.cols ?? 0) || (Array.isArray(sugarGrid?.[0]) ? sugarGrid[0].length : 0) || 1;
        return { rows: Math.max(1, rows), cols: Math.max(1, cols) };
    }, [payload, sugarGrid]);

    const start = payload?.start || { r: 0, c: 0 };
    const goal = payload?.goal || null;

    const initTable = (data) => {
        // Recalculate dims from data to be safe, logic duplicated but safe
        const sGrid = Array.isArray(data?.sugarGrid) ? data.sugarGrid : [];
        const r = Number(data?.rows ?? 0) || (sGrid.length) || 1;
        const c = Number(data?.cols ?? 0) || (sGrid[0]?.length) || 1;
        return Array.from({ length: r }, () => Array.from({ length: c }, () => null));
    };

    const { isVisible, table, playback, currentStep } = useTablePlayback({
        stateKey: 'antDpState',
        data: tableData,
        initTable
    });

    const safeTable = table || Array.from({ length: dims.rows }, () => Array.from({ length: dims.cols }, () => null));

    return {
        isVisible,
        table: safeTable,
        dims,
        sugarGrid,
        start,
        goal,
        playback,
        currentStep,
        cellSize,
        setCellSize
    };
};
