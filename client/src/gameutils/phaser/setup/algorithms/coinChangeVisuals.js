// Coin Change algorithm visualization setup
import Phaser from "phaser";

// Function to setup Coin Change problem display
export function setupCoinChange(scene) {
  console.log('ðŸ” setupCoinChange called');
  console.log('ðŸ” scene.levelData:', scene.levelData);
  console.log('ðŸ” scene.levelData.coinChangeData:', scene.levelData?.coinChangeData);

  if (!scene.levelData || !scene.levelData.coinChangeData) {
    console.log('âš ï¸ No coinChangeData found, skipping setup');
    return;
  }

  const coinChangeData = scene.levelData.coinChangeData;
  console.log('âœ… Coin Change data found:', coinChangeData);

  const monsterPower = coinChangeData.monster_power || 32;
  const warriors = coinChangeData.warriors || [1, 5, 10, 25]; // Default warriors levels

  scene.coinChange = {
    monster: null,
    warriors: [],
    selectedBox: null
  };

  // Setup warriors (à¸™à¸±à¸à¸£à¸š 4 à¸£à¸°à¸”à¸±à¸š) - à¹à¸ªà¸”à¸‡à¸”à¹‰à¸²à¸™à¸šà¸™
  // à¹à¸•à¹ˆà¸¥à¸°à¸Šà¸¸à¸”à¸¡à¸µ: square à¸”à¹‰à¸²à¸™à¸šà¸™ (dotted outline) + blue circle à¸”à¹‰à¸²à¸™à¸¥à¹ˆà¸²à¸‡
  const warriorStartX = 150;
  const warriorY = 150;
  const warriorSpacing = 150;

  warriors.forEach((power, index) => {
    const warriorX = warriorStartX + (index * warriorSpacing);
    const warriorNumber = index + 1; // 1, 2, 3, 4

    // Determine character sprite based on power
    let characterSprite;

    // Target position: Replace the circle position (warriorY + 60)
    const spriteY = warriorY + 60;
    const textY = warriorY; // Above the sprite

    // 1 = Slime (Static from bot folder)
    if (power === 1) {
      characterSprite = scene.add.image(warriorX, spriteY, 'bot_slime1');
      characterSprite.setScale(1.6);
    }
    // 5 = Org1
    else if (power === 5) {
      characterSprite = scene.add.image(warriorX, spriteY, 'org1');
      characterSprite.setScale(1.6);
    }
    // 10 = Org2
    else if (power === 10) {
      characterSprite = scene.add.image(warriorX, spriteY, 'org2');
      characterSprite.setScale(1.6);
    }
    // 25 = Org3
    else if (power === 25) {
      characterSprite = scene.add.image(warriorX, spriteY, 'org3');
      characterSprite.setScale(1.6);
    }
    // Fallback for others
    else {
      const fallbackText = scene.add.text(warriorX, spriteY, '?', { fontSize: '24px', color: '#000', fontStyle: 'bold' }).setOrigin(0.5);
      characterSprite = fallbackText;
    }

    if (characterSprite.setDepth) characterSprite.setDepth(8);

    // Keep reference
    const powerSquare = characterSprite;

    // Text showing power value (1, 5, 10, 25)
    // Positioned above the sprite
    const powerText = scene.add.text(warriorX, textY, power.toString(), {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    powerText.setOrigin(0.5, 0.5);
    powerText.setDepth(9);

    // Removed: Blue circle and index number (1, 2, 3, 4) as requested

    scene.coinChange.warriors.push({
      power: power,
      index: index,
      number: warriorNumber,
      powerSquare: powerSquare, // Now the sprite
      powerText: powerText,
      circle: null, // Removed
      numberText: null, // Removed
      x: warriorX,
      y: spriteY,
      originalX: warriorX,
      originalY: spriteY
    });
  });

  // Setup monster (Target Amount) - displayed on the right
  const monsterX = 900;
  const monsterY = 150;

  // Use Human Sprite instead of red circle
  const monsterSprite = scene.add.image(monsterX, monsterY + 60, 'bot_humen1');
  monsterSprite.setScale(2.2);
  monsterSprite.setDepth(7);

  // Power Text (formerly "Monster Power") - positioned above sprite
  const monsterPowerText = scene.add.text(monsterX, monsterY, monsterPower.toString(), {
    fontSize: '24px',
    color: '#000000',
    fontStyle: 'bold'
  });
  monsterPowerText.setOrigin(0.5, 0.5);
  monsterPowerText.setDepth(8);

  // Removed: Power Square (box around text) if desired, or keep it?
  // User asked to replace "circle". I'll keep the power text.
  // Previous code had a "dotted square" for power. I'll remove it for cleaner look if I follow the "warrior" pattern.
  // The warriors has text with stroke. I'll do the same here for consistency.

  monsterPowerText.setStyle({
    fontSize: '24px',
    color: '#ffffff',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 4
  });

  scene.coinChange.monster = {
    power: monsterPower,
    powerSquare: null, // Removed
    powerText: monsterPowerText,
    circle: null, // Removed
    labelText: null, // Removed "Monster" text
    sprite: monsterSprite, // Added reference
    x: monsterX,
    y: monsterY
  };

  // Setup large rectangular box (à¸”à¹‰à¸²à¸™à¸¥à¹ˆà¸²à¸‡à¸‹à¹‰à¸²à¸¢) - à¸ªà¸³à¸«à¸£à¸±à¸šà¹à¸ªà¸”à¸‡à¸œà¸¥à¸™à¸±à¸à¸£à¸šà¸—à¸µà¹ˆà¹€à¸¥à¸·à¸­à¸
  const boxX = 400; // à¸‚à¸¢à¸±à¸šà¹„à¸›à¸—à¸²à¸‡à¸‚à¸§à¸²
  const boxY = 500; // à¸‚à¸¢à¸±à¸šà¸‚à¸¶à¹‰à¸™à¸¡à¸²à¸­à¸µà¸
  const boxWidth = 400;
  const boxHeight = 200;

  // const selectedBox = scene.add.graphics();
  // selectedBox.lineStyle(4, 0x000000, 1);
  // selectedBox.strokeRoundedRect(boxX - boxWidth / 2, boxY - boxHeight / 2, boxWidth, boxHeight, 10);
  // selectedBox.setDepth(5);

  scene.coinChange.selectedBox = {
    graphics: null, // selectedBox,
    x: boxX,
    y: boxY,
    width: boxWidth,
    height: boxHeight
  };

  console.log(`Setup Coin Change: ${warriors.length} warriors, monster power: ${monsterPower}`);
}

