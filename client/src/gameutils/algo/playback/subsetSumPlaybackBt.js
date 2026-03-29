// Subset Sum Backtracking Animation Playback
import { animationController, createTraceBuffer } from './AnimationController';
import { createTreeRenderer } from './TreeRenderer';

export async function playSubsetSumBacktrackAnimation(scene, trace, options = {}) {
    // สลับ Display Mode ตรงนี้:
    return playTreeDisplay(scene, trace, options);
}

// ============================================================================
// Display Mode 2: Tree Display (Reingold-Tilford)
// ============================================================================
async function playTreeDisplay(scene, trace, options) {
    const baseDelay = 800;
    if (!scene || !scene.subsetSum || !scene.subsetSum.warriors || !trace) return;

    const warriors = scene.subsetSum.warriors;
    const targetSum = scene.levelData?.algo_data?.payload?.target_sum || 0;

    const canvasW = scene.scale.width || 800;
    const canvasH = scene.scale.height || 600;
    const sleep = (ms) => animationController.sleep(ms);

    if (!scene || !trace) {
        console.warn('⚠️ [primPlayback] No scene or trace found');
        return;
    }

    // Status text (ย้ายไปอยู่มุมขวาล่างใต้ Target Sum เหมือน Coin Change)
    const statusText = scene.add.text(1050, 420, 'เริ่มสร้าง Tree...', {
        fontSize: '20px', color: '#FFFF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4, align: 'center', wordWrap: { width: 220 }
    }).setOrigin(0.5, 0).setDepth(20);

    // ดันต้นไม้ลงมาให้พ้น UI ด้านบน
    const tree = createTreeRenderer(scene, canvasW, canvasH);
    tree.container.setY(30);

    // Root node โชว์ผลรวมเริ่มต้น (0)
    const rootId = tree.addNode(null, -1, 0);
    tree.setState(rootId, 'active');

    // stack เก็บ node id เอาไว้ backtracking
    const path = [rootId];
    let currentSum = 0;

    tree.relayout();
    tree.redraw();

    for await (const step of createTraceBuffer(trace)) {
        if (!scene?.scene?.isActive(scene.scene.key)) break;

        // SubsetSum trace events: consider, include, exclude, reset
        if (step.action === 'include') {
            const idx = step.index;
            const parentId = path[path.length - 1];
            const warrior = warriors[idx];

            const parentSum = parentId !== null ? tree.nodes[parentId].amount : 0;
            currentSum = Number(parentSum) + Number(warrior.power);

            // Flash highlight over the setup warrior
            if (warrior && warrior.sprite) {
                const flash = scene.add.rectangle(warrior.sprite.x, warrior.sprite.y, 60, 60, 0x00FFFF, 0.6).setDepth(12);
                scene.tweens.add({ targets: flash, alpha: 0, duration: 400 / animationController.speed, onComplete: () => flash.destroy() });
            }

            // Edge label โชว์ว่า Include (+X)
            const id = tree.addNode(parentId, idx, currentSum, `+${warrior.power}`);

            if (currentSum === targetSum) {
                tree.setState(id, 'solved');
                statusText.setText(`✅ ผลรวมพอดีเป๊ะ! (Sum = ${currentSum})`).setColor('#00FF88');
            } else if (currentSum > targetSum) {
                tree.setState(id, 'dead');
                statusText.setText(`❌ ผลรวมเกิน! (${currentSum} > ${targetSum})`).setColor('#FF4444');
            } else {
                tree.setState(id, 'active');
                statusText.setText(`หยิบชิ้น ${idx + 1} (Sum = ${currentSum})`).setColor('#00FF88');
            }

            path.push(id);

            tree.relayout();
            tree.redraw();
            await sleep(baseDelay * 0.6);
        }
        else if (step.action === 'exclude') {
            const idx = step.index;
            const parentId = path[path.length - 1];

            const parentSum = parentId !== null ? tree.nodes[parentId].amount : 0;
            currentSum = parentSum;

            // Flash highlight over the setup warrior (skipped)
            const warrior = warriors[idx];
            if (warrior && warrior.sprite) {
                const flash = scene.add.rectangle(warrior.sprite.x, warrior.sprite.y, 60, 60, 0x00FFFF, 0.6).setAlpha(0.3).setDepth(12); // Slightly dimmer for skip
                scene.tweens.add({ targets: flash, alpha: 0, duration: 400 / animationController.speed, onComplete: () => flash.destroy() });
            }

            // Edge label = Exclude / Skip
            const id = tree.addNode(parentId, -1, currentSum, `Skip`); // -1 = ไม่ได้ใช้นักรบตัวไหนเลย

            tree.setState(id, 'active');
            statusText.setText(`⏭️ ข้ามชิ้น ${idx + 1} (Sum = ${currentSum})`).setColor('#FFA500');

            path.push(id);

            tree.relayout();
            tree.redraw();
            await sleep(baseDelay * 0.6);
        }
        else if (step.action === 'reset' || step.action === 'backtrack') {
            const deadId = path.pop();

            if (deadId !== undefined && tree.nodes[deadId]?.state !== 'solved') {
                tree.setState(deadId, 'dead');
                tree.redraw();
            }

            // Restore currentSum from parent
            if (path.length > 0) {
                const parentId = path[path.length - 1];
                currentSum = tree.nodes[parentId].amount;
            }

            statusText.setText('↩ Backtrack (ย้อนกลับ)').setColor('#FF9944');
            await sleep(baseDelay * 0.4);
        }
        else if (step.action === 'consider') {
            const idx = step.index;
            const warrior = warriors[idx];
            statusText.setText(`พิจารณาชิ้นที่ ${idx + 1}` + (warrior ? ` (Power: ${warrior.power})` : '')).setColor('#3498db');
            await sleep(baseDelay * 0.4);
        }
    }

    // Highlight solved path (หาคำตอบแรกที่พบ)
    let foundSolution = false;
    let successfulPathIndices = [];

    for (const n of tree.nodes) {
        if (n.amount === targetSum) {
            foundSolution = true;
            let cur = n.id;
            while (cur !== null) {
                tree.setState(cur, 'solved');
                // เก็บ index ของนักรบที่ถูกเลือกลงใน successfulPathIndices
                if (tree.nodes[cur].coinIdx >= 0) {
                    successfulPathIndices.push(tree.nodes[cur].coinIdx);
                }
                cur = tree.nodes[cur].parentId;
            }
            successfulPathIndices.reverse();
            break; // เอาแค่ชุดแรกที่เจอ
        }
    }

    tree.relayout();
    tree.redraw();

    if (foundSolution) {
        statusText.setText(`✅ สำเร็จ! พบผลรวมตรงตามเป้าหมาย (Sum = ${targetSum})`).setColor('#00FF88');
        await sleep(baseDelay);

        // ให้ Tree จางหายไปเพื่อให้เห็นฉากกระโดดชัดเจน (ตามแผน ไม่จางก็ได้ แต่เคืองตา อาจจะจางแค่ 0.1 หรือปล่อยไว้)
        // เพื่อให้ตรงตามที่ผู้ใช้ร้องขอล่าสุด "tree ไม่ต้องจางหาย" => ไม่สั่ง alpha: 0

        // นำตัวละครที่เป็นชุดคำตอบบินมาตรงกลางจอ
        await sleep(500);
        const centerY = canvasH / 2 + 70;
        const spacing = 180;
        const startHeroX = (canvasW / 2) - ((successfulPathIndices.length * spacing) / 2) + (spacing / 2);

        for (let idx = 0; idx < successfulPathIndices.length; idx++) {
            const warriorIdx = successfulPathIndices[idx];
            const w = warriors[warriorIdx];
            if (!w || !w.sprite) continue;

            const px = startHeroX + (idx * spacing);

            scene.tweens.add({
                targets: w.sprite,
                x: px,
                y: centerY,
                scale: 2.0, // ขยายขนาดตอนบินมาโชว์ตัว
                duration: 800 / animationController.speed,
                ease: 'Back.easeOut',
                onComplete: () => {
                    scene.tweens.add({
                        targets: w.sprite,
                        y: '-=20',
                        yoyo: true,
                        repeat: -1,
                        duration: 350
                    });
                }
            });

            if (w.powerText) {
                scene.tweens.add({
                    targets: w.powerText,
                    x: px,
                    y: centerY - 60,
                    scale: 1.5,
                    duration: 800 / animationController.speed,
                    ease: 'Back.easeOut'
                });
            }
            if (w.labelText) w.labelText.setVisible(false);

            await sleep(200);
        }

        await sleep(baseDelay * 1.5);
    } else {
        statusText.setText(`❌ ไม่พบคำตอบที่ทำผลรวมได้ ${targetSum}`).setColor('#FF4444');
        await sleep(baseDelay * 2.0);
    }
}
