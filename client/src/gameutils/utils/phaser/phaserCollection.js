// Phaser collection and interaction functions
import Phaser from "phaser";

// Function to update person display
export function updatePersonDisplay(scene) {
  if (!scene.people || !scene.levelData || !scene.levelData.people) return;

  scene.people.forEach((person) => {
    const nodeId = person.getData('nodeId');
    const personData = scene.levelData.people.find(p => p.nodeId === nodeId);
    const rescued = personData ? personData.rescued : false;

    if (rescued) {
      // Hide person when rescued
      person.setVisible(false);
      if (person.nameLabel) {
        person.nameLabel.setVisible(false);
      }
      if (person.rescueEffect) {
        person.rescueEffect.setVisible(false);
      }
    } else {
      // Show person when not rescued
      person.setVisible(true);
      if (person.nameLabel) {
        person.nameLabel.setVisible(true);
      }
      if (person.rescueEffect) {
        person.rescueEffect.setVisible(true);
      }
    }
  });
}

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

// Function to rescue person at position
export function rescuePersonAtPosition(scene, playerX, playerY) {
  if (!scene.people) return false;

  const rescueRange = 50; // Range to rescue person

  for (let person of scene.people) {
    if (person.getData('rescue')) continue; // Already rescued

    const distance = Phaser.Math.Distance.Between(playerX, playerY, person.x, person.y);

    if (distance <= rescueRange) {
      // Rescue the person
      person.setData('rescue', true);

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

      console.log(`Rescued ${person.getData('personName')} at node ${person.getData('nodeId')}`);
      return true;
    }
  }

  return false;
}

export function collectCoinByPlayer(scene, playerX, playerY) {
  if (!scene.coins) {
    console.log("No coins array found in scene");
    return false;
  }

  console.log(`=== PLAYER COIN COLLECTION DEBUG ===`);
  console.log(`Player position: (${playerX}, ${playerY})`);
  console.log(`Total coins: ${scene.coins.length}`);

  // Show available coins
  const availableCoins = scene.coins.filter(c => !c.collected);
  console.log('Available coins:', availableCoins.map(c => ({ id: c.id, x: c.x, y: c.y, value: c.value })));

  // Find all coins within range and sort by distance
  const coinsInRange = [];

  for (let coin of scene.coins) {
    if (!coin.collected) {
      // Check if player is close enough to the coin (within 100 pixels)
      const distance = Math.sqrt(
        Math.pow(playerX - coin.x, 2) + Math.pow(playerY - coin.y, 2)
      );

      console.log(`Coin ${coin.id} (${coin.value} points) at (${coin.x}, ${coin.y}), distance: ${distance.toFixed(2)}, can collect: ${distance <= 100}`);

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
    console.log(`Coin ${coin.value} collected, should be added to player coins`);

    // Show collection effect
    showCoinCollectionEffect(scene, coin.sprite.x, coin.sprite.y, coin.value);

    console.log(`🎯 Collecting coin ${coin.id} (${coin.value} points) at distance ${distance.toFixed(2)}!`);
  }

  // Return true if any coins were collected
  return coinsInRange.length > 0;

  console.log("No coin to collect at current position");
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
    console.log("haveCoinAtPosition: No coins array found in scene");
    return false;
  }

  console.log(`haveCoinAtPosition: Checking coins for player at (${playerX}, ${playerY})`);

  const result = scene.coins.some(coin => {
    if (coin.collected) return false;

    // Check if player is close enough to the coin (within 100 pixels)
    const distance = Math.sqrt(
      Math.pow(playerX - coin.x, 2) + Math.pow(playerY - coin.y, 2)
    );

    console.log(`haveCoinAtPosition: Coin ${coin.value} at (${coin.x}, ${coin.y}), distance: ${distance.toFixed(2)}`);

    return distance <= 1000;
  });

  console.log(`haveCoinAtPosition result: ${result}`);
  return result;
}

