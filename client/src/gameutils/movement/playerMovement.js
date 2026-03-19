import { playWalk, playIdle } from './playerAnimation';
import { updateWeaponPosition } from '../combat/weaponEffects';
import { setCurrentGameState } from '../shared/game/gameState';
import { updatePlayerArrow } from '../effects/arrow';
import { startManagedLoop, stopManagedLoop } from '../sound/soundManager';

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
        const dx = targetNode.x - currentNode.x;
        const dy = targetNode.y - currentNode.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            directionIndex = dx > 0 ? 0 : 2; // right : left
        } else {
            directionIndex = dy > 0 ? 1 : 3; // down : up
        }
    } else {
        directionIndex = player.directionIndex || 0;
    }

    await moveToPosition(player, worldX, worldY, directionIndex);
    player.currentNodeIndex = nodeId;

    if (levelData.goal_node_id === nodeId) {
        setCurrentGameState({ goalReached: true });
        player.scene.events.emit('goalReached');
    }

    return true;
}

// Basic position movement with animation
export async function moveToPosition(player, x, y, directionIndex = null) {
    startManagedLoop('walk');

    // Calculate direction if not provided
    if (directionIndex === null) {
        const dx = x - player.x;
        const dy = y - player.y;
        if (Math.abs(dx) > Math.abs(dy)) {
            directionIndex = dx > 0 ? 0 : 2;
        } else {
            directionIndex = dy > 0 ? 1 : 3;
        }
    }

    // Update player direction
    if (!player.directions) player.directions = ['right', 'down', 'left', 'up'];
    player.directionIndex = directionIndex;
    setCurrentGameState({ direction: directionIndex });

    // Play walk animation
    playWalk(player);

    // Trail effect
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
                updateWeaponPosition(player.scene);
                updatePlayerArrow(player.scene, player.x, player.y, directionIndex);
            },
            onComplete: () => {
                playIdle(player);
                updateWeaponPosition(player.scene);
                updatePlayerArrow(player.scene, x, y, directionIndex);

                stopManagedLoop('walk');
                resolve();
            }
        });
    });
}

// Rotate player to new direction
export function rotatePlayer(scene, newDirection) {
    if (!scene || !scene.player) return;
    scene.player.directionIndex = newDirection;
    setCurrentGameState({ direction: newDirection });
    updatePlayerArrow(scene, null, null, newDirection);
    playIdle(scene.player);
}
