// Knapsack algorithm visualization setup
import Phaser from "phaser";
import { getAlgoPayload } from '../../shared/levelType';

// Function to setup Knapsack problem display
export function setupKnapsack(scene) {

  const data = getAlgoPayload(scene.levelData, 'KNAPSACK');
  if (!data) {
    return;
  }

  scene.knapsack = {
    bag: null,
    items: []
  };

  // Setup bag (กระเป๋า)
  if (data.bag) {
    const bagX = 1050;
    const bagY = 500;

    const bag = scene.add.image(bagX, bagY, 'bag');
    bag.setScale(0.8); // ขยายขนาดย่อกระเป๋าให้ชัดขึ้น
    bag.setDepth(5);

    // ความจุของกระเป๋า (วางไว้ด้านล่าง)
    const capacityStr = data.capacity ? `Max: ${data.capacity} kg` : 'กระเป๋า';
    const capacityText = scene.add.text(bagX, bagY + 100, capacityStr, {
      fontSize: '24px',
      color: '#ff5555',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(6);

    bag.capacityText = capacityText;
    scene.knapsack.bag = bag;
  }

  // Setup items (สมบัติ)
  if (data.items && Array.isArray(data.items)) {
    const startX = 90;
    const startY = 280;
    const spacingY = 130;

    data.items.forEach((itemData, index) => {
      const itemX = startX;
      const itemY = startY + (index * spacingY);

      const crownIndex = (index % 3) + 1;
      const crownKey = `crown-${crownIndex}`;

      // ขยายสมบัติให้ใหญ่ขึ้นเพื่อความมินิมอลและเห็นชัด
      const item = scene.add.image(itemX, itemY, crownKey);
      item.setScale(1.8);
      item.setDepth(7);

      item.setData({
        id: itemData.id,
        weight: itemData.weight,
        price: itemData.price,
        label: itemData.label,
        selected: false
      });

      // Label วางด้านล่างสมบัติแบบเรียบๆ
      const itemLabelStr = itemData.label || `⚖️ ${itemData.weight}kg  💰 $${itemData.price}`;
      const itemLabelText = scene.add.text(itemX, itemY + 50, itemLabelStr, {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5, 0.5).setDepth(8);

      item.labelText = itemLabelText;

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
  }
}
