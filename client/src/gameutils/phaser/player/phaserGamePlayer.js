// Phaser Game Player Functions
import {
  updateWeaponPosition
} from '../../shared/items';

import { getCurrentGameState, setCurrentGameState, getPlayerHp } from '../../shared/game';

import { checkObstacleCollisionWithRadius } from '../../shared/collision';
import { isInCombat } from '../../shared/combat/core/combatCore';
import { playIdle, playWalk } from '../player/playerAnimation';
import { moveToPosition } from '../player/playerMovement';
import { updatePlayerArrow } from '../effects/phaserGameArrow';

export function updatePlayer(scene, nodeId, direction) {
  // ตรวจสอบว่ามี nodes หรือไม่
  const hasNodes = scene.levelData.nodes && scene.levelData.nodes.length > 0;
  const targetNode = hasNodes ? scene.levelData.nodes.find((n) => n.id === nodeId) : null;

  if (targetNode && scene.player) {
    // Calculate direction from current node to target node
    const currentNodeId = scene.player.currentNodeIndex;
    const currentNode = scene.levelData.nodes.find((n) => n.id === currentNodeId);

    let calculatedDirection = direction;
    // Only calculate direction if we're actually moving to a different node
    // If current node = target node (e.g., initial position), use the provided direction
    if (currentNode && currentNodeId !== nodeId) {
      const dx = targetNode.x - currentNode.x;
      const dy = targetNode.y - currentNode.y;

      // Determine direction index based on movement
      // 0 = right, 1 = down, 2 = left, 3 = up
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal movement
        calculatedDirection = dx > 0 ? 0 : 2; // right : left
      } else {
        // Vertical movement
        calculatedDirection = dy > 0 ? 1 : 3; // down : up
      }
    }

    // Update player direction in both player sprite and gameState
    scene.player.directionIndex = calculatedDirection;
    setCurrentGameState({ direction: calculatedDirection });

    // Use new movement function with animation
    moveToPosition(scene.player, targetNode.x, targetNode.y, calculatedDirection).then(() => {
      console.log("moveToPosition completed");
      // Update player node index
      scene.player.currentNodeIndex = nodeId;

      // Play idle animation after movement
      playIdle(scene.player);

      // Update weapon position after movement
      updateWeaponPosition(scene);

      // Update arrow position with calculated direction
      updatePlayerArrow(scene, targetNode.x, targetNode.y, calculatedDirection);

      // Check win condition
      if (nodeId === scene.levelData.goalNodeId) {
        setTimeout(() => {
          setCurrentGameState({ goalReached: true });
        }, 300);
      }
    });

    // Reset player appearance (in case it was affected by pit fall)
    scene.player.alpha = 1;
    scene.player.setScale(1.8);
  } else if (!hasNodes && scene.player) {
    // ถ้าไม่มี nodes แต่มีการเรียก updatePlayer ให้ทำแค่ update direction และ animation
    // เพื่อให้ผู้เล่นเห็นการเปลี่ยนแปลงตัวละคร (สำหรับด่านที่ไม่มี nodes เช่น Backtrack)
    const calculatedDirection = direction !== undefined ? direction : (scene.player.directionIndex || 0);

    // Update player direction
    scene.player.directionIndex = calculatedDirection;
    setCurrentGameState({ direction: calculatedDirection });

    // Play idle animation to show player is active
    playIdle(scene.player);

    // Update arrow position (ถ้ามี arrow)
    if (scene.playerArrow) {
      updatePlayerArrow(scene, scene.player.x, scene.player.y, calculatedDirection);
    }

    // Update weapon position
    updateWeaponPosition(scene);

    console.log('⚠️ No nodes in level, player animation updated at current position');
  }
}

// New function for movement with real-time collision detection
export function movePlayerWithCollisionDetection(scene, fromNode, toNode, forcedDirection) {
  return new Promise((resolve) => {
    const startX = fromNode.x;
    const startY = fromNode.y;
    const endX = toNode.x;
    const endY = toNode.y;

    const distance = Phaser.Math.Distance.Between(startX, startY, endX, endY);
    const duration = Math.max(800, distance * 2);

    // Calculate direction based on movement vector
    const dx = endX - startX;
    const dy = endY - startY;

    // Determine direction index based on movement
    // 0 = right, 1 = down, 2 = left, 3 = up
    let directionIndex = scene.player.directionIndex || 0;

    if (forcedDirection !== undefined) {
      // Use the pre-calculated/forced direction if provided (e.g. from useGameActions)
      directionIndex = forcedDirection;
    } else {
      // Auto-calculate based on major axis
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal movement
        directionIndex = dx > 0 ? 0 : 2; // right : left
      } else {
        // Vertical movement
        directionIndex = dy > 0 ? 1 : 3; // down : up
      }
    }

    // Update player direction in both player sprite and gameState
    scene.player.directionIndex = directionIndex;
    setCurrentGameState({ direction: directionIndex });

    // Play walk animation with correct direction
    playWalk(scene.player);

    let hitObstacle = false;
    let hpDepleted = false;
    let stopX = endX;
    let stopY = endY;

    const moveTween = scene.tweens.add({
      targets: [scene.player, scene.playerBorder],
      x: endX,
      y: endY,
      duration: duration,
      ease: 'Linear',
      onUpdate: () => {
        updateWeaponPosition(scene);
        // Update arrow position during movement
        updatePlayerArrow(scene, scene.player.x, scene.player.y, directionIndex);

        // เช็ค HP และ isGameOver ในระหว่างการเคลื่อนที่ (เฉพาะเมื่อไม่ได้อยู่ใน combat mode)
        if (!hpDepleted && !isInCombat()) {
          const currentState = getCurrentGameState();
          const playerHP = getPlayerHp();

          if (playerHP <= 0 || currentState.isGameOver) {
            hpDepleted = true;
            stopX = scene.player.x;
            stopY = scene.player.y;

            // Movement stopped: Player HP is 0 or game over (not in combat mode)
            moveTween.stop();

            // หยุดที่ตำแหน่งปัจจุบัน
            resolve({
              success: false,
              hitObstacle: false,
              hpDepleted: true,
              stopX: stopX,
              stopY: stopY
            });
            return;
          }
        }

        if (checkObstacleCollisionWithRadius(scene, scene.player.x, scene.player.y, 20)) {
          if (!hitObstacle) {
            hitObstacle = true;
            stopX = scene.player.x;
            stopY = scene.player.y;

            moveTween.stop();

            scene.tweens.add({
              targets: [scene.player, scene.playerBorder],
              x: stopX - (endX - startX) * 0.1,
              y: stopY - (endY - startY) * 0.1,
              duration: 200,
              ease: 'Back.easeOut',
              yoyo: true,
              onComplete: () => {
                resolve({
                  success: false,
                  hitObstacle: true,
                  stopX: stopX,
                  stopY: stopY
                });
              }
            });
          }
        }
      },
      onComplete: () => {
        // เช็ค HP อีกครั้งก่อนจบการเคลื่อนที่ (เฉพาะเมื่อไม่ได้อยู่ใน combat mode)
        if (!hpDepleted && !isInCombat()) {
          const currentState = getCurrentGameState();
          const playerHP = getPlayerHp();

          if (playerHP <= 0 || currentState.isGameOver) {
            // Movement completed but HP is 0 or game over (not in combat mode)
            resolve({
              success: false,
              hitObstacle: false,
              hpDepleted: true,
              stopX: scene.player.x,
              stopY: scene.player.y
            });
            return;
          }
        }

        if (!hitObstacle && !hpDepleted) {
          // Play idle animation after movement completes
          playIdle(scene.player);

          // Update arrow position after movement completes with calculated direction
          updatePlayerArrow(scene, endX, endY, directionIndex);
          // Weapon icon position update removed - now only shown in bottom UI
          resolve({
            success: true,
            hitObstacle: false,
            stopX: endX,
            stopY: endY
          });
        }
      }
    });
  });
}

