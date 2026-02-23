// Knapsack Backtracking Animation Playback

export async function playKnapsackBacktrackAnimation(scene, trace, options = {}) {
    if (!scene.knapsack || !scene.knapsack.items || !scene.knapsack.bag) return;

    const { speed = 1.0 } = options;
    const baseWait = 800 / speed;

    const items = scene.knapsack.items;
    const bagX = scene.knapsack.bag.x;
    const bagY = scene.knapsack.bag.y;

    // Maintain state for where the items in the bag are
    const bagContents = [];

    // Text to show current value of bag
    const currentBagText = scene.add.text(bagX, bagY + 80, '', {
        fontSize: '24px',
        color: '#ffd700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 5
    }).setOrigin(0.5).setDepth(20);

    let currentValue = 0;

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Draw event text box
    let infoGraphics = scene.add.graphics().setDepth(15);
    let infoText = scene.add.text(400, 50, '', { fontSize: '20px', color: '#fff' }).setOrigin(0.5).setDepth(16);

    const updateInfo = (text, color = 0x000000) => {
        infoGraphics.clear();
        infoGraphics.fillStyle(color, 0.7);
        infoGraphics.fillRoundedRect(150, 25, 500, 50, 10);
        infoText.setText(text);
    };

    updateInfo("เริ่มทำการค้นหาแบบ Backtracking", 0x333333);
    await sleep(baseWait);

    for (let step of trace) {
        if (!scene.scene.isActive(scene.scene.key)) break;

        if (step.action === 'consider') {
            const idx = step.index;
            if (idx >= 0 && idx < items.length) {
                const item = items[idx];
                updateInfo(`กำลังพิจารณาสมบัติชิ้นที่ ${idx + 1} (${item.weight}kg, $${item.price})`, 0x3498db);

                // Flash glow
                if (item.sprite) {
                    scene.tweens.add({
                        targets: item.sprite,
                        alpha: 0.5,
                        duration: 150 / speed,
                        yoyo: true,
                        repeat: 1
                    });
                }
                await sleep(baseWait * 0.5);
            }

        } else if (step.action === 'pick') {
            const idx = step.index;
            if (idx >= 0 && idx < items.length) {
                const item = items[idx];
                updateInfo(`หยิบสมบัติชิ้นที่ ${idx + 1} ใส่กระเป๋า`, 0x2ecc71);

                bagContents.push(item);
                currentValue += item.price;
                currentBagText.setText(`Value: $${currentValue}`);

                // Animate to bag
                const offset = (bagContents.length - 1) * -20; // Stack slightly upwards
                scene.tweens.add({
                    targets: item.sprite,
                    x: bagX,
                    y: bagY + offset,
                    scaleX: 0.8,
                    scaleY: 0.8,
                    duration: 400 / speed,
                    ease: 'Power2'
                });

                // Hide label
                if (item.labelText) item.labelText.setVisible(false);

                await sleep(baseWait);
            }

        } else if (step.action === 'remove') {
            if (bagContents.length > 0) {
                const item = bagContents.pop();
                updateInfo(`เอาสมบัติชิ้นที่ ${items.indexOf(item) + 1} ออก (Backtrack)`, 0xe74c3c);

                currentValue -= item.price;
                currentBagText.setText(currentValue > 0 ? `Value: $${currentValue}` : '');

                // Animate back
                scene.tweens.add({
                    targets: item.sprite,
                    x: item.x, // original x
                    y: item.y, // original y
                    scaleX: 1.3,
                    scaleY: 1.3,
                    duration: 400 / speed,
                    ease: 'Power2'
                });

                if (item.labelText) item.labelText.setVisible(true);

                await sleep(baseWait);
            }
        }
    }

    updateInfo("จบการค้นหา Backtracking", 0x333333);

    if (options.result !== undefined) {
        scene.add.text(400, 300, `Max Value: $${options.result}`, {
            fontSize: '48px',
            color: '#2ecc71',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(30);
    }

    await sleep(2000);
}
