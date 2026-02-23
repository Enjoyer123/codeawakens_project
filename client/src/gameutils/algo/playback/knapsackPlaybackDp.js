// Knapsack Dynamic Programming Animation Playback
// 2D Spreadsheet Display Mode

export async function playKnapsackDpAnimation(scene, trace, options = {}) {
    const { speed = 1.0 } = options;
    const baseDelay = 1000 / speed;

    if (!scene || !scene.knapsack || !trace || trace.length === 0) {
        console.warn('⚠️ [knapsackPlaybackDp] No scene.knapsack or trace');
        return;
    }

    console.log(`🎬 [knapsackPlayback] Playing DP Spreadsheet Display at ${speed}x speed`);

    const items = scene.knapsack.items || [];
    const capacity = scene.levelData?.knapsackData?.capacity || 10;
    const numItems = items.length;

    // Total rows = numItems + 1 (for 0 items)
    // Total cols = capacity + 1 (for 0 capacity)
    const rows = numItems + 1;
    const cols = capacity + 1;

    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    const statusText = scene.add.text(
        400, 30,
        'สร้างกระดาน DP Spreadsheet (2D Array)',
        { fontSize: '24px', color: '#FFFF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4, align: 'center' }
    ).setOrigin(0.5).setDepth(20);

    // ==========================================
    // UI: DP Table Array (Spreadsheet)
    // ==========================================
    const cellW = 50;
    const cellH = 40;

    // Center the table
    const tableWidth = cols * cellW;
    const tableHeight = rows * cellH;
    const startX = 400 - (tableWidth / 2) + (cellW / 2);
    const startY = 160;

    const cells = []; // 2D array of cells

    // Column Headers (Capacity)
    for (let c = 0; c <= capacity; c++) {
        scene.add.text(startX + (c * cellW), startY - 30, c.toString(), {
            fontSize: '14px', color: '#888888', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);
    }

    // Row Headers (Items)
    scene.add.text(startX - 40, startY, '0', {
        fontSize: '14px', color: '#888888', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    for (let r = 1; r <= numItems; r++) {
        const item = items[r - 1];
        scene.add.text(startX - 60, startY + (r * cellH), `W:${item.weight} V:${item.price}`, {
            fontSize: '12px', color: '#888888', fontStyle: 'bold'
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

    // 2. ลุยรัน Trace เติมตาราง
    for (let i = 0; i < trace.length; i++) {
        if (!scene || !scene.scene.isActive(scene.scene.key)) break;
        const step = trace[i];

        if (step.action === 'dp_update') {
            const r = step.index; // itemIndex (1-based in DP formulation usually, but blockly handles this)
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

    // Show Result
    if (options.result !== undefined) {
        scene.add.text(400, 500, `Max Value: $${options.result}`, {
            fontSize: '48px',
            color: '#2ecc71',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(30);
    }

    await sleep(2000);
}
