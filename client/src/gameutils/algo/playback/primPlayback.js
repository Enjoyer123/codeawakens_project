/**
 * primPlayback.js — Prim's Algorithm Animation Playback
 *
 * Trace Events handled:
 *   { action: 'visit',            node, neighbors }   ← from getGraphNeighborsWithWeightWithVisualSync
 *   { action: 'prim_visit',       node, parent, dist} ← from prim_visit block
 *   { action: 'prim_relax',       from, to, newDist } ← from prim_relax block
 */

export async function playPrimAnimation(scene, trace, options = {}) {
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
        console.warn('⚠️ [primPlayback] No scene or trace');
        return;
    }

    console.log(`🎬 [primPlayback] Playing ${trace.length} steps at ${speed}x speed`);

    // Graphics layers
    const edgeGraphics = scene.add.graphics().setDepth(2.5);
    const mstGraphics = scene.add.graphics().setDepth(2.6); // Persistent MST edges

    // Track MST edges to prevent re-drawing
    const mstEdges = [];
    let totalMstWeight = 0;

    // Status text
    const statusText = scene.add.text(400, 20, 'Prim: เริ่มสร้าง MST...', {
        fontSize: '20px', color: '#00ff88', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(20);

    // -------------------------------------------------------------------------
    for (let i = 0; i < trace.length; i++) {
        if (!scene?.scene?.isActive(scene.scene.key)) break;
        const step = trace[i];

        switch (step.action) {

            // -----------------------------------------------------------------
            // 'visit' → emitted by getGraphNeighborsWithWeightWithVisualSync
            //           shows orange flash on node + edges to neighbors
            // -----------------------------------------------------------------
            case 'visit': {
                const { node, neighbors } = step;
                const pos = getNodePos(scene, node);
                if (!pos) break;

                lightNode(scene, node, 0xff8800, 500 / speed);
                statusText.setText(`สำรวจเพื่อนบ้านของโหนด ${node}...`);

                if (neighbors && neighbors.length > 0) {
                    neighbors.forEach(nbr => {
                        const nbrPos = getNodePos(scene, nbr);
                        if (nbrPos) {
                            edgeGraphics.lineStyle(3, 0xff8800, 0.7);
                            edgeGraphics.lineBetween(pos.x, pos.y, nbrPos.x, nbrPos.y);
                        }
                    });
                    await sleep(baseDelay * 0.3);
                    edgeGraphics.clear();
                }
                break;
            }

            // -----------------------------------------------------------------
            // 'prim_visit' → explicit trace block
            //                Add node to MST, highlight the edge from parent
            // -----------------------------------------------------------------
            case 'prim_visit': {
                const { node, parent, dist } = step;
                const pos = getNodePos(scene, node);
                if (!pos) break;

                statusText.setText(`เลือกโหนด ${node} เข้าสู่ MST (น้ำหนัก = ${dist})`);

                // Highlight the node permanently (or long duration)
                lightNode(scene, node, 0x00ff88, 1000 / speed);

                // Draw solid green line from parent to node to represent MST edge
                if (parent !== undefined && parent !== null && parent !== node) {
                    const parentPos = getNodePos(scene, parent);
                    if (parentPos) {
                        mstEdges.push({ from: parent, to: node, weight: dist });
                        totalMstWeight += Number(dist);

                        // Draw the permanent MST edge
                        mstGraphics.lineStyle(6, 0x00ff88, 1.0);
                        mstGraphics.lineBetween(parentPos.x, parentPos.y, pos.x, pos.y);
                    }
                }

                await sleep(baseDelay);
                break;
            }

            // -----------------------------------------------------------------
            // 'prim_relax' → explicit trace block
            //                yellow flash on the relaxed potential MST edge
            // -----------------------------------------------------------------
            case 'prim_relax': {
                const { from, to, newDist } = step;
                const posA = getNodePos(scene, from);
                const posB = getNodePos(scene, to);
                if (!posA || !posB) break;

                statusText.setText(`พบเส้นทางไป ${to} ที่ดีกว่า (น้ำหนัก = ${newDist})`);

                // Flash yellow for potential edge
                edgeGraphics.lineStyle(5, 0xffdd00, 1.0);
                edgeGraphics.lineBetween(posA.x, posA.y, posB.x, posB.y);

                await sleep(baseDelay * 0.5);

                edgeGraphics.clear();

                // Re-draw MST edges in case we cleared over them (though they are on different depth)
                // Just for safety if we change depths later.

                await sleep(baseDelay * 0.3);
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
