// Movement Domain - Re-export hub
// Groups all movement-related logic and visuals into one domain

// Pure logic (สมอง)
export { calculateMoveForward, calculateTurnLeft, calculateTurnRight } from './movementCore';

// Collision detection
export { checkMovementCollision, checkObstacleCollisionWithRadius, canMoveForward, nearPit, atGoal } from './collisionUtils';

// Phaser playback (แขนขา)
export { playMoveAnimation, playTurnAnimation } from './movementPlayback';
export { moveToPosition, rotatePlayer, moveForwardWithCollisionDetection } from './playerMovement';
export { playIdle, playWalk, playAttack } from './playerAnimation';
