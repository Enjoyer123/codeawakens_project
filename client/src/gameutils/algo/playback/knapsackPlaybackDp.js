// Knapsack Dynamic Programming Animation Playback
// 2D Spreadsheet Display Mode

export async function playKnapsackDpAnimation(scene, trace, options = {}) {
    // สลับ Display Mode ตรงนี้:
    return playClassicDisplay(scene, trace, options);
}

// ============================================================================
// Display Mode 1: Classic Display (self-contained)
// ============================================================================
async function playClassicDisplay(scene, trace, options = {}) {
    const { speed = 1.0 } = options;
    const baseDelay = 1000 / speed;

    if (!scene || !scene.knapsack || !trace || trace.length === 0) {
        console.warn('⚠️ [knapsackPlaybackDp] No scene.knapsack or trace');
        return;
    }


    const items = scene.knapsack.items || [];
    const capacity = scene.levelData?.knapsack_data?.capacity || 10;
    const numItems = items.length;

    // Total rows = numItems + 1 (for 0 items)
    // Total cols = capacity + 1 (for 0 capacity)
    const rows = numItems + 1;
    const cols = capacity + 1;

    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    const statusText = scene.add.text(
        660, 650,
        'สร้างกระดาน DP Spreadsheet (2D Array)',
        { fontSize: '24px', color: '#FFFF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4, align: 'center' }
    ).setOrigin(0.5).setDepth(20);

    // ==========================================
    // UI: DP Table Array (Spreadsheet)
    // ==========================================
    const cellW = 50;
    const cellH = 40;

    // Position table on the middle-right side of the screen (game width is 800)
    const tableWidth = cols * cellW;
    const tableHeight = rows * cellH;

    // Push further to the right by adding an offset (e.g., +80px)
    const startX = 800 - tableWidth + (cellW / 2) + 80;
    const startY = 400; // Moved further down from 260

    const cells = []; // 2D array of cells

    // Column Headers (Capacity)
    for (let c = 0; c <= capacity; c++) {
        scene.add.text(startX + (c * cellW), startY - 30, c.toString(), {
            fontSize: '16px', color: '#DDDDDD', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);
    }

    // Row Headers (Items)
    scene.add.text(startX - 40, startY, '0', {
        fontSize: '16px', color: '#DDDDDD', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    for (let r = 1; r <= numItems; r++) {
        const item = items[r - 1];
        scene.add.text(startX - 60, startY + (r * cellH), `W:${item.weight} V:${item.price}`, {
            fontSize: '14px', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);
    }

    // Create Table Cells
    for (let r = 0; r <= numItems; r++) {
        cells[r] = [];
        for (let c = 0; c <= capacity; c++) {
            const cx = startX + (c * cellW);
            const cy = startY + (r * cellH);

            const bg = scene.add.rectangle(cx, cy, cellW, cellH, 0x111111, 0.9)
                .setStrokeStyle(1, 0x555555).setDepth(10);

            // Base case initialization
            const initVal = (r === 0 || c === 0) ? '0' : '';
            const textVal = scene.add.text(cx, cy, initVal, {
                fontSize: '18px', color: initVal === '0' ? '#00FF00' : '#FFFFFF', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(11);

            cells[r][c] = { bg, text: textVal, cx, cy, val: initVal === '0' ? 0 : null };
        }
    }

    // Pointers
    const pointerDest = scene.add.rectangle(0, 0, cellW + 4, cellH + 4, 0x000000, 0)
        .setStrokeStyle(3, 0xFFFF00).setDepth(15).setVisible(false);

    // Fade out original graphics somewhat to focus on table
    if (scene.knapsack.bag) scene.knapsack.bag.setAlpha(0.2);
    items.forEach(item => {
        if (item.sprite) item.sprite.setAlpha(0.2);
        if (item.labelText) item.labelText.setAlpha(0.2);
        if (item.glowEffect) item.glowEffect.setAlpha(0);
    });

    await sleep(baseDelay);

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
    for (let i = 0; i < trace.length; i++) {
        if (!scene || !scene.scene || !scene.scene.isActive(scene.scene.key)) break;
        const step = trace[i];

        if (step.action === 'dp_update') {
            const r = step.index + idxOffset; // mapped index (1-based internally)
            const c = step.capacity;
            const val = step.value;

            if (r === undefined || c === undefined || !cells[r] || !cells[r][c]) continue;

            const targetCell = cells[r][c];

            pointerDest.setPosition(targetCell.cx, targetCell.cy)
                .setVisible(true)
                .setStrokeStyle(3, 0xFFFF00); // Yellow targeting

            // Write Value
            targetCell.val = val;
            targetCell.text.setText(val.toString());
            targetCell.text.setColor('#FFFF00'); // Yellow when writing

            // Flash cell background
            scene.tweens.add({
                targets: targetCell.bg,
                fillColor: 0x333300,
                duration: 200,
                yoyo: true
            });

            statusText.setText(`อัปเดตช่อง Item=${r}, Cap=${c} -> ค่าใหม่: ${val}`);

            await sleep(baseDelay * 0.4);

            // Revert text color to normal white
            targetCell.text.setColor('#FFFFFF');
        }
    }

    pointerDest.setVisible(false);
    statusText.setText('การคำนวณตาราง DP เสร็จสิ้น!');

    // Restore opacities 
    if (scene.knapsack.bag) scene.knapsack.bag.setAlpha(1);
    items.forEach(item => {
        if (item.sprite) item.sprite.setAlpha(1);
        if (item.labelText) item.labelText.setAlpha(1);
    });

    // Show Result Text first
    if (options.result !== undefined) {
        scene.add.text(400, 250, `Max Value: $${options.result}`, {
            fontSize: '48px',
            color: '#2ecc71',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(30);
    }

    // --- NEW: Trace back DP table to find chosen items and animate them to bag ---
    statusText.setPosition(400, 750); // Move below the table
    statusText.setText('กำลังคำนวณย้อนกลับ (Traceback) เพื่อหยิบของใส่เป้...');
    await sleep(baseDelay);

    let currC = capacity;
    let currR = numItems;
    const chosenItems = [];

    // Find items
    while (currR > 0 && currC > 0) {
        // Ensure values are numbers for comparison. Unfilled cells are 0.
        const currentVal = Number(cells[currR][currC].val) || 0;
        const aboveVal = Number(cells[currR - 1][currC].val) || 0;

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
                    duration: 600 / speed,
                    ease: 'Power2'
                });
            }
            if (item.labelText) item.labelText.setVisible(false);

            await sleep(800 / speed);
        }

        statusText.setText('หยิบของใส่เป้เสร็จสมบูรณ์!');
    } else {
        statusText.setText('ไม่มีของชิ้นไหนถูกหยิบใส่เป้เลย');
    }

    await sleep(2000);
}
