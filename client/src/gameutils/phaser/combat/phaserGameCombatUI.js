// Phaser Game Combat UI Functions
import Phaser from "phaser";
import { isDefeat } from '../../phaser/enemies/enemyUtils';

// Combat UI System for Adventure Game Style
export function updateCombatUI(scene, monster, distance) {
  const combatRange = 120; // Distance to show combat UI
  const warningRange = 80;  // Distance to show warning
  const dangerRange = 50;   // Distance for danger state

  // Remove existing combat UI if too far
  if (distance > combatRange) {
    hideCombatUI(scene, monster);
    return;
  }

  // Show combat UI based on distance
  if (distance <= combatRange) {
    showCombatUI(scene, monster, distance, warningRange, dangerRange);
  }
}

// Function to update all combat UIs and manage multiple enemies
export function updateAllCombatUIs(scene) {
  if (!scene.monsters || !scene.player) return;

  // Find all nearby enemies
  const nearbyEnemies = [];

  scene.monsters.forEach((monster) => {
    if (isDefeat(monster.sprite) || monster.data?.defeated || monster.sprite.getData('defeated') || monster.isDefeated) return;

    const distance = Phaser.Math.Distance.Between(
      scene.player.x, scene.player.y,
      monster.sprite.x, monster.sprite.y
    );

    if (distance <= 120) { // Combat range
      nearbyEnemies.push({ monster, distance });
    }
  });

  // Sort by distance (closest first)
  nearbyEnemies.sort((a, b) => a.distance - b.distance);

  // Show UI for closest enemy only (or multiple if very close)
  nearbyEnemies.forEach((enemyData, index) => {
    if (index === 0 || enemyData.distance <= 60) {
      updateCombatUI(scene, enemyData.monster, enemyData.distance);
    } else {
      hideCombatUI(scene, enemyData.monster);
    }
  });
}

export function showCombatUI(scene, monster, distance, warningRange, dangerRange) {
  // Remove existing UI first
  hideCombatUI(scene, monster);

  // Determine UI state based on distance
  let uiState = 'safe';
  let uiColor = 0x00ff00; // Green
  let borderColor = 0x00aa00;

  if (distance <= dangerRange) {
    uiState = 'danger';
    uiColor = 0xff0000; // Red
    borderColor = 0xaa0000;
  } else if (distance <= warningRange) {
    uiState = 'warning';
    uiColor = 0xffaa00; // Orange
    borderColor = 0xaa6600;
  }

  // Create combat UI container
  const uiContainer = scene.add.container(0, 0);
  uiContainer.setDepth(100);
  monster.combatUI = uiContainer;

  // Background panel with rounded corners effect
  const panelWidth = 200;
  const panelHeight = 90;
  const panelX = scene.cameras.main.width - panelWidth - 10;
  const panelY = 50; // เพิ่มระยะห่างจากด้านบน

  // Main background
  const background = scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, uiColor, 0.85);
  background.setStrokeStyle(3, borderColor);
  uiContainer.add(background);

  // Add subtle gradient effect
  const gradient = scene.add.rectangle(panelX, panelY - 15, panelWidth - 10, 2, 0xffffff, 0.3);
  uiContainer.add(gradient);

  // Enemy name
  const enemyName = scene.add.text(panelX, panelY - 20, `🧛 ${monster.data.name || 'Vampire'}`, {
    fontSize: '14px',
    color: '#ffffff',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 2
  });
  enemyName.setOrigin(0.5);
  uiContainer.add(enemyName);

  // Distance indicator with icon
  const distanceIcon = scene.add.text(panelX - 70, panelY - 5, '📏', {
    fontSize: '12px'
  });
  distanceIcon.setOrigin(0.5);
  uiContainer.add(distanceIcon);

  const distanceText = scene.add.text(panelX - 40, panelY - 5, `${Math.round(distance)}px`, {
    fontSize: '12px',
    color: '#ffffff',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 1
  });
  distanceText.setOrigin(0, 0.5);
  uiContainer.add(distanceText);

  // Status text with enhanced styling
  let statusText = '';
  let statusColor = '#ffffff';
  let statusIcon = '';

  if (uiState === 'danger') {
    statusText = 'IN COMBAT RANGE!';
    statusColor = '#ff0000';
    statusIcon = '⚔️';
  } else if (uiState === 'warning') {
    statusText = 'APPROACHING!';
    statusColor = '#ffaa00';
    statusIcon = '⚠️';
  } else {
    statusText = 'DETECTED';
    statusColor = '#00ff00';
    statusIcon = '👁️';
  }

  const statusIconText = scene.add.text(panelX - 70, panelY + 10, statusIcon, {
    fontSize: '14px'
  });
  statusIconText.setOrigin(0.5);
  uiContainer.add(statusIconText);

  const status = scene.add.text(panelX - 40, panelY + 10, statusText, {
    fontSize: '10px',
    color: statusColor,
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 1
  });
  status.setOrigin(0, 0.5);
  uiContainer.add(status);

  // Health bar for enemy with icon
  const healthIcon = scene.add.text(panelX - 70, panelY + 25, '❤️', {
    fontSize: '10px'
  });
  healthIcon.setOrigin(0.5);
  uiContainer.add(healthIcon);

  const healthBarBg = scene.add.rectangle(panelX - 20, panelY + 25, 100, 6, 0x000000, 0.8);
  healthBarBg.setStrokeStyle(1, 0xffffff);
  uiContainer.add(healthBarBg);

  const currentHealth = monster.data.hp || monster.sprite.currentHealth || 3;
  const maxHealth = monster.data.maxHp || monster.sprite.maxHealth || 3;
  const healthPercentage = Math.max(0, currentHealth / maxHealth);

  // Health bar color based on percentage
  let healthBarColor = 0x00ff00; // Green
  if (healthPercentage <= 0.3) {
    healthBarColor = 0xff0000; // Red
  } else if (healthPercentage <= 0.6) {
    healthBarColor = 0xffaa00; // Orange
  }

  const healthBar = scene.add.rectangle(panelX - 70, panelY + 25, 100 * healthPercentage, 6, healthBarColor, 1);
  healthBar.setOrigin(0, 0.5);
  uiContainer.add(healthBar);

  // Health text
  const healthText = scene.add.text(panelX + 40, panelY + 25, `${currentHealth}/${maxHealth}`, {
    fontSize: '9px',
    color: '#ffffff',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 1
  });
  healthText.setOrigin(0.5);
  uiContainer.add(healthText);

  // Enemy level/danger indicator
  const enemyLevel = monster.data.level || 1;
  const levelText = scene.add.text(panelX + 70, panelY - 20, `Lv.${enemyLevel}`, {
    fontSize: '10px',
    color: '#ffff00',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 1
  });
  levelText.setOrigin(0.5);
  uiContainer.add(levelText);

  // Attack power indicator
  const attackPower = monster.data.damage || 25;
  const attackIcon = scene.add.text(panelX - 70, panelY + 40, '⚔️', {
    fontSize: '9px'
  });
  attackIcon.setOrigin(0.5);
  uiContainer.add(attackIcon);

  const attackText = scene.add.text(panelX - 40, panelY + 40, `${attackPower}`, {
    fontSize: '9px',
    color: '#ff6666',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 1
  });
  attackText.setOrigin(0, 0.5);
  uiContainer.add(attackText);

  // Add pulsing effect for danger state
  if (uiState === 'danger') {
    scene.tweens.add({
      targets: background,
      alpha: 0.6,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Add screen shake effect for danger (ลดความสั่นลงอีก)
    // scene.cameras.main.shake(30, 0.002);
  }

  // Add warning effect for warning state
  if (uiState === 'warning') {
    scene.tweens.add({
      targets: background,
      alpha: 0.7,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
  }
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

