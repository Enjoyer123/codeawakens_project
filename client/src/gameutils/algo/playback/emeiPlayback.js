/**
 * emeiPlayback.js — Emei Mountain Cable Car Animation Playback
 * 
 * Trace Events handled:
 *   { action: 'emei_peak', node }
 *   { action: 'emei_cable', u, v, capacity }
 *   { action: 'emei_result', bottleneck, rounds }
 *   { action: 'emei_path', path, bottleneck }   ← path = [start, ..., end] array
 */
// All visual methods are now internal to playback.
import { animationController, createTraceBuffer } from './AnimationController';

export async function playEmeiAnimation(scene, trace, options = {}) {
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
        console.warn('⚠️ [emeiPlayback] No scene or trace found');
        return;
    }


    // Pre-scan: find the correct emei_path event
    // Prefer the event where path ends at goalEnd (the actual goal node)
    // Fallback: use the last emei_path event
    let targetPathIdx = -1;
    let lastPathIdx = -1;
    trace.forEach((step, idx) => {
        if (step.action !== 'emei_path') return;
        lastPathIdx = idx;
        const { path, goalEnd } = step;
        if (!path || path.length === 0) return;
        const pathEnd = path[path.length - 1];
        // goalEnd may be number or string, use weak equality
        if (goalEnd !== undefined && goalEnd !== null && pathEnd == goalEnd) {
            targetPathIdx = idx; // this path ends at the actual goal
        }
    });
    // If no goal-matching path found, fallback to last
    if (targetPathIdx === -1) targetPathIdx = lastPathIdx;

    // Persistent graphics for the final path highlight
    const pathGraphics = scene.add.graphics().setDepth(100);

    for await (const step of createTraceBuffer(trace)) {
        if (!scene || !scene.scene || !scene.scene.isActive(scene.scene.key)) break;

        switch (step.action) {
            case 'emei_peak': {
                await highlightPeak(scene, step.node);
                await sleep(baseDelay * 0.3);
                break;
            }

            case 'emei_cable': {
                // Flash: draw a temporary edge between u and v
                await flashEdge(scene, step.u, step.v, 0x00ffff, speed);
                await sleep(baseDelay * 0.3);
                break;
            }

            case 'emei_path': {
                // Only animate the path that ends at the actual goal node
                if (i !== targetPathIdx) break;

                const { path, bottleneck, goalEnd } = step;

                if (!path || path.length < 2) break;

                // Draw each edge of the path sequentially with cable car animation
                for (let j = 0; j < path.length - 1; j++) {
                    const u = path[j];
                    const v = path[j + 1];
                    // Draw persistent cyan line
                    drawEdgeLine(pathGraphics, scene, u, v, 0x00ffff, 8);
                    // Animate cable car
                    await animateCableCar(scene, u, v, speed);
                    await sleep(baseDelay * 0.2);
                }
                break;
            }
        }
    }

    // Automatically show the final calculation result at the end of the animation
    if (options && options.result && Array.isArray(options.result) && options.result.length >= 2) {
        const bottleneck = options.result[0];
        const rounds = options.result[1];
        showEmeiFinalResult(scene, bottleneck, rounds);
        await sleep(3000);
    }
}

// ============================================================================
// Helpers
// ============================================================================

function getNodePos(scene, nodeId) {
    if (!scene.levelData?.nodes) return null;
    // Use weak equality to handle string/number mismatch
    const n = scene.levelData.nodes.find(n => n.id == nodeId);
    return n ? { x: n.x, y: n.y } : null;
}

/** วาดเส้นถาวร (persistent) บน Graphics object */
function drawEdgeLine(graphics, scene, u, v, color, lineWidth = 8) {
    const from = getNodePos(scene, u);
    const to = getNodePos(scene, v);
    if (!from || !to) {
        console.warn(`[emeiPlayback] drawEdgeLine: node not found u=${u} v=${v}`);
        return;
    }
    graphics.lineStyle(lineWidth, color, 1.0);
    graphics.lineBetween(from.x, from.y, to.x, to.y);
}

/** Flash edge แบบชั่วคราว (แสดงแล้วหายไป) */
async function flashEdge(scene, u, v, color) {
    const from = getNodePos(scene, u);
    const to = getNodePos(scene, v);
    if (!from || !to) return;

    const g = scene.add.graphics().setDepth(101);
    g.lineStyle(5, color, 0.8);
    g.lineBetween(from.x, from.y, to.x, to.y);

    await animationController.sleep(400);
    g.destroy();
}

/** Animate กล่อง cable car วิ่งจาก u ไป v แล้วหายไป */
function animateCableCar(scene, u, v) {
    const from = getNodePos(scene, u);
    const to = getNodePos(scene, v);
    if (!from || !to) return Promise.resolve();

    return new Promise(resolve => {
        const car = scene.add.rectangle(from.x, from.y, 24, 16, 0xff00ff);
        car.setDepth(102);
        car.setStrokeStyle(2, 0xffffff);

        scene.tweens.add({
            targets: car,
            x: to.x,
            y: to.y,
            duration: 600 / animationController.speed,
            ease: 'Power1',
            onComplete: () => {
                car.destroy();
                resolve();
            }
        });
    });
}

// ============================================================================
// Emei Specialized VFX
// ============================================================================

/**
 * Highlight a peak in Emei Mountain
 */
function highlightPeak(scene, nodeId) {
    if (!scene || !scene.levelData || !scene.levelData.nodes) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        // Use weak equality for string vs number ID safety
        const node = scene.levelData.nodes.find(n => n.id == nodeId);
        if (node) {
            const circle = scene.add.circle(node.x, node.y, 25, 0x00ff00, 0.3);
            circle.setDepth(2);
            scene.tweens.add({
                targets: circle,
                scale: 1.5,
                alpha: 0,
                duration: 500, // Faster peak highlight
                onComplete: () => {
                    circle.destroy();
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
}

/**
 * Show final calculation for rounds
 */
function showEmeiFinalResult(scene, bottleneck, rounds) {
    if (!scene) return;

    // Create a COMPACT Popup located lower (to avoid Victory screen overlap)
    const centerX = scene.cameras.main.width / 2;
    const centerY = scene.cameras.main.height / 2;

    const popupContainer = scene.add.container(centerX, centerY + 150).setDepth(200); // Moved down +150
    popupContainer.setScale(0); // Start small for pop effect

    const bg = scene.add.rectangle(0, 0, 300, 120, 0x000000, 0.9); // Smaller box
    bg.setStrokeStyle(3, 0x00ffff);

    const title = scene.add.text(0, -30, "✨ ผลลัพธ์ ✨", {
        fontSize: '20px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5);

    const resultText = scene.add.text(0, 15, `คอขวด: ${bottleneck}\nต้องขนส่ง: ${rounds} รอบ`, {
        fontSize: '24px', color: '#ffffff', align: 'center'
    }).setOrigin(0.5);

    popupContainer.add([bg, title, resultText]);
    scene.add.existing(popupContainer);

    // Pop in animation
    scene.tweens.add({
        targets: popupContainer,
        scale: 1,
        ease: 'Back.out',
        duration: 500,
        onComplete: () => {
            // Fade out after 3 seconds so it doesn't block view forever
            scene.tweens.add({
                targets: popupContainer,
                alpha: 0,
                delay: 3000,
                duration: 1000,
                onComplete: () => popupContainer.destroy()
            });
        }
    });
}
