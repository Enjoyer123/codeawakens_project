import { playWalk, playIdle } from '../../phaser/utils/playerAnimation';
import { updateWeaponPosition, setCurrentGameState } from '../../utils/gameUtils';
import { updatePlayerArrow } from '../../utils/phaserGame/phaserGameArrow';

// Core movement function with collision detection
export async function moveForwardWithCollisionDetection(player) {
    const currentNodeId = player.currentNodeIndex;
    
    const targetNodeId = player.scene.pathSystem.getTargetNodeInDirection(
        currentNodeId, 
        player.directionIndex
    );

    if (targetNodeId === null) {
        return false;
    }

    const currentNode = player.scene.pathSystem.getNodeById(currentNodeId);
    const targetNode = player.scene.pathSystem.getNodeById(targetNodeId);
    
    if (!currentNode || !targetNode) {
        return false;
    }

    const moveResult = await player.scene.pathSystem.movePlayerWithCollisionDetection(
        player.scene, 
        currentNode, 
        targetNode
    );
    
    if (moveResult.hitObstacle) {
        player.scene.events.emit('pitCollision', {
            collided: true,
            obstacle: { description: "Pit encountered during movement" },
            type: "pit",
            collisionType: "realtime"
        });
        return false;
    }

    if (moveResult.success) {
        player.currentNodeIndex = targetNodeId;
        
        if (player.scene.pathSystem.isGoalNode(targetNodeId)) {
            player.scene.events.emit('goalReached');
        }
        
        return true;
    }

    return false;
}

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

    if (levelData.goalNodeId === nodeId) {
        const { getCurrentGameState, setCurrentGameState } = await import('../../utils/gameUtils');
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
    
    // Debug: Log direction to verify it's correct
    console.log('moveToPosition - directionIndex:', directionIndex, 'direction:', player.directions[directionIndex]);
    
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

// Core direction-checking functions
export function getTargetNodeIndex(player, direction) {
    const currentNodeId = player.currentNodeIndex;
    return player.scene.pathSystem.getTargetNodeInDirection(currentNodeId, player.directionIndex);
}

export function getPossibleDirections(player) {
    const currentNodeId = player.currentNodeIndex;
    return player.scene.pathSystem.getPossibleDirections(currentNodeId);
}

export function canMoveForward(player) {
    const currentNodeId = player.currentNodeIndex;
    return player.scene.pathSystem.canMoveInDirection(currentNodeId, player.directionIndex);
}

export function getCurrentDirectionSymbol(player) {
    return player.scene.pathSystem.getDirectionSymbol(player.directionIndex);
}
