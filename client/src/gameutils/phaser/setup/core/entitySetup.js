// Entity setup functions
// Handles coins, people (NPCs), and treasures
import Phaser from "phaser";

/**
 * Setup collectible coins with animations
 * @param {Phaser.Scene} scene - Phaser scene instance
 */
export function setupCoins(scene) {
    if (!scene.levelData.coinPositions) return;

    scene.coins = [];

    // Reset all coins to not collected
    scene.levelData.coinPositions.forEach(coinData => {
        coinData.collected = false;
    });

    scene.levelData.coinPositions.forEach((coinData, index) => {
        // Use pixel coordinates directly
        const worldX = coinData.x;
        const worldY = coinData.y;

        // Create coin sprite
        const coinSprite = scene.add.circle(worldX, worldY, 12, 0xffd700, 1);
        coinSprite.setStrokeStyle(3, 0xffaa00);
        coinSprite.setDepth(5);

        // Add coin value text
        const valueText = scene.add.text(worldX, worldY, coinData.value.toString(), {
            fontSize: '10px',
            color: '#000000',
            fontStyle: 'bold'
        });
        valueText.setOrigin(0.5);
        valueText.setDepth(6);

        // Add glow effect
        const glowCircle = scene.add.circle(worldX, worldY, 18, 0xffd700, 0.3);
        glowCircle.setDepth(4);

        // Set coin properties
        coinSprite.setData('collected', false);
        coinSprite.setData('value', coinData.value);
        coinSprite.setData('id', coinData.id);
        coinSprite.setData('valueText', valueText);
        coinSprite.setData('glow', glowCircle);

        // Add pulsing animation
        scene.tweens.add({
            targets: [coinSprite, glowCircle],
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        scene.coins.push({
            id: coinData.id,
            sprite: coinSprite,
            value: coinData.value,
            collected: false,
            x: coinData.x,
            y: coinData.y
        });
    });

    console.log(`Setup ${scene.coins.length} coins`);
}

/**
 * Setup people (NPCs) to rescue
 * @param {Phaser.Scene} scene - Phaser scene instance
 */
export function setupPeople(scene) {
    if (!scene.levelData.people) return;

    scene.people = [];

    scene.levelData.people.forEach((personData) => {
        // ใช้ตำแหน่งเดิมของคน (บน node) และขยับลงมา 10 พิกเซล
        const personX = personData.x;
        const personY = personData.y + 10;

        // Create person sprite as green rectangle (เล็กลงจาก 30x30 เป็น 20x20)
        const person = scene.add.rectangle(personX, personY, 20, 20, 0x00ff00);
        person.setStrokeStyle(2, 0xffffff);
        person.setDepth(10);

        // Add person data
        person.setData({
            nodeId: personData.nodeId,
            personName: personData.personName,
            rescued: false
        });

        // Create person name label
        const nameLabel = scene.add.text(personX, personY - 20, personData.personName, {
            fontSize: '10px',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 3, y: 1 }
        });
        nameLabel.setOrigin(0.5, 0.5);
        nameLabel.setDepth(11);

        // Create rescue effect
        const rescueEffect = scene.add.circle(personX, personY, 25, 0x00ff00, 0.3);
        rescueEffect.setStrokeStyle(1, 0x00ff00);
        rescueEffect.setDepth(9);
        rescueEffect.setVisible(false);

        // Store references
        person.nameLabel = nameLabel;
        person.rescueEffect = rescueEffect;
        person.setData('rescueEffect', rescueEffect);

        scene.people.push(person);
    });

    console.log(`Setup ${scene.people.length} people`);
}

/**
 * Setup treasure items
 * @param {Phaser.Scene} scene - Phaser scene instance
 */
export function setupTreasures(scene) {
    if (!scene.levelData.treasures) return;

    scene.treasures = [];

    scene.levelData.treasures.forEach((treasureData) => {
        // ใช้ตำแหน่งเดิมของสมบัติ
        const treasureX = treasureData.x;
        const treasureY = treasureData.y;

        // Create treasure sprite as diamond shape
        const treasure = scene.add.polygon(treasureX, treasureY, [
            0, -15,  // top
            10, 0,   // right
            0, 15,   // bottom
            -10, 0   // left
        ], 0xffd700, 1);
        treasure.setStrokeStyle(3, 0xffaa00);
        treasure.setDepth(8);

        // Add treasure data
        treasure.setData({
            nodeId: treasureData.nodeId,
            treasureName: treasureData.name,
            collected: false,
            id: treasureData.id
        });

        // Create treasure name label
        const nameLabel = scene.add.text(treasureX, treasureY - 25, treasureData.name, {
            fontSize: '10px',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 3, y: 1 }
        });
        nameLabel.setOrigin(0.5, 0.5);
        nameLabel.setDepth(9);

        // Create glow effect
        const glowEffect = scene.add.circle(treasureX, treasureY, 25, 0xffd700, 0.3);
        glowEffect.setStrokeStyle(2, 0xffd700);
        glowEffect.setDepth(7);

        // Add pulsing animation
        scene.tweens.add({
            targets: [treasure, glowEffect],
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Store references
        treasure.nameLabel = nameLabel;
        treasure.glowEffect = glowEffect;
        treasure.setData('glowEffect', glowEffect);

        scene.treasures.push(treasure);
    });

    console.log(`Setup ${scene.treasures.length} treasures`);
}
