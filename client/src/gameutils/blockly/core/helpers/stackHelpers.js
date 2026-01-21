// Stack and Treasure Helper Functions
import {

    getStack as gameGetStack,
    pushToStack as gamePushToStack,
    popFromStack as gamePopFromStack,
    isStackEmpty as gameIsStackEmpty,
    getStackCount as gameGetStackCount,
    hasTreasureAtNode as gameHasTreasureAtNode,
    collectTreasure as gameCollectTreasure,
    isTreasureCollected as gameIsTreasureCollected,
    clearStack as gameClearStack
} from '../../../shared/items';
import { getCurrentGameState } from '../../../shared/game';
import { moveToNode } from './movementHelpers';

// Stack operations
export function getStack() {
    return gameGetStack();
}

export async function pushNode() {
    const currentState = getCurrentGameState();
    const currentNodeId = currentState.currentNodeId;
    return await gamePushToStack(currentNodeId);
}

export async function popNode() {
    const nodeId = await gamePopFromStack();
    if (nodeId !== null) {
        return await moveToNode(nodeId);
    }
    return false;
}

export function keepItem() {
    const currentState = getCurrentGameState();
    const currentNodeId = currentState.currentNodeId;
    return gameCollectTreasure(currentNodeId);
}

export function hasTreasure() {
    const currentState = getCurrentGameState();
    const currentNodeId = currentState.currentNodeId;
    return gameHasTreasureAtNode(currentNodeId);
}

export function treasureCollected() {
    const currentState = getCurrentGameState();
    const currentNodeId = currentState.currentNodeId;
    return gameIsTreasureCollected(currentNodeId);
}

export function stackEmpty() {
    return gameIsStackEmpty();
}

export function stackCount() {
    return gameGetStackCount();
}

export function clearStack() {
    return gameClearStack();
}
