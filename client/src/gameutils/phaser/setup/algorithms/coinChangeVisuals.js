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

    // Square à¸”à¹‰à¸²à¸™à¸šà¸™ (dotted outline) - à¹à¸ªà¸”à¸‡à¸žà¸¥à¸±à¸‡
    // à¹ƒà¸Šà¹‰ rectangle à¸—à¸µà¹ˆà¸¡à¸µ fill à¹‚à¸›à¸£à¹ˆà¸‡à¹ƒà¸ªà¹à¸¥à¸° stroke à¹à¸—à¸™ (à¹€à¸žà¸·à¹ˆà¸­à¸„à¸§à¸²à¸¡à¸‡à¹ˆà¸²à¸¢)
    const powerSquare = scene.add.rectangle(warriorX, warriorY, 50, 50);
    powerSquare.setFillStyle(0xffffff, 0); // fill à¹‚à¸›à¸£à¹ˆà¸‡à¹ƒà¸ª
    powerSquare.setStrokeStyle(2, 0x000000, 0.8); // stroke à¸ªà¸µà¸”à¸³ (à¹ƒà¸Šà¹‰ alpha à¸•à¹ˆà¸³à¹€à¸žà¸·à¹ˆà¸­à¸”à¸¹à¹€à¸«à¸¡à¸·à¸­à¸™ dotted)
    powerSquare.setDepth(7);

    // Text à¹à¸ªà¸”à¸‡à¸žà¸¥à¸±à¸‡à¹ƒà¸™ square
    const powerText = scene.add.text(warriorX, warriorY, power.toString(), {
      fontSize: '20px',
      color: '#000000',
      fontStyle: 'bold'
    });
    powerText.setOrigin(0.5, 0.5);
    powerText.setDepth(8);

    // Blue circle à¸”à¹‰à¸²à¸™à¸¥à¹ˆà¸²à¸‡ (solid outline) - à¹à¸ªà¸”à¸‡à¸«à¸¡à¸²à¸¢à¹€à¸¥à¸‚
    const warriorCircle = scene.add.circle(warriorX, warriorY + 60, 30, 0x0066ff, 1); // à¸ªà¸µà¸Ÿà¹‰à¸²
    warriorCircle.setStrokeStyle(3, 0x0044cc); // à¹€à¸ªà¹‰à¸™à¸‚à¸­à¸šà¸ªà¸µà¸Ÿà¹‰à¸²à¹€à¸‚à¹‰à¸¡
    warriorCircle.setDepth(7);

    // Text à¹à¸ªà¸”à¸‡à¸«à¸¡à¸²à¸¢à¹€à¸¥à¸‚à¹ƒà¸™ circle
    const numberText = scene.add.text(warriorX, warriorY + 60, warriorNumber.toString(), {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    numberText.setOrigin(0.5, 0.5);
    numberText.setDepth(8);

    scene.coinChange.warriors.push({
      power: power,
      index: index,
      number: warriorNumber,
      powerSquare: powerSquare,
      powerText: powerText,
      circle: warriorCircle,
      numberText: numberText,
      x: warriorX,
      y: warriorY,
      originalX: warriorX,
      originalY: warriorY
    });
  });

  // Setup monster (à¸¡à¸­à¸™à¸ªà¹€à¸•à¸­à¸£à¹Œ) - à¸”à¹‰à¸²à¸™à¸‚à¸§à¸²
  const monsterX = 900; // à¸‚à¸¢à¸±à¸šà¹„à¸›à¸—à¸²à¸‡à¸‚à¸§à¸²
  const monsterY = 150;

  // Square à¸”à¹‰à¸²à¸™à¸šà¸™ (dotted outline) - à¹à¸ªà¸”à¸‡à¸žà¸¥à¸±à¸‡
  // à¹ƒà¸Šà¹‰ rectangle à¸—à¸µà¹ˆà¸¡à¸µ fill à¹‚à¸›à¸£à¹ˆà¸‡à¹ƒà¸ªà¹à¸¥à¸° stroke à¹à¸—à¸™ (à¹€à¸žà¸·à¹ˆà¸­à¸„à¸§à¸²à¸¡à¸‡à¹ˆà¸²à¸¢)
  const monsterPowerSquare = scene.add.rectangle(monsterX, monsterY, 50, 50);
  monsterPowerSquare.setFillStyle(0xffffff, 0); // fill à¹‚à¸›à¸£à¹ˆà¸‡à¹ƒà¸ª
  monsterPowerSquare.setStrokeStyle(2, 0x000000, 0.8); // stroke à¸ªà¸µà¸”à¸³ (à¹ƒà¸Šà¹‰ alpha à¸•à¹ˆà¸³à¹€à¸žà¸·à¹ˆà¸­à¸”à¸¹à¹€à¸«à¸¡à¸·à¸­à¸™ dotted)
  monsterPowerSquare.setDepth(7);

  // Text à¹à¸ªà¸”à¸‡à¸žà¸¥à¸±à¸‡à¹ƒà¸™ square
  const monsterPowerText = scene.add.text(monsterX, monsterY, monsterPower.toString(), {
    fontSize: '20px',
    color: '#000000',
    fontStyle: 'bold'
  });
  monsterPowerText.setOrigin(0.5, 0.5);
  monsterPowerText.setDepth(8);

  // Red circle à¸”à¹‰à¸²à¸™à¸¥à¹ˆà¸²à¸‡ (solid outline, filled light red) - à¹à¸ªà¸”à¸‡à¸„à¸³à¸§à¹ˆà¸² "Monster"
  const monsterCircle = scene.add.circle(monsterX, monsterY + 60, 40, 0xff6666, 1); // à¸ªà¸µà¹à¸”à¸‡à¸­à¹ˆà¸­à¸™
  monsterCircle.setStrokeStyle(3, 0xff0000); // à¹€à¸ªà¹‰à¸™à¸‚à¸­à¸šà¸ªà¸µà¹à¸”à¸‡à¹€à¸‚à¹‰à¸¡
  monsterCircle.setDepth(7);

  // Text à¹à¸ªà¸”à¸‡à¸„à¸³à¸§à¹ˆà¸² "Monster" à¹ƒà¸™ circle
  const monsterLabelText = scene.add.text(monsterX, monsterY + 60, 'Monster', {
    fontSize: '14px',
    color: '#ffffff',
    fontStyle: 'bold'
  });
  monsterLabelText.setOrigin(0.5, 0.5);
  monsterLabelText.setDepth(8);

  scene.coinChange.monster = {
    power: monsterPower,
    powerSquare: monsterPowerSquare,
    powerText: monsterPowerText,
    circle: monsterCircle,
    labelText: monsterLabelText,
    x: monsterX,
    y: monsterY
  };

  // Setup large rectangular box (à¸”à¹‰à¸²à¸™à¸¥à¹ˆà¸²à¸‡à¸‹à¹‰à¸²à¸¢) - à¸ªà¸³à¸«à¸£à¸±à¸šà¹à¸ªà¸”à¸‡à¸œà¸¥à¸™à¸±à¸à¸£à¸šà¸—à¸µà¹ˆà¹€à¸¥à¸·à¸­à¸
  const boxX = 400; // à¸‚à¸¢à¸±à¸šà¹„à¸›à¸—à¸²à¸‡à¸‚à¸§à¸²
  const boxY = 500; // à¸‚à¸¢à¸±à¸šà¸‚à¸¶à¹‰à¸™à¸¡à¸²à¸­à¸µà¸
  const boxWidth = 400;
  const boxHeight = 200;

  const selectedBox = scene.add.graphics();
  selectedBox.lineStyle(4, 0x000000, 1);
  selectedBox.strokeRoundedRect(boxX - boxWidth / 2, boxY - boxHeight / 2, boxWidth, boxHeight, 10);
  selectedBox.setDepth(5);

  scene.coinChange.selectedBox = {
    graphics: selectedBox,
    x: boxX,
    y: boxY,
    width: boxWidth,
    height: boxHeight
  };

  console.log(`Setup Coin Change: ${warriors.length} warriors, monster power: ${monsterPower}`);
}

