/**
 * graphPlayback.js — DFS/BFS Animation Playback
 *
 * เล่น Animation สำรวจ Graph แบบเห็น backtrack ชัดเจน โดยใช้ Router Pattern:
 * - เส้นสีเหลือง = ทางที่กำลังสำรวจ (ยืดออกไป)
 * - เส้นจางเป็นเทา = ทางตัน (backtrack)
 * - เส้นสีฟ้า = คำตอบสุดท้าย
 */

import Phaser from 'phaser';
import { updateWeaponPosition } from '../../combat/weaponEffects';

/**
 * เล่น DFS/BFS Animation จาก trace array (Router Function)
 */
export async function playGraphAnimation(scene, trace, options = {}) {
    // ------------------------------------------------------------------------
    // Router: ตรงนี้คือจุดสลับ "รูปแบบการแสดงผล (Display Mode)"
    // ถ้าตอนสอบอาจารย์สั่งให้วาดรูปแบบอื่น ให้สร้างฟังก์ชันใหม่ด้านล่าง
    // เช่น function playTreeDisplay(...) แล้วเปลี่ยนสวิตซ์ตรงนี้แค่นั้นครับ!
    // ------------------------------------------------------------------------
    return playDfsBfsDisplay(scene, trace, options);
}

// ============================================================================
// Display Mode 1: แบบดั้งเดิม (วาดเส้นสำรวจบนกราฟ + Magic Circle)
// ============================================================================
async function playDfsBfsDisplay(scene, trace, options = {}) {
    const { speed = 1.0 } = options;
    const baseDelay = 3000 / speed; // ให้ช้าลง ให้คนดูทัน

    if (!scene || !trace || trace.length === 0) {
        console.warn('⚠️ [graphPlayback] No scene or trace');
        return;
    }

    clearScanningHighlights(scene);
    clearDfsVisuals(scene);

    // Graphics layers
    const explorationGraphics = scene.add.graphics().setDepth(2.5);   // เส้นสำรวจ (เหลือง)
    const deadEndGraphics = scene.add.graphics().setDepth(2.2);       // เส้นตาย (เทา)
    const answerGraphics = scene.add.graphics().setDepth(3);          // เส้นคำตอบ (ฟ้า)

    let currentPath = [];  // เส้นทางที่กำลังสำรวจอยู่

    console.log(`🎬 [graphPlayback] Playing ${trace.length} steps at ${speed}x speed`);

    for (let i = 0; i < trace.length; i++) {
        const step = trace[i];

        switch (step.action) {
            case 'show_path': {
                if (!step.path || step.path.length === 0) break;

                const newPath = step.path;
                const prevPath = [...currentPath];
                currentPath = newPath;

                // เกิด Backtrack? (Path ใหม่สั้นกว่าหรือเท่ากับ Path เดิม)
                if (prevPath.length > 0 && newPath.length <= prevPath.length) {
                    const backtrackFrom = prevPath.length;
                    const backtrackTo = findCommonPrefixLength(prevPath, newPath);

                    if (backtrackTo < backtrackFrom) {
                        // เจอจุดย้อน ทิ้งรอยเส้นสีแดง (Dead end, เปลี่ยนจากสีเทาเพื่อความชัดเจน)
                        drawPath(deadEndGraphics, scene, prevPath.slice(Math.max(0, backtrackTo - 1)), 0xff4444, 0.8, 5);
                        await sleep(baseDelay * 0.4);
                    }
                }

                // วาดเส้นสำรวจปัจจุบัน (สีเหลือง)
                explorationGraphics.clear();
                if (currentPath.length >= 2) {
                    drawPath(explorationGraphics, scene, currentPath, 0xffdd00, 1.0, 6);
                }

                // Highlight โหนดที่กำลังยืนอยู่ (ปลายทางของ path)
                const tipNode = currentPath[currentPath.length - 1];
                clearScanningHighlights(scene);
                highlightNode(scene, tipNode, 0x00ff00, 700);
                markNodeAsVisited(scene, tipNode);

                await sleep(baseDelay * 0.4);
                break;
            }

            case 'visit': {
                const tipNode = step.node;

                // แสดง neighbors (flash สั้นๆ)
                if (step.neighbors && step.neighbors.length > 0) {
                    for (const neighbor of step.neighbors) {
                        // ลากเส้นพิจารณาด้วยสีม่วงสว่าง (bright purple/magenta)
                        drawEdge(explorationGraphics, scene, tipNode, neighbor, 0xff00ff, 0.8, 5);
                    }
                    await sleep(baseDelay * 0.6);

                    // ลบ neighbor hint ออก วาดแค่ path เดิม
                    explorationGraphics.clear();
                    if (currentPath.length >= 2) {
                        drawPath(explorationGraphics, scene, currentPath, 0xffdd00, 1.0, 6);
                    }
                }
                break;
            }

            case 'move_along_path': {
                clearScanningHighlights(scene);
                explorationGraphics.clear();
                deadEndGraphics.clear(); // ลบเส้นตายตอนจบ

                if (step.path && step.path.length >= 2) {
                    // Flash คำตอบ — เส้นสีฟ้าสว่าง
                    drawPath(answerGraphics, scene, step.path, 0x00ffff, 1.0, 8);

                    // Pulse effect
                    await pulseAnswerPath(scene, answerGraphics, step.path, speed);

                    // เดินตัวละครตามเส้นทาง
                    await playMoveAlongPath(scene, step.path, speed);
                }
                break;
            }

            default:
                break;
        }
    }

    // Cleanup temp graphics
    explorationGraphics.destroy();
    deadEndGraphics.destroy();

    console.log('✅ [graphPlayback] Animation complete');
}

// ============================================================================
// Display Mode 2: ต้นแบบเตรียมเผื่อไว้ตอนสอบ
// ============================================================================
export async function playAbcDisplay(scene, trace, options) {
    // 1. Setup UI elements here

    // 2. Loop through trace and draw
    for (let i = 0; i < trace.length; i++) {
        const step = trace[i];
        switch (step.action) {
            case 'show_path':
                // แอนิเมชันเดินหน้า ถอยหลัง...
                break;
            case 'visit':
                // แอนิเมชันส่องไฟฉายดู Neighbor...
                break;
            case 'move_along_path':
                // แอนิเมชันเคลื่อนที่ตอบคำถาม...
                break;
        }
    }
}

// ============================================================================
// Path tracking logic
// ============================================================================

/**
 * หาจุดที่ path สอง path เหมือนกัน (common prefix length)
 */
function findCommonPrefixLength(pathA, pathB) {
    let i = 0;
    while (i < pathA.length && i < pathB.length && pathA[i] === pathB[i]) i++;
    return i;
}

// ============================================================================
// Visual / Drawing helpers (Decoupled from Blockly)
// ============================================================================

function getNodePos(scene, nodeId) {
    const node = scene.levelData?.nodes?.find(n => String(n.id) === String(nodeId));
    return node ? { x: node.x, y: node.y } : null;
}

/** วาดเส้นทาง (หลายโหนด) ด้วย Graphics */
function drawPath(graphics, scene, path, color, alpha, lineWidth) {
    if (!path || path.length < 2) return;

    graphics.lineStyle(lineWidth, color, alpha);
    for (let i = 0; i < path.length - 1; i++) {
        const from = getNodePos(scene, path[i]);
        const to = getNodePos(scene, path[i + 1]);
        if (from && to) {
            graphics.lineBetween(from.x, from.y, to.x, to.y);
        }
    }

    // วาดจุดบนแต่ละ node
    path.forEach(nodeId => {
        const pos = getNodePos(scene, nodeId);
        if (pos) {
            graphics.fillStyle(color, alpha * 0.5);
            graphics.fillCircle(pos.x, pos.y, 8);
        }
    });
}

/** วาดเส้นเดี่ยวระหว่าง 2 node */
function drawEdge(graphics, scene, fromId, toId, color, alpha, lineWidth) {
    const from = getNodePos(scene, fromId);
    const to = getNodePos(scene, toId);
    if (from && to) {
        graphics.lineStyle(lineWidth, color, alpha);
        graphics.lineBetween(from.x, from.y, to.x, to.y);
    }
}

/** Pulse effect สำหรับ answer path */
async function pulseAnswerPath(scene, graphics, path, speed) {
    const pulseCount = 3;
    const pulseDuration = 300 / speed;

    for (let p = 0; p < pulseCount; p++) {
        graphics.clear();
        drawPath(graphics, scene, path, 0x00ffff, 1.0, 8);
        await sleep(pulseDuration * 0.5);
        graphics.clear();
        drawPath(graphics, scene, path, 0x00ffff, 0.5, 5);
        await sleep(pulseDuration * 0.5);
    }
    // Final solid
    graphics.clear();
    drawPath(graphics, scene, path, 0x00ffff, 1.0, 6);
    await sleep(200 / speed);
}

/** เดินตัวละครตามเส้นทาง */
async function playMoveAlongPath(scene, path, speed = 1.0) {
    if (!scene || !path || path.length < 2) return;

    const hero = scene.hero || scene.player;
    if (!hero) return;

    const moveDuration = 350 / speed;

    for (let i = 0; i < path.length; i++) {
        const nodeId = path[i];
        const pos = getNodePos(scene, nodeId);
        if (!pos) continue;

        await new Promise(resolve => {
            scene.tweens.add({
                targets: hero,
                x: pos.x,
                y: pos.y,
                duration: moveDuration,
                ease: 'Power2.easeInOut',
                onUpdate: () => {
                    try { updateWeaponPosition(scene); } catch (e) { }
                },
                onComplete: () => {
                    hero.currentNodeId = nodeId;
                    if (scene.gameState) {
                        scene.gameState.currentNodeId = nodeId;
                    }
                    resolve();
                }
            });
        });

        markNodeAsVisited(scene, nodeId);
        await sleep(80 / speed);
    }
}

// ============================================================================
// Graph Magic Effect Drawing Logic
// ============================================================================

/** ลบไฮไลท์ที่กำลังแสกนอยู่ */
function clearScanningHighlights(scene) {
    if (!scene) return;
    if (scene.graphPlaybackTweens) {
        scene.graphPlaybackTweens.forEach(tween => { if (tween && tween.isActive) tween.stop(); });
        scene.graphPlaybackTweens = [];
    }
    if (scene.graphPlaybackGraphics) {
        scene.graphPlaybackGraphics.clear();
    }
}

/** ลบวิชวล DFS ทั้งหมด (รีเซ็ตฉาก) */
function clearDfsVisuals(scene) {
    clearScanningHighlights(scene);
    if (scene.graphVisitedGraphics) scene.graphVisitedGraphics.clear();
}

/** ไฮไลต์กราฟด้วย Magic Circle (วงแหวนเวทมนตร์) */
function highlightNode(scene, nodeId, color = 0x00ff00, duration = 800) {
    if (!scene || !scene.levelData) return;
    const node = scene.levelData.nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (!scene.graphPlaybackGraphics) {
        scene.graphPlaybackGraphics = scene.add.graphics().setDepth(3);
    }
    const graphics = scene.graphPlaybackGraphics;
    graphics.clear();

    const baseRadius = 30;
    const animationObj = { starRotation: 0, alpha: 1 };

    const pulseTween = scene.tweens.add({
        targets: animationObj,
        alpha: { from: 1, to: 0.4 },
        starRotation: { from: 0, to: Math.PI * 2 },
        duration: duration * 2,
        yoyo: false,
        repeat: -1,
        ease: 'Linear',
        onUpdate: function () {
            if (!graphics || !node) return;
            graphics.clear();
            drawMagicCircle(graphics, node.x, node.y, baseRadius, color, animationObj.alpha, animationObj.starRotation);
        }
    });

    if (!scene.graphPlaybackTweens) scene.graphPlaybackTweens = [];
    scene.graphPlaybackTweens.push(pulseTween);
}

function drawMagicCircle(graphics, x, y, radius, color, alpha, starRotation = 0) {
    graphics.fillStyle(color, alpha * 0.25).fillCircle(x, y, radius * 1.2);
    graphics.fillStyle(color, alpha * 0.15).fillCircle(x, y, radius * 1.4);
    graphics.lineStyle(5, color, alpha).strokeCircle(x, y, radius);
    graphics.lineStyle(3, color, alpha * 0.9).strokeCircle(x, y, radius * 0.75);

    const starPoints = 7, starRadius = radius * 0.5, starPointsArray = [];
    for (let i = 0; i < starPoints; i++) {
        const angle = (i / starPoints) * Math.PI * 2 - Math.PI / 2 + starRotation;
        starPointsArray.push({ x: x + Math.cos(angle) * starRadius, y: y + Math.sin(angle) * starRadius });
    }
    graphics.lineStyle(3, color, alpha);
    for (let i = 0; i < starPoints; i++) {
        const nextIndex = (i + 3) % starPoints;
        graphics.lineBetween(starPointsArray[i].x, starPointsArray[i].y, starPointsArray[nextIndex].x, starPointsArray[nextIndex].y);
    }
    const symbolCount = 7, symbolRadius = radius * 0.9;
    for (let i = 0; i < symbolCount; i++) {
        const angle = (i / symbolCount) * Math.PI * 2 - Math.PI / 2 + starRotation;
        const symbolX = x + Math.cos(angle) * symbolRadius, symbolY = y + Math.sin(angle) * symbolRadius;
        graphics.lineStyle(2, color, alpha * 0.9);
        graphics.lineBetween(symbolX, symbolY - 6, symbolX, symbolY + 6);
        graphics.lineBetween(symbolX - 4, symbolY, symbolX + 4, symbolY);
        graphics.lineBetween(symbolX - 3, symbolY - 3, symbolX + 3, symbolY + 3);
        graphics.lineBetween(symbolX - 3, symbolY + 3, symbolX + 3, symbolY - 3);
    }
    graphics.lineStyle(1, color, alpha * 0.3);
    for (let i = 0; i < starPoints; i++) {
        const angle = (i / starPoints) * Math.PI * 2 - Math.PI / 2 + starRotation;
        graphics.lineBetween(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, x + Math.cos(angle) * starRadius, y + Math.sin(angle) * starRadius);
    }
}

/** มาร์คว่าช่องนี้ผ่านการยืนมาแล้ว */
function markNodeAsVisited(scene, nodeId) {
    if (!scene || !scene.levelData) return;
    const node = scene.levelData.nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (!scene.graphVisitedGraphics) {
        scene.graphVisitedGraphics = scene.add.graphics().setDepth(2);
    }
    // เปลี่ยนจากเทาเป็นสีม่วงสว่างเพื่อความชัดเจน
    scene.graphVisitedGraphics.fillStyle(0x9933ff, 0.7);
    scene.graphVisitedGraphics.fillCircle(node.x, node.y, 15);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, Math.max(0, ms)));
}
