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
  drawPlayer,
  setupKnapsack,
  setupSubsetSum,
  setupCoinChange,
  setupAntDp,
  setupNQueen,
  drawQueenOnBoard,
  drawCinematicMonster
} from './phaser/phaserSetup';
export { setupTrainSchedule, updateTrainScheduleVisuals } from './phaser/trainSchedulePhaser';
export { setupRopePartition, updateRopePartitionVisuals } from './phaser/ropePartitionPhaser';
export { setupEmeiMountain, highlightPeak, highlightCableCar, showEmeiFinalResult } from './phaser/emeiMountainPhaser';

export {
  updatePersonDisplay,
  updateTreasureDisplay,
  collectTreasureVisual,
  rescuePersonAtPosition,
  rescuePersonVisual,
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

export {
  playCombatSequence
} from './phaserGame/phaserGameCombatAnimation';
