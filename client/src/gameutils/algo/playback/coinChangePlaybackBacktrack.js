/**
 * coinChangePlaybackBacktrack.js
 * เลน Animation แบบ Backtracking (Stacking Bar / Tree)
 */
import { animationController, createTraceBuffer } from './AnimationController';
import { createTreeRenderer } from './TreeRenderer';

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
    const statusText = scene.add.text(1050, 420, 'เริ่มสร้าง Tree...', {
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
                statusText.setText(`✅ ครบ! ใช้ ${power} → 0`).setColor('#00FF88');

                // ตรวจสอบว่านี่คือชุดคำตอบที่สั้นที่สุดหรือไม่
                if (!bestSolution || currentCoins.length < bestSolution.length) {
                    bestSolution = [...currentCoins];
                }
            } else if (newAmt < 0) {
                tree.setState(id, 'dead');
                statusText.setText(`❌ เกิน (${newAmt})`).setColor('#FF4444');
            } else {
                tree.setState(id, 'active');
                statusText.setText(`⚔️ ใช้ ${power} → เหลือ ${newAmt}`).setColor('#FFFF00');
            }

            path.push(id);
            tree.relayout();
            tree.redraw();
            await sleep(baseDelay * 0.6);
        }

        else if (step.action === 'remove_coin') {
            const deadId = path.pop();
            currentCoins.pop();

            if (deadId !== undefined && tree.nodes[deadId].state !== 'solved') {
                tree.setState(deadId, 'dead');
                tree.redraw();
            }
            statusText.setText('↩ Backtrack').setColor('#FF9944');
            await sleep(baseDelay * 0.4);
        }
    }

    // จบกระบวนการวาด Tree
    tree.relayout();
    tree.redraw();

    if (bestSolution && bestSolution.length > 0) {
        statusText.setText(`✅ เสร็จสิ้น! คำตอบที่ดีที่สุดใช้ ${bestSolution.length} เหรียญ`).setColor('#00FF88');
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
            if (!w) continue;

            const px = startHeroX + (idx * spacing);
            const tex = w.powerSquare?.texture?.key || 'bot_slime1';

            // ดึงตัวละครเดิมจาก setup มา animate ย้ายมาตรงกลางแทนที่จะสร้าง clone ตัวใหม่
            scene.tweens.add({
                targets: w.powerSquare,
                x: px,
                y: centerY,
                scale: 2.0, // ให้ใหญ่ขึ้นนิดนึงตอนมาโชว์ตัว
                duration: 800 / animationController.speed,
                ease: 'Back.easeOut',
                onComplete: () => {
                    // โดดฉลอง
                    scene.tweens.add({
                        targets: w.powerSquare,
                        y: '-=20',
                        yoyo: true,
                        repeat: -1,
                        duration: 350
                    });
                }
            });

            // เลื่อนป้ายพลังตามมาด้วย
            scene.tweens.add({
                targets: w.powerText,
                x: px,
                y: centerY - 60,
                duration: 800 / animationController.speed,
                ease: 'Back.easeOut'
            });

            await sleep(200);
        }

        await sleep(baseDelay * 1.5);
    } else {
        statusText.setText('❌ สิ้นสุดการค้นหา ไม่พบวิธีการใดที่สำเร็จ').setColor('#FF5555');
        await sleep(baseDelay * 2.0);
    }
}
