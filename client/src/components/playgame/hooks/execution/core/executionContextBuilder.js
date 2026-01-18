import {
    collectCoin, haveCoin, getCoinCount, getCoinValue, swapCoins, compareCoins, isSorted,
    rescuePersonAtNode, hasPerson, personRescued, getPersonCount, moveToNode, moveAlongPath,
    getCurrentNode, getGraphNeighbors, getGraphNeighborsWithWeight, getNodeValue,
    getGraphNeighborsWithVisual, getGraphNeighborsWithVisualSync, getGraphNeighborsWithWeightWithVisualSync,
    markVisitedWithVisual, showPathUpdateWithVisual, clearDfsVisuals, showMSTEdges,
    findMinIndex, findMaxIndex, getAllEdges, sortEdgesByWeight, dsuFind, dsuUnion, showMSTEdgesFromList,
    updateDijkstraVisited, updateDijkstraPQ, updateMSTWeight, resetDijkstraState,
    pushNode, popNode, keepItem, hasTreasure, treasureCollected, stackEmpty, stackCount,
    selectKnapsackItemVisual, unselectKnapsackItemVisual, resetKnapsackItemsVisual,
    knapsackMaxWithVisual, antMaxWithVisual, showAntDpFinalPath,
    resetKnapsackSelectionTracking, startKnapsackSelectionTracking, showKnapsackFinalSelection,
    addWarriorToSide1Visual, addWarriorToSide2Visual, resetSubsetSumWarriorsVisual,
    startSubsetSumTrackingVisual, showSubsetSumFinalSolutionVisual, resetSubsetSumTrackingVisual,
    addWarriorToSelectionVisual, resetCoinChangeVisualDisplay,
    resetCoinChangeSelectionTracking, startCoinChangeSelectionTracking, trackCoinChangeDecision, showCoinChangeFinalSolution,
    highlightPeak, highlightCableCar, showEmeiFinalResult
} from '../../../../../gameutils/utils/blocklyUtils';

import {
    highlightKruskalEdge, showKruskalRoot, clearKruskalVisuals
} from '../../../../../gameutils/utils/blockly/graph/blocklyDfsVisual';

import {
    updateSubsetSumCellVisual
} from '../../../../../gameutils/utils/blockly/algorithms/subset_sum/subsetSumStateManager';

import {
    updateCoinChangeCellVisual
} from '../../../../../gameutils/utils/blockly/algorithms/coin_change/coinChangeStateManager';

import {
    updateAntDpCellVisual
} from '../../../../../gameutils/utils/blockly/algorithms/ant_dp/antDpStateManager';

import {
    getPlayerCoins, addCoinToPlayer, clearPlayerCoins as clearPlayerCoinsUtil,
    swapPlayerCoins, comparePlayerCoins, getPlayerCoinValue, getPlayerCoinCount,
    arePlayerCoinsSorted, allPeopleRescued
} from '../../../../../gameutils/utils/gameUtils';

import {
    getStack, pushToStack, popFromStack, isStackEmpty, getStackCount,
    hasTreasureAtNode, collectTreasure, isTreasureCollected, clearStack
} from '../../../../../gameutils/utils/gameUtils';

import {
    getCurrentGameState,
    setCurrentGameState
} from '../../../../../gameutils/utils/gameUtils';


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
        pushNode, popNode, keepItem, hasTreasure, treasureCollected, stackEmpty, stackCount,
        moveToNode: wrappedMoveToNode, moveAlongPath: wrappedMoveAlongPath, getCurrentNode, getGraphNeighbors, getGraphNeighborsWithWeight, getNodeValue,
        getGraphNeighborsWithVisual, getGraphNeighborsWithVisualSync, getGraphNeighborsWithWeightWithVisualSync,
        markVisitedWithVisual, showPathUpdateWithVisual, clearDfsVisuals, showMSTEdges,
        findMinIndex, findMaxIndex, getAllEdges, sortEdgesByWeight, dsuFind, dsuUnion, showMSTEdgesFromList,
        highlightKruskalEdge, showKruskalRoot, clearKruskalVisuals,
        updateDijkstraVisited, updateDijkstraPQ, updateMSTWeight, resetDijkstraState,
        selectKnapsackItemVisual, unselectKnapsackItemVisual, resetKnapsackItemsVisual, knapsackMaxWithVisual, antMaxWithVisual,
        addWarriorToSide1Visual, addWarriorToSide2Visual, resetSubsetSumWarriorsVisual,
        updateSubsetSumCellVisual, updateCoinChangeCellVisual, updateAntDpCellVisual,
        addWarriorToSelectionVisual, trackCoinChangeDecision,
        highlightPeak: (node) => highlightPeak(null, node),
        highlightCableCar: (u, v, cap) => highlightCableCar(null, u, v, cap),
        showEmeiFinalResult: (bn, rounds) => showEmeiFinalResult(null, bn, rounds),
        getCurrentGameState, setCurrentGameState,
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
