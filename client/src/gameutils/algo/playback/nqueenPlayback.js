/**
 * nqueenPlayback.js — N-Queen Animation Playback
 *
 * แต่ละ Display Mode เป็น self-contained 100%:
 * วาด grid, เล่น animation, แสดง solution boards — ทุกอย่างอยู่ใน function เดียว
 * ถ้าอยากเพิ่มแบบใหม่ (เช่น tree) ก็สร้าง function ใหม่แล้วมาสลับตรง router
 */

/**
 * Router: เรียก Display Mode ที่ต้องการ (แค่นี้เท่านั้น ไม่ทำอะไรเพิ่ม)
 */
export async function playNQueenAnimation(scene, trace, options = {}) {
    // สลับ Display Mode ตรงนี้:
    return playClassicDisplay(scene, trace, options);
    // return playAbcDisplay(scene, trace, options);
}

// ============================================================================
// Display Mode 1: Classic Display (self-contained 100%)
// ============================================================================
async function playClassicDisplay(scene, trace, options = {}) {
    const { speed = 1.0 } = options;
    const baseDelay = 200 / speed;

    if (!scene || !trace || trace.length === 0) {
        console.warn('⚠️ [nqueenPlayback] No scene or trace');
        return;
    }

    // อ่าน n จาก levelData โดยตรง
    const n = scene.levelData?.nqueenData?.n || options.n || 4;
    const cellSize = 60;
    const boardStartX = 400;
    const boardStartY = 300;
    const boardWidth = n * cellSize;
    const boardHeight = n * cellSize;

    console.log(`🎬 [nqueenPlayback] Drawing ${n}x${n} grid and playing ${trace.length} steps`);

    // ====== วาด Board ======
    const bgRect = scene.add.rectangle(boardStartX, boardStartY, boardWidth, boardHeight, 0xFDF5E6);
    bgRect.setStrokeStyle(3, 0x333333);
    bgRect.setDepth(4);

    for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
            if ((row + col) % 2 === 1) {
                const x = boardStartX - boardWidth / 2 + col * cellSize + cellSize / 2;
                const y = boardStartY - boardHeight / 2 + row * cellSize + cellSize / 2;
                scene.add.rectangle(x, y, cellSize - 1, cellSize - 1, 0xD4A574, 0.5).setDepth(4);
            }
        }
    }

    const gridGfx = scene.add.graphics().setDepth(5);
    gridGfx.lineStyle(2, 0x333333, 0.8);
    for (let i = 0; i <= n; i++) {
        const vx = boardStartX - boardWidth / 2 + (i * cellSize);
        gridGfx.moveTo(vx, boardStartY - boardHeight / 2);
        gridGfx.lineTo(vx, boardStartY + boardHeight / 2);
        const hy = boardStartY - boardHeight / 2 + (i * cellSize);
        gridGfx.moveTo(boardStartX - boardWidth / 2, hy);
        gridGfx.lineTo(boardStartX + boardWidth / 2, hy);
    }
    gridGfx.strokePath();

    for (let i = 0; i < n; i++) {
        const cx = boardStartX - boardWidth / 2 + (i * cellSize) + cellSize / 2;
        scene.add.text(cx, boardStartY - boardHeight / 2 - 18, i.toString(), {
            fontSize: '16px', color: '#FFD700', fontStyle: 'bold', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(6);

        const ry = boardStartY - boardHeight / 2 + (i * cellSize) + cellSize / 2;
        scene.add.text(boardStartX - boardWidth / 2 - 18, ry, i.toString(), {
            fontSize: '16px', color: '#FFD700', fontStyle: 'bold', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(6);
    }

    // ====== Helpers ======
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    const getCellCenter = (row, col) => ({
        cx: boardStartX - boardWidth / 2 + (col * cellSize) + cellSize / 2,
        cy: boardStartY - boardHeight / 2 + (row * cellSize) + cellSize / 2
    });

    const overlays = {};
    const setCellOverlay = (row, col, color, alpha = 0.35) => {
        const key = `${row}_${col}`;
        if (overlays[key]) overlays[key].destroy();
        const { cx, cy } = getCellCenter(row, col);
        overlays[key] = scene.add.rectangle(cx, cy, cellSize - 2, cellSize - 2, color, alpha).setDepth(8);
    };
    const clearCellOverlay = (row, col) => {
        const key = `${row}_${col}`;
        if (overlays[key]) { overlays[key].destroy(); delete overlays[key]; }
    };

    const drawMiniBoard = (sc, sx, sy, size, qArr, scale) => {
        const cs = 60 * scale;
        const bw = size * cs;
        const bh = size * cs;
        sc.add.rectangle(sx, sy, bw + 4, bh + 4, 0xFDF5E6).setStrokeStyle(2, 0x333333).setDepth(4);
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if ((r + c) % 2 === 1) {
                    sc.add.rectangle(sx - bw / 2 + c * cs + cs / 2, sy - bh / 2 + r * cs + cs / 2, cs - 1, cs - 1, 0xD4A574, 0.5).setDepth(4);
                }
            }
        }
        const gfx = sc.add.graphics().setDepth(5);
        gfx.lineStyle(1, 0x333333, 0.6);
        for (let i = 0; i <= size; i++) {
            gfx.moveTo(sx - bw / 2 + i * cs, sy - bh / 2);
            gfx.lineTo(sx - bw / 2 + i * cs, sy + bh / 2);
            gfx.moveTo(sx - bw / 2, sy - bh / 2 + i * cs);
            gfx.lineTo(sx + bw / 2, sy - bh / 2 + i * cs);
        }
        gfx.strokePath();
        qArr.forEach(q => {
            sc.add.image(sx - bw / 2 + q.col * cs + cs / 2, sy - bh / 2 + q.row * cs + cs / 2, 'gun').setScale(2.5 * scale).setDepth(9);
        });
    };

    const queens = [];

    // ====== เล่น Animation ตาม trace ======
    for (let i = 0; i < trace.length; i++) {
        const step = trace[i];
        const r = step.row;
        const c = step.col;

        switch (step.action) {
            case 'consider': {
                const isSafe = step.safe !== undefined ? step.safe : true;
                setCellOverlay(r, c, isSafe ? 0xFFA500 : 0xFF0000, 0.6);
                await sleep(baseDelay * 0.8);
                if (!isSafe) clearCellOverlay(r, c);
                break;
            }

            case 'place': {
                clearCellOverlay(r, c);
                setCellOverlay(r, c, 0x00FF00, 0.8);
                await sleep(150 / speed);
                clearCellOverlay(r, c);

                const { cx, cy } = getCellCenter(r, c);
                const queen = scene.add.image(cx, cy, 'gun').setScale(0).setAlpha(0).setDepth(9);
                scene.tweens.add({
                    targets: queen, alpha: 1, scaleX: 2.5, scaleY: 2.5,
                    duration: 200 / speed, ease: 'Back.easeOut'
                });
                queens.push({ row: r, col: c, graphics: queen });
                await sleep(baseDelay);
                break;
            }

            case 'remove': {
                const qIdx = queens.findIndex(q => q.row === r && q.col === c);
                if (qIdx !== -1) {
                    scene.tweens.add({
                        targets: queens[qIdx].graphics, alpha: 0, scale: 0,
                        duration: 200 / speed, ease: 'Power2',
                        onComplete: () => queens[qIdx]?.graphics?.destroy()
                    });
                    queens.splice(qIdx, 1);
                }
                setCellOverlay(r, c, 0xFF0000, 0.6);
                await sleep(baseDelay * 0.3);
                clearCellOverlay(r, c);
                await sleep(baseDelay * 0.5);
                break;
            }

            default:
                break;
        }
    }

    console.log('✅ [nqueenPlayback] Animation complete');

    // ====== แสดง Solution Boards ======
    if (options.result && Array.isArray(options.result) && options.result.length > 0) {
        const solutions = options.result;
        const isMulti = Array.isArray(solutions[0]) && Array.isArray(solutions[0][0]);

        if (isMulti && solutions.length > 0) {
            console.log(`🏆 Found ${solutions.length} solutions! Drawing mini boards...`);
            const miniStartX = 650;
            let miniY = 120;
            const maxShow = Math.min(solutions.length, 4);
            const miniScale = maxShow > 2 ? 0.35 : 0.5;

            for (let s = 0; s < maxShow; s++) {
                const sol = solutions[s];
                const solQueens = sol.map(pair => ({ row: pair[0], col: pair[1] }));
                drawMiniBoard(scene, miniStartX, miniY, n, solQueens, miniScale);

                scene.add.text(miniStartX, miniY - (n * 60 * miniScale) / 2 - 18,
                    `Solution ${s + 1}`, {
                    fontSize: '16px', color: '#FFD700', fontStyle: 'bold',
                    stroke: '#000', strokeThickness: 3
                }).setOrigin(0.5).setDepth(10);

                miniY += (n * 60 * miniScale) + 50;
            }

            await sleep(3000);
        }
    }
}
