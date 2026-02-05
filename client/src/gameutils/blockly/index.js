// Blockly - Re-export hub
// Central export point for all Blockly-related functionality

// Core Blockly imports
import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/javascript";

// Import and run overrides
import { setupBlocklyOverrides } from './core/blocklyOverrides';

// CRITICAL: Setup overrides IMMEDIATELY after importing Blockly
// This must happen before any other code uses procedure blocks
console.log('[blockly/index] Initializing Blockly overrides...');
setupBlocklyOverrides();

// Re-export from sub-modules
export { ensureDefaultBlocks } from './core/blocklyDefault';
export {
    ensureCommonVariables,
    initializeImprovedVariableHandling
} from './data/blocklyVariable';
export { ensureStandardBlocks } from './core/blocklyStandard/blocklyStandardBlocks';
export { defineAllBlocks } from './core/blocklyBlocks';
export { createToolboxConfig } from './core/blocklyToolbox';

// Re-export helper functions
export {
    turnLeft,
    turnRight,
    collectCoin,
    haveCoin,
    swapCoins,
    compareCoins,
    getCoinValue,
    getCoinCount,
    isSorted,
    rescuePerson,
    rescuePersonAtNode,
    hasPerson,
    personRescued,
    getPersonCount,
    allPeopleRescued,
    getRescuedPeople,
    clearRescuedPeople,
    resetAllPeople,
    moveToNode,
    moveAlongPath,
    getCurrentNode,
    getGraphNeighbors,
    getGraphNeighborsWithWeight,
    getNodeValue,
    findMinIndex,
    findMaxIndex,
    getAllEdges,
    sortEdgesByWeight,
    dsuFind,
    dsuUnion,
    showMSTEdgesFromList,
    getStack,
    pushNode,
    popNode,
    keepItem,
    hasTreasure,
    treasureCollected,
    stackEmpty,
    stackCount,
    clearStack,
    selectKnapsackItemVisual,
    unselectKnapsackItemVisual,
    resetKnapsackItemsVisual,
    knapsackMaxWithVisual,
    antMaxWithVisual,
    showAntDpFinalPath,
    resetKnapsackSelectionTracking,
    startKnapsackSelectionTracking,
    showKnapsackFinalSelection,
    addWarriorToSide1Visual,
    addWarriorToSide2Visual,
    resetSubsetSumWarriorsVisual,
    startSubsetSumTrackingVisual,
    showSubsetSumFinalSolutionVisual,
    resetSubsetSumTrackingVisual,
    addWarriorToSelectionVisual,
    resetCoinChangeVisualDisplay,
    resetCoinChangeSelectionTrackingWrapper as resetCoinChangeSelectionTracking,
    startCoinChangeSelectionTrackingWrapper as startCoinChangeSelectionTracking,
    trackCoinChangeDecisionWrapper as trackCoinChangeDecision,
    showCoinChangeFinalSolutionWrapper as showCoinChangeFinalSolution,
    sortTrains,
    assignTrainVisual
} from './core/blocklyHelpers';

// Re-export DFS visual feedback functions
export {
    getGraphNeighborsWithVisual,
    getGraphNeighborsWithVisualSync,
    markVisitedWithVisual,
    showPathUpdateWithVisual,
    clearDfsVisuals,
    getGraphNeighborsWithWeightWithVisualSync,
    highlightNode,
    highlightEdge,
    markNodeAsVisited,
    showCurrentPath,
    showMSTEdges,
    highlightKruskalEdge,
    showKruskalRoot,
    clearKruskalVisuals
} from './graph/blocklyDfsVisual';

// Re-export Dijkstra state management functions
export {
    updateDijkstraVisited,
    updateDijkstraPQ,
    updateMSTWeight,
    resetDijkstraState
} from './graph/dijkstraStateManager';

// Re-export generators
export { registerRopePartitionBlocks } from './algorithms/special/blocklyRopePartition';
