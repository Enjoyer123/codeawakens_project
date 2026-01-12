import { useMemo } from 'react';
import { useTablePlayback } from './useTablePlayback';

export const useKnapsackTable = (currentLevel) => {
    const knapsackData = useMemo(() => {
        return currentLevel?.knapsackData || null;
    }, [currentLevel]);

    const items = Array.isArray(knapsackData?.items) ? knapsackData.items : [];
    const capacity = Number(knapsackData?.capacity ?? 0) || 0;

    const initTable = (data) => {
        const iItems = Array.isArray(data?.items) ? data.items : [];
        const iCapacity = Number(data?.capacity ?? 0) || 0;
        const rows = Math.max(1, iItems.length);
        const cols = Math.max(1, iCapacity + 1);
        return Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
    };

    const { isVisible, table, playback, currentStep } = useTablePlayback({
        stateKey: 'knapsackState',
        data: knapsackData,
        initTable
    });

    // Fallback table for initial render or safety
    const safeTable = table || Array.from({ length: Math.max(1, items.length) },
        () => Array.from({ length: Math.max(1, capacity + 1) }, () => null));

    return {
        isVisible,
        table: safeTable,
        items,
        capacity,
        playback,
        currentStep
    };
};
