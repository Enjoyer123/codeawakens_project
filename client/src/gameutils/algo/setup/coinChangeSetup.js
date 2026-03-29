/**
 * Setup Coin Change Visuals (ฉากพื้นฐานของนักรบและบอส)
 * ถูกเรียกใช้จาก GameScene.js ตอนโหลดด่าน
 */
import { getAlgoPayload } from '../../shared/levelType';

export function setupCoinChange(scene) {
    const data = getAlgoPayload(scene.levelData, 'COINCHANGE');
    if (!data) return;
    const monsterPower = data.monster_power;
    const warriors = data.warriors || [];

    scene.coinChange = { monster: null, warriors: [], selectedBox: null };

    // Setup Warriors (ชิดขอบซ้าย เรียงลงมาแนวตั้ง)
    const startX = 90, startY = 280, spacingY = 120;
    warriors.forEach((power, index) => {
        const warriorX = startX;
        const spriteY = startY + (index * spacingY);
        const spriteKeys = ['bot_slime1', 'org1', 'org2', 'org3'];
        const safeIndex = index % spriteKeys.length;

        const characterSprite = scene.add.image(warriorX, spriteY, spriteKeys[safeIndex]).setScale(1.6).setDepth(8);

        const powerText = scene.add.text(warriorX, spriteY + 45, `ATK: ${power}`, {
            fontSize: '20px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5, 0.5).setDepth(9);

        scene.coinChange.warriors.push({
            power, index, number: index + 1,
            powerSquare: characterSprite, powerText,
            x: warriorX, y: spriteY, originalX: warriorX, originalY: spriteY
        });
    });

    // Setup Monster (ชิดขอบขวา)
    const monsterX = 1050, monsterY = 300;
    const monsterSprite = scene.add.image(monsterX, monsterY + 60, 'bot_humen1').setScale(2.2).setDepth(7);

    const monsterPowerText = scene.add.text(monsterX, monsterY, `HP: ${monsterPower}`, {
        fontSize: '24px', color: '#ff5555', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(8);

    scene.coinChange.monster = {
        power: monsterPower, powerText: monsterPowerText, sprite: monsterSprite,
        x: monsterX, y: monsterY
    };

    // Setup box (invisible logic box used for coordinates if needed)
    scene.coinChange.selectedBox = { graphics: null, x: 400, y: 500, width: 400, height: 200 };

}
