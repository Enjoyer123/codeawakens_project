/**
 * Movement, combat, and sensor wrappers for code execution.
 * These bridge the Blockly-generated code with Phaser animations.
 */

import { getCurrentGameState, setCurrentGameState } from '@/gameutils/shared/game/gameState';
import { calculateMoveForward, calculateTurnLeft, calculateTurnRight } from '@/gameutils/movement/movementCore';
import { playMoveAnimation, playTurnAnimation } from '@/gameutils/movement/movementPlayback';
import { nearPit as checkNearPit } from '@/gameutils/movement/collisionUtils';
import { calculateHit } from '@/gameutils/combat/combatLogic';
import { playHitAnimation } from '@/gameutils/combat/combatPlayback';
import { haveEnemy } from '@/gameutils/combat/playerCombat';

/**
 * Create all game action functions that Blockly code can call.
 * @param {Object} setters - React state setters
 * @param {Object} currentLevel - Current level data
 * @param {boolean} isPreview - Whether in admin preview mode
 */
export function createGameActions(setters, currentLevel, isPreview) {
    const {
        setIsGameOver, setGameState,
        setShowProgressModal, setGameResult
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



    return {
        moveForward, turnLeft, turnRight, hit,
        foundMonster, nearPit, atGoal, castSpell, say
    };
}
