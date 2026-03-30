import Phaser from 'phaser';
import { updateWeaponPosition } from '../../combat/weaponEffects';
import { animationController, createTraceBuffer } from './AnimationController';
import { playSound } from '../../sound/soundManager';

/**
 * dijkstraPlayback.js — Dijkstra's Algorithm Animation Playback
 *
 * Trace Events handled:
 *   { action: 'visit',            node, neighbors }   ← from getGraphNeighborsWithWeightWithVisualSync
 *   { action: 'dijkstra_visit',   node, dist }        ← from dijkstra_visit block
 *   { action: 'dijkstra_relax',   from, to, newDist } ← from dijkstra_relax block
 *   { action: 'move_along_path',  path }              ← auto-added after test passes
 */

export async function playDijkstraAnimation(scene, trace, options = {}) {
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
        console.warn('⚠️ [dijkstraPlayback] No scene or trace');
        return;
    }


    // Graphics layers
    const edgeGraphics = scene.add.graphics().setDepth(2.5);
    const answerGraphics = scene.add.graphics().setDepth(3);

    // Distance labels on every node (start with ∞)
    const distTexts = {};
    if (scene.levelData?.nodes) {
        scene.levelData.nodes.forEach(node => {
            const t = scene.add.text(node.x, node.y - 28, '∞', {
                fontSize: '14px', color: '#ffffff',
                backgroundColor: '#000000bb',
                padding: { x: 4, y: 2 }, fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(10);
            distTexts[node.id] = t;
        });
    }

    // Status text
    const statusText = scene.add.text(scene.scale.width / 2, 870, 'ค้นหาเส้นทาง (Dijkstra)...', {
        fontSize: '20px', color: '#FFFF00', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(20);

    // -------------------------------------------------------------------------
    for await (const step of createTraceBuffer(trace)) {
        if (!scene || !scene.scene || !scene.scene.isActive(scene.scene.key)) break;

        switch (step.action) {

            // -----------------------------------------------------------------
            // 'visit' → emitted by getGraphNeighborsWithWeightWithVisualSync
            //           shows orange flash on node + edges to neighbors
            // -----------------------------------------------------------------
            case 'visit': {
                const { node, neighbors } = step;
                const pos = getNodePos(scene, node);
                if (!pos) break;

                lightNode(scene, node, 0xff8800, 500 / animationController.speed);
                playSound('run');
                statusText.setText(`สำรวจโหนด ${node}...`);

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
            // 'dijkstra_visit' → explicit trace block in Blockly
            //                    updates distance label on the visited node
            // -----------------------------------------------------------------
            case 'dijkstra_visit': {
                const { node, dist } = step;
                const pos = getNodePos(scene, node);
                if (!pos) break;

                statusText.setText(`พิจารณาโหนด ${node}  (dist = ${dist})`);
                lightNode(scene, node, 0x00ff88, 600 / animationController.speed);
                playSound('run');

                if (distTexts[node]) {
                    distTexts[node].setText(String(dist));
                    distTexts[node].setColor('#2ecc71');
                }

                await sleep(baseDelay);
                break;
            }

            // -----------------------------------------------------------------
            // 'dijkstra_relax' → explicit trace block in Blockly
            //                    yellow flash on the relaxed edge + update label
            // -----------------------------------------------------------------
            case 'dijkstra_relax': {
                const { from, to, newDist } = step;
                const posA = getNodePos(scene, from);
                const posB = getNodePos(scene, to);
                if (!posA || !posB) break;

                statusText.setText(`พบเส้นทางสั้นกว่าไปยัง ${to}  ระยะใหม่: ${newDist}`);
                playSound('paper');

                edgeGraphics.lineStyle(5, 0xffdd00, 1.0);
                edgeGraphics.lineBetween(posA.x, posA.y, posB.x, posB.y);

                if (distTexts[to]) {
                    distTexts[to].setText(String(newDist));
                    distTexts[to].setColor('#ffff00');
                }

                await sleep(baseDelay * 0.5);

                edgeGraphics.lineStyle(3, 0x555555, 0.6);
                edgeGraphics.lineBetween(posA.x, posA.y, posB.x, posB.y);
                if (distTexts[to]) distTexts[to].setColor('#aaaaaa');

                await sleep(baseDelay * 0.3);
                break;
            }

            // -----------------------------------------------------------------
            // 'move_along_path' → auto-injected by useCodeExecution after pass
            //                     draws cyan path + walks hero
            // -----------------------------------------------------------------
            case 'move_along_path': {
                edgeGraphics.clear();

                if (step.path && step.path.length >= 2) {
                    statusText.setText(`เส้นทางที่สั้นที่สุด: ${step.path.join(' → ')}`).setColor('#00FF00');
                    playSound('paper');
                    drawPath(answerGraphics, scene, step.path, 0x00ffff, 1.0, 8);

                    for (let p = 0; p < 3; p++) {
                        answerGraphics.clear();
                        drawPath(answerGraphics, scene, step.path, 0x00ffff, 1.0, 8);
                        await sleep(200);
                        answerGraphics.clear();
                        drawPath(answerGraphics, scene, step.path, 0x00ffff, 0.4, 4);
                        await sleep(200);
                    }
                    drawPath(answerGraphics, scene, step.path, 0x00ffff, 1.0, 6);

                    step.path.forEach(nid => {
                        if (distTexts[nid]) distTexts[nid].setColor('#2ecc71');
                    });

                    await playMoveAlongPath(scene, step.path);
                }
                break;
            }

            default:
                break;
        }
    }

    edgeGraphics.destroy();
    statusText.setText('ค้นหาเส้นทางเสร็จสิ้น');
}

// =============================================================================
// Helpers
// =============================================================================

function getNodePos(scene, nodeId) {
    const node = scene.levelData?.nodes?.find(n => n.id === nodeId);
    return node ? { x: node.x, y: node.y } : null;
}

function drawPath(graphics, scene, path, color, alpha, lineWidth) {
    if (!path || path.length < 2) return;
    graphics.lineStyle(lineWidth, color, alpha);
    for (let i = 0; i < path.length - 1; i++) {
        const a = getNodePos(scene, path[i]);
        const b = getNodePos(scene, path[i + 1]);
        if (a && b) graphics.lineBetween(a.x, a.y, b.x, b.y);
    }
    path.forEach(nodeId => {
        const pos = getNodePos(scene, nodeId);
        if (pos) {
            graphics.fillStyle(color, alpha * 0.5);
            graphics.fillCircle(pos.x, pos.y, 8);
        }
    });
}

function lightNode(scene, nodeId, color, duration) {
    const pos = getNodePos(scene, nodeId);
    if (!pos) return;

    if (!scene.dijkstraLightGraphics) {
        scene.dijkstraLightGraphics = scene.add.graphics().setDepth(3);
    }
    const g = scene.dijkstraLightGraphics;
    const obj = { alpha: 1.0 };

    scene.tweens.add({
        targets: obj, alpha: 0, duration, ease: 'Linear',
        onUpdate: () => {
            g.clear();
            g.fillStyle(color, obj.alpha * 0.4);
            g.fillCircle(pos.x, pos.y, 28);
            g.lineStyle(3, color, obj.alpha);
            g.strokeCircle(pos.x, pos.y, 28);
        }
    });
}

async function playMoveAlongPath(scene, path) {
    if (!scene || !path || path.length < 2) return;
    const hero = scene.hero || scene.player;
    if (!hero) return;

    const moveDuration = 350 / animationController.speed;
    for (const nodeId of path) {
        const pos = getNodePos(scene, nodeId);
        if (!pos) continue;
        await new Promise(resolve => {
            scene.tweens.add({
                targets: hero, x: pos.x, y: pos.y,
                duration: moveDuration, ease: 'Power2.easeInOut',
                onUpdate: () => {
                    try { updateWeaponPosition(scene); } catch (e) { }
                },
                onComplete: () => { hero.currentNodeId = nodeId; resolve(); }
            });
        });
        await new Promise(r => setTimeout(r, 80 / animationController.speed));
    }
}
