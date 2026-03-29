// Subset Sum algorithm visualization setup
import Phaser from "phaser";
import { getAlgoPayload } from '../../shared/levelType';

// Function to setup Subset Sum problem display
export function setupSubsetSum(scene) {

  const data = getAlgoPayload(scene.levelData, 'SUBSETSUM');
  if (!data) {
    return;
  }

  const targetSum = data.target_sum !== undefined ? data.target_sum : 0;
  // Get warriors array from warriors_display or fallback to warriors
  const warriorsData = data.warriors_display && Array.isArray(data.warriors_display)
    ? data.warriors_display.map(w => w.power !== undefined ? w.power : w)
    : (Array.isArray(data.warriors) ? data.warriors : []);

  scene.subsetSum = {
    monster: null,
    warriors: [],
    targetSum: targetSum
  };

  // Setup Warriors (นักรบ) ชิดซ้าย เรียงแนวตั้งเหมือน Coin Change
  const startX = 90;
  const startY = 280;
  const spacingY = 120;

  warriorsData.forEach((power, index) => {
    const warriorX = startX;
    const spriteY = startY + (index * spacingY);

    // สุ่มหรือเรียงรูปภาพ sprite เพื่อความหลากหลาย
    const spriteKeys = ['bot_slime1', 'org1', 'org2', 'org3'];
    const safeIndex = index % spriteKeys.length;

    const characterSprite = scene.add.image(warriorX, spriteY, spriteKeys[safeIndex]).setScale(1.6).setDepth(8);

    const powerText = scene.add.text(warriorX, spriteY + 45, `Power: ${power}`, {
      fontSize: '20px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5, 0.5).setDepth(9);

    scene.subsetSum.warriors.push({
      power, index, id: index + 1,
      sprite: characterSprite, powerText,
      x: warriorX, y: spriteY, originalX: warriorX, originalY: spriteY
    });
  });

  // Setup Target Entity (บอสฝั่งขวา) ตัวแทนของ Target Sum
  const monsterX = 1050;
  const monsterY = 300;

  // ใช้ sprite บอสเพื่อความสวยงาม
  const monsterSprite = scene.add.image(monsterX, monsterY + 60, 'bot_humen1').setScale(2.2).setDepth(7);

  const monsterPowerText = scene.add.text(monsterX, monsterY, `Target: ${targetSum}`, {
    fontSize: '24px', color: '#ff5555', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
  }).setOrigin(0.5).setDepth(8);

  scene.subsetSum.monster = {
    power: targetSum, powerText: monsterPowerText, sprite: monsterSprite,
    x: monsterX, y: monsterY
  };

}
