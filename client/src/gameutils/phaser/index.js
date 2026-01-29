// Phaser - Re-export hub
// Central export point for all Phaser-related functionality

// Scenes
export { GameScene } from './scenes/GameScene';

// Setup functions
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
    drawCinematicMonster
} from './setup/index.js';

export { setupTrainSchedule, updateTrainScheduleVisuals } from './setup/trainSchedulePhaser';
export { setupRopePartition, updateRopePartitionVisuals } from './setup/ropePartitionPhaser';
export { setupEmeiMountain, highlightPeak, highlightCableCar, showEmeiFinalResult } from './setup/emeiMountainPhaser';

export {
    updatePersonDisplay,
    updateTreasureDisplay,
    collectTreasureVisual,
    rescuePersonAtPosition,
    rescuePersonVisual,
    collectCoinByPlayer,
    showCoinCollectionEffect,
    haveCoinAtPosition
} from './setup/phaserCollection';

// Player functions
export {
    updatePlayer,
    movePlayerWithCollisionDetection
} from './player/phaserGamePlayer';

export {
    rotatePlayer,
    moveToPosition,

} from './player/playerMovement';

export {
    playIdle as playerPlayIdle,
    playWalk as playerPlayWalk,
    playIdle,
    playWalk,
} from './player/playerAnimation';

export {
    attackPlayer
} from './enemies/enemyBehavior';

// Enemy functions
export {
    checkPlayerInRange
} from './enemies/enemyBehavior';

// export {
//     attackEnemy as enemyAttackPlayer
// } from '.';

export {
    resetEnemy,
    isDefeat
} from './enemies/enemyUtils';

// Effects
export {
    updatePlayerArrow
} from './effects/phaserGameArrow';

export {
    createPitFallEffect,
    showGameOver,
    clearGameOverScreen,
    showVictory
} from './effects/phaserGameEffects';

export {
    createRescueEffect,
    createFirework
} from './effects/phaserGameVictory';

// Combat
export {
    updateCombatUI,
    updateAllCombatUIs,
    showCombatUI,
    hideCombatUI,
    cleanupMonsterUI
} from './combat/phaserGameCombatUI';

export {
    startBattle,
    updateMonsters
} from './combat/phaserGameBattle';

export {
    playCombatSequence
} from './combat/phaserGameCombatAnimation';


