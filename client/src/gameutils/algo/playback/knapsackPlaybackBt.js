import { animationController, createTraceBuffer } from './AnimationController';
import { createTreeRenderer } from './TreeRenderer';
import { playSound } from '../../sound/soundManager';

export async function playKnapsackBacktrackAnimation(scene, trace, options = {}) {
    // สลับ Display Mode ตรงนี้:
    return playTreeDisplay(scene, trace, options);
}

// ============================================================================
// Display Mode 2: Tree Display (Reingold-Tilford)
// ============================================================================
async function playTreeDisplay(scene, trace, options) {
    const baseDelay = 800;
    if (!scene || !scene.knapsack || !trace) return;

    const items = scene.knapsack.items;
    const canvasW = scene.scale.width || 800;
    const canvasH = scene.scale.height || 600;
    const sleep = (ms) => animationController.sleep(ms);

    // Status text (ย้ายไปอยู่มุมขวาล่างใต้กระเป๋า เหมือน Coin Change)
    const statusText = scene.add.text(1050, 300, 'เริ่มสำรวจทางเลือก...', {
        fontSize: '20px', color: '#FFFF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4, align: 'center', wordWrap: { width: 220 }
    }).setOrigin(0.5, 0).setDepth(20);

    const subText = scene.add.text(1050, 500, 'มูลค่า $0', {
        fontSize: '20px', color: '#FFFF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4, align: 'center', wordWrap: { width: 220 }
    }).setOrigin(0.5, 0).setDepth(20);

    const tree = createTreeRenderer(scene, canvasW, canvasH);
    tree.container.setY(30);

    // Root node (weight remaining = bag.maxWeight)
    // สำหรับ Knapsack ค่า amount จะใช้โชว์อะไร? สมมติโชว์มูลค่าสะสม (Value)
    const rootId = tree.addNode(null, -1, 0);
    tree.nodes[rootId].weight = 0;
    tree.setState(rootId, 'active');

    // stack เก็บ node id เอาไว้ backtracking แบบ Push/Pop ธรรมดา
    const path = [rootId];

    const maxWeight = scene.knapsack?.bag?.maxWeight || scene.levelData?.algo_data?.payload?.capacity || 0;

    tree.relayout();
    tree.redraw();

    for await (const step of createTraceBuffer(trace)) {
        if (!scene?.scene?.isActive(scene.scene.key)) break;

        if (step.action === 'pick') {
            const idx = step.index;
            const parentId = path[path.length - 1];
            const item = items[idx];

            const parentWeight = parentId !== null && tree.nodes[parentId].weight !== undefined ? tree.nodes[parentId].weight : 0;
            const parentValue = parentId !== null ? tree.nodes[parentId].amount : 0;

            const currentWeight = Number(parentWeight) + Number(item.weight);
            const currentValue = Number(parentValue) + Number(item.price);

            // Flash highlight over the setup item
            if (item && item.sprite) {
                const flash = scene.add.rectangle(item.sprite.x, item.sprite.y, 60, 60, 0x00FFFF, 0.6).setDepth(12);
                scene.tweens.add({ targets: flash, alpha: 0, duration: 400 / animationController.speed, onComplete: () => flash.destroy() });
            }

            // Edge label โชว์น้ำหนัก (-xg) หรือโชว์ว่า 'Pick'
            // Node label โชว์ Value ($X)
            const id = tree.addNode(parentId, idx, currentValue, `+$${item.price}`);
            tree.nodes[id].weight = currentWeight;

            if (currentWeight > maxWeight) {
                tree.setState(id, 'dead');
                statusText.setText(`น้ำหนักเกิน แบกชิ้นที่ ${idx + 1} ไม่ได้ (${currentWeight}/${maxWeight}kg)`).setColor('#FF4444');
            } else {
                tree.setState(id, 'active');
                statusText.setText(`เลือกชิ้นที่ ${idx + 1} ($${item.price}, ${item.weight}kg)`);
                subText.setText(`มูลค่า $${currentValue}`);
            }

            path.push(id);

            tree.relayout();
            tree.redraw();
            playSound('run');
            await sleep(baseDelay * 0.6);
        }
        else if (step.action === 'skip') {
            const idx = step.index;
            const parentId = path[path.length - 1];

            const parentWeight = parentId !== null && tree.nodes[parentId].weight !== undefined ? tree.nodes[parentId].weight : 0;
            const parentValue = parentId !== null ? tree.nodes[parentId].amount : 0;

            const currentWeight = parentWeight;
            const currentValue = parentValue;

            // Flash highlight over the setup item (skipped)
            const item = items[idx];
            if (item && item.sprite) {
                const flash = scene.add.rectangle(item.sprite.x, item.sprite.y, 60, 60, 0x00FFFF, 0.6).setAlpha(0.3).setDepth(12); // Dimmer for skip
                scene.tweens.add({ targets: flash, alpha: 0, duration: 400 / animationController.speed, onComplete: () => flash.destroy() });
            }

            // Edge label = Skip
            const id = tree.addNode(parentId, -1, currentValue, `Skip`); // -1 เพราะไม่ได้เลือก item ไหนเลย
            tree.nodes[id].weight = currentWeight;

            tree.setState(id, 'active');
            statusText.setText(`ไม่เลือกชิ้นที่ ${idx + 1}`);
            subText.setText(`มูลค่า $${currentValue}`);

            path.push(id);

            tree.relayout();
            tree.redraw();
            playSound('run');
            await sleep(baseDelay * 0.6);
        }
        else if (step.action === 'remove') {
            const deadId = path.pop();
            if (deadId !== undefined && tree.nodes[deadId]?.state !== 'solved') {
                tree.setState(deadId, 'dead');
                tree.redraw();
            }

            statusText.setText('ย้อนกลับไปทางเลือกก่อนหน้า');
            await sleep(baseDelay * 0.4);
        }
        else if (step.action === 'consider') {
            const idx = step.index;
            const item = items[idx];
            statusText.setText(`พิจารณาชิ้นที่ ${idx + 1}` + (item ? `\n($${item.price}, ${item.weight}kg)` : ""));
            await sleep(baseDelay * 0.4);
        }
    }

    // หายอดที่ดีที่สุดมาไฮไลต์
    let bestNodeId = -1;
    let maxVal = -1;
    for (let i = 0; i < tree.nodes.length; i++) {
        const node = tree.nodes[i];
        if (node.weight <= maxWeight) {
            if (node.amount > maxVal) {
                maxVal = node.amount;
                bestNodeId = i;
            }
        }
    }

    let successfulPathIndices = [];
    if (bestNodeId !== -1 && maxVal > 0) {
        let cur = bestNodeId;
        while (cur !== null) {
            tree.setState(cur, 'solved');
            // เก็บ index ของไอเทมที่ถูกเลือกลงใน successfulPathIndices
            if (tree.nodes[cur].coinIdx >= 0) {
                successfulPathIndices.push(tree.nodes[cur].coinIdx);
            }
            cur = tree.nodes[cur].parentId;
        }
        successfulPathIndices.reverse();
    }

    tree.relayout();
    tree.redraw();

    if (maxVal > 0) {
        statusText.setText(`ค้นหาเสร็จสิ้น ค่าสูงสุดที่ได้คือ`).setColor('#00FF88');
        subText.setText(`มูลค่า $${maxVal}`).setColor('#00FF88');
        await sleep(baseDelay);

        // นำไอเทมที่เป็นชุดคำตอบบินเข้าไปสะสมในกระเป๋า
        await sleep(500);

        const bagX = scene.knapsack?.bag?.x || 1050;
        const bagY = scene.knapsack?.bag?.y || 300;

        for (let idx = 0; idx < successfulPathIndices.length; idx++) {
            const itemIdx = successfulPathIndices[idx];
            const itemObj = items[itemIdx];
            if (!itemObj || !itemObj.sprite) continue;

            const targetY = bagY - (idx * 25) - 30; // วางซ้อนกันแนวตั้งในกระเป๋า

            scene.tweens.add({
                targets: itemObj.sprite,
                x: bagX,
                y: targetY,
                scale: 0.9, // ย่อขนาดลงนิดนึงตอนเข้ากระเป๋า
                duration: 600 / animationController.speed,
                ease: 'Back.easeIn',
                onStart: () => playSound('paper'),
                onComplete: () => {
                    // สร้างข้อความลอยขึ้นมาแสดงมูลค่าตอนที่ไอเทมลงกระเป๋า
                    const floatText = scene.add.text(bagX, targetY - 30, `+$${itemObj.price}`, {
                        fontSize: '26px', color: '#00FF88', fontStyle: 'bold', stroke: '#000', strokeThickness: 5
                    }).setOrigin(0.5).setDepth(30);

                    scene.tweens.add({
                        targets: floatText,
                        y: targetY - 80,
                        alpha: 0,
                        duration: 1000,
                        ease: 'Power1',
                        onComplete: () => floatText.destroy()
                    });
                }
            });

            // ซ่อนข้อความและเอฟเฟกต์เดิมตอนบิน
            if (itemObj.labelText) itemObj.labelText.setVisible(false);
            if (itemObj.glowEffect) itemObj.glowEffect.setVisible(false);

            await sleep(500);
        }

        await sleep(baseDelay * 1.5);
    } else {
        statusText.setText(`ไม่ได้เลือกของเข้ากระเป๋า`).setColor('#FF4444');
        await sleep(baseDelay * 2.0);
    }
}
