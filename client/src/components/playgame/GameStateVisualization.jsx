import React from 'react';

// Hooks (Logic)
import { useDijkstraTable } from './hooks/tableState/useDijkstraTable';
import { useKnapsackTable } from './hooks/tableState/useKnapsackTable';
import { useSubsetSumTable } from './hooks/tableState/useSubsetSumTable';
import { useCoinChangeTable } from './hooks/tableState/useCoinChangeTable';
import { useCoinPeopleTable } from './hooks/tableState/useCoinPeopleTable';

// Components (View)
import DijkstraTable from './table/DijkstraTable';
import KnapsackTable from './table/KnapsackTable';
import SubsetSumTable from './table/SubsetSumTable';
import CoinChangeTable from './table/CoinChangeTable';
import CoinPeopleTable from './table/CoinPeopleTable';

const GameStateVisualization = ({
    levelData,
    playerCoins,
    rescuedPeople,
    collectedTreasures
}) => {
    // 1. Dijkstra / Shortest Path
    const dijkstraState = useDijkstraTable(levelData);

    // 2. Knapsack
    const knapsackState = useKnapsackTable(levelData);

    // 3. Subset Sum
    const subsetSumState = useSubsetSumTable(levelData);

    // 4. Coin Change
    const coinChangeState = useCoinChangeTable(levelData);

    // 5. Coin, People & Treasures
    const coinPeopleState = useCoinPeopleTable(levelData, playerCoins, rescuedPeople, collectedTreasures);

    return (
        <>
            <DijkstraTable {...dijkstraState} />
            <KnapsackTable {...knapsackState} />
            <SubsetSumTable {...subsetSumState} />
            <CoinChangeTable {...coinChangeState} />
            <CoinPeopleTable {...coinPeopleState} />
        </>
    );
};

export default GameStateVisualization;
