/**
 * coinChangePlaybackBacktrack.js
 * เล่น Animation แบบ Backtracking (Binary Decision Tree)
 * Pattern เดียวกันกับ knapsackPlaybackBt.js / subsetSumPlaybackBt.js
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

    // Status text
    const statusText = scene.add.text(1050, 420, 'เริ่มสำรวจทางเลือก...', {
        fontSize: '20px', color: '#FFFF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4, align: 'center', wordWrap: { width: 220 }
    }).setOrigin(0.5, 0).setDepth(20);

    // สร้าง Tree + Root
    const tree = createTreeRenderer(scene, canvasW, canvasH);
    tree.container.setY(30);

    // Root node → amount ที่ต้องทอน
    const rootId = tree.addNode(null, -1, targetAmount);
    tree.setState(rootId, 'active');
    const path = [rootId];
    const currentCoins = [];
    let bestSolution = null;
    let bestSolutionNodeId = null;

    tree.relayout();
    tree.redraw();

    for await (const step of createTraceBuffer(trace)) {
        if (!scene?.scene?.isActive(scene.scene.key)) break;

        if (step.action === 'pick') {
            const idx = step.index;
            const parentId = path[path.length - 1];
            const parent = tree.nodes[parentId];
            const power = warriors[idx]?.power ?? 0;
            const newAmt = parent.amount - power;

            // Flash highlight over the warrior
            const w = warriors[idx];
            if (w && w.sprite) {
                const flash = scene.add.rectangle(w.sprite ? w.sprite.x : w.x, w.sprite ? w.sprite.y : w.y, 60, 60, 0x00FFFF, 0.6).setDepth(12);
                scene.tweens.add({ targets: flash, alpha: 0, duration: 400 / animationController.speed, onComplete: () => flash.destroy() });
            } else if (w) {
                const flash = scene.add.rectangle(w.x, w.y, 60, 60, 0x00FFFF, 0.6).setDepth(12);
                scene.tweens.add({ targets: flash, alpha: 0, duration: 400 / animationController.speed, onComplete: () => flash.destroy() });
            }

            const id = tree.addNode(parentId, idx, newAmt, `-${power}`);
            tree.nodes[id].isPick = true; // Mark that this node picked a coin

            currentCoins.push(idx);

            if (newAmt === 0) {
                tree.setState(id, 'solved');
                statusText.setText(`ผลรวมพอดี! ใช้ ${power}`);
                if (!bestSolution || currentCoins.length < bestSolution.length) {
                    bestSolution = [...currentCoins];
                    bestSolutionNodeId = id;
                }
            } else if (newAmt < 0) {
                tree.setState(id, 'dead');
                statusText.setText(`เกินเป้าหมาย`);
            } else {
                tree.setState(id, 'active');
                statusText.setText(`เลือก ${power} (ขาดอีก ${newAmt})`);
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
            const parentAmt = parentId !== null ? tree.nodes[parentId].amount : targetAmount;

            // Flash highlight (dimmer for skip)
            const w = warriors[idx];
            if (w && w.sprite) {
                const flash = scene.add.rectangle(w.sprite.x, w.sprite.y, 60, 60, 0x00FFFF, 0.6).setAlpha(0.3).setDepth(12);
                scene.tweens.add({ targets: flash, alpha: 0, duration: 400 / animationController.speed, onComplete: () => flash.destroy() });
            } else if (w) {
                const flash = scene.add.rectangle(w.x, w.y, 60, 60, 0x00FFFF, 0.6).setAlpha(0.3).setDepth(12);
                scene.tweens.add({ targets: flash, alpha: 0, duration: 400 / animationController.speed, onComplete: () => flash.destroy() });
            }

            const id = tree.addNode(parentId, -1, parentAmt, `Skip`);
            tree.nodes[id].isPick = false; // Mark that this node didn't pick anything
            tree.setState(id, 'active');
            statusText.setText(`ข้ามเหรียญชนิดที่ ${idx + 1}`);

            path.push(id);
            tree.relayout();
            tree.redraw();
            playSound('run');
            await sleep(baseDelay * 0.6);
        }
        else if (step.action === 'prune_skip') {
            const idx = step.index;
            const parentId = path[path.length - 1];
            const parentAmt = parentId !== null ? tree.nodes[parentId].amount : targetAmount;

            // Flash highlight (red for prune)
            const w = warriors[idx];
            if (w && w.sprite) {
                const flash = scene.add.rectangle(w.sprite.x, w.sprite.y, 60, 60, 0xFF0000, 0.6).setAlpha(0.3).setDepth(12);
                scene.tweens.add({ targets: flash, alpha: 0, duration: 400 / animationController.speed, onComplete: () => flash.destroy() });
            }

            // วาดกิ่ง Pick ที่โดน Prune ทิ้ง
            const power = warriors[idx]?.power ?? 0;
            const prunedAmt = parentAmt - power;
            const edgeText = `-${power}`;
            const deadPickId = tree.addNode(parentId, idx, prunedAmt, edgeText);
            tree.setState(deadPickId, 'pruned');

            statusText.setText(`เหรียญใหญ่เกินไป! ตัดกิ่ง Pick ทิ้ง ❌ (ชิ้น ${idx + 1})`);

            tree.relayout();
            tree.redraw();
            playSound('run');
            await sleep(baseDelay * 0.8);
        }
        else if (step.action === 'remove') {
            // Single pop — เหมอน knapsack pattern
            const deadId = path.pop();
            
            // Only pop the coin if the branch we are backtracking from was a "pick" branch!
            if (deadId !== undefined && tree.nodes[deadId].isPick) {
                currentCoins.pop();
            }

            if (deadId !== undefined && tree.nodes[deadId]?.state !== 'solved') {
                tree.setState(deadId, 'dead');
            }

            tree.redraw();
            statusText.setText('ย้อนกลับไปทางเลือกก่อนหน้า');
            await sleep(baseDelay * 0.4);
        }
        else if (step.action === 'consider') {
            const idx = step.index;
            const w = warriors[idx];
            statusText.setText(`พิจารณาเหรียญชนิดที่ ${idx + 1}` + (w ? ` (Power: ${w.power})` : ''));
            await sleep(baseDelay * 0.4);
        }
        // Legacy actions (for old saves/DP levels)
        else if (step.action === 'select_coin') {
            const coinIdx = step.coin;
            const parentId = path[path.length - 1];
            const parent = tree.nodes[parentId];
            const power = warriors[coinIdx]?.power ?? 0;
            const newAmt = parent.amount - power;
            const id = tree.addNode(parentId, coinIdx, newAmt, `-${power}`);
            currentCoins.push(coinIdx);
            if (newAmt === 0) { tree.setState(id, 'solved'); if (!bestSolution || currentCoins.length < bestSolution.length) bestSolution = [...currentCoins]; }
            else if (newAmt < 0) tree.setState(id, 'dead');
            else tree.setState(id, 'active');
            path.push(id);
            tree.relayout(); tree.redraw(); playSound('run');
            await sleep(baseDelay * 0.6);
        }
        else if (step.action === 'remove_coin') {
            const deadId = path.pop(); currentCoins.pop();
            if (deadId !== undefined && tree.nodes[deadId]?.state !== 'solved') { tree.setState(deadId, 'dead'); tree.redraw(); }
            await sleep(baseDelay * 0.4);
        }
    }

    // Highlight the best path (เขียวทั้งเส้น)
    if (bestSolutionNodeId !== null) {
        let cur = bestSolutionNodeId;
        while (cur !== null) {
            tree.setState(cur, 'solved');
            cur = tree.nodes[cur].parentId;
        }
        tree.relayout();
        tree.redraw();
    }

    if (bestSolution && bestSolution.length > 0) {
        statusText.setText(`ค้นหาเสร็จสิ้น (ใช้น้อยสุด ${bestSolution.length} เหรียญ)`).setColor('#00FF88');
        await sleep(baseDelay);

        // ไม่ทำให้ Tree จางหายไป เพื่อให้ผู้เล่นได้เห็น Tree ค้างไว้เหมือน Knapsack/SubsetSum

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

            const spawnX = w.x;
            const spawnY = w.y;

            const ghost = scene.add.sprite(spawnX, spawnY, tex)
                .setDisplaySize(80, 80).setDepth(30).setAlpha(0);

            if (w.powerSquare.frame && w.powerSquare.frame.name) {
                ghost.setFrame(w.powerSquare.frame.name);
            }

            const powerLabel = scene.add.text(spawnX, spawnY + 45, `ATK: ${w.power}`, {
                fontSize: '20px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
            }).setOrigin(0.5).setDepth(31).setAlpha(0);

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
                    scene.tweens.add({
                        targets: ghost,
                        y: '-=15',
                        yoyo: true,
                        repeat: -1,
                        duration: 350
                    });
                }
            });

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
