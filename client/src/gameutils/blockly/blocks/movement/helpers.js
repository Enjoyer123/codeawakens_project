// Movement Helper Functions
import {
    getCurrentGameState,
    setCurrentGameState
} from '../../../shared/game/gameState';
import { moveToNode as phaserMoveToNode } from '../../../movement/playerMovement';

// export async function turnLeft() {
//     const currentState = getCurrentGameState();
//     if (currentState.goalReached || currentState.moveCount >= currentState.maxMoves || currentState.isGameOver) return;
//     await new Promise((resolve) => setTimeout(resolve, 300));
//     setCurrentGameState({ direction: (currentState.direction + 3) % 4 });
// }

// export async function turnRight() {
//     const currentState = getCurrentGameState();
//     if (currentState.goalReached || currentState.moveCount >= currentState.maxMoves || currentState.isGameOver) return;
//     await new Promise((resolve) => setTimeout(resolve, 300));
//     setCurrentGameState({ direction: (currentState.direction + 1) % 4 });
// }

// Move to node function
export async function moveToNode(targetNodeId) {
    const currentState = getCurrentGameState();
    if (!currentState.currentScene) {
        // console.log removed("No current scene available");
        return false;
    }

    const player = currentState.currentScene.player;
    if (!player) {
        // console.log removed("No player found");
        return false;
    }

    const result = await phaserMoveToNode(player, targetNodeId);

    if (result) {
        const levelData = currentState.levelData;
        const goalReached = targetNodeId === levelData.goal_node_id;

        setCurrentGameState({
            currentNodeId: targetNodeId,
            goalReached: goalReached
        });
    }

    return result;
}

// Move along path (for DFS)
export async function moveAlongPath(path) {
    if (!path || !Array.isArray(path) || path.length === 0) {
        console.warn('Invalid path:', path);
        return;
    }

    // Clear scanning highlights before moving (keep only path)
    const currentState = getCurrentGameState();

    // Move to each node in the path sequentially
    for (let i = 0; i < path.length; i++) {
        const nodeId = path[i];
        if (nodeId !== null && nodeId !== undefined) {
            await moveToNode(Number(nodeId));

            // Check if reached goal - if yes, clear all highlights except path
            const state = getCurrentGameState();
            if (state.currentScene && state.currentScene.levelData) {
                const goalNodeId = state.currentScene.levelData.goal_node_id;
                if (Number(nodeId) === goalNodeId) {
                    // Reached goal (Highlights could be cleared via standard victory flow)
                }
            }

            // Add small delay between moves for visualization
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
}
