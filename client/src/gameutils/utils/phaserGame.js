// Phaser Game - Re-export hub
// This file now acts as a re-export hub for all Phaser game-related functionality

// Re-export from phaserSetup and phaserCollection
export {
  drawLevel,
  setupObstacles,
  setupCoins,
  setupPeople,
  setupTreasures,
  setupMonsters,
  drawPlayer
} from './phaser/phaserSetup';

export {
  updatePersonDisplay,
  updateTreasureDisplay,
  rescuePersonAtPosition,
  collectCoinByPlayer,
  showCoinCollectionEffect,
  haveCoinAtPosition
} from './phaser/phaserCollection';

// Re-export from sub-modules
export {
  updatePlayer,
  movePlayerWithCollisionDetection
} from './phaserGame/phaserGamePlayer';

export {
  updatePlayerArrow
} from './phaserGame/phaserGameArrow';

export {
  createPitFallEffect,
  showGameOver,
  clearGameOverScreen,
  showVictory
} from './phaserGame/phaserGameEffects';

export {
  createRescueEffect,
  createFirework
} from './phaserGame/phaserGameVictory';

export {
  updateCombatUI,
  updateAllCombatUIs,
  showCombatUI,
  hideCombatUI,
  cleanupMonsterUI
} from './phaserGame/phaserGameCombatUI';

export {
  startBattle,
  updateMonsters
} from './phaserGame/phaserGameBattle';
