import {
    collectCoin, haveCoin, getCoinCount, getCoinValue, swapCoins, compareCoins, isSorted,
    rescuePersonAtNode, hasPerson, personRescued, getPersonCount, moveToNode, moveAlongPath,
    getCurrentNode, getGraphNeighbors, getGraphNeighborsWithWeight, getNodeValue,
    getGraphNeighborsWithVisual, getGraphNeighborsWithVisualSync, getGraphNeighborsWithWeightWithVisualSync,
    markVisitedWithVisual, showPathUpdateWithVisual, clearDfsVisuals, showMSTEdges,
    findMinIndex, findMaxIndex, findMinIndexWithVisual, findMaxIndexWithVisual,
    getAllEdges, sortEdgesByWeight, dsuFind, dsuUnion, dsuFindWithVisual, dsuUnionWithVisual, showMSTEdgesFromList,
    updateDijkstraVisited, updateDijkstraPQ, updateMSTWeight, resetDijkstraState,
    selectKnapsackItemVisual, unselectKnapsackItemVisual, resetKnapsackItemsVisual,
    knapsackMaxWithVisual,
    resetKnapsackSelectionTracking, startKnapsackSelectionTracking, showKnapsackFinalSelection,
    addWarriorToSide1Visual, addWarriorToSide2Visual, resetSubsetSumWarriorsVisual,
    startSubsetSumTrackingVisual, showSubsetSumFinalSolutionVisual, resetSubsetSumTrackingVisual,
    resetCoinChangeSelectionTracking, startCoinChangeSelectionTracking, trackCoinChangeDecision, showCoinChangeFinalSolution,
    addWarriorToSelectionVisual,
    sortTrains, assignTrainVisual,
    listPush, createListPushWithVisual, createListSetWithVisual,
    createHighlightEmeiPath,
    createDictSetWithVisual

} from '../../../../../gameutils/blockly';

import { highlightPeak, highlightCableCar, showEmeiFinalResult } from '../../../../../gameutils/phaser';

import {
    showKruskalRoot, clearKruskalVisuals
} from '@/gameutils/blockly';

import {
    updateSubsetSumCellVisual,
    updateCoinChangeCellVisual
} from '@/gameutils/blockly';



import {
    getPlayerCoins, addCoinToPlayer, clearPlayerCoins as clearPlayerCoinsUtil,
    swapPlayerCoins, comparePlayerCoins, getPlayerCoinValue, getPlayerCoinCount,
    arePlayerCoinsSorted, allPeopleRescued
} from '../../../../../gameutils/shared/items';

import {
    getStack, pushToStack, popFromStack, isStackEmpty, getStackCount,
    hasTreasureAtNode, collectTreasure, isTreasureCollected, clearStack
} from '../../../../../gameutils/shared/items';

import {
    getCurrentGameState,
    setCurrentGameState
} from '../../../../../gameutils/shared/game';


/**
 * Builds the execution context object containing all API functions available to the user's code.
 * @param {Object} params - Configuration parameters
 * @param {Object} params.map - Graph map object
 * @param {Array} params.all_nodes - Array of all node IDs
 * @param {Object} params.gameActions - Core game actions (moveForward, turnLeft, etc.) passed from hook
 * @param {Object} params.wrappers - Wrapped functions (wrappedMoveToNode, wrappedMoveAlongPath)
 * @param {Object} params.levelData - Current level data
 * @param {Object} params.emeiParams - Parameters specific to Emei Mountain levels
 * @returns {Object} The context object
 */
export const buildExecutionContext = ({
    map,
    all_nodes,
    gameActions,
    wrappers,
    currentLevel,
    emeiParams
}) => {
    // Destructure game actions
    const {
        moveForward, turnLeft, turnRight, hit, foundMonster,
        canMoveForward, nearPit, atGoal
    } = gameActions;

    // Destructure wrappers
    const {
        wrappedMoveToNode,
        wrappedMoveAlongPath
    } = wrappers;

    // Prepare context for execution (all API functions and variables)
    const context = {
        map, all_nodes,
        moveForward, turnLeft, turnRight, hit, foundMonster, canMoveForward, nearPit, atGoal,
        collectCoin, haveCoin, getCoinCount, getCoinValue, swapCoins, compareCoins, isSorted,
        getPlayerCoins, addCoinToPlayer, clearPlayerCoins: clearPlayerCoinsUtil, swapPlayerCoins, comparePlayerCoins,
        getPlayerCoinValue, getPlayerCoinCount, arePlayerCoinsSorted,
        rescuePersonAtNode, hasPerson, personRescued, getPersonCount, allPeopleRescued,
        getStack, pushToStack, popFromStack, isStackEmpty, getStackCount, hasTreasureAtNode, collectTreasure, isTreasureCollected, clearStack,

        moveToNode: wrappedMoveToNode, moveAlongPath: wrappedMoveAlongPath, getCurrentNode, getGraphNeighbors, getGraphNeighborsWithWeight, getNodeValue,
        getGraphNeighborsWithVisual, getGraphNeighborsWithVisualSync, getGraphNeighborsWithWeightWithVisualSync,
        markVisitedWithVisual, showPathUpdateWithVisual, clearDfsVisuals, showMSTEdges,
        findMinIndex: findMinIndexWithVisual, findMaxIndex: findMaxIndexWithVisual,
        getAllEdges, sortEdgesByWeight,
        dsuFind: dsuFindWithVisual, dsuUnion: dsuUnionWithVisual, showMSTEdgesFromList,
        showKruskalRoot, clearKruskalVisuals,
        updateDijkstraVisited, updateDijkstraPQ, updateMSTWeight, resetDijkstraState,
        selectKnapsackItemVisual, unselectKnapsackItemVisual, resetKnapsackItemsVisual, knapsackMaxWithVisual,
        addWarriorToSide1Visual, addWarriorToSide2Visual, resetSubsetSumWarriorsVisual,
        updateSubsetSumCellVisual, updateCoinChangeCellVisual,
        addWarriorToSelectionVisual, trackCoinChangeDecision,
        sortTrains, assignTrainVisual,
        listPush: createListPushWithVisual({ markVisitedWithVisual, showPathUpdateWithVisual, updateDijkstraPQ, showMSTEdgesFromList }),
        listSet: createListSetWithVisual({ updateCoinChangeCellVisual, updateSubsetSumCellVisual }),
        dictSet: createDictSetWithVisual({ showMSTEdges, getCurrentGameState }),
        highlightEmeiPath: createHighlightEmeiPath({ clearDfsVisuals, highlightCableCar: (u, v, cap) => highlightCableCar(null, u, v, cap), getCurrentGameState }),
        highlightPeak: (node) => highlightPeak(null, node),
        highlightCableCar: (u, v, cap) => highlightCableCar(null, u, v, cap),
        showEmeiFinalResult: (bn, rounds) => showEmeiFinalResult(null, bn, rounds),
        getCurrentGameState, setCurrentGameState,
        // Demo: explore effect (จำลองเอฟเฟกต์สำรวจ)
        playExploreEffect: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
        },
        // Inject trains for Train Schedule
        trains: (currentLevel?.appliedData?.payload?.trains || currentLevel?.trains || [])
    };

    // --- Inject Algorithm Init Variables (Phase 1) ---

    // Knapsack
    if (currentLevel?.knapsackData) {
        const { items = [], capacity = 0 } = currentLevel.knapsackData;
        context.weights = items.map(item => item.weight);
        context.values = items.map(item => item.price);
        context.n = items.length;
        context.capacity = capacity;
    }

    // Subset Sum
    if (currentLevel?.subsetSumData) {
        const { warriors = [], target_sum = 0 } = currentLevel.subsetSumData;
        context.warriors = warriors;
        context.target_sum = target_sum;
    }

    // Coin Change
    if (currentLevel?.coinChangeData) {
        const { monster_power = 32, warriors = [1, 5, 10, 25] } = currentLevel.coinChangeData;
        context.monster_power = Math.round(Number(monster_power));
        // Use a different name if warriors conflicts with SubsetSum (though usually mutually exclusive)
        // Check if warriors is already set by SubsetSum? (Levels don't mix usually)
        context.warriors = warriors.map(w => Math.round(Number(w)));
    }

    // N-Queen
    if (currentLevel?.nqueenData) {
        const nVal = currentLevel.nqueenData.n || 4;
        context.n = nVal;

        // Initialize board (2D array: 0 = empty, 1 = queen)
        const boardArr = [];
        for (let i = 0; i < nVal; i++) {
            boardArr[i] = [];
            for (let j = 0; j < nVal; j++) {
                boardArr[i][j] = 0;
            }
        }
        context.board = boardArr;
        context.solution = [];

        // Helper: Check if placing queen at (row, col) is safe
        context.safe = async (row, col) => {
            try { if (globalThis.__nqueenVisual_api?.onConsider) globalThis.__nqueenVisual_api.onConsider(row, col, true); } catch (e) { }
            await new Promise(r => setTimeout(r, 400));

            let isSafe = true;
            for (let i = 0; i < row; i++) {
                if (context.board[i][col] === 1) isSafe = false;
            }
            for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
                if (context.board[i][j] === 1) isSafe = false;
            }
            for (let i = row - 1, j = col + 1; i >= 0 && j < context.n; i--, j++) {
                if (context.board[i][j] === 1) isSafe = false;
            }

            try { if (globalThis.__nqueenVisual_api?.onConsider) globalThis.__nqueenVisual_api.onConsider(row, col, isSafe); } catch (e) { }
            await new Promise(r => setTimeout(r, isSafe ? 200 : 500));
            return isSafe;
        };

        // Helper: Place queen at (row, col)
        context.place = async (row, col) => {
            context.board[row][col] = 1;
            try { if (globalThis.__nqueenVisual_api?.onPlace) globalThis.__nqueenVisual_api.onPlace(row, col); } catch (e) { }
            await new Promise(r => setTimeout(r, 300));
        };

        // Helper: Remove queen from (row, col)
        context.remove = async (row, col) => {
            context.board[row][col] = 0;
            try { if (globalThis.__nqueenVisual_api?.onRemove) globalThis.__nqueenVisual_api.onRemove(row, col); } catch (e) { }
            await new Promise(r => setTimeout(r, 300));
        };

        // Expose to globalThis for Blockly-generated code that uses globalThis.safe etc.
        try {
            globalThis.safe = context.safe;
            globalThis.place = context.place;
            globalThis.remove = context.remove;
        } catch (e) { }
    }

    // Rope Partition
    if (currentLevel?.gameType === 'rope_partition' || currentLevel?.appliedData?.type === 'BACKTRACKING_ROPE_PARTITION') {
        context.cuts = [];

        context.addCut = async (len) => {
            context.cuts.push(len);
            if (globalThis.__ropePartition_api && typeof globalThis.__ropePartition_api.updateCuts === 'function') {
                globalThis.__ropePartition_api.updateCuts(context.cuts);
                await new Promise(r => setTimeout(r, globalThis.__ropePartition_delay || 300));
            }
        };

        context.removeCut = async () => {
            context.cuts.pop();
            if (globalThis.__ropePartition_api && typeof globalThis.__ropePartition_api.updateCuts === 'function') {
                globalThis.__ropePartition_api.updateCuts(context.cuts);
                await new Promise(r => setTimeout(r, globalThis.__ropePartition_delay || 300));
            }
        };
    }


    // Add Emei Mountain specific parameters if applicable
    if (emeiParams) {
        context.n = emeiParams.n;
        context.edges = emeiParams.edges;
        context.start = emeiParams.start;
        context.end = emeiParams.end;
        context.tourists = emeiParams.tourists;
    }

    return context;
};
