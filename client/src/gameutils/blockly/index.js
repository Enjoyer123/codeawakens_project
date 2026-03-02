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

// Re-export Data Operation Helpers
export {
    listPush, listSet, dictSet,
} from './blocks/data/lists/helpers';

export { defineAllGenerators } from './core/generators';
export { setXmlLoading, isXmlLoading } from './core/state';
