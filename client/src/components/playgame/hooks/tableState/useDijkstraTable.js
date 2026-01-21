import { useState, useEffect } from 'react';
import { getCurrentGameState } from '../../../../gameutils/shared/game';

export const useDijkstraTable = (currentLevel) => {
    const [visited, setVisited] = useState([]);
    const [pq, setPq] = useState([]);
    const [mstWeight, setMstWeight] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [algorithmName, setAlgorithmName] = useState('Dijkstra');

    useEffect(() => {
        let categoryName = '';

        if (currentLevel?.category?.category_name) {
            categoryName = currentLevel.category.category_name.toLowerCase();
        } else if (currentLevel?.category_name) {
            categoryName = currentLevel.category_name.toLowerCase();
        }

        if (categoryName) {
            const isShortestPath = categoryName.includes('shortest path') ||
                categoryName.includes('minimum spanning tree') ||
                categoryName.includes('dijkstra') ||
                categoryName.includes('prim') ||
                categoryName.includes('kruskal');
            setIsVisible(isShortestPath);

            let algoName = 'Dijkstra';
            if (categoryName.includes('prim')) {
                algoName = 'Prim';
            } else if (categoryName.includes('kruskal')) {
                algoName = 'Kruskal';
            } else if (categoryName.includes('minimum spanning tree')) {
                algoName = 'MST';
            } else if (categoryName.includes('dijkstra') || categoryName.includes('shortest path')) {
                algoName = 'Dijkstra';
            }
            setAlgorithmName(algoName);
        } else {
            setIsVisible(false);
        }
    }, [currentLevel]);

    useEffect(() => {
        const updateInterval = setInterval(() => {
            const gameState = getCurrentGameState();
            if (gameState && gameState.dijkstraState) {
                if (gameState.dijkstraState.visited) {
                    setVisited(gameState.dijkstraState.visited);
                }
                if (gameState.dijkstraState.pq) {
                    setPq(gameState.dijkstraState.pq);
                }
                if (gameState.dijkstraState.mstWeight !== undefined) {
                    setMstWeight(gameState.dijkstraState.mstWeight);
                }
            }
        }, 100);

        return () => clearInterval(updateInterval);
    }, []);

    return {
        isVisible,
        visited,
        pq,
        mstWeight,
        algorithmName
    };
};
