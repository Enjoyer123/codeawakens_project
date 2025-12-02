// Phaser Game Effects Functions
import Phaser from "phaser";
import { createRescueEffect, createFirework } from './phaserGameVictory';

// Function to create pit fall effect
export function createPitFallEffect(scene) {
  console.log("Creating pit fall effect");

  if (!scene.player) return;

  // Create falling animation
  scene.tweens.add({
    targets: [scene.player, scene.playerBorder],
    y: scene.player.y + 50,
    alpha: 0.3,
    scaleX: 0.8,
    scaleY: 0.8,
    duration: 1000,
    ease: 'Power2',
    onComplete: () => {
      // Keep player in pit position for Game Over
      scene.tweens.add({
        targets: [scene.player, scene.playerBorder],
        alpha: 0.5,
        scaleX: 0.6,
        scaleY: 0.6,
        duration: 500,
        ease: 'Power2'
      });
    }
  });

  // Create splash effect
  const splash = scene.add.circle(scene.player.x, scene.player.y, 30, 0x000000, 0.6);
  scene.tweens.add({
    targets: splash,
    scaleX: 2,
    scaleY: 2,
    alpha: 0,
    duration: 800,
    ease: 'Power2',
    onComplete: () => {
      splash.destroy();
    }
  });
}

// Function to show Game Over screen
export function showGameOver(scene) {
  if (scene.gameOverTriggered) return;
  scene.gameOverTriggered = true;

  // Player died

  scene.isExecuting = false;
  scene.isPaused = false;

  const gameOverText = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY - 50,
    'GAME OVER', {
    fontSize: '48px',
    color: '#ff0000',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 4
  });
  gameOverText.setOrigin(0.5);
  gameOverText.setDepth(200);
  gameOverText.setScrollFactor(0);

  // Update hint text if it exists
  if (scene.hintText) {
    scene.hintText.setText('Game Over! Press R to reset and try again!');
  }

  scene.tweens.add({
    targets: gameOverText,
    scaleX: 1.1,
    scaleY: 1.1,
    duration: 1000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  const darkOverlay = scene.add.rectangle(scene.cameras.main.centerX, scene.cameras.main.centerY,
    scene.cameras.main.width, scene.cameras.main.height, 0x000000, 0.7);
  darkOverlay.setDepth(199);
  darkOverlay.setScrollFactor(0);

  // Store references for cleanup
  scene.gameOverText = gameOverText;
  scene.gameOverOverlay = darkOverlay;

  scene.gameWon = false;
}

// Function to clear Game Over screen
export function clearGameOverScreen(scene) {
  if (scene.gameOverText) {
    scene.gameOverText.destroy();
    scene.gameOverText = null;
  }
  if (scene.gameOverOverlay) {
    scene.gameOverOverlay.destroy();
    scene.gameOverOverlay = null;
  }
  scene.gameOverTriggered = false;
}

// Function to show Victory screen
export function showVictory(scene, victoryType = 'normal') {
  const victoryText = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY - 50,
    'VICTORY!', {
    fontSize: '48px',
    color: '#ffff00',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 4
  });
  victoryText.setOrigin(0.5);
  victoryText.setDepth(200);
  victoryText.setScrollFactor(0);

  let subtitleText;
  if (victoryType === 'rescue') {
    subtitleText = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY + 10,
      'All people rescued and goal reached!', {
      fontSize: '24px',
      color: '#00ff00',
      fontStyle: 'bold'
    });
  } else {
    subtitleText = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY + 10,
      'All enemies defeated and goal reached!', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
  }
  subtitleText.setOrigin(0.5);
  subtitleText.setDepth(200);
  subtitleText.setScrollFactor(0);

  scene.tweens.add({
    targets: victoryText,
    scaleX: 1.2,
    scaleY: 1.2,
    duration: 1000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  scene.tweens.add({
    targets: subtitleText,
    alpha: 0.5,
    duration: 1500,
    yoyo: true,
    repeat: -1
  });

  // เพิ่มเอฟเฟกต์พิเศษสำหรับด่านช่วยคน
  if (victoryType === 'rescue') {
    // แสดงข้อความพิเศษสำหรับการช่วยคน
    const rescueMessage = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY + 50,
      '🎉 Mission Accomplished! 🎉', {
      fontSize: '20px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    rescueMessage.setOrigin(0.5);
    rescueMessage.setDepth(200);
    rescueMessage.setScrollFactor(0);

    // เอฟเฟกต์พิเศษสำหรับการช่วยคน
    scene.time.addEvent({
      delay: 300,
      callback: () => createRescueEffect(scene),
      repeat: 8
    });
  } else {
    // เอฟเฟกต์ปกติ
    scene.time.addEvent({
      delay: 500,
      callback: () => createFirework(scene),
      repeat: 10
    });
  }
}

