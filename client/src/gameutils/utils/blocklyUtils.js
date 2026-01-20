// Blockly Utility Functions - Re-export hub
// This file now acts as a re-export hub for all Blockly-related functionality

// Core Blockly imports
import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/javascript";

// Import and run overrides
import { setupBlocklyOverrides } from './blockly/core/blocklyOverrides';

// CRITICAL: Setup overrides IMMEDIATELY after importing Blockly
// This must happen before any other code uses procedure blocks
console.log('[blocklyUtils] Initializing Blockly overrides...');
setupBlocklyOverrides();

// Re-export from sub-modules
export { ensureDefaultBlocks } from './blockly/core/blocklyDefault';
export {
  ensureCommonVariables,
  initializeImprovedVariableHandling
} from './blockly/data/blocklyVariable';
export { ensureStandardBlocks } from './blockly/core/blocklyStandard/blocklyStandardBlocks';
// export { defineLogicBlocks } from './blockly/logic/blocklyLogic'; // Unused, aggregate in defineAllBlocks
// export { defineLogicOperatorsBlocks } from './blockly/logic/blocklyLogicOperators'; // Unused, aggregate in defineAllBlocks
// export { defineMovementBlocks } from './blockly/movement/blocklyMovement';
// export { defineLoopBlocks } from './blockly/loop/blocklyLoop';  // Keep this for backward compatibility if needed, though defineAllBlocks handles it
// export { defineMathBlocks } from './blockly/math/blocklyMath';
export { defineAllBlocks } from './blockly/core/blocklyBlocks';
// export { defineListBlocks } from './blockly/data/blocklyList'; // Used in blocklyInit.js separately
export { createToolboxConfig } from './blockly/core/blocklyToolbox';
// export { initBlockly } from './blockly/core/blocklyInit';

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
  showCoinChangeFinalSolutionWrapper as showCoinChangeFinalSolution
} from './blockly/core/blocklyHelpers';

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
} from './blockly/graph/blocklyDfsVisual';

// Re-export Dijkstra state management functions
export {
  updateDijkstraVisited,
  updateDijkstraPQ,
  updateMSTWeight,
  resetDijkstraState
} from './blockly/graph/dijkstraStateManager';
// Re-export Emei Mountain visual functions
export {
  highlightPeak,
  highlightCableCar,
  showEmeiFinalResult
} from './phaser/emeiMountainPhaser';
