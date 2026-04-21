/**
 * Movement, combat, and sensor wrappers for code execution.
 * These bridge the Blockly-generated code with Phaser animations.
 */

import { getCurrentGameState, setCurrentGameState, getPlayerHp, setPlayerHp } from '@/gameutils/shared/game/gameState';
import { calculateMoveForward, calculateTurnLeft, calculateTurnRight } from '@/gameutils/movement/movementCore';
import { playMoveAnimation, playTurnAnimation } from '@/gameutils/movement/movementPlayback';
import { nearPit as checkNearPit } from '@/gameutils/movement/collisionUtils';
import { calculateHit } from '@/gameutils/combat/combatLogic';
import { playHitAnimation } from '@/gameutils/combat/combatPlayback';
import { haveEnemy } from '@/gameutils/combat/playerCombat';
import { updateWeaponPosition } from '@/gameutils/combat/weaponEffects';
import { updatePlayerArrow } from '@/gameutils/effects/arrow';

/**
 * Create all game action functions that Blockly code can call.
 * @param {Object} setters - React state setters
 * @param {Object} currentLevel - Current level data
 * @param {boolean} isPreview - Whether in admin preview mode
 */
export function createGameActions(setters, currentLevel, isPreview) {
    const {
        setIsGameOver, setGameState,
        setShowProgressModal, setGameResult,
        setPlayerHp: setReactPlayerHp
    } = setters;

    // ─── Sensors ───
    const foundMonster = () => {
        const scene = getCurrentGameState().currentScene;
        return scene?.player ? haveEnemy(scene.player) : false;
    };

    const nearPit = () => checkNearPit();

    const atGoal = () =>
        getCurrentGameState().currentNodeId === currentLevel?.goal_node_id;

    // ─── Movement ───
    const moveForward = async () => {
        const scene = getCurrentGameState().currentScene;
        const result = calculateMoveForward(scene);

        if (!result.success) {
            await new Promise(resolve => setTimeout(resolve, 50));
            return false;
        }

        if (scene) {
            const playbackResult = await playMoveAnimation(scene, result);
            if (playbackResult?.status === 'game_over') {
                setIsGameOver(true);
                setGameState('gameOver');
                if (!isPreview) {
                    setShowProgressModal(true);
                    setGameResult('gameover');
                }
                return false;
            }
        }

        setCurrentGameState({
            currentNodeId: result.targetNode.id,
            goalReached: result.goalReached
        });

        return false;
    };

    const turnLeft = async () => {
        const result = calculateTurnLeft();
        if (result.success) {
            setCurrentGameState({ direction: result.newDirection });
            const scene = getCurrentGameState().currentScene;
            if (scene) await playTurnAnimation(scene, result);
        } else {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    };

    const turnRight = async () => {
        const result = calculateTurnRight();
        if (result.success) {
            setCurrentGameState({ direction: result.newDirection });
            const scene = getCurrentGameState().currentScene;
            if (scene) await playTurnAnimation(scene, result);
        } else {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    };

    // ─── Combat ───
    const hit = async () => {
        const scene = getCurrentGameState().currentScene;
        const result = calculateHit(scene);

        if (!result.success) {
            await new Promise(resolve => setTimeout(resolve, 50));
            return false;
        }

        if (scene) {
            const playbackResult = await playHitAnimation(scene, result);
            if (playbackResult.status === 'enemy_defeated') {
            } else if (playbackResult.status === 'missed') {
            }
        }
        return true;
    };

    const castSpell = async () => {

    };

    const say = async (text) => {
        const scene = getCurrentGameState().currentScene;
        if (!scene || !scene.player) return;

        // // 1. ถ้าตัวละครมีข้อความเก่าค้างหัวอยู่ ให้ทำลายทิ้งก่อนจะได้ไม่ทับกัน
        if (scene.player.speechBubble) {
            scene.player.speechBubble.destroy();
        }

        // 2. สร้างข้อความใหม่
        const bubble = scene.add.text(scene.player.x, scene.player.y - 90, text, {
            fontSize: '60px', fill: '#ffffff', backgroundColor: '#ff0505ff', padding: { x: 5, y: 5 }
        });
        bubble.setDepth(100);
        scene.player.speechBubble = bubble; // จำไว้ว่านี่คือกรอบข้อความปัจจุบัน

        // 3. ใช้ Event Listener ผูกติดการขยับ! เพื่อให้ข้อความแกน X, Y วิ่งตาม Player ทุก Frame
        const updateBubbleTracking = () => {
            // ถ้ากรอบข้อความพังไปแล้ว ให้เลิกตาม
            if (!bubble.active) {
                scene.events.off('update', updateBubbleTracking);
                return;
            }
            // อัปเดตตำแหน่งให้ตามหัวตัวละคร (จัดกึ่งกลางความกว้างของข้อความด้วย)
            bubble.x = scene.player.x - (bubble.width / 2);
            bubble.y = scene.player.y - 90;
        };
        scene.events.on('update', updateBubbleTracking);

        // 4. ตั้งเวลาทำลายตัวเอง (สมมติให้อยู่ 3 วินาที)
        // สังเกตว่าเราใช้ setTimeout ธรรมดา "โดยไม่ใส่ await" นำหน้า! 
        // แปลว่าพอมันเสกตัวหนังสือปุ๊บ ฟังก์ชันจะจบและรันโค้ดบรรทัดต่อไป (เช่นเดิน) ทันที!
        setTimeout(() => {
            if (bubble.active) {
                bubble.destroy();
                scene.events.off('update', updateBubbleTracking);
            }
        }, 3000);
    };

    const Defend = async () => {
        const scene = getCurrentGameState().currentScene;
        if (!scene || !scene.player) return;

        // 1. ถ้าตัวละครมีข้อความเก่าค้างหัวอยู่ ให้ทำลายทิ้งก่อนจะได้ไม่ทับกัน
        if (scene.player.speechBubble) {
            scene.player.speechBubble.destroy();
        }

        // 2. สร้างข้อความใหม่
        const bubble = scene.add.text(scene.player.x, scene.player.y - 90, "Defend", {
            fontSize: '60px', fill: '#ffffff', backgroundColor: '#ff0505ff', padding: { x: 5, y: 5 }
        });
        bubble.setDepth(100);
        scene.player.speechBubble = bubble; // จำไว้ว่านี่คือกรอบข้อความปัจจุบัน

        // 3. ใช้ Event Listener ผูกติดการขยับ! เพื่อให้ข้อความแกน X, Y วิ่งตาม Player ทุก Frame
        const updateBubbleTracking = () => {
            // ถ้ากรอบข้อความพังไปแล้ว ให้เลิกตาม
            if (!bubble.active) {
                scene.events.off('update', updateBubbleTracking);
                return;
            }
            // อัปเดตตำแหน่งให้ตามหัวตัวละคร (จัดกึ่งกลางความกว้างของข้อความด้วย)
            bubble.x = scene.player.x - (bubble.width / 2);
            bubble.y = scene.player.y - 90;
        };
        scene.events.on('update', updateBubbleTracking);

        // 4. ตั้งเวลาทำลายตัวเอง (สมมติให้อยู่ 3 วินาที)
        // สังเกตว่าเราใช้ setTimeout ธรรมดา "โดยไม่ใส่ await" นำหน้า! 
        // แปลว่าพอมันเสกตัวหนังสือปุ๊บ ฟังก์ชันจะจบและรันโค้ดบรรทัดต่อไป (เช่นเดิน) ทันที!
        setTimeout(() => {
            if (bubble.active) {
                bubble.destroy();
                scene.events.off('update', updateBubbleTracking);
            }
        }, 3000);
    };

    // ── [สำรอง] Dash — วิ่ง 2 ช่อง ──
    // const dash = async () => {
    //     await moveForward();
    //     await moveForward();
    // };

    // ── [สำรอง] Spin — หมุนตัว 360° ──
    const spin = async () => {
        const scene = getCurrentGameState().currentScene;
        if (!scene || !scene.player) return;
        await new Promise(resolve => {
            scene.tweens.add({
                targets: scene.player,
                angle: 360,
                duration: 500,
                ease: 'Linear',
                onComplete: () => { scene.player.angle = 0; resolve(); }
            });
        });
    };

    // ── [สำรอง] Heal — ฮีล +20 HP ──
    const heal = async () => {
        const scene = getCurrentGameState().currentScene;
        if (!scene || !scene.player) return;
        const currentHP = getPlayerHp();
        console.log("currentHP", currentHP)
        const newHP = Math.min(currentHP + 20, 100);
        setPlayerHp(newHP);  // ← อัปเดตฝั่ง Phaser
        if (setReactPlayerHp) setReactPlayerHp(newHP); // ← อัปเดตฝั่ง React Panel!
        const text = scene.add.text(scene.player.x, scene.player.y - 60, '+20', {
            fontSize: '40px', fill: '#00ff00', fontStyle: 'bold'
        });
        text.setDepth(100);
        scene.tweens.add({
            targets: text, y: text.y - 50, alpha: 0, duration: 1000,
            onComplete: () => text.destroy()
        });
        await new Promise(r => setTimeout(r, 500));
    };

    // ── [สำรอง] Teleport — วาร์ปไป Node ──
    const teleport = async (nodeId) => {
        const scene = getCurrentGameState().currentScene;
        if (!scene || !scene.player) return;
        const targetNode = scene.levelData.nodes.find(n => n.id === nodeId);
        if (!targetNode) { console.warn('[TELEPORT] Node not found:', nodeId); return; }

        console.log('[TELEPORT] จาก Node', getCurrentGameState().currentNodeId, '→ Node', nodeId);

        const targets = [scene.player, scene.playerBorder].filter(Boolean);

        await new Promise(resolve => {
            scene.tweens.add({
                targets: targets, alpha: 0, duration: 300,
                onComplete: () => {
                    targets.forEach(t => { t.x = targetNode.x; t.y = targetNode.y; });
                    scene.player.currentNodeIndex = nodeId;
                    updateWeaponPosition(scene);
                    updatePlayerArrow(scene, targetNode.x, targetNode.y, scene.player.directionIndex);
                    scene.tweens.add({
                        targets: targets, alpha: 1, duration: 300,
                        onComplete: resolve
                    });
                }
            });
        });

        // อัปเดต gameState + เช็คว่าถึง Goal ไหม
        const goalReached = nodeId === currentLevel?.goal_node_id;
        setCurrentGameState({ currentNodeId: nodeId, goalReached });
        console.log('[TELEPORT] เสร็จ! currentNodeId:', nodeId, 'goalReached:', goalReached);
    };

    // ── [สำรอง] Wait — รอ N วินาที ──
    // const wait = async (seconds) => {
    //     await new Promise(r => setTimeout(r, seconds * 1000));
    // };

    // ── [สำรอง] Dodge — หลบข้างแล้วกลับ ──
    // const dodge = async () => {
    //     const scene = getCurrentGameState().currentScene;
    //     if (!scene || !scene.player) return;
    //     const originalX = scene.player.x;
    //     await new Promise(resolve => {
    //         scene.tweens.add({
    //             targets: [scene.player, scene.playerBorder].filter(Boolean),
    //             x: originalX + 40,
    //             duration: 150, ease: 'Sine.easeOut', yoyo: true,
    //             onComplete: resolve
    //         });
    //     });
    // };

    // ── [สำรอง] Shield — กันดาเมจ (แสดง effect ป้องกัน) ──
    // const shield = async () => {
    //     const scene = getCurrentGameState().currentScene;
    //     if (!scene || !scene.player) return;
    //     const circle = scene.add.circle(scene.player.x, scene.player.y, 50, 0x00aaff, 0.3);
    //     circle.setDepth(99);
    //     // ติดตาม player
    //     const track = () => { if (circle.active) { circle.x = scene.player.x; circle.y = scene.player.y; } };
    //     scene.events.on('update', track);
    //     // หายไปหลัง 3 วินาที
    //     setTimeout(() => { if (circle.active) { circle.destroy(); scene.events.off('update', track); } }, 3000);
    //     await new Promise(r => setTimeout(r, 300));
    // };

    // ── [สำรอง] MoveBackward — เดินถอยหลัง (หมุน 180° → เดิน → หมุนกลับ) ──
    // const moveBackward = async () => {
    //     await turnLeft();
    //     await turnLeft();
    //     await moveForward();
    //     await turnRight();
    //     await turnRight();
    // };

    // ── [สำรอง] DoubleHit — ตี 2 ครั้งรวด ──
    // const doubleHit = async () => {
    //     await hit();
    //     await new Promise(r => setTimeout(r, 200)); // หน่วงเล็กน้อย
    //     await hit();
    // };

    // ── CheckHP → ไม่ต้องเขียนฟังก์ชันเพิ่ม เพราะ getPlayerHp อยู่ใน context แล้ว! ──

    return {
        moveForward, turnLeft, turnRight, hit,
        foundMonster, nearPit, atGoal, castSpell, say, Defend, spin, teleport, heal
        // , dash, heal, wait, dodge, shield, moveBackward, doubleHit
    };
}
