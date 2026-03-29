// Subset Sum Dynamic Programming Animation Playback
// 2D Spreadsheet Display Mode
import { animationController, createTraceBuffer } from './AnimationController';
import { createDpTableRenderer } from './DpTableRenderer';

export async function playSubsetSumDpAnimation(scene, trace, options = {}) {
    // สลับ Display Mode ตรงนี้:
    return playClassicDisplay(scene, trace, options);
}

// ============================================================================
// Display Mode 1: Classic Display (self-contained)
// ============================================================================
async function playClassicDisplay(scene, trace, options = {}) {
    const baseDelay = 1000;

    if (!scene || !scene.subsetSum || !trace) {
        console.warn('⚠️ [subsetSumPlaybackDp] No scene.subsetSum or trace');
        return;
    }


    const warriors = scene.subsetSum.warriors || [];
    const targetSum = scene.levelData?.algo_data?.payload?.target_sum || 0;
    const numItems = warriors.length;

    // Total rows = numItems + 1 (for 0 items)
    // Total cols = targetSum + 1 (for 0 capacity)
    const rows = numItems + 1;
    const cols = targetSum + 1;

    const sleep = (ms) => animationController.sleep(ms);

    const canvasW = scene.scale.width || 1200;
    const canvasH = scene.scale.height || 920;
    const centerX = canvasW / 2;
    const centerY = canvasH / 2;

    const cellW = Math.min(50, 800 / (cols + 2)); // Dynamic scaling if table is too wide
    const cellH = 40;

    const tableWidth = cols * cellW;
    const tableHeight = rows * cellH;

    // Center Dynamic (x, y)
    const startX = centerX - (tableWidth / 2) + (cellW / 2);
    const startY = centerY - (tableHeight / 2) + 40;

    const statusText = scene.add.text(
        centerX, startY - 90,
        'สร้างกระดาน DP Spreadsheet (2D Array)',
        { fontSize: '24px', color: '#FFFF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4, align: 'center' }
    ).setOrigin(0.5).setDepth(20);

    const table = createDpTableRenderer(scene, startX, startY, rows, cols, cellW, cellH);

    // Headers
    const colLabels = Array.from({ length: cols }, (_, i) => i.toString());
    table.setColHeaders(colLabels, -30);

    const rowLabels = ['0', ...warriors.map((w, i) => `W[${i + 1}]: ${w.power}`)];
    table.setRowHeaders(rowLabels, -60);

    // Initial Base Cases
    table.initRow(0, false, '#ffffff', 'F'); // Row 0 (0 items) -> False
    table.initCol(0, true, '#2ecc71', 'T');  // Col 0 (target 0) -> True

    // Fade out original graphics somewhat to focus on table
    if (scene.subsetSum.side1) scene.subsetSum.side1.setAlpha(0.2);
    warriors.forEach(w => {
        if (w.sprite) {
            w.sprite.setAlpha(0.2);
            if (w.sprite.powerText) w.sprite.powerText.setAlpha(0.2);
            if (w.sprite.labelText) w.sprite.labelText.setAlpha(0.2);
        }
    });

    // 2. Play Trace 
    for await (const step of createTraceBuffer(trace)) {
        if (!scene || !scene.scene || !scene.scene.isActive(scene.scene.key)) break;

        if (step.action === 'dp_update') {
            const r = step.index; // itemIndex (1 to numItems)
            const c = step.sum;
            const val = step.value; // true/false

            if (r === undefined || c === undefined || !table.isValid(r, c)) continue;

            table.setPointer(r, c);

            const textStr = val ? 'T' : 'F';
            table.updateCell(r, c, val, textStr);

            // Set permanent color purely for aesthetic correctness after flash
            const cellTextObj = table.getCell(r, c).text;

            statusText.setText(`อัปเดตช่อง Item=${r}, Sum=${c} -> ค่าใหม่: ${textStr}`);

            // Flash highlight over the setup warrior for this row
            const w = warriors[r - 1];
            if (w && w.sprite) {
                const flash = scene.add.rectangle(w.sprite.x, w.sprite.y, 60, 60, 0x00FFFF, 0.6).setDepth(12);
                scene.tweens.add({ targets: flash, alpha: 0, duration: 400 / animationController.speed, onComplete: () => flash.destroy() });
            }

            await sleep(baseDelay * 0.4);

            cellTextObj.setColor(val ? '#2ecc71' : '#e74c3c');
        }
    }

    table.hidePointer();
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
            if (w.sprite) {
                scene.tweens.add({ targets: w.sprite, x: w.originalX, y: w.originalY, duration: 500, ease: 'Power2' });
            }
            if (w.powerText) {
                scene.tweens.add({ targets: w.powerText, x: w.originalX, y: w.originalY + 45, duration: 500, ease: 'Power2' });
            }
        });
        await sleep(600);

        // คำนวณหาจำนวนไอเทมที่ถูกเลือกทั้งหมดก่อนเพื่อจัดกึ่งกลางแถว
        const finalWarriors = [];
        let tempR = numItems, tempC = targetSum;
        while (tempR > 0 && tempC > 0) {
            const currentVal = table.getCellValue(tempR, tempC) === true || table.getCellValue(tempR, tempC) === 'true' || table.getCellValue(tempR, tempC) === 1;
            const aboveVal = table.getCellValue(tempR - 1, tempC) === true || table.getCellValue(tempR - 1, tempC) === 'true' || table.getCellValue(tempR - 1, tempC) === 1;
            if (aboveVal) tempR--;
            else {
                const w = warriors[tempR - 1];
                finalWarriors.push(w);
                tempC -= w.power;
                tempR--;
            }
        }

        const spacing = 180;
        const totalW = finalWarriors.length;
        const startHeroX = centerX - ((totalW * spacing) / 2) + (spacing / 2);
        const tableHeight = rows * cellH;
        const scaleBaseY = startY + tableHeight + 60;

        let warriorIdx = 0;
        while (currR > 0 && currC > 0) {
            const currentCellInfo = table.getCell(currR, currC);
            if (currentCellInfo) currentCellInfo.bg.setFillStyle(0xffff00, 0.5);

            const currentVal = table.getCellValue(currR, currC) === true || table.getCellValue(currR, currC) === 'true' || table.getCellValue(currR, currC) === 1;
            const aboveVal = table.getCellValue(currR - 1, currC) === true || table.getCellValue(currR - 1, currC) === 'true' || table.getCellValue(currR - 1, currC) === 1;

            if (aboveVal) {
                // We can achieve this sum without the current item (Excluded)
                currR--;
            } else {
                // Included!
                const w = warriors[currR - 1]; // 0-based index for warriors
                const wVal = w.power;

                statusText.setText(`พบว่า W[${currR}] ถูกเลือกนำมาบวก!`);
                if (currentCellInfo) currentCellInfo.bg.setFillStyle(0x2ecc71, 0.8); // Green for included

                // Animate Warrior to Center Row (Below Table) keeping correct label offsets
                const px = startHeroX + (warriorIdx * spacing);
                if (w.sprite) {
                    scene.tweens.add({ targets: w.sprite, x: px, y: scaleBaseY, duration: 600, ease: 'Bounce.easeOut' });
                }
                if (w.powerText) {
                    scene.tweens.add({ targets: w.powerText, x: px, y: scaleBaseY + 45, duration: 600, ease: 'Bounce.easeOut' });
                }

                warriorIdx++;

                currR--;
                currC -= wVal;
                await sleep(1000);
            }
            await sleep(baseDelay * 0.5);
        }

        // Highlight the remaining path up to row 0 if sum is 0
        while (currR >= 0) {
            const cellInf = table.getCell(currR, currC);
            if (cellInf) cellInf.bg.setFillStyle(0xffff00, 0.5);
            currR--;
            await sleep(baseDelay * 0.2);
        }
    }

    // Show Result
    if (options.result !== undefined) {
        const resultText = options.result ? 'พบคำตอบ (True)' : 'ไม่พบคำตอบ (False)';
        const resultColor = options.result ? '#2ecc71' : '#e74c3c';
        const canvasW = scene.scale.width || 1200;
        const centerX = canvasW / 2;
        scene.add.text(centerX, startY - 160, resultText, {
            fontSize: '48px',
            color: resultColor,
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(30);
    }

    await sleep(2000);
}
