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

    // Create bag as rectangle (à¸ªà¸µà¹ˆà¹€à¸«à¸¥à¸µà¹ˆà¸¢à¸¡)
    const bag = scene.add.rectangle(bagX, bagY, 200, 150, 0x8B4513, 1); // à¸ªà¸µà¸™à¹‰à¸³à¸•à¸²à¸¥
    bag.setStrokeStyle(3, 0x654321);
    bag.setDepth(5);

    // Add bag label
    const bagLabelText = scene.add.text(bagX, bagY - 80, bagLabel, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 5, y: 3 }
    });
    bagLabelText.setOrigin(0.5, 0.5);
    bagLabelText.setDepth(6);

    // Add capacity label if available
    if (knapsackData.capacity) {
      const capacityText = scene.add.text(bagX, bagY, `${knapsackData.capacity} kg`, {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 5, y: 3 }
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
    knapsackData.items.forEach((itemData) => {
      const itemX = itemData.x || 200;
      const itemY = itemData.y || 150;

      // Create item as diamond shape (à¸£à¸¹à¸›à¹€à¸žà¸Šà¸£) - à¹€à¸«à¸¡à¸·à¸­à¸™ treasure
      const item = scene.add.polygon(itemX, itemY, [
        0, -20,  // top
        15, 0,   // right
        0, 20,   // bottom
        -15, 0   // left
      ], 0xffd700, 1); // à¸ªà¸µà¸—à¸­à¸‡
      item.setStrokeStyle(3, 0xffaa00);
      item.setDepth(7);

      // Add item data
      item.setData({
        id: itemData.id,
        weight: itemData.weight,
        price: itemData.price,
        label: itemData.label,
        selected: false // à¸ªà¸³à¸«à¸£à¸±à¸šà¹€à¸à¹‡à¸šà¸§à¹ˆà¸² item à¸–à¸¹à¸à¹€à¸¥à¸·à¸­à¸à¹à¸¥à¹‰à¸§à¸«à¸£à¸·à¸­à¸¢à¸±à¸‡
      });

      // Create item label
      const itemLabel = itemData.label || `${itemData.weight} kg, ${itemData.price} baht`;
      const itemLabelText = scene.add.text(itemX, itemY - 35, itemLabel, {
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 }
      });
      itemLabelText.setOrigin(0.5, 0.5);
      itemLabelText.setDepth(8);

      // Add weight and price text
      const itemInfoText = scene.add.text(itemX, itemY, `${itemData.weight}kg / ${itemData.price}à¸¿`, {
        fontSize: '10px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 3, y: 1 }
      });
      itemInfoText.setOrigin(0.5, 0.5);
      itemInfoText.setDepth(8);

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
      item.infoText = itemInfoText;
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
