// Phaser Game Arrow Functions
import { getCurrentGameState } from '../gameUtils';

export function updatePlayerArrow(scene, x = null, y = null, direction = null) {
  if (!scene.playerArrow || !scene.player) {
    return;
  }

  const playerX = x !== null ? x : scene.player.x;
  const playerY = y !== null ? y : scene.player.y;
  const currentState = getCurrentGameState();
  const dir = direction !== null ? direction : currentState.direction;

  const directionOffsets = [
    { x: 30, y: 0, rotation: Math.PI / 2 }, // right - adjusted for bigger sprite
    { x: 0, y: 30, rotation: Math.PI }, // down - adjusted for bigger sprite
    { x: -30, y: 0, rotation: -Math.PI / 2 }, // left - adjusted for bigger sprite
    { x: 0, y: -30, rotation: 0 }, // up - adjusted for bigger sprite
  ];

  const offset = directionOffsets[dir];

  scene.tweens.add({
    targets: scene.playerArrow,
    x: playerX + offset.x,
    y: playerY + offset.y,
    rotation: offset.rotation,
    duration: 300,
    ease: "Power2",
  });
}

