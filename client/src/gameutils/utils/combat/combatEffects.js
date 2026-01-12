// Combat Effects - Main Aggregator
// Re-exports all combat effect functions from specialized modules

export { attackEnemy, showEffectWeaponFixed } from './effects/weaponEffects';
export {
  createSingleSpriteEffect,
  loadSingleSpriteEffect,
  createCanvasBasedEffect,
  animateTextureFrames,
  showFallbackEffect
} from './effects/animationUtils';
export { createDeathExplosion } from './effects/deathEffects';
