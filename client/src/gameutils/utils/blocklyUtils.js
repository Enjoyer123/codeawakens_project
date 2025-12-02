// Blockly Utility Functions - Re-export hub
// This file now acts as a re-export hub for all Blockly-related functionality

// Core Blockly imports
import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/javascript";

// Re-export from sub-modules
export { ensureDefaultBlocks } from './blockly/blocklyDefault';
export { 
  ensureCommonVariables, 
  initializeImprovedVariableHandling 
} from './blockly/blocklyVariable';
export { ensureStandardBlocks } from './blockly/blocklyStandardBlocks';
export { defineAllBlocks } from './blockly/blocklyBlocks';
export { defineListBlocks } from './blockly/blocklyList';
export { createToolboxConfig } from './blockly/blocklyToolbox';
export { initBlockly } from './blockly/blocklyInit';

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
  getStack,
  pushNode,
  popNode,
  keepItem,
  hasTreasure,
  treasureCollected,
  stackEmpty,
  stackCount,
  clearStack
} from './blockly/blocklyHelpers';
