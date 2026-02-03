// Phaser Game Combat UI Functions
import Phaser from "phaser";
import { isDefeat } from '../../phaser/enemies/enemyUtils';

// Combat UI System for Adventure Game Style
// Combat UI System - DISABLED by user request
export function updateCombatUI(scene, monster, distance) {
  // UI disabled
  return;
}

// Function to update all combat UIs and manage multiple enemies
export function updateAllCombatUIs(scene) {
  // UI disabled
  return;
}

export function showCombatUI(scene, monster, distance, warningRange, dangerRange) {
  // UI disabled
  return;
}

export function hideCombatUI(scene, monster) {
  if (monster.combatUI) {
    monster.combatUI.destroy();
    monster.combatUI = null;
  }
}

// Function to clean up combat UI when monster is defeated
export function cleanupMonsterUI(scene, monster) {
  hideCombatUI(scene, monster);

  // Hide health bars
  const healthBar = monster.sprite.getData('healthBar');
  const healthBarBg = monster.sprite.getData('healthBarBg');
  if (healthBar) healthBar.setVisible(false);
  if (healthBarBg) healthBarBg.setVisible(false);

  // Hide glow effect
  if (monster.glow) {
    monster.glow.setVisible(false);
  }
}

