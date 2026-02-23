// Setup Domain - Re-export hub
// Scene setup: level rendering, player/monster initialization

export { drawLevel, setupObstacles } from './levelRenderer';
export { setupCoins, setupPeople, setupTreasures } from './entitySetup';
export { drawPlayer, drawCinematicMonster } from './playerSetup';
export { setupMonsters } from './monsterSetup';

// Algorithm visualization setup (re-exported from algo/)
export { setupKnapsack } from '../algo/setup/knapsackSetup';
export { setupSubsetSum } from '../algo/setup/subsetSumSetup';
export { setupCoinChange } from '../algo/setup/coinChangeSetup';
