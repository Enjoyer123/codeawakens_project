// Combat Domain - Re-export hub
// Groups all combat-related logic and visuals into one domain

// Core combat logic
export { initiateCombat, endCombat, isInCombat, executePlayerAttack } from './combatCore';
export { getCombatState, setCombatState } from './combatState';
export { calculateAttackDamage, calculatePlayerDamage } from './combatDamage';
export { attackEnemy, showEffectWeaponFixed, createDeathExplosion } from './combatEffects';

// Combat UI
export { showCombatUI, hideCombatUI } from './combatUI';
export { showAttackResult, showCombatMessage, reducePlayerHP, showEnemyDefeat } from './combatHelpers';
export { updateAllCombatUIs, cleanupMonsterUI } from './battleUI';

// Combat visuals / playback
export { playCombatSequence } from './battleAnimation';
export { startBattle, updateMonsters } from './battle';
export { playHitAnimation } from './combatPlayback';
export { calculateHit } from './combatLogic';

// Player combat
export { hitEnemyWithDamage, defendFromEnemy } from './playerCombat';

// Enemy behavior
export { checkPlayerInRange } from './enemyBehavior';
export { isDefeat } from './enemyUtils';

// Effects
export { showMonsterDeathEffect } from './deathEffects';
export { showEffectWeaponFixed as showWeaponEffect } from './weaponEffects';
export { preloadAllWeaponEffects } from './combatPreload';
