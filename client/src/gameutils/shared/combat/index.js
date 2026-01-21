// Combat System - Re-export hub
// Central export point for all combat-related functionality

// Re-export from sub-modules
export {
    initiateCombat,
    endCombat,
    isInCombat,
    executePlayerAttack
} from './core/combatCore';

export {
    attackEnemy,
    showEffectWeaponFixed,
    createDeathExplosion
} from './combatEffects';

export {
    calculateAttackDamage,
    calculatePlayerDamage
} from './core/combatDamage';

export {
    reducePlayerHP,
    showAttackResult,
    showCombatMessage,
    showEnemyDefeat
} from './ui/combatHelpers';

export {
    preloadAllWeaponEffects,
    preloadWeaponEffectSafe,
    checkImageExistsSafe,
    validateTextureState,
    checkImageExists
} from './assets/combatPreload';

export {
    showCombatUI,
    hideCombatUI,
    updateCombatUI
} from './ui/combatUI';

export {
    canExecuteCommand,
    requiresHitCommand,
    pauseGameExecution,
    resumeGameExecution,
    isGamePaused,
    isCombatResolved,
    getCombatResult
} from './core/combatUtils';
