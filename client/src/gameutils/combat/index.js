// Combat Domain - Re-export hub
// Groups all combat-related logic and visuals into one domain

// Core combat logic
export { attackEnemy, showEffectWeaponFixed, createDeathExplosion } from './combatEffects';

// Combat UI
export {
    getDirectionFromAngle,
    showFloatingText,
    showCombatMessage,
    reducePlayerHP,
    showEnemyDefeat,
} from './combatHelpers';

// Combat visuals / playback
export { startBattle } from './battle';
export { updateMonsters } from './enemyMovement';
export { playHitAnimation } from './combatPlayback';
export { calculateHit } from './combatLogic';

// Player combat
export { hitEnemyWithDamage, defendFromEnemy } from './playerCombat';

// Enemy behavior
export { isDefeat } from './enemyUtils';

// Effects
export { showMonsterDeathEffect } from './deathEffects';
export {
    showEffectWeaponFixed as showWeaponEffect,
    createWeaponRing,
    displayPlayerWeapon,
    animateWeaponAttack,
    displayPlayerEffect,
    updateWeaponPosition,
    getPlayerWeaponSprite,
    updatePlayerWeaponDisplay
} from './weaponEffects';
export { preloadAllWeaponEffects } from './combatPreload';
