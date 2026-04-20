/**
 * fiboPlayback.js — Fibonacci Backtrack Recursion Tree Animation
 * ใช้ TreeRenderer วาดต้นไม้ Recursion แบบ Real-time ตาม trace
 */
import { animationController, createTraceBuffer } from './AnimationController';
import { createTreeRenderer } from './TreeRenderer';
import { playSound } from '../../sound/soundManager';

export async function playFiboAnimation(scene, trace, options = {}) {
    if (!scene || !trace?.length) return;

    const canvasW = scene.scale.width || 1200;
    const canvasH = scene.scale.height || 920;
    const sleep = (ms) => animationController.sleep(ms);
    const baseDelay = 600;

    // ── Status label ─────────────────────────────────────────────────────────
    const statusText = scene.add.text(canvasW / 2, 40, 'กำลังหาค่า Fibonacci...', {
        fontSize: '22px', color: '#FFFF00', fontStyle: 'bold',
        stroke: '#000', strokeThickness: 4, align: 'center'
    }).setOrigin(0.5, 0).setDepth(25);

    // ── Tree renderer ────────────────────────────────────────────────────────
    const tree = createTreeRenderer(scene, canvasW, canvasH);
    tree.container.setY(20);

    // Stack: id ของโหนดปัจจุบัน (Depth-first)
    const callStack = [];   // [{nodeId, n}]
    let rootId = null;

    // ── Play through trace ───────────────────────────────────────────────────
    for await (const step of createTraceBuffer(trace)) {
        if (!scene?.scene?.isActive(scene.scene.key)) break;

        if (step.action === 'call') {
            // สร้างโหนดลูกจากโหนดปัจจุบัน
            const parentId = callStack.length > 0 ? callStack[callStack.length - 1].nodeId : null;
            const n = step.n;
            const edgeLabel = parentId !== null ? `fib(${n})` : '';

            const nodeId = tree.addNode(parentId, n, n, edgeLabel);
            tree.setState(nodeId, 'active');

            if (rootId === null) rootId = nodeId;

            callStack.push({ nodeId, n });

            tree.relayout();
            tree.redraw();

            statusText.setText(`เรียก fib(${n})`).setStyle({ color: '#FFFF00' });
            playSound('run');
            await sleep(baseDelay * 0.7);

        } else if (step.action === 'base_case') {
            // ชนขอบ: โชว์ค่า result บน node แล้ว backtrack
            const current = callStack[callStack.length - 1];
            if (current) {
                // อัปเดต label โหนดให้โชว์ค่าจริง
                const n = tree.nodes[current.nodeId];
                n.amount = step.value;
                tree.setState(current.nodeId, 'solved');
                tree.redraw();

                statusText.setText(`Base Case! fib(${current.n}) = ${step.value}`).setStyle({ color: '#FFFF00' });
                playSound('pickup');
                await sleep(baseDelay * 1.2);
            }
            callStack.pop();

        } else if (step.action === 'return') {
            // โหนดนี้คำนวณเสร็จ (รวบลูก 2 ตัวเรียบร้อย)
            const current = callStack[callStack.length - 1];
            if (current) {
                const n = tree.nodes[current.nodeId];
                n.amount = step.value;
                tree.setState(current.nodeId, 'solved');
                tree.redraw();

                statusText.setText(`fib(${current.n}) = ${step.value} ✓`).setStyle({ color: '#AAE8FF' });
                playSound('paper');
                await sleep(baseDelay * 0.8);
            }
            callStack.pop();
        }
    }

    // ── Final highlight root ────────────────────────────────────────────────
    tree.relayout();
    tree.redraw();

    const rootVal = rootId !== null ? tree.nodes[rootId].amount : '?';
    statusText.setText(`ค่า Fibonacci = ${rootVal}`).setStyle({ color: '#00FF00', fontSize: '28px' });

    await sleep(2500);
}
