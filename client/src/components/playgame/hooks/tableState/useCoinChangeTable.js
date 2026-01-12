import { useMemo } from 'react';
import { useTablePlayback } from './useTablePlayback';

export const useCoinChangeTable = (currentLevel) => {
    const coinChangeData = useMemo(() => {
        return currentLevel?.coinChangeData || null;
    }, [currentLevel]);

    const coins = Array.isArray(coinChangeData?.warriors) ? coinChangeData.warriors : [];
    const amount = Number(coinChangeData?.monster_power ?? 0) || 0;

    const initTable = (data) => {
        const iCoins = Array.isArray(data?.warriors) ? data.warriors : [];
        const iAmount = Number(data?.monster_power ?? 0) || 0;
        const rows = Math.max(1, iCoins.length);
        const cols = Math.max(1, iAmount + 1);
        return Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
    };

    const { isVisible, table, playback, currentStep } = useTablePlayback({
        stateKey: 'coinChangeState',
        data: coinChangeData,
        initTable
    });

    const safeTable = table || Array.from({ length: Math.max(1, coins.length) },
        () => Array.from({ length: Math.max(1, amount + 1) }, () => null));

    return {
        isVisible,
        table: safeTable,
        coins,
        amount,
        playback,
        currentStep
    };
};
