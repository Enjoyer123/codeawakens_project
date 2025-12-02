// Phaser Game Player Functions
import {
  getCurrentGameState,
  setCurrentGameState,
  getPlayerHp,
  checkObstacleCollisionWithRadius,
  updateWeaponPosition
} from '../gameUtils';
import { isInCombat } from '../combatSystem';
import { playIdle } from '../../phaser/utils/playerAnimation';
import { moveToPosition } from '../../phaser/utils/playerMovement';
import { updatePlayerArrow } from './phaserGameArrow';

export function updatePlayer(scene, nodeId, direction) {
  const targetNode = scene.levelData.nodes.find((n) => n.id === nodeId);

  if (targetNode && scene.player) {

    // Update player direction
    scene.player.directionIndex = direction;

    // Use new movement function with animation
    moveToPosition(scene.player, targetNode.x, targetNode.y).then(() => {
      console.log("moveToPosition completed");
      // Update player node index
      scene.player.currentNodeIndex = nodeId;

      // Play idle animation after movement
      playIdle(scene.player);

      // Update arrow position
      updatePlayerArrow(scene, targetNode.x, targetNode.y, direction);

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
  }
}

// New function for movement with real-time collision detection
export function movePlayerWithCollisionDetection(scene, fromNode, toNode) {
  return new Promise((resolve) => {
    const startX = fromNode.x;
    const startY = fromNode.y;
    const endX = toNode.x;
    const endY = toNode.y;

    const distance = Phaser.Math.Distance.Between(startX, startY, endX, endY);
    const duration = Math.max(800, distance * 2);

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
          const currentState = getCurrentGameState();
          updatePlayerArrow(scene, endX, endY, currentState.direction);
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

