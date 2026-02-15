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
            console.log('✨ [Explore Effect] สำรวจพื้นที่!');
            await new Promise(resolve => setTimeout(resolve, 300));
        },
        // Inject trains for Train Schedule
        trains: (currentLevel?.appliedData?.payload?.trains || currentLevel?.trains || [])
    };

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
