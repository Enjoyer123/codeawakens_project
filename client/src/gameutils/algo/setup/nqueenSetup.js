/**
 * Setup N-Queen Visuals (ฉากพื้นฐานของกระดาน N-Queen)
 * ถูกเรียกใช้จาก GameScene.js ตอนโหลดด่าน
 */
import { getAlgoPayload } from '../../shared/levelType';
import { NQUEEN_DISPLAY_MODE } from '../playback/nqueenPlayback';

export function setupNQueen(scene) {
    const payload = getAlgoPayload(scene.levelData, 'NQUEEN');
    if (!payload) return;

    // ถ้าระบบถูกปรับให้ใช้ Tree Mode เราจะไม่วาดตารางรอไว้ตั้งแต่แรก (ปล่อยไว้ให้ playTreeDisplay วาดเอง)
    if (NQUEEN_DISPLAY_MODE === 'TREE') return;

    const n = payload.n || 4;
    
    // Store properties in scene for playback to use
    scene.nqueenBoard = {
        n: n,
        cellSize: 60,
        startX: 400,
        startY: 300,
        width: n * 60,
        height: n * 60,
        graphics: []
    };

    const { cellSize, startX, startY, width, height } = scene.nqueenBoard;

    // ====== วาด Board ======
    const bgRect = scene.add.rectangle(startX, startY, width, height, 0xFDF5E6);
    bgRect.setStrokeStyle(3, 0x333333);
    bgRect.setDepth(4);
    scene.nqueenBoard.graphics.push(bgRect);

    for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
            // Draw dark squares
            if ((row + col) % 2 === 1) {
                const x = startX - width / 2 + col * cellSize + cellSize / 2;
                const y = startY - height / 2 + row * cellSize + cellSize / 2;
                const square = scene.add.rectangle(x, y, cellSize - 1, cellSize - 1, 0xD4A574, 0.5).setDepth(4);
                scene.nqueenBoard.graphics.push(square);
            }
        }
    }

    // Grid lines
    const gridGfx = scene.add.graphics().setDepth(5);
    gridGfx.lineStyle(2, 0x333333, 0.8);
    for (let i = 0; i <= n; i++) {
        const vx = startX - width / 2 + (i * cellSize);
        gridGfx.moveTo(vx, startY - height / 2);
        gridGfx.lineTo(vx, startY + height / 2);
        
        const hy = startY - height / 2 + (i * cellSize);
        gridGfx.moveTo(startX - width / 2, hy);
        gridGfx.lineTo(startX + width / 2, hy);
    }
    gridGfx.strokePath();
    scene.nqueenBoard.graphics.push(gridGfx);

    // Coordinates (Numbers on axes)
    for (let i = 0; i < n; i++) {
        // X-axis columns (top)
        const cx = startX - width / 2 + (i * cellSize) + cellSize / 2;
        const txtX = scene.add.text(cx, startY - height / 2 - 18, i.toString(), {
            fontSize: '16px', color: '#FFD700', fontStyle: 'bold', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(6);
        scene.nqueenBoard.graphics.push(txtX);

        // Y-axis rows (left)
        const ry = startY - height / 2 + (i * cellSize) + cellSize / 2;
        const txtY = scene.add.text(startX - width / 2 - 18, ry, i.toString(), {
            fontSize: '16px', color: '#FFD700', fontStyle: 'bold', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(6);
        scene.nqueenBoard.graphics.push(txtY);
    }
}
