import { useMemo } from 'react';
import { useTablePlayback } from './useTablePlayback';

export const useSubsetSumTable = (currentLevel) => {
    const subsetSumData = useMemo(() => {
        return currentLevel?.subsetSumData || null;
    }, [currentLevel]);

    const warriors = Array.isArray(subsetSumData?.warriors) ? subsetSumData.warriors : [];
    const targetSum = Number(subsetSumData?.target_sum ?? 0) || 0;

    const initTable = (data) => {
        const iWarriors = Array.isArray(data?.warriors) ? data.warriors : [];
        const iTargetSum = Number(data?.target_sum ?? 0) || 0;
        const rows = Math.max(1, iWarriors.length);
        const cols = Math.max(1, iTargetSum + 1);
        return Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
    };

    const { isVisible, table, playback, currentStep } = useTablePlayback({
        stateKey: 'subsetSumState',
        data: subsetSumData,
        initTable
    });

    const safeTable = table || Array.from({ length: Math.max(1, warriors.length) },
        () => Array.from({ length: Math.max(1, targetSum + 1) }, () => null));

    return {
        isVisible,
        table: safeTable,
        warriors,
        targetSum,
        playback,
        currentStep
    };
};
