import { getCurrentGameState, setCurrentGameState, getPlayerHp } from '../shared/game/gameState';
import { checkMovementCollision } from './collisionUtils';

const directionsArr = [
    { x: 1, y: 0, symbol: "→" }, // 0: right
    { x: 0, y: 1, symbol: "↓" }, // 1: down
    { x: -1, y: 0, symbol: "←" }, // 2: left
    { x: 0, y: -1, symbol: "↑" }, // 3: up
];

/**
 * Pure logic for moving forward
 * Returns the planned action details without triggering visual animations
 */
export function calculateMoveForward(sceneForCollision) {
    const currentState = getCurrentGameState();
    const playerHP = getPlayerHp();

    if (currentState.goalReached || currentState.moveCount >= currentState.maxMoves || currentState.isGameOver || playerHP <= 0) {
        return { success: false, reason: 'game_over_or_dead' };
    }

    const currentLevel = currentState.levelData;
    const currentNode = currentLevel.nodes.find((n) => n.id === currentState.currentNodeId);

    if (!currentNode) {
        return { success: false, reason: 'node_not_found' };
    }

    const connectedNodes = currentLevel.edges
        .filter((edge) => edge.from === currentState.currentNodeId || edge.to === currentState.currentNodeId)
        .map((edge) => (edge.from === currentState.currentNodeId ? edge.to : edge.from))
        .map((nodeId) => currentLevel.nodes.find((n) => n.id === nodeId))
        .filter((node) => node);

    let targetNode = null;
    const dirVector = directionsArr[currentState.direction];

    for (let node of connectedNodes) {
        const dx = node.x - currentNode.x;
        const dy = node.y - currentNode.y;

        const angle = Math.atan2(dy, dx);
        const dirAngle = Math.atan2(dirVector.y, dirVector.x);

        let angleDiff = Math.abs(angle - dirAngle);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

        if (angleDiff < Math.PI / 3) {
            targetNode = node;
            break;
        }
    }

    if (!targetNode) {
        return { success: false, reason: 'no_path', direction: currentState.direction };
    }

    let hitObstacle = false;
    if (sceneForCollision) {
        hitObstacle = checkMovementCollision(sceneForCollision, currentNode, targetNode);
    }

    // Logic updates
    setCurrentGameState({ moveCount: currentState.moveCount + 1 });

    if (hitObstacle) {
        // Player falls into pit
        return {
            success: true,
            action: 'move',
            hitObstacle: true,
            currentNode,
            targetNode,
            direction: currentState.direction
        };
    }

    // Validate if goal is reached logically
    const goalReached = targetNode.id === currentLevel.goal_node_id;


    return {
        success: true,
        action: 'move',
        hitObstacle: false,
        currentNode,
        targetNode,
        direction: currentState.direction,
        goalReached
    };
}

/**
 * Pure logic for turning left
 */
export function calculateTurnLeft() {
    const currentState = getCurrentGameState();
    if (currentState.goalReached || currentState.moveCount >= currentState.maxMoves || currentState.isGameOver) {
        return { success: false, reason: 'game_over' };
    }

    const newDirection = (currentState.direction + 3) % 4;
    return { success: true, action: 'turn', newDirection };
}

/**
 * Pure logic for turning right
 */
export function calculateTurnRight() {
    const currentState = getCurrentGameState();
    if (currentState.goalReached || currentState.moveCount >= currentState.maxMoves || currentState.isGameOver) {
        return { success: false, reason: 'game_over' };
    }

    const newDirection = (currentState.direction + 1) % 4;
    return { success: true, action: 'turn', newDirection };
}
