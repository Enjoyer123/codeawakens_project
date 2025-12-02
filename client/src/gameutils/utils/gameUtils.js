// Main gameUtils.js - Re-exports all utility functions
// This file acts as a central export point for all game utilities

// Game state management
export {
  getCurrentScene,
  setCurrentScene,
  setLevelData,
  getLevelData,
  getCurrentGameState,
  setCurrentGameState,
  getPlayerHp,
  setPlayerHp,
  resetPlayerHp,
  directions
} from './game/gameState';

// Weapon management
export {
  getWeaponsData,
  loadWeaponsData,
  getWeaponData,
  calculateDamage,
  displayPlayerWeapon,
  updateWeaponPosition,
  getPlayerWeaponSprite,
  updatePlayerWeaponDisplay,
  foundMonster
} from './items/weaponUtils';

// Collision detection and movement conditions
export {
  checkObstacleCollisionWithRadius,
  isCircleIntersectingPolygon,
  distanceFromPointToLineSegment,
  isPointInPolygon,
  checkMovementCollision,
  canMoveForward,
  nearPit,
  atGoal
} from './collision/collisionUtils';

// Coin management
export {
  getPlayerCoins,
  addCoinToPlayer,
  clearPlayerCoins,
  swapPlayerCoins,
  comparePlayerCoins,
  getPlayerCoinValue,
  getPlayerCoinCount,
  arePlayerCoinsSorted
} from './items/coinUtils';

// Person rescue management
export {
  rescuePerson,
  rescuePersonAtNode,
  hasPerson,
  personRescued,
  getPersonCount,
  allPeopleRescued,
  getRescuedPeople,
  clearRescuedPeople,
  resetAllPeople
} from './items/personUtils';

// Stack operations and treasure
export {
  getStack,
  pushToStack,
  popFromStack,
  isStackEmpty,
  getStackCount,
  hasTreasureAtNode,
  collectTreasure,
  isTreasureCollected,
  clearStack,
  pushNode,
  popNode,
  keepItem,
  hasTreasure,
  treasureCollected,
  stackEmpty,
  stackCount
} from './items/stackUtils';

// Movement utilities
export {
  moveToNode
} from './game/movementUtils';

// Victory conditions
export {
  checkVictoryConditions,
  generateVictoryHint
} from './game/victoryUtils';

// Debug mode
export {
  toggleDebugMode,
  isDebugMode,
  clearDebugLabels
} from './game/debugUtils';
