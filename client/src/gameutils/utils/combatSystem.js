// Combat System - Re-export hub
// This file now acts as a re-export hub for all combat-related functionality

// Re-export from sub-modules
export {
  initiateCombat,
  endCombat,
  isInCombat,
  executePlayerAttack
} from './combat/combatCore';

export {
  attackEnemy,
  showEffectWeaponFixed,
  createDeathExplosion
} from './combat/combatEffects';

export {
  calculateAttackDamage,
  calculatePlayerDamage
} from './combat/combatDamage';

export {
  reducePlayerHP,
  showAttackResult,
  showCombatMessage,
  showEnemyDefeat
} from './combat/combatHelpers';

export {
  preloadAllWeaponEffects,
  preloadWeaponEffectSafe,
  checkImageExistsSafe,
  validateTextureState,
  checkImageExists
} from './combat/combatPreload';

export {
  showCombatUI,
  hideCombatUI,
  updateCombatUI
} from './combat/combatUI';

export {
  canExecuteCommand,
  requiresHitCommand,
  pauseGameExecution,
  resumeGameExecution,
  isGamePaused,
  isCombatResolved,
  getCombatResult
} from './combat/combatUtils';
