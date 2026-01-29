// Main setup module - Re-exports all Phaser setup functions
// For backward compatibility with existing imports

// Core rendering functions
export { drawLevel, setupObstacles } from './core/levelRenderer.js';
export { setupCoins, setupPeople, setupTreasures } from './core/entitySetup.js';

// Character setup functions
export { drawPlayer, drawCinematicMonster } from './characters/playerSetup.js';
export { setupMonsters } from './characters/monsterSetup.js';

// Algorithm visualization functions
export { setupKnapsack } from './algorithms/knapsackVisuals.js';
export { setupSubsetSum } from './algorithms/subsetSumVisuals.js';
export { setupCoinChange } from './algorithms/coinChangeVisuals.js';
export { setupNQueen } from './algorithms/nQueenVisuals.js';
export { setupAntDp } from './algorithms/antDpVisuals.js';
