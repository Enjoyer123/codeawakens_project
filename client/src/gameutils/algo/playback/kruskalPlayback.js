/**
 * kruskalPlayback.js — Kruskal's Algorithm Animation Playback
 *
 * Trace Events handled:
 *   { action: 'kruskal_visit',    from, to, weight }  ← from kruskal_visit block
 *   { action: 'kruskal_add_edge', from, to, weight }  ← from kruskal_add_edge block
 */
import { animationController, createTraceBuffer } from './AnimationController';
import { playSound } from '../../sound/soundManager';

export async function playKruskalAnimation(scene, trace, options = {}) {
    // สลับ Display Mode ตรงนี้:
    return playClassicDisplay(scene, trace, options);
}

// ============================================================================
// Display Mode 1: Classic Display (self-contained)
// ============================================================================
async function playClassicDisplay(scene, trace, options = {}) {
    const baseDelay = 700;
    const sleep = ms => animationController.sleep(Math.max(0, ms));

    if (!scene || !trace) {
        console.warn('⚠️ [kruskalPlayback] No scene or trace found');
        return;
    }


    // Graphics layers
    const edgeGraphics = scene.add.graphics().setDepth(2.5);
    const mstGraphics = scene.add.graphics().setDepth(2.6); // Persistent MST edges

    // Track MST edges and weight
    const mstEdges = [];
    let totalMstWeight = 0;

    // Status text
    const statusText = scene.add.text(scene.scale.width / 2, 870, 'เริ่มสร้าง Minimum Spanning Tree...', {
        fontSize: '20px', color: '#FFFF00', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(20);

    // -------------------------------------------------------------------------
    for await (const step of createTraceBuffer(trace)) {
        if (!scene || !scene.scene || !scene.scene.isActive(scene.scene.key)) break;

        switch (step.action) {

            // -----------------------------------------------------------------
            // 'kruskal_visit' → explicitly emitted via blockly block
            //                   shows yellow flash on edge getting evaluated
            // -----------------------------------------------------------------
            case 'kruskal_visit': {
                const { from, to, weight } = step;
                const posA = getNodePos(scene, from);
                const posB = getNodePos(scene, to);
                if (!posA || !posB) break;

                statusText.setText(`พิจารณาเส้นเชื่อม ${from} → ${to} (น้ำหนัก = ${weight})`);
                playSound('run');

                edgeGraphics.lineStyle(5, 0xffdd00, 1.0);
                edgeGraphics.lineBetween(posA.x, posA.y, posB.x, posB.y);

                await sleep(baseDelay * 0.5);

                edgeGraphics.clear();
                await sleep(baseDelay * 0.3);
                break;
            }

            // -----------------------------------------------------------------
            // 'kruskal_add_edge' → explicitly emitted via blockly block
            //                      Add edge to MST (green solid line)
            // -----------------------------------------------------------------
            case 'kruskal_add_edge': {
                const { from, to, weight } = step;
                const posA = getNodePos(scene, from);
                const posB = getNodePos(scene, to);
                if (!posA || !posB) break;

                statusText.setText(`เพิ่มเส้นเชื่อม ${from} ↔ ${to} เข้าสู่ MST (น้ำหนัก = ${weight})`);

                playSound('paper');
                lightNode(scene, from, 0x00ff88, 1000 / animationController.speed);
                lightNode(scene, to, 0x00ff88, 1000 / animationController.speed);

                // Draw solid green line to represent MST edge
                mstEdges.push({ from, to, weight });
                totalMstWeight += Number(weight);

                // Draw the permanent MST edge
                mstGraphics.lineStyle(6, 0x00ff88, 1.0);
                mstGraphics.lineBetween(posA.x, posA.y, posB.x, posB.y);

                await sleep(baseDelay);
                break;
            }
        }
    }

    // Finished
    const finalWeight = options.result !== undefined ? options.result : totalMstWeight;
    statusText.setText(`สร้าง Minimum Spanning Tree เสร็จสิ้น\nน้ำหนักรวม: ${finalWeight}`).setColor('#00FF00');
    await sleep(4000);
    statusText.destroy();
}

// ============================================================================
// Helpers
// ============================================================================

function getNodePos(scene, nodeId) {
    if (!scene.levelData || !scene.levelData.nodes) return null;
    const n = scene.levelData.nodes.find(x => String(x.id) === String(nodeId));
    if (!n) return null;
    return { x: n.x, y: n.y };
}

function lightNode(scene, nodeId, color, duration = 500) {
    const pos = getNodePos(scene, nodeId);
    if (!pos) return;

    const c = scene.add.circle(pos.x, pos.y, 25, color, 0.6).setDepth(1.5);

    scene.tweens.add({
        targets: c,
        scale: 1.5,
        alpha: 0,
        duration: duration,
        ease: 'Sine.easeOut',
        onComplete: () => c.destroy()
    });
}
