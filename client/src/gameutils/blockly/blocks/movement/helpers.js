// Movement Helper Functions
import {
    getCurrentGameState,
    setCurrentGameState
} from '../../../shared/game';
import { moveToNode as phaserMoveToNode } from '../../../phaser/player/playerMovement';

export async function turnLeft() {
    const currentState = getCurrentGameState();
    if (currentState.goalReached || currentState.moveCount >= currentState.maxMoves || currentState.isGameOver) return;
    await new Promise((resolve) => setTimeout(resolve, 300));
    setCurrentGameState({ direction: (currentState.direction + 3) % 4 });
}

export async function turnRight() {
    const currentState = getCurrentGameState();
    if (currentState.goalReached || currentState.moveCount >= currentState.maxMoves || currentState.isGameOver) return;
    await new Promise((resolve) => setTimeout(resolve, 300));
    setCurrentGameState({ direction: (currentState.direction + 1) % 4 });
}

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
        const goalReached = targetNodeId === levelData.goalNodeId;

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
    if (currentState.currentScene) {
        // Dynamic import to avoid circular dependency if possible, or just adjust path
        const { clearScanningHighlights } = await import('../../algorithms/graph/dfs_visual');
        clearScanningHighlights(currentState.currentScene);
    }

    // Move to each node in the path sequentially
    for (let i = 0; i < path.length; i++) {
        const nodeId = path[i];
        if (nodeId !== null && nodeId !== undefined) {
            await moveToNode(Number(nodeId));

            // Check if reached goal - if yes, clear all highlights except path
            const state = getCurrentGameState();
            if (state.currentScene && state.currentScene.levelData) {
                const goalNodeId = state.currentScene.levelData.goalNodeId;
                if (Number(nodeId) === goalNodeId) {
                    // Reached goal - clear scanning highlights, keep only path
                    const { clearScanningHighlights } = await import('../../algorithms/graph/dfs_visual');
                    clearScanningHighlights(state.currentScene);
                }
            }

            // Add small delay between moves for visualization
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
}
