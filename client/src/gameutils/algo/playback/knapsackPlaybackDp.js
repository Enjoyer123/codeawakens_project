// Knapsack Dynamic Programming Animation Playback
// 2D Spreadsheet Display Mode
import { animationController, createTraceBuffer } from './AnimationController';
import { createDpTableRenderer } from './DpTableRenderer';

export async function playKnapsackDpAnimation(scene, trace, options = {}) {
    // สลับ Display Mode ตรงนี้:
    return playClassicDisplay(scene, trace, options);
}

// ============================================================================
// Display Mode 1: Classic Display (self-contained)
// ============================================================================
async function playClassicDisplay(scene, trace, options = {}) {
    const baseDelay = 1000;

    if (!scene || !scene.knapsack || !trace) {
        console.warn('⚠️ [knapsackPlaybackDp] No scene.knapsack or trace');
        return;
    }


    const items = scene.knapsack.items || [];
    const capacity = scene.levelData?.algo_data?.payload?.capacity || 10;
    const numItems = items.length;

    // Total rows = numItems + 1 (for 0 items)
    // Total cols = capacity + 1 (for 0 capacity)
    const rows = numItems + 1;
    const cols = capacity + 1;

    const sleep = (ms) => animationController.sleep(ms);

    const canvasW = scene.scale.width || 1200;
    const canvasH = scene.scale.height || 920;
    const centerX = canvasW / 2;
    const centerY = canvasH / 2;

    const cellW = 50;
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
    const colLabels = Array.from({length: cols}, (_, i) => i.toString());
    table.setColHeaders(colLabels, -30);

    const rowLabels = ['0', ...items.map(item => `W:${item.weight} V:${item.price}`)];
    table.setRowHeaders(rowLabels, -60);

    // Initial Base Cases
    table.initCol(0, 0); // r=0..numItems, c=0 -> 0
    table.initRow(0, 0); // c=0..capacity, r=0 -> 0

    // Fade out original graphics somewhat to focus on table
    if (scene.knapsack.bag) scene.knapsack.bag.setAlpha(0.2);
    items.forEach(item => {
        if (item.sprite) item.sprite.setAlpha(0.2);
        if (item.labelText) item.labelText.setAlpha(0.2);
        if (item.glowEffect) item.glowEffect.setAlpha(0);
    });

    // --- NEW: Detect if DP table loop is 0-indexed or 1-indexed ---
    let minItemIdx = 999;
    for (let i = 0; i < trace.length; i++) {
        const step = trace[i];
        if (step.action === 'dp_update' && step.index !== undefined) {
            if (step.index < minItemIdx) minItemIdx = step.index;
        }
    }
    const idxOffset = (minItemIdx === 0) ? 1 : 0;

    // 2. ลุยรัน Trace เติมตาราง
    for await (const step of createTraceBuffer(trace)) {
        if (!scene || !scene.scene || !scene.scene.isActive(scene.scene.key)) break;

        if (step.action === 'dp_update') {
            const r = step.index + idxOffset; // mapped index (1-based internally)
            const c = step.capacity;
            const val = step.value;

            if (r === undefined || c === undefined || !table.isValid(r, c)) continue;

            table.setPointer(r, c);
            table.updateCell(r, c, val);

            statusText.setText(`อัปเดตช่อง Item=${r}, Cap=${c} -> ค่าใหม่: ${val}`);

            // Flash highlight over the setup item for this row
            const item = items[r - 1];
            if (item && item.sprite) {
                const flash = scene.add.rectangle(item.sprite.x, item.sprite.y, 60, 60, 0x00FFFF, 0.6).setDepth(12);
                scene.tweens.add({ targets: flash, alpha: 0, duration: 400 / animationController.speed, onComplete: () => flash.destroy() });
            }

            await sleep(baseDelay * 0.4);
        }
    }

    table.hidePointer();
    statusText.setText('การคำนวณตาราง DP เสร็จสิ้น!');

    // Restore opacities 
    if (scene.knapsack.bag) scene.knapsack.bag.setAlpha(1);
    items.forEach(item => {
        if (item.sprite) item.sprite.setAlpha(1);
        if (item.labelText) item.labelText.setAlpha(1);
    });

    // Show Result Text first
    if (options.result !== undefined) {
        const canvasW = scene.scale.width || 1200;
        const centerX = canvasW / 2;
        scene.add.text(centerX, startY - 160, `Max Value: $${options.result}`, {
            fontSize: '48px',
            color: '#2ecc71',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(30);
    }

    // --- NEW: Trace back DP table to find chosen items and animate them to bag ---
    statusText.setText('กำลังคำนวณย้อนกลับ (Traceback) เพื่อหยิบของใส่เป้...');
    await sleep(baseDelay);

    let currC = capacity;
    let currR = numItems;
    const chosenItems = [];

    // Find items
    while (currR > 0 && currC > 0) {
        // Ensure values are numbers for comparison. Unfilled cells are 0.
        const currentVal = Number(table.getCellValue(currR, currC)) || 0;
        const aboveVal = Number(table.getCellValue(currR - 1, currC)) || 0;

        // If value came from the cell above, item R was NOT included
        if (currentVal === aboveVal) {
            currR--;
        } else {
            // Item R was included
            const item = items[currR - 1]; // items array is 0-indexed
            chosenItems.push(item);
            currC -= item.weight;
            currR--;
        }
    }

    // Animate items moving to bag
    if (chosenItems.length > 0) {
        const bagX = scene.knapsack.bag.x;
        const bagY = scene.knapsack.bag.y;
        let currentValue = 0;

        const currentBagText = scene.add.text(bagX, bagY + 80, '', {
            fontSize: '24px',
            color: '#ffd700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(20);

        for (let i = chosenItems.length - 1; i >= 0; i--) { // Reverse to pick from smallest row first
            const item = chosenItems[i];

            statusText.setText(`หยิบสมบัติ W:${item.weight} V:${item.price} ใส่กระเป๋า`);

            // Highlight table row? (Optional)

            currentValue += item.price;
            currentBagText.setText(`Value: $${currentValue}`);

            const offset = ((chosenItems.length - 1) - i) * -20;
            if (item.sprite) {
                scene.tweens.add({
                    targets: item.sprite,
                    x: bagX,
                    y: bagY + offset,
                    scaleX: 0.8,
                    scaleY: 0.8,
                    duration: 600 / animationController.speed,
                    ease: 'Power2'
                });
            }
            if (item.labelText) item.labelText.setVisible(false);

            await sleep(800);
        }

        statusText.setText('หยิบของใส่เป้เสร็จสมบูรณ์!');
    } else {
        statusText.setText('ไม่มีของชิ้นไหนถูกหยิบใส่เป้เลย');
    }

    await sleep(2000);
}
