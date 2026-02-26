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

// Re-export List Operations & Helpers
export {
    listPush, listSet,
    // createListPushWithVisual, createListSetWithVisual
} from './blocks/data/lists/helpers';

// Re-export Shared Visual Wrappers (Emei, Dict)
export {
    createHighlightEmeiPath,
    dictSet, createDictSetWithVisual
} from './algorithms/shared/visual_wrappers';

// Removed obsolete knapsack visual exports

// Removed obsolete subset sum and coin change visual exports

// Removed old coin change visuals export

export { defineAllGenerators } from './core/generators';
export { setXmlLoading, isXmlLoading } from './core/state';

