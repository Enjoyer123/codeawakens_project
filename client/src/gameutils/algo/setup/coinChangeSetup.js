/**
 * Setup Coin Change Visuals (ฉากพื้นฐานของนักรบและบอส)
 * ถูกเรียกใช้จาก GameScene.js ตอนโหลดด่าน
 */
export function setupCoinChange(scene) {
    if (!scene.levelData || !scene.levelData.coin_change_data) return;
    const data = scene.levelData.coin_change_data;
    const monsterPower = data.monster_power;
    const warriors = data.warriors || [];

    scene.coinChange = { monster: null, warriors: [], selectedBox: null };

    // Setup Warriors
    const warriorStartX = 150, warriorY = 150, warriorSpacing = 150;
    warriors.forEach((power, index) => {
        const warriorX = warriorStartX + (index * warriorSpacing);
        const spriteY = warriorY + 60;
        const spriteKeys = ['bot_slime1', 'org1', 'org2', 'org3'];
        const safeIndex = index % spriteKeys.length;

        const characterSprite = scene.add.image(warriorX, spriteY, spriteKeys[safeIndex]).setScale(1.6).setDepth(8);

        const powerText = scene.add.text(warriorX, warriorY, power.toString(), {
            fontSize: '24px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(9);

        scene.coinChange.warriors.push({
            power, index, number: index + 1,
            powerSquare: characterSprite, powerText,
            x: warriorX, y: spriteY, originalX: warriorX, originalY: spriteY
        });
    });

    // Setup Monster
    const monsterX = 900, monsterY = 150;
    const monsterSprite = scene.add.image(monsterX, monsterY + 60, 'bot_humen1').setScale(2.2).setDepth(7);

    const monsterPowerText = scene.add.text(monsterX, monsterY, monsterPower.toString(), {
        fontSize: '24px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(8);

    scene.coinChange.monster = {
        power: monsterPower, powerText: monsterPowerText, sprite: monsterSprite,
        x: monsterX, y: monsterY
    };

    // Setup box (invisible logic box used for coordinates if needed)
    scene.coinChange.selectedBox = { graphics: null, x: 400, y: 500, width: 400, height: 200 };

}
