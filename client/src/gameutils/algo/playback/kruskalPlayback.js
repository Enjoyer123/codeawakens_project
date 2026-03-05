/**
 * kruskalPlayback.js — Kruskal's Algorithm Animation Playback
 *
 * Trace Events handled:
 *   { action: 'kruskal_visit',    from, to, weight }  ← from kruskal_visit block
 *   { action: 'kruskal_add_edge', from, to, weight }  ← from kruskal_add_edge block
 */

export async function playKruskalAnimation(scene, trace, options = {}) {
    // สลับ Display Mode ตรงนี้:
    return playClassicDisplay(scene, trace, options);
}

// ============================================================================
// Display Mode 1: Classic Display (self-contained)
// ============================================================================
async function playClassicDisplay(scene, trace, options = {}) {
    const { speed = 1.0 } = options;
    const baseDelay = 700 / speed;
    const sleep = ms => new Promise(r => setTimeout(r, Math.max(0, ms)));

    if (!scene || !trace || trace.length === 0) {
        console.warn('⚠️ [kruskalPlayback] No scene or trace');
        return;
    }


    // Graphics layers
    const edgeGraphics = scene.add.graphics().setDepth(2.5);
    const mstGraphics = scene.add.graphics().setDepth(2.6); // Persistent MST edges

    // Track MST edges and weight
    const mstEdges = [];
    let totalMstWeight = 0;

    // Status text
    const statusText = scene.add.text(400, 20, 'Kruskal: เริ่มสร้าง MST...', {
        fontSize: '20px', color: '#00ff88', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(20);

    // -------------------------------------------------------------------------
    for (let i = 0; i < trace.length; i++) {
        if (!scene || !scene.scene || !scene.scene.isActive(scene.scene.key)) break;
        const step = trace[i];

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

                statusText.setText(`กำลังพิจารณาเส้นเชื่อม ${from} → ${to} (น้ำหนัก = ${weight})`);

                // Flash yellow for potential edge evaluation
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

                statusText.setText(`เลือกเส้นเชื่อม ${from} ↔ ${to} เข้าสู่ MST (น้ำหนัก = ${weight})`);

                // Highlight the nodes connected
                lightNode(scene, from, 0x00ff88, 1000 / speed);
                lightNode(scene, to, 0x00ff88, 1000 / speed);

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
    statusText.setText(`สร้าง Minimum Spanning Tree สำเร็จ!\nน้ำหนักรวม (Weight) = ${finalWeight}`);
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
