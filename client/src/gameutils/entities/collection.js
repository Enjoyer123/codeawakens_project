// Phaser collection and interaction functions
import Phaser from "phaser";
import { updateGoalUI } from '../setup/uiManager';


// Function to update treasure display
export function updateTreasureDisplay(scene) {
  if (!scene.treasures || !scene.levelData || !scene.levelData.treasures) return;

  scene.treasures.forEach((treasure) => {
    const nodeId = treasure.getData('nodeId');
    const treasureData = scene.levelData.treasures.find(t => t.nodeId === nodeId);
    const collected = treasureData ? treasureData.collected : false;

    if (collected) {
      // Hide treasure when collected
      treasure.setVisible(false);
      if (treasure.nameLabel) {
        treasure.nameLabel.setVisible(false);
      }
      if (treasure.glowEffect) {
        treasure.glowEffect.setVisible(false);
      }
    } else {
      // Show treasure when not collected
      treasure.setVisible(true);
      if (treasure.nameLabel) {
        treasure.nameLabel.setVisible(true);
      }
      if (treasure.glowEffect) {
        treasure.glowEffect.setVisible(true);
      }
    }
  });
}

// Function to visually collect treasure (direct update)
export function collectTreasureVisual(scene, nodeId) {
  if (!scene.treasures) return;

  const treasure = scene.treasures.find(t => t.getData('nodeId') === nodeId);
  if (treasure) {
    treasure.setVisible(false);
    if (treasure.nameLabel) treasure.nameLabel.setVisible(false);
    if (treasure.glowEffect) treasure.glowEffect.setVisible(false);

    // Play collection effect similar to coins
    showCoinCollectionEffect(scene, treasure.x, treasure.y, 100); // Assume 100 points for treasure for visual effect

    // Update Phaser UI
    if (treasureData) treasureData.collected = true;
    const collectedCount = scene.levelData.treasures.filter(t => t.collected).length;
    updateGoalUI(scene, 'treasures', collectedCount);
  } else {
    console.warn(`⚠️ Visual update: Treasure at node ${nodeId} not found in scene`);
  }
}


// Function to visually rescue person (direct update)
export function rescuePersonVisual(scene, nodeId) {
  if (!scene.people) return;

  const person = scene.people.find(p => p.getData('nodeId') === nodeId);
  if (person) {

    // Show rescue effect
    const rescueEffect = person.getData('rescueEffect');
    if (rescueEffect) {
      rescueEffect.setVisible(true);
      scene.tweens.add({
        targets: rescueEffect,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 500,
        ease: "Power2",
        onComplete: () => {
          rescueEffect.setVisible(false);
          rescueEffect.setScale(1);
          rescueEffect.setAlpha(1);
        }
      });
    }

    // Hide person
    person.setVisible(false);
    if (person.nameLabel) {
      person.nameLabel.setVisible(false);
    }

    // Play collection effect (using green text)
    const personName = person.getData('personName') || 'Person';
    const effect = scene.add.text(person.x, person.y, `Saved ${personName}!`, {
      fontSize: '14px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    effect.setOrigin(0.5);
    effect.setDepth(20);

    scene.tweens.add({
      targets: effect,
      y: person.y - 40,
      alpha: 0,
      duration: 1500,
      ease: 'Power2.easeOut',
      onComplete: () => effect.destroy()
    });

    // Update Phaser UI
    if (scene.rescuedPeopleSet) scene.rescuedPeopleSet.add(nodeId);
    else scene.rescuedPeopleSet = new Set([nodeId]);
    updateGoalUI(scene, 'people', scene.rescuedPeopleSet.size);

  } else {
    console.warn(`⚠️ Visual update: Person at node ${nodeId} not found in scene`);
  }
}

export function collectCoinByPlayer(scene, playerX, playerY) {
  if (!scene.coins) {
    return false;
  }


  // Show available coins
  const availableCoins = scene.coins.filter(c => !c.collected);

  // Find all coins within range and sort by distance
  const coinsInRange = [];

  for (let coin of scene.coins) {
    if (!coin.collected) {
      // Check if player is close enough to the coin (within 100 pixels)
      const distance = Math.sqrt(
        Math.pow(playerX - coin.x, 2) + Math.pow(playerY - coin.y, 2)
      );


      if (distance <= 100) {
        coinsInRange.push({ coin, distance });
      }
    }
  }

  // Sort coins by distance (closest first)
  coinsInRange.sort((a, b) => a.distance - b.distance);

  // Collect all coins in range
  for (let { coin, distance } of coinsInRange) {
    // Mark coin as collected
    coin.collected = true;

    // Hide coin sprite and related elements
    coin.sprite.setVisible(false);
    const valueText = coin.sprite.getData('valueText');
    const glow = coin.sprite.getData('glow');
    if (valueText) valueText.setVisible(false);
    if (glow) glow.setVisible(false);

    // Add to player coins
    // Note: This will be handled by the calling function

    // Show collection effect
    showCoinCollectionEffect(scene, coin.sprite.x, coin.sprite.y, coin.value);

    // Update Phaser UI is now handled inside addCoinToPlayer (coinUtils.js)
  }

  // Return true if any coins were collected
  return coinsInRange.length > 0;

  return false;
}

export function showCoinCollectionEffect(scene, x, y, value) {
  // Create collection effect
  const effect = scene.add.text(x, y, `+${value}`, {
    fontSize: '16px',
    color: '#ffd700',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 2
  });
  effect.setOrigin(0.5);
  effect.setDepth(20);

  // Animate collection effect
  scene.tweens.add({
    targets: effect,
    y: y - 30,
    alpha: 0,
    scaleX: 1.5,
    scaleY: 1.5,
    duration: 1000,
    ease: 'Power2.easeOut',
    onComplete: () => effect.destroy()
  });

  // Create sparkle effect
  for (let i = 0; i < 6; i++) {
    const sparkle = scene.add.circle(x, y, 3, 0xffd700, 1);
    sparkle.setDepth(19);

    const angle = (i / 6) * Math.PI * 2;
    const distance = 20;

    scene.tweens.add({
      targets: sparkle,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      duration: 600,
      onComplete: () => sparkle.destroy()
    });
  }
}

export function haveCoinAtPosition(scene, playerX, playerY) {
  if (!scene.coins) {
    return false;
  }


  const result = scene.coins.some(coin => {
    if (coin.collected) return false;

    // Check if player is close enough to the coin (within 100 pixels)
    const distance = Math.sqrt(
      Math.pow(playerX - coin.x, 2) + Math.pow(playerY - coin.y, 2)
    );


    return distance <= 1000;
  });

  return result;
}

