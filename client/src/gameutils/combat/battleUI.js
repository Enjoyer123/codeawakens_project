// Phaser Game Combat UI Functions

// Function to clean up combat UI when monster is defeated
export function cleanupMonsterUI(scene, monster) {
  if (monster.combatUI) {
    monster.combatUI.destroy();
    monster.combatUI = null;
  }

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
