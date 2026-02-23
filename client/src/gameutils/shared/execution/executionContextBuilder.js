import {
    collectCoin, haveCoin, getCoinCount, getCoinValue, swapCoins, compareCoins, isSorted,
    rescuePersonAtNode, hasPerson, personRescued, getPersonCount, moveToNode, moveAlongPath, listPush
} from '../../blockly';

import {
    getPlayerCoins, addCoinToPlayer, clearPlayerCoins as clearPlayerCoinsUtil,
    swapPlayerCoins, comparePlayerCoins, getPlayerCoinValue, getPlayerCoinCount,
    arePlayerCoinsSorted, allPeopleRescued
} from '../../entities';

import {
    hasTreasureAtNode, collectTreasure, isTreasureCollected, resetTreasures,
    hasTreasure, treasureCollected, getCollectedTreasures
} from '../../entities';

import { playRescueAnimation, playCollectAnimation } from '../../entities/actionPlayback';

import {
    getCurrentGameState,
    setCurrentGameState
} from '../game';


/**
 * Builds the execution context object containing all API functions available to the user's code.
 * @param {Object} params - Configuration parameters
 * @param {Object} params.map - Graph map object
 * @param {Array} params.all_nodes - Array of all node IDs
 * @param {Object} params.gameActions - Core game actions (moveForward, turnLeft, etc.) passed from hook
 * @param {Object} params.wrappers - Wrapped functions (wrappedMoveToNode, wrappedMoveAlongPath)
 * @param {Object} params.levelData - Current level data
 * @returns {Object} The context object
 */
export const buildExecutionContext = ({
    map,
    all_nodes,
    gameActions,
    wrappers,
    currentLevel
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
        rescuePersonAtNode: async (nodeId) => {
            const result = await rescuePersonAtNode(nodeId);
            if (result && result.success && getCurrentGameState().currentScene) {
                await playRescueAnimation(getCurrentGameState().currentScene, result);
            }
            return result;
        },
        hasPerson, personRescued, getPersonCount, allPeopleRescued,
        hasTreasureAtNode,
        collectTreasure: async (nodeId) => {
            const result = await collectTreasure(nodeId);
            if (result && result.success && getCurrentGameState().currentScene) {
                await playCollectAnimation(getCurrentGameState().currentScene, result);
            }
            return result;
        },
        isTreasureCollected, hasTreasure, treasureCollected,

        moveToNode: wrappedMoveToNode, moveAlongPath: wrappedMoveAlongPath,

        // Use basic list ops for simple levels (no visual tracing needed here)
        listPush,
        // listSet, dictSet can be mapped to simple array/object mutations if actually used in Simple Levels,
        // but typically Simple Levels do not use complex array replacements.

        getCurrentGameState, setCurrentGameState,
        // Demo: explore effect (จำลองเอฟเฟกต์สำรวจ)
        playExploreEffect: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    };

    // --- Phase 1: Pure Level Actions executed by generic execution context ---

    return context;
};
