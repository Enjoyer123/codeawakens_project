// Subset Sum Backtracking Animation Playback

export async function playSubsetSumBacktrackAnimation(scene, trace, options = {}) {
    // สลับ Display Mode ตรงนี้:
    return playClassicDisplay(scene, trace, options);
}

// ============================================================================
// Display Mode 1: Classic Display (self-contained)
// ============================================================================
async function playClassicDisplay(scene, trace, options = {}) {
    if (!scene.subsetSum || !scene.subsetSum.warriors) return;

    const { speed = 1.0 } = options;
    const baseWait = 800 / speed;

    const warriors = scene.subsetSum.warriors;
    const side1 = scene.subsetSum.side1;

    let currentSum = 0;
    const side1Contents = [];

    // Text to show current sum on side 1
    const currentSumText = scene.add.text(side1.x, side1.y + 60, '', {
        fontSize: '24px',
        color: '#ffd700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 5
    }).setOrigin(0.5).setDepth(20);

    const targetSum = scene.levelData?.subsetSumData?.target_sum || 0;

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Draw event text box
    let infoGraphics = scene.add.graphics().setDepth(15);
    let infoText = scene.add.text(400, 50, '', { fontSize: '20px', color: '#fff' }).setOrigin(0.5).setDepth(16);

    const updateInfo = (text, color = 0x000000) => {
        infoGraphics.clear();
        infoGraphics.fillStyle(color, 0.7);
        infoGraphics.fillRoundedRect(100, 25, 600, 50, 10);
        infoText.setText(text);
    };

    updateInfo("เริ่มการค้นหาแบบ Backtracking (Subset Sum)", 0x333333);
    await sleep(baseWait);

    for (let step of trace) {
        if (!scene || !scene.scene || !scene.scene.isActive(scene.scene.key)) break;

        const idx = step.index; // Trace uses 0-based indexing
        if (idx < 0 || idx >= warriors.length) continue;
        const warrior = warriors[idx];

        // --- Auto-Cleanup Deeper Recursions ---
        // When backtracking to a smaller index, any warriors with a larger index
        // that are still on the board (Side 1 or Side 2) must be reset to their original position.
        let cleanedUp = false;
        for (let i = idx + 1; i < warriors.length; i++) {
            const w = warriors[i];
            const s1Idx = side1Contents.indexOf(w);

            // Clean up from board if it was there
            if (s1Idx !== -1) {
                cleanedUp = true;
                side1Contents.splice(s1Idx, 1);
                currentSum -= w.power;
                currentSumText.setText(currentSum > 0 ? `Sum: ${currentSum} / ${targetSum}` : '');
            }

            // Always reset visual state for deeper warriors
            if (w.sprite.alpha < 1.0 || w.sprite.x !== w.originalX || w.sprite.y !== w.originalY) {
                cleanedUp = true;
                scene.tweens.add({
                    targets: [w.sprite, w.powerText],
                    x: w.originalX,
                    y: w.originalY,
                    scaleX: 1.5,
                    scaleY: 1.5,
                    alpha: 1.0,
                    duration: 400 / speed,
                    ease: 'Power2'
                });
                if (w.labelText) w.labelText.setVisible(true);
            }
        }
        if (cleanedUp) {
            updateInfo(`ย้อนระดับ (Backtrack): ดึงนักรบระดับลึกกลับทั้งหมด`, 0x95a5a6);
            await sleep(400 / speed);
        }
        // --- End Auto-Cleanup ---

        if (step.action === 'consider') {
            updateInfo(`กำลังพิจารณานักรบที่ ${idx + 1} (พลัง: ${warrior.power})`, 0x3498db);

            // Flash glow
            if (warrior.sprite) {
                scene.tweens.add({
                    targets: warrior.sprite,
                    alpha: 0.5,
                    duration: 150 / speed,
                    yoyo: true,
                    repeat: 1
                });
            }
            await sleep(baseWait * 0.5);

        } else if (step.action === 'include') {
            updateInfo(`เลือกนักรบที่ ${idx + 1} เข้าร่วม (ซ้อนขึ้นตาชั่ง)`, 0x2ecc71);

            side1Contents.push(warrior);
            currentSum += warrior.power;

            if (currentSum > targetSum) {
                currentSumText.setColor('#e74c3c'); // Red if exceeded
            } else {
                currentSumText.setColor('#ffd700'); // Gold otherwise
            }
            currentSumText.setText(`Sum: ${currentSum} / ${targetSum}`);

            // Animate to side1
            const offset = (side1Contents.length - 1) * -30; // Stack slightly upwards
            scene.tweens.add({
                targets: [warrior.sprite, warrior.powerText],
                x: side1.x,
                y: side1.y + offset,
                scaleX: 1.0,
                scaleY: 1.0,
                duration: 400 / speed,
                ease: 'Power2'
            });

            // Hide normal label
            if (warrior.labelText) warrior.labelText.setVisible(false);

            await sleep(baseWait);

        } else if (step.action === 'exclude') {
            const s1Index = side1Contents.indexOf(warrior);

            if (s1Index !== -1) {
                // It was on the scale, so we are backtracking from 'include' to try 'exclude'
                updateInfo(`ถอนกำลัง! เอานักรบที่ ${idx + 1} ออกจากตาชั่ง`, 0xe67e22);
                side1Contents.splice(s1Index, 1);
                currentSum -= warrior.power;
                currentSumText.setText(currentSum > 0 ? `Sum: ${currentSum} / ${targetSum}` : '');

                // Add brief delay to let user see it's being removed
                await sleep(200 / speed);
            }

            updateInfo(`กิ่งชอยส์ 2: ข้าม (Exclude) นักรบที่ ${idx + 1}`, 0xe74c3c);

            // Animate to original position but faded (Discarded for this branch)
            scene.tweens.add({
                targets: [warrior.sprite, warrior.powerText],
                x: warrior.originalX,
                y: warrior.originalY,
                scaleX: 1.0,
                scaleY: 1.0,
                alpha: 0.3,
                duration: 400 / speed,
                ease: 'Power2'
            });

            if (warrior.labelText) warrior.labelText.setVisible(true);

            await sleep(baseWait);

        } else if (step.action === 'reset') {
            updateInfo(`ถอยกิ่ง (Reset): คืนค่านักรบที่ ${idx + 1} ให้สว่างพร้อมเลือกใหม่`, 0x95a5a6);

            const s1Index = side1Contents.indexOf(warrior);
            if (s1Index !== -1) {
                side1Contents.splice(s1Index, 1);
                currentSum -= warrior.power;
                currentSumText.setText(currentSum > 0 ? `Sum: ${currentSum} / ${targetSum}` : '');
            }

            scene.tweens.add({
                targets: [warrior.sprite, warrior.powerText],
                x: warrior.originalX,
                y: warrior.originalY,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 1.0,
                duration: 400 / speed,
                ease: 'Power2'
            });

            if (warrior.labelText) warrior.labelText.setVisible(true);
            await sleep(baseWait * 0.5);
        }
    }

    if (options.result) {
        updateInfo("พบคำตอบ! ผลรวมตรงเป้าหมาย", 0x2ecc71);
    } else {
        updateInfo("จบการค้นหา: ไม่พบเซตที่ผลรวมตรงเป้าหมาย", 0xe74c3c);
    }

    await sleep(2000);
}
