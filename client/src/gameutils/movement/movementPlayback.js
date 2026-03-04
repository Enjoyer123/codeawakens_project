import { movePlayerWithCollisionDetection } from '../phaser/player/phaserGamePlayer';
import { createPitFallEffect } from '../effects/gameEffects';
import { rotatePlayer } from './playerMovement';
import { getCurrentGameState } from '../shared/game/gameState';

/**
 * Handles playing the visual animation for turning (left/right).
 * Playback pattern supports swappable visuals via `options`.
 */
export async function playTurnAnimation(scene, actionData, options = {}) {
    if (!scene || !actionData.success || actionData.action !== 'turn') return;

    await new Promise(resolve => setTimeout(resolve, 300));

    // Default classic visual
    if (rotatePlayer) {
        rotatePlayer(scene, actionData.newDirection);
    }
}

/**
 * Handles playing the visual animation for walking or falling into a pit.
 */
export async function playMoveAnimation(scene, actionData, options = {}) {
    if (!scene || !actionData.success || actionData.action !== 'move') return;

    if (actionData.hitObstacle) {
        // Player moves into pit
        console.log("Player fell into pit! Movement stopped.");

        // This simulates moving halfway then falling
        await movePlayerWithCollisionDetection(
            scene,
            actionData.currentNode,
            actionData.targetNode,
            actionData.direction
        );

        createPitFallEffect(scene);

        // Wait for visual effect before game over
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { status: 'game_over', reason: 'pit' };
    } else {
        // Normal movement
        const moveResult = await movePlayerWithCollisionDetection(
            scene,
            actionData.currentNode,
            actionData.targetNode,
            actionData.direction
        );

        // We handle HP depletion in battle logic, but fallback if animation detects death
        if (moveResult.hpDepleted) {
            return { status: 'game_over', reason: 'hp_depleted' };
        }

        return { status: 'success' };
    }
}
