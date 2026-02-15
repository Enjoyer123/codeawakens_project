// Blockly - Re-export hub
// Central export point for all Blockly-related functionality

// Core Blockly imports
import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/javascript";

// Re-export Core Setup & configuration
export { ensureDefaultBlocks } from './core/defaults';
export { ensureStandardBlocks } from './core/standard';
export { defineAllBlocks } from './core/definitions';
export { createToolboxConfig } from './core/toolbox';

// Re-export Data blocks related
export {
    ensureCommonVariables,
    initializeImprovedVariableHandling
} from './blocks/data/variables/definitions';

// Re-export Helpers (Movement & Logic)
export {
    turnLeft,
    turnRight,
    moveToNode,
    moveAlongPath
} from './blocks/movement/helpers';

export {
    collectCoin,
    haveCoin,
    swapCoins,
    compareCoins,
    getCoinValue,
    getCoinCount,
    isSorted
} from './blocks/entities/coin_helpers';

export {
    rescuePerson,
    rescuePersonAtNode,
    hasPerson,
    personRescued,
    getPersonCount,
    allPeopleRescued,
    getRescuedPeople,
    clearRescuedPeople,
    resetAllPeople
} from './blocks/entities/rescue_helpers';

// Re-export Graph Logic & Visuals
export {
    getGraphNeighbors,
    getGraphNeighborsWithWeight,
    getNodeValue,
    findMinIndex,
    findMaxIndex,
    getAllEdges,
    sortEdgesByWeight,
    dsuFind,
    dsuUnion,
    getCurrentNode,
    findMinIndexWithVisual,
    findMaxIndexWithVisual,
    dsuFindWithVisual,
    dsuUnionWithVisual
} from './algorithms/graph/helpers';



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
    showKruskalRoot,
    clearKruskalVisuals
} from './algorithms/graph/dfs_visual';

export { showMSTEdgesFromList } from './algorithms/graph/helpers';

export {
    updateDijkstraVisited,
    updateDijkstraPQ,
    updateMSTWeight,
    resetDijkstraState
} from './algorithms/graph/dijkstra_state';

// Re-export List Operations & Helpers
export {
    listPush, listSet,
    createListPushWithVisual, createListSetWithVisual
} from './blocks/data/lists/helpers';

// Re-export Shared Visual Wrappers (Emei, Dict)
export {
    createHighlightEmeiPath,
    dictSet, createDictSetWithVisual
} from './algorithms/shared/visual_wrappers';

// Re-export Algorithm Visuals
export {
    selectKnapsackItem as selectKnapsackItemVisual,
    unselectKnapsackItem as unselectKnapsackItemVisual,
    resetKnapsackItems as resetKnapsackItemsVisual,
    knapsackMaxWithVisual,
    resetKnapsackSelectionTracking,
    startKnapsackSelectionTracking,
    showKnapsackFinalSelection
} from './algorithms/knapsack/visuals';



export {
    addWarriorToSide1 as addWarriorToSide1Visual,
    addWarriorToSide2 as addWarriorToSide2Visual,
    resetSubsetSumWarriors as resetSubsetSumWarriorsVisual
} from './algorithms/subset_sum/visuals';

export {
    startSubsetSumTracking as startSubsetSumTrackingVisual,
    showSubsetSumFinalSolution as showSubsetSumFinalSolutionVisual,
    resetSubsetSumTracking as resetSubsetSumTrackingVisual
} from './algorithms/subset_sum/blocklySubsetSumTracking';

export {
    resetCoinChangeVisual,
    resetCoinChangeSelectionTracking,
    startCoinChangeSelectionTracking,
    trackCoinChangeDecision,
    showCoinChangeFinalSolution,
    addWarriorToSelection as addWarriorToSelectionVisual
} from './algorithms/coin_change/visuals';

export {
    sortTrains,
    assignTrainVisual
} from './algorithms/train_schedule/helpers';

// Re-export Specific Algorithm Definitions
export { registerRopePartitionBlocks } from './algorithms/rope_partition/definitions';
export { defineAllGenerators } from './core/generators';
export { setXmlLoading, isXmlLoading } from './core/state';

// Re-export State Managers (for GameCore/Resets)
export {
    resetKnapsackTableState,
    updateKnapsackCell,
    flushKnapsackStepsNow,
    waitForKnapsackPlaybackDone
} from './algorithms/knapsack/state';
export {
    resetSubsetSumTableState,
    updateSubsetSumCellVisual,
    flushSubsetSumStepsNow,
    waitForSubsetSumPlaybackDone
} from './algorithms/subset_sum/state';
export {
    resetCoinChangeTableState,
    updateCoinChangeCellVisual,
    flushCoinChangeStepsNow,
    waitForCoinChangePlaybackDone
} from './algorithms/coin_change/state';


// Re-export Tracking/Start Visuals (for Execution Context) - Deduped above
// export { startSubsetSumTracking as startSubsetSumTrackingVisual } from './algorithms/subset_sum/blocklySubsetSumTracking';
// export { startCoinChangeSelectionTracking } from './algorithms/coin_change/visuals';
// export { showKruskalRoot, clearKruskalVisuals } from './algorithms/graph/dfs_visual';
