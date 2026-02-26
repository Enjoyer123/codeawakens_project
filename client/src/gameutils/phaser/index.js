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
    drawCinematicMonster
} from '../setup';


export {

    updateTreasureDisplay,
    collectTreasureVisual,

    rescuePersonVisual,
    collectCoinByPlayer,
    showCoinCollectionEffect,
    haveCoinAtPosition
} from '../entities/collection';

// Player functions
export {
    updatePlayer,
    movePlayerWithCollisionDetection
} from './player/phaserGamePlayer';

export {
    rotatePlayer,
    moveToPosition,

} from '../movement/playerMovement';

export {
    playIdle as playerPlayIdle,
    playWalk as playerPlayWalk,
    playIdle,
    playWalk,
} from '../movement/playerAnimation';

// Enemy functions
export {
    resetEnemy,
    isDefeat
} from '../combat/enemyUtils';

// Effects
export {
    updatePlayerArrow
} from '../effects/arrow';

export {
    createPitFallEffect,
    showGameOver,
    clearGameOverScreen,
    showVictory
} from '../effects/gameEffects';

export {
    createRescueEffect,
    createFirework
} from '../effects/victory';

// Combat
export {
    startBattle,
    updateMonsters
} from '../combat/battle';

export {
    playCombatSequence
} from '../combat/battleAnimation';


