import { playWalk, playIdle } from './playerAnimation';
import { updateWeaponPosition } from '../combat/weaponEffects';
import { setCurrentGameState } from '../shared/game/gameState';
import { updatePlayerArrow } from '../effects/arrow';

// Node-based movement function
export async function moveToNode(player, nodeId) {
    if (nodeId === undefined || nodeId === null || isNaN(nodeId)) {
        return false;
    }

    const levelData = player.scene.levelData;
    if (!levelData) {
        return false;
    }

    const targetNode = levelData.nodes.find(node => node.id === nodeId);
    if (!targetNode) {
        return false;
    }

    const worldX = targetNode.x;
    const worldY = targetNode.y;

    // Calculate direction from current node to target node
    const currentNodeId = player.currentNodeIndex;
    const currentNode = levelData.nodes.find(node => node.id === currentNodeId);

    let directionIndex = null;
    if (currentNode && currentNodeId !== nodeId) {
        // Calculate direction based on node positions, not player position
        const dx = targetNode.x - currentNode.x;
        const dy = targetNode.y - currentNode.y;

        // Determine direction index based on movement
        // 0 = right, 1 = down, 2 = left, 3 = up
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal movement
            directionIndex = dx > 0 ? 0 : 2; // right : left
        } else {
            // Vertical movement
            directionIndex = dy > 0 ? 1 : 3; // down : up
        }
    } else {
        // If at same node or no current node, use current direction
        directionIndex = player.directionIndex || 0;
    }

    await moveToPosition(player, worldX, worldY, directionIndex);
    player.currentNodeIndex = nodeId;

    if (levelData.goal_node_id === nodeId) {
        const { getCurrentGameState, setCurrentGameState } = await import('../shared/game/gameState');
        setCurrentGameState({ goalReached: true });
        player.scene.events.emit('goalReached');
    }

    return true;
}

// Basic position movement with animation
export async function moveToPosition(player, x, y, directionIndex = null) {
    // Calculate direction based on movement vector if not provided
    if (directionIndex === null) {
        const dx = x - player.x;
        const dy = y - player.y;

        // Determine direction index based on movement
        // 0 = right, 1 = down, 2 = left, 3 = up
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal movement
            directionIndex = dx > 0 ? 0 : 2; // right : left
        } else {
            // Vertical movement
            directionIndex = dy > 0 ? 1 : 3; // down : up
        }
    }

    // Update player direction in both player sprite and gameState
    // Ensure directions array exists
    if (!player.directions) {
        player.directions = ['right', 'down', 'left', 'up'];
    }

    // Update directionIndex BEFORE calling playWalk
    player.directionIndex = directionIndex;
    setCurrentGameState({ direction: directionIndex });

    // Play walk animation with correct direction (directionIndex is already set)
    playWalk(player);

    const trailColor = 0x00ff00;
    const trail = player.scene.add.circle(player.x, player.y, 12, trailColor, 0.3);
    trail.setDepth(5);
    player.scene.tweens.add({
        targets: trail,
        alpha: 0,
        scaleX: 2.5,
        scaleY: 2.5,
        duration: 500,
        onComplete: () => trail.destroy()
    });

    await new Promise(resolve => {
        player.scene.tweens.add({
            targets: player,
            x,
            y,
            duration: 500,
            ease: 'Power2.easeInOut',
            onUpdate: () => {
                // Update weapon position during movement
                updateWeaponPosition(player.scene);
                // Update arrow position during movement
                updatePlayerArrow(player.scene, player.x, player.y, directionIndex);
            },
            onComplete: () => {
                playIdle(player);
                // Update weapon position after movement completes
                updateWeaponPosition(player.scene);
                // Update arrow position after movement completes
                updatePlayerArrow(player.scene, x, y, directionIndex);
                resolve();
            }
        });
    });
}


// Rotate player to new direction
export function rotatePlayer(scene, newDirection) {
    if (!scene || !scene.player) return;

    // Update player direction in Phaser sprite
    scene.player.directionIndex = newDirection;

    // Update global game state
    setCurrentGameState({ direction: newDirection });

    // Update visual arrow
    updatePlayerArrow(scene, null, null, newDirection);

    // Update visual sprite (animation & flip)
    playIdle(scene.player);
}
