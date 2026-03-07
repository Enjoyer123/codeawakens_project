// Subset Sum Dynamic Programming Animation Playback
// 2D Spreadsheet Display Mode

export async function playSubsetSumDpAnimation(scene, trace, options = {}) {
    // สลับ Display Mode ตรงนี้:
    return playClassicDisplay(scene, trace, options);
}

// ============================================================================
// Display Mode 1: Classic Display (self-contained)
// ============================================================================
async function playClassicDisplay(scene, trace, options = {}) {
    const { speed = 1.0 } = options;
    const baseDelay = 1000 / speed;

    if (!scene || !scene.subsetSum || !trace || trace.length === 0) {
        console.warn('⚠️ [subsetSumPlaybackDp] No scene.subsetSum or trace');
        return;
    }


    const warriors = scene.subsetSum.warriors || [];
    const targetSum = scene.levelData?.subset_sum_data?.target_sum || 0;
    const numItems = warriors.length;

    // Total rows = numItems + 1 (for 0 items)
    // Total cols = targetSum + 1 (for 0 capacity)
    const rows = numItems + 1;
    const cols = targetSum + 1;

    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    const statusText = scene.add.text(
        400, 750,
        'สร้างกระดาน DP Spreadsheet (2D Array)',
        { fontSize: '24px', color: '#FFFF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4, align: 'center' }
    ).setOrigin(0.5).setDepth(20);

    // ==========================================
    // UI: DP Table Array (Spreadsheet)
    // ==========================================
    const cellW = Math.min(50, 800 / (cols + 2)); // Dynamic scaling if table is too wide
    const cellH = 40;

    // Center the table, shifted to the right to avoid overlapping warriors
    const tableWidth = cols * cellW;
    const startX = 750 - (tableWidth / 2) + (cellW / 2);
    const startY = 300; // Moved down to avoid overlapping the warrior scale

    const cells = []; // 2D array of cells

    // Column Headers (Target Sums)
    for (let c = 0; c <= targetSum; c++) {
        scene.add.text(startX + (c * cellW), startY - 30, c.toString(), {
            fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);
    }

    // Row Headers (Warriors)
    scene.add.text(startX - 40, startY, '0', {
        fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    for (let r = 1; r <= numItems; r++) {
        const warrior = warriors[r - 1];
        scene.add.text(startX - 60, startY + (r * cellH), `W[${r}]: ${warrior.power}`, {
            fontSize: '12px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);
    }

    // Create Table Cells
    for (let r = 0; r <= numItems; r++) {
        cells[r] = [];
        for (let c = 0; c <= targetSum; c++) {
            const cx = startX + (c * cellW);
            const cy = startY + (r * cellH);

            const bg = scene.add.rectangle(cx, cy, cellW, cellH, 0x111111, 0.9)
                .setStrokeStyle(1, 0x555555).setDepth(10);

            // Base case initialization
            const initVal = (c === 0) ? 'T' : 'F';
            const textVal = scene.add.text(cx, cy, initVal, {
                fontSize: '18px', color: initVal === 'T' ? '#2ecc71' : '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(11);

            cells[r][c] = { bg, text: textVal, cx, cy, val: initVal === 'T' ? true : false };
        }
    }

    // Pointers
    const pointerDest = scene.add.rectangle(0, 0, cellW + 4, cellH + 4, 0x000000, 0)
        .setStrokeStyle(3, 0xFFFF00).setDepth(15).setVisible(false);

    // Fade out original graphics somewhat to focus on table
    if (scene.subsetSum.side1) scene.subsetSum.side1.setAlpha(0.2);
    warriors.forEach(w => {
        if (w.sprite) {
            w.sprite.setAlpha(0.2);
            if (w.sprite.powerText) w.sprite.powerText.setAlpha(0.2);
            if (w.sprite.labelText) w.sprite.labelText.setAlpha(0.2);
        }
    });

    await sleep(baseDelay);

    // 2. Play Trace 
    for (let i = 0; i < trace.length; i++) {
        if (!scene || !scene.scene || !scene.scene.isActive(scene.scene.key)) break;
        const step = trace[i];

        if (step.action === 'dp_update') {
            const r = step.index; // itemIndex (1 to numItems)
            const c = step.sum;
            const val = step.value;

            if (r === undefined || c === undefined || !cells[r] || !cells[r][c]) continue;

            const targetCell = cells[r][c];

            pointerDest.setPosition(targetCell.cx, targetCell.cy)
                .setVisible(true)
                .setStrokeStyle(3, 0xFFFF00); // Yellow targeting

            // Write Value
            targetCell.val = val;
            const textStr = val ? 'T' : 'F';
            targetCell.text.setText(textStr);
            targetCell.text.setColor('#FFFF00'); // Yellow when writing

            // Flash cell background
            scene.tweens.add({
                targets: targetCell.bg,
                fillColor: 0x333300,
                duration: 200,
                yoyo: true
            });

            statusText.setText(`อัปเดตช่อง Item=${r}, Sum=${c} -> ค่าใหม่: ${textStr}`);

            await sleep(baseDelay * 0.4);

            // Revert text color to normal state
            targetCell.text.setColor(val ? '#2ecc71' : '#e74c3c');
        }
    }

    pointerDest.setVisible(false);
    statusText.setText('การคำนวณตาราง DP เสร็จสิ้น!');

    // Restore opacities for visual pop
    if (scene.subsetSum.side1) scene.subsetSum.side1.setAlpha(1);
    warriors.forEach(w => {
        if (w.sprite) {
            w.sprite.setAlpha(1);
            if (w.sprite.powerText) w.sprite.powerText.setAlpha(1);
            if (w.sprite.labelText) w.sprite.labelText.setAlpha(1);
        }
    });

    // --- Traceback: Highlight Path & Bring Included Items to Scale ---
    if (options.result) {
        statusText.setText('แกะรอยกลับ (Traceback) เพื่อหาคำตอบ...');
        await sleep(baseDelay);

        let currR = numItems;
        let currC = targetSum;

        // Reset positions smoothly before traceback brings them in
        warriors.forEach(w => {
            scene.tweens.add({
                targets: [w.sprite, w.sprite.powerText, w.sprite.labelText].filter(Boolean),
                x: w.originalX,
                y: w.originalY,
                duration: 500,
                ease: 'Power2'
            });
        });
        await sleep(600);

        let scaleStackHeight = 0;
        const scaleBaseY = scene.subsetSum.side1.y - 120;
        const scaleX = scene.subsetSum.side1.x;

        while (currR > 0 && currC > 0) {
            const currentCell = cells[currR][currC];
            currentCell.bg.setFillStyle(0xffff00, 0.5); // Highlight traceback path

            // Check if it came from top (excluded) or from top-left (included)
            const prevCellAbove = cells[currR - 1][currC];

            // Type-safe boolean parse (Blockly might send "true", "false", 1, 0, or actual booleans)
            const currentVal = currentCell.val === true || currentCell.val === 'true' || currentCell.val === 1;
            const aboveVal = prevCellAbove && (prevCellAbove.val === true || prevCellAbove.val === 'true' || prevCellAbove.val === 1);

            if (aboveVal) {
                // We can achieve this sum without the current item (Excluded)
                currR--;
            } else {
                // Included!
                const w = warriors[currR - 1]; // 0-based index for warriors
                const wVal = w.power;

                statusText.setText(`พบว่า W[${currR}] ถูกเลือกนำมาบวก!`);
                currentCell.bg.setFillStyle(0x2ecc71, 0.8); // Green for included

                // Animate Warrior to Scale
                scene.tweens.add({
                    targets: [w.sprite, w.sprite.powerText, w.sprite.labelText].filter(Boolean),
                    x: scaleX,
                    y: scaleBaseY - scaleStackHeight,
                    duration: 600,
                    ease: 'Bounce.easeOut'
                });

                scaleStackHeight += 60; // Stack vertically

                currR--;
                currC -= wVal;
                await sleep(1000);
            }
            await sleep(baseDelay * 0.5);
        }

        // Highlight the remaining path up to row 0 if sum is 0
        while (currR >= 0) {
            cells[currR][currC].bg.setFillStyle(0xffff00, 0.5);
            currR--;
            await sleep(baseDelay * 0.2);
        }
    }

    // Show Result
    if (options.result !== undefined) {
        const resultText = options.result ? 'พบคำตอบ (True)' : 'ไม่พบคำตอบ (False)';
        const resultColor = options.result ? '#2ecc71' : '#e74c3c';
        scene.add.text(400, 500, resultText, {
            fontSize: '48px',
            color: resultColor,
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(30);
    }

    await sleep(2000);
}
