/**
 * nqueenPlayback.js — N-Queen Animation Playback
 *
 * แต่ละ Display Mode เป็น self-contained 100%:
 * วาด grid, เล่น animation, แสดง solution boards — ทุกอย่างอยู่ใน function เดียว
 * ถ้าอยากเพิ่มแบบใหม่ (เช่น tree) ก็สร้าง function ใหม่แล้วมาสลับตรง router
 */
import { animationController, createTraceBuffer } from './AnimationController';
import { createTreeRenderer } from './TreeRenderer';
import { playSound } from '../../sound/soundManager';
import { createGameActions } from '../../../components/playgame/hooks/execution/gameActions'

/**
 * ระบบสับสวิตช์โหมดการแสดงผลของ N-Queen (ตั้งค่าเป็น 'CLASSIC' หรือ 'TREE')
 * การตั้งค่านี้จะถูกนำไปใช้ร่วมกับฉากเริ่มต้นด้วย
 */
export const NQUEEN_DISPLAY_MODE = 'CLASSIC';

/**
 * Router: เรียก Display Mode ที่ต้องการ (แค่นี้เท่านั้น ไม่ทำอะไรเพิ่ม)
 */
export async function playNQueenAnimation(scene, trace, options = {}) {
    if (NQUEEN_DISPLAY_MODE === 'TREE') {
        return playTreeDisplay(scene, trace, options);
    } else {
        return playClassicDisplay(scene, trace, options);
    }
}

// ============================================================================
// Display Mode 2: Tree Display (Reingold-Tilford)
// ============================================================================
async function playTreeDisplay(scene, trace, options) {
    const baseDelay = 800;

    if (!scene || !trace) {
        console.warn('⚠️ [nqueenPlayback] No scene or trace');
        return;
    }

    // ลบกระดาน 2D ที่สร้างจาก nqueenSetup.js ทิ้งไปเลย เพราะหน้านี้เราจะโชว์เป็น Tree
    if (scene.nqueenBoard && scene.nqueenBoard.graphics) {
        scene.nqueenBoard.graphics.forEach(gfx => {
            if (gfx && gfx.destroy) gfx.destroy();
        });
        scene.nqueenBoard.graphics = [];
    }

    const n = scene.levelData?.algo_data?.payload?.n || options.n || 4;
    const canvasW = scene.scale.width || 800;
    const canvasH = scene.scale.height || 600;
    const sleep = (ms) => animationController.sleep(ms);

    // Status text (ย้ายไปอยู่มุมขวาล่างให้เหมือนด่านอื่นๆ)
    const statusText = scene.add.text(1050, 420, 'เริ่มสำรวจรูปแบบการจัดวาง...', {
        fontSize: '20px', color: '#FFFF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4, align: 'center', wordWrap: { width: 220 }
    }).setOrigin(0.5, 0).setDepth(20);

    const tree = createTreeRenderer(scene, canvasW, canvasH);
    tree.container.setY(30);

    // Root node: start with an empty board represented by amount=0 just to show root
    const rootId = tree.addNode(null, -1, 0, 'Root');
    tree.setState(rootId, 'active');

    // stack เก็บ node id เอาไว้ backtracking
    const path = [rootId];
    let currentQueensPlaced = 0;

    tree.relayout();
    tree.redraw();

    for await (const step of createTraceBuffer(trace)) {
        if (!scene?.scene?.isActive(scene.scene.key)) break;

        // nQueens trace events: consider, place, remove
        if (step.action === 'consider') {
            const r = step.row;
            const c = step.col;
            const isSafe = step.safe !== undefined ? step.safe : true;
            statusText.setText(`พิจารณาช่อง (แถว ${r}, คอลัมน์ ${c})`)

            // Highlight the fact we are considering
            await sleep(baseDelay * 0.4);
        }
        else if (step.action === 'place') {
            const r = step.row;
            const c = step.col;
            const parentId = path[path.length - 1];

            const currentQueensPlaced = (parentId !== null && tree.nodes[parentId].amount !== undefined)
                ? tree.nodes[parentId].amount + 1 : 1;

            // Edge label โชว์ Row,Col
            const id = tree.addNode(parentId, c, currentQueensPlaced, `(R${r},C${c})`);

            if (currentQueensPlaced === n) {
                tree.setState(id, 'solved');
                statusText.setText(`วางกระดานได้สมบูรณ์ พบการจัดวางที่ถูกต้อง`)
            } else {
                tree.setState(id, 'active');
                statusText.setText(`วางหมากที่ (แถว ${r}, คอลัมน์ ${c})`)
            }

            path.push(id);

            tree.relayout();
            tree.redraw();
            playSound('run');
            await sleep(baseDelay * 0.6);
        }
        else if (step.action === 'remove') {
            const r = step.row;
            const c = step.col;
            const deadId = path.pop();

            if (deadId !== undefined && tree.nodes[deadId]?.state !== 'solved') {
                tree.setState(deadId, 'dead');
                tree.redraw();
            }

            statusText.setText(`นำหมากออกจาก (แถว ${r}, คอลัมน์ ${c}) และพิจารณาช่องถัดไป`).setColor('#FF9944');
            await sleep(baseDelay * 0.5);
        }
    }

    // Highlight all solved paths
    let foundSolution = false;
    for (const node of tree.nodes) {
        if (node.amount === n) {
            foundSolution = true;
            let cur = node.id;
            while (cur !== null) {
                tree.setState(cur, 'solved');
                cur = tree.nodes[cur].parentId;
            }
        }
    }

    tree.relayout();
    tree.redraw();

    if (foundSolution) {
        statusText.setText(`ค้นหาเสร็จสิ้น พบแบบจำลองการจัดวาง`).setColor('#00FF88');
    } else {
        statusText.setText(`ค้นหาเสร็จสิ้น ไม่พบชุดรูปแบบการจัดวาง`).setColor('#FF4444');
    }

    await sleep(baseDelay * 2.0);
}



// ============================================================================
// Display Mode 1: Classic Display (self-contained 100%)
// ============================================================================

async function playClassicDisplay(scene, trace, options = {}) {
    const { speed = 1.0 } = options;
    const baseDelay = 200;

    if (!scene || !trace) {
        console.warn('⚠️ [nqueenPlayback] No scene or trace');
        return;
    }

    // อ่านตัวแปรทั้งหมดจาก nqueenSetup.js (หากมี) 
    const boardState = scene.nqueenBoard || {};
    const n = boardState.n || scene.levelData?.algo_data?.payload?.n || options.n || 4;
    const cellSize = boardState.cellSize || 60;
    const boardStartX = boardState.startX || 400;
    const boardStartY = boardState.startY || 300;
    const boardWidth = boardState.width || (n * cellSize);
    const boardHeight = boardState.height || (n * cellSize);

    // เราไม่วาดบอร์ดพื้นฐานซ้ำตรงนี้แล้วเพราะ nqueenSetup.js ได้วาดรอไว้แล้วตั้งแต่โหลดด่าน

    // ====== Helpers ======
    const sleep = (ms) => animationController.sleep(ms);

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
    }; const queens = [];
    let solutionCount = 0;

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
                await sleep(150);
                clearCellOverlay(r, c);

                const { cx, cy } = getCellCenter(r, c);
                const queen = scene.add.image(cx, cy, 'gun').setScale(0).setAlpha(0).setDepth(9);
                scene.tweens.add({
                    targets: queen, alpha: 1, scaleX: 2.5, scaleY: 2.5,
                    duration: 200 / animationController.speed, ease: 'Back.easeOut'
                });
                playSound('run');
                queens.push({ row: r, col: c, graphics: queen });
                await sleep(baseDelay);

                // --- DETECT SOLUTION IN REAL-TIME ---
                if (queens.length === n) {
                    solutionCount++;
                    const overlay = scene.add.rectangle(boardStartX, boardStartY, boardWidth, boardHeight, 0x00FF00, 0.2).setDepth(10);
                    const solutionText = scene.add.text(boardStartX, boardStartY + 180, `ค้นพบรูปแบบที่ ${solutionCount} ถูกต้อง!`, {
                        fontSize: '28px', color: '#FFFFFF', fontStyle: 'bold', stroke: '#000', strokeThickness: 6
                    }).setOrigin(0.5).setDepth(11);

                    playSound('success');
                    await sleep(3000); // Pause for 3 seconds to let user see it clearly

                    overlay.destroy();
                    solutionText.destroy();
                }
                break;
            }

            case 'remove': {
                const qIdx = queens.findIndex(q => q.row === r && q.col === c);
                if (qIdx !== -1) {
                    scene.tweens.add({
                        targets: queens[qIdx].graphics, alpha: 0, scale: 0,
                        duration: 200 / animationController.speed, ease: 'Power2',
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
            case 'say': {
                // สร้างกล่องเครื่องมือจำลอง 
                const actions = createGameActions({}, null, false);

                // หยิบคำสั่ง say ออกมาใช้
                actions.say(step.text);
                break;

            }

            default:
                break;
        }
    }


    // ====== แสดง Solution Boards ======
    if (options.result && Array.isArray(options.result) && options.result.length > 0) {
        const solutions = options.result;
        const isMulti = Array.isArray(solutions[0]) && Array.isArray(solutions[0][0]);

        if (isMulti && solutions.length > 0) {
            const maxShow = Math.min(solutions.length, 10);

            // Adjust scale based on how many we need to show
            const miniScale = maxShow > 4 ? 0.3 : (maxShow > 2 ? 0.4 : 0.5);

            for (let s = 0; s < maxShow; s++) {
                const sol = solutions[s];
                const solQueens = sol.map(pair => ({ row: pair[0], col: pair[1] }));

                // Calculate column and row position
                const col = Math.floor(s / 5);
                const row = s % 5;

                const miniStartX = 750 + (col * (n * 60 * miniScale + 50));
                const miniY = 120 + (row * (n * 60 * miniScale + 50));

                drawMiniBoard(scene, miniStartX, miniY, n, solQueens, miniScale);

                scene.add.text(miniStartX, miniY - (n * 60 * miniScale) / 2 - 18,
                    `Solution ${s + 1}`, {
                    fontSize: '14px', color: '#FFD700', fontStyle: 'bold',
                    stroke: '#000', strokeThickness: 3
                }).setOrigin(0.5).setDepth(10);
            }

            if (solutions.length > maxShow) {
                scene.add.text(800, 700, `... และคำตอบอื่นๆ อีก ${solutions.length - maxShow} รูปแบบ`, {
                    fontSize: '20px', color: '#FFD700', fontStyle: 'bold',
                    stroke: '#000', strokeThickness: 4
                }).setOrigin(0.5).setDepth(10);
            }

            await sleep(3000);
        }
    }
}

