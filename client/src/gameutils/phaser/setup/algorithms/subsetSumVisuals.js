// Subset Sum algorithm visualization setup
import Phaser from "phaser";

// Function to setup Subset Sum problem display
export function setupSubsetSum(scene) {
  console.log('ðŸ” setupSubsetSum called');
  console.log('ðŸ” scene.levelData:', scene.levelData);
  console.log('ðŸ” scene.levelData.subsetSumData:', scene.levelData?.subsetSumData);

  if (!scene.levelData || !scene.levelData.subsetSumData) {
    console.log('âš ï¸ No subsetSumData found, skipping setup');
    return;
  }

  const subsetSumData = scene.levelData.subsetSumData;
  console.log('âœ… Subset Sum data found:', subsetSumData);
  scene.subsetSum = {
    side1: null,
    side2: null,
    warriors: []
  };

  // Setup side1 (à¸à¸±à¹ˆà¸‡à¸—à¸µà¹ˆ 1) - à¸ªà¸µà¹ˆà¹€à¸«à¸¥à¸µà¹ˆà¸¢à¸¡à¹‚à¸›à¸£à¹ˆà¸‡à¹ƒà¸ªà¹€à¸ªà¹‰à¸™à¸ªà¸µà¹€à¸«à¸¥à¸·à¸­à¸‡
  if (subsetSumData.side1) {
    const side1X = subsetSumData.side1.x || 200;
    const side1Y = subsetSumData.side1.y || 400;
    const side1Label = subsetSumData.side1.label || 'à¸à¸±à¹ˆà¸‡ 1';
    const side1Width = 150;
    const side1Height = 100;
    const targetSum = subsetSumData.target_sum !== undefined ? subsetSumData.target_sum : 0;

    // à¸ªà¸£à¹‰à¸²à¸‡ label à¸—à¸µà¹ˆà¸£à¸§à¸¡ target_sum
    const side1LabelWithTarget = `${side1Label}\n${targetSum}`;

    // Create side1 as rectangle with transparent fill and transparent stroke (hidden)
    const side1 = scene.add.rectangle(side1X, side1Y, side1Width, side1Height);
    side1.setFillStyle(0x000000, 0);
    side1.setStrokeStyle(0, 0x000000, 0); // Removed yellow stroke
    side1.setDepth(5);

    // Add side1 label with target_sum
    const side1LabelText = scene.add.text(side1X, side1Y - 60, side1LabelWithTarget, {
      fontSize: '24px', // Increased size
      color: '#ffffff',
      fontStyle: 'bold',
      // Removed black background for cleaner look, added stroke
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    });
    side1LabelText.setOrigin(0.5, 0.5);
    side1LabelText.setDepth(6);

    side1.labelText = side1LabelText;
    scene.subsetSum.side1 = side1;

    console.log(`Setup subset sum side1 at (${side1X}, ${side1Y})`);
  }

  // Setup side2 (à¸ à¸±à¹ˆà¸‡à¸—à¸µà¹ˆ 2) - à¸ªà¸µà¹ˆà¹€à¸«à¸¥à¸µà¹ˆà¸¢à¸¡à¹‚à¸›à¸£à¹ˆà¸‡à¹ƒà¸ªà¹€à¸ªà¹‰à¸™à¸ªà¸µà¹€à¸«à¸¥à¸·à¸­à¸‡
  if (subsetSumData.side2) {
    const side2X = subsetSumData.side2.x || 600;
    const side2Y = subsetSumData.side2.y || 400;
    const side2Label = subsetSumData.side2.label || 'à¸ à¸±à¹ˆà¸‡ 2';
    const side2Width = 150;
    const side2Height = 100;
    const targetSum = subsetSumData.target_sum !== undefined ? subsetSumData.target_sum : 0;

    // à¸ªà¸£à¹‰à¸²à¸‡ label à¸—à¸µà¹ˆà¸£à¸§à¸¡ target_sum
    const side2LabelWithTarget = `${side2Label}\n${targetSum}`;

    // Create side2 as rectangle with transparent fill and transparent stroke (hidden)
    const side2 = scene.add.rectangle(side2X, side2Y, side2Width, side2Height);
    side2.setFillStyle(0x000000, 0);
    side2.setStrokeStyle(0, 0x000000, 0); // Removed yellow stroke
    side2.setDepth(5);

    // Add side2 label with target_sum
    const side2LabelText = scene.add.text(side2X, side2Y - 60, side2LabelWithTarget, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    });
    side2LabelText.setOrigin(0.5, 0.5);
    side2LabelText.setDepth(6);

    side2.labelText = side2LabelText;
    scene.subsetSum.side2 = side2;

    console.log(`Setup subset sum side2 at (${side2X}, ${side2Y})`);
  }

  // Setup warriors (à¸™à¸±à¸à¸£à¸š) - à¸§à¸‡à¸à¸¥à¸¡à¸ªà¸µà¹à¸”à¸‡
  if (subsetSumData.warriors_display && Array.isArray(subsetSumData.warriors_display)) {
    subsetSumData.warriors_display.forEach((warriorData) => {
      const warriorX = warriorData.x || 200;
      const warriorY = warriorData.y || 150;
      const warriorPower = warriorData.power || 0;
      const warriorLabel = warriorData.label || `${warriorPower}`;

      // Create warrior as org1 Sprite
      const warrior = scene.add.image(warriorX, warriorY, 'org1');
      warrior.setScale(1.5);
      warrior.setDepth(7);

      // Add warrior data
      warrior.setData({
        id: warriorData.id,
        power: warriorPower,
        label: warriorLabel,
        selected: false,
        side: null
      });

      // Create warrior label (à¹ à¸ªà¸”à¸‡à¸žà¸¥à¸±à¸‡) - Moved higher
      const warriorLabelText = scene.add.text(warriorX, warriorY - 50, warriorLabel, {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      });
      warriorLabelText.setOrigin(0.5, 0.5);
      warriorLabelText.setDepth(8);

      // Add power text above sprite (replaces inside circle text)
      const powerText = scene.add.text(warriorX, warriorY - 70, warriorPower.toString(), {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      });
      powerText.setOrigin(0.5, 0.5);
      powerText.setDepth(8);

      // Store references
      warrior.labelText = warriorLabelText;
      warrior.powerText = powerText;

      scene.subsetSum.warriors.push({
        id: warriorData.id,
        sprite: warrior,
        power: warriorPower,
        label: warriorLabel,
        x: warriorX,
        y: warriorY,
        originalX: warriorX, // Store original position for reset
        originalY: warriorY
      });
    });

    console.log(`Setup ${scene.subsetSum.warriors.length} subset sum warriors`);
  } else if (subsetSumData.warriors && Array.isArray(subsetSumData.warriors)) {
    // à¸–à¹‰à¸²à¹„à¸¡à¹ˆà¸¡à¸µ warriors_display à¹ƒà¸«à¹‰à¹ƒà¸Šà¹‰ warriors array à¸¡à¸²à¸ªà¸£à¹‰à¸²à¸‡à¹€à¸­à¸‡
    const spacing = 150;
    const startX = 200;
    const startY = 150;

    subsetSumData.warriors.forEach((power, index) => {
      const warriorX = startX + (index * spacing);
      const warriorY = startY;
      const warriorLabel = power.toString();

      // Create warrior as org1 Sprite
      const warrior = scene.add.image(warriorX, warriorY, 'org1');
      warrior.setScale(1.5);
      warrior.setDepth(7);

      // Add warrior data
      warrior.setData({
        id: index + 1,
        power: power,
        label: warriorLabel,
        selected: false,
        side: null
      });

      // Create warrior label
      const warriorLabelText = scene.add.text(warriorX, warriorY - 50, warriorLabel, {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      });
      warriorLabelText.setOrigin(0.5, 0.5);
      warriorLabelText.setDepth(8);

      // Add power text
      const powerText = scene.add.text(warriorX, warriorY - 70, power.toString(), {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      });
      powerText.setOrigin(0.5, 0.5);
      powerText.setDepth(8);

      // Store references
      warrior.labelText = warriorLabelText;
      warrior.powerText = powerText;

      scene.subsetSum.warriors.push({
        id: index + 1,
        sprite: warrior,
        power: power,
        label: warriorLabel,
        x: warriorX,
        y: warriorY,
        originalX: warriorX, // Store original position for reset
        originalY: warriorY
      });
    });

    console.log(`Setup ${scene.subsetSum.warriors.length} subset sum warriors from warriors array`);
  }
}

