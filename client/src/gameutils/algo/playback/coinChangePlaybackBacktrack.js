/**
 * coinChangePlaybackBacktrack.js
 * เลน Animation แบบ Backtracking (Stacking Bar / Tree)
 */
import { animationController, createTraceBuffer } from './AnimationController';
import { createTreeRenderer } from './TreeRenderer';
import { playSound } from '../../sound/soundManager';

export async function playCoinChangeBacktrackAnimation(scene, trace, options = {}) {
    return playTreeDisplay(scene, trace, options);
}

async function playTreeDisplay(scene, trace, options) {
    const baseDelay = 800;
    if (!scene || !scene.coinChange || !trace) return;

    const warriors = scene.coinChange.warriors;
    const targetAmount = scene.levelData?.algo_data?.payload?.monster_power || 0;
    const sleep = (ms) => animationController.sleep(ms);
    const canvasW = scene.scale.width || 800;
    const canvasH = scene.scale.height || 600;

    // Status text (ย้ายไปอยู่ใต้บอสด้านขวา ตามที่ขอ)
    const statusText = scene.add.text(1050, 420, 'เริ่มสำรวจทางเลือก...', {
        fontSize: '20px', color: '#FFFF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4, align: 'center', wordWrap: { width: 220 }
    }).setOrigin(0.5, 0).setDepth(20);

    // สร้าง Tree + Root ให้อยู่ต่ำลงมานิดหน่อย
    const tree = createTreeRenderer(scene, canvasW, canvasH);
    tree.container.setY(30); // เลื่อนต้นไม้ทั้งก้อนลงมา 60 px

    const rootId = tree.addNode(null, -1, targetAmount);
    tree.setState(rootId, 'active');
    const path = [rootId];  // stack เก็บ active path
    const currentCoins = []; // เก็บ coinIdx ที่เลือกใน path ปัจจุบัน
    let bestSolution = null;

    tree.relayout();
    tree.redraw();

    // วน trace
    for await (const step of createTraceBuffer(trace)) {
        if (!scene?.scene?.isActive(scene.scene.key)) break;

        if (step.action === 'select_coin') {
            const coinIdx = step.coin;
            const parentId = path[path.length - 1];
            const parent = tree.nodes[parentId];
            const power = warriors[coinIdx]?.power ?? 0;
            const newAmt = parent.amount - power;

            // เพิ่ม node
            const id = tree.addNode(parentId, coinIdx, newAmt, `-${power}`);

            // Flash highlight over the setup warrior
            const w = warriors[coinIdx];
            if (w) {
                const flash = scene.add.rectangle(w.x, w.y, 60, 60, 0x00FFFF, 0.6).setDepth(12);
                scene.tweens.add({ targets: flash, alpha: 0, duration: 400 / animationController.speed, onComplete: () => flash.destroy() });
            }

            currentCoins.push(coinIdx);

            // กำหนดสถานะ
            if (newAmt === 0) {
                tree.setState(id, 'solved');
                statusText.setText(`ผลรวมพอดี ใช้ ${power}`)

                // ตรวจสอบว่านี่คือชุดคำตอบที่สั้นที่สุดหรือไม่
                if (!bestSolution || currentCoins.length < bestSolution.length) {
                    bestSolution = [...currentCoins];
                }
            } else if (newAmt < 0) {
                tree.setState(id, 'dead');
                statusText.setText(`เกินเป้าหมาย`)
            } else {
                tree.setState(id, 'active');
                statusText.setText(`เลือก ${power} (ขาดอีก ${newAmt})`)
            }

            path.push(id);
            tree.relayout();
            tree.redraw();
            playSound('run');
            await sleep(baseDelay * 0.6);
        }

        else if (step.action === 'remove_coin') {
            const deadId = path.pop();
            currentCoins.pop();

            if (deadId !== undefined && tree.nodes[deadId].state !== 'solved') {
                tree.setState(deadId, 'dead');
                tree.redraw();
            }
            statusText.setText('ย้อนกลับไปทางเลือกก่อนหน้า')
            await sleep(baseDelay * 0.4);
        }
    }

    // จบกระบวนการวาด Tree
    tree.relayout();
    tree.redraw();

    if (bestSolution && bestSolution.length > 0) {
        statusText.setText(`ค้นหาเสร็จสิ้น (ใช้น้อยสุด ${bestSolution.length} เหรียญ)`).setColor('#00FF88');
        await sleep(baseDelay);

        // ทำให้ Tree จางหายไปเพื่อให้จุดโฟกัสกลับมาที่ตัวละคร
        if (tree.graphics) {
            scene.tweens.add({
                targets: tree.graphics,
                alpha: 0,
                duration: 800
            });
            Object.values(tree.nodes).forEach(node => {
                const elements = [node.bg, node.bgStroke, node.text, node.edgeLabelBg, node.edgeText].filter(Boolean);
                scene.tweens.add({ targets: elements, alpha: 0, duration: 800 });
            });
        }

        await sleep(500);

        // นำตัวละครที่เป็น Best Solution บินมาตรงกลาง
        const centerY = canvasH / 2 + 70;
        const spacing = 120;
        const startHeroX = (canvasW / 2) - ((bestSolution.length * spacing) / 2) + (spacing / 2);

        for (let idx = 0; idx < bestSolution.length; idx++) {
            const warriorIdx = bestSolution[idx];
            const w = warriors[warriorIdx];
            if (!w || !w.powerSquare) continue;

            const px = startHeroX + (idx * spacing);
            const py = centerY;
            const tex = w.powerSquare.texture.key;

            // ดึงพิกัดจากตัวออริจินัลฝั่งซ้าย
            const spawnX = w.x;
            const spawnY = w.y;

            // สร้างร่างเงา (Clone) เริ่มจากตำแหน่งฝั่งซ้าย
            const ghost = scene.add.sprite(spawnX, spawnY, tex)
                .setDisplaySize(80, 80).setDepth(30).setAlpha(0);

            if (w.powerSquare.frame && w.powerSquare.frame.name) {
                ghost.setFrame(w.powerSquare.frame.name);
            }

            // ตัวเลขพลัง — เริ่มจากเป้าหมายที่เดียวกัน 
            const powerLabel = scene.add.text(spawnX, spawnY + 45, `ATK: ${w.power}`, {
                fontSize: '20px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
            }).setOrigin(0.5).setDepth(31).setAlpha(0);

            // Animate ร่าง Clone ไปตรงกลาง
            scene.tweens.add({
                targets: ghost,
                x: px,
                y: py,
                alpha: 1,
                scale: 1.5,
                duration: 800 / animationController.speed,
                ease: 'Back.easeOut',
                onStart: () => playSound('paper'),
                onComplete: () => {
                    // โดดฉลอง
                    scene.tweens.add({
                        targets: ghost,
                        y: '-=15',
                        yoyo: true,
                        repeat: -1,
                        duration: 350
                    });
                }
            });

            // เลื่อนป้ายพลังตามมาด้วย
            scene.tweens.add({
                targets: powerLabel,
                x: px,
                y: py + 45,
                alpha: 1,
                duration: 800 / animationController.speed,
                ease: 'Back.easeOut'
            });

            await sleep(200);
        }

        await sleep(baseDelay * 1.5);
    } else {
        statusText.setText('ค้นหาเสร็จสิ้น ไม่พบวิธีการที่พอดี').setColor('#FF5555');
        await sleep(baseDelay * 2.0);
    }
}
