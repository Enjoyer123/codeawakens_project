// Knapsack algorithm visualization setup
import Phaser from "phaser";

// Function to setup Knapsack problem display
export function setupKnapsack(scene) {
  console.log('ðŸ” setupKnapsack called');
  console.log('ðŸ” scene.levelData:', scene.levelData);
  console.log('ðŸ” scene.levelData.knapsackData:', scene.levelData?.knapsackData);

  if (!scene.levelData || !scene.levelData.knapsackData) {
    console.log('âš ï¸ No knapsackData found, skipping setup');
    return;
  }

  const knapsackData = scene.levelData.knapsackData;
  console.log('âœ… Knapsack data found:', knapsackData);
  scene.knapsack = {
    bag: null,
    items: []
  };

  // Setup bag (à¸à¸£à¸°à¹€à¸›à¹‹à¸²) - à¸ªà¸µà¹ˆà¹€à¸«à¸¥à¸µà¹ˆà¸¢à¸¡
  if (knapsackData.bag) {
    const bagX = knapsackData.bag.x || 400;
    const bagY = knapsackData.bag.y || 450;
    const bagLabel = knapsackData.bag.label || 'à¸à¸£à¸°à¹€à¸›à¹‹à¸²';

    // Create bag as Image
    const bag = scene.add.image(bagX, bagY, 'bag');
    bag.setScale(0.8); // Increased from 0.5
    bag.setDepth(5);

    // Add bag label
    const bagLabelText = scene.add.text(bagX, bagY - 100, bagLabel, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    });
    bagLabelText.setOrigin(0.5, 0.5);
    bagLabelText.setDepth(6);

    // Add capacity label if available
    if (knapsackData.capacity) {
      const capacityText = scene.add.text(bagX, bagY, `${knapsackData.capacity} kg`, {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      });
      capacityText.setOrigin(0.5, 0.5);
      capacityText.setDepth(6);
      bag.capacityText = capacityText;
    }

    bag.labelText = bagLabelText;
    scene.knapsack.bag = bag;

    console.log(`Setup knapsack bag at (${bagX}, ${bagY})`);
  }

  // Setup items (à¸ªà¸¡à¸šà¸±à¸•à¸´) - à¸£à¸¹à¸›à¹€à¸žà¸Šà¸£
  if (knapsackData.items && Array.isArray(knapsackData.items)) {
    knapsackData.items.forEach((itemData, index) => {
      const itemX = itemData.x || 200;
      const itemY = itemData.y || 150;

      // Determine crown image: 1, 2, 3 based on index
      // User said "sorted 1 is left". The loop usually iterates items in order.
      // We'll map index 0 -> crown-1, 1 -> crown-2, 2 -> crown-3.
      // If there are more, we can cycle: (index % 3) + 1.
      const crownIndex = (index % 3) + 1;
      const crownKey = `crown-${crownIndex}`;

      // Create item as crown sprite
      const item = scene.add.image(itemX, itemY, crownKey);
      item.setScale(1.3); // Increased scale
      item.setDepth(7);

      // Add item data
      item.setData({
        id: itemData.id,
        weight: itemData.weight,
        price: itemData.price,
        label: itemData.label,
        selected: false // à¸ªà¸³à¸«à¸£à¸±à¸šà¹€à¸à¹‡à¸šà¸§à¹ˆà¸² item à¸–à¸¹à¸à¹€à¸¥à¸·à¸­à¸à¹à¸¥à¹‰à¸§à¸«à¸£à¸·à¸­à¸¢à¸±à¸‡
      });

      // Create item label - Positioned higher
      const itemLabel = itemData.label || `${itemData.weight} kg, ${itemData.price} baht`;
      const itemLabelText = scene.add.text(itemX, itemY - 70, itemLabel, {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
        padding: { x: 4, y: 2 }
      });
      itemLabelText.setOrigin(0.5, 0.5);
      itemLabelText.setDepth(8);

      // Removed redundant itemInfoText

      // Create glow effect
      const glowEffect = scene.add.circle(itemX, itemY, 30, 0xffd700, 0.3);
      glowEffect.setStrokeStyle(2, 0xffd700);
      glowEffect.setDepth(6);

      // Add pulsing animation
      scene.tweens.add({
        targets: [item, glowEffect],
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Store references
      item.labelText = itemLabelText;
      item.infoText = null;
      item.glowEffect = glowEffect;
      item.setData('glowEffect', glowEffect);

      scene.knapsack.items.push({
        id: itemData.id,
        sprite: item,
        weight: itemData.weight,
        price: itemData.price,
        label: itemData.label,
        x: itemX,
        y: itemY
      });
    });

    console.log(`Setup ${scene.knapsack.items.length} knapsack items`);
  }
}
