// Combat Effects - Main Aggregator
// Re-exports all combat effect functions from specialized modules

export { attackEnemy, showEffectWeaponFixed } from './weaponEffects';
export {
  createSingleSpriteEffect,
  loadSingleSpriteEffect,
  createCanvasBasedEffect,
  animateTextureFrames,
  showFallbackEffect
} from './animationUtils';
export { createDeathExplosion } from './deathEffects';
