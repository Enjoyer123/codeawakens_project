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

        if (!result.success) return false;

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
        }
    };

    const turnRight = async () => {
        const result = calculateTurnRight();
        if (result.success) {
            setCurrentGameState({ direction: result.newDirection });
            const scene = getCurrentGameState().currentScene;
            if (scene) await playTurnAnimation(scene, result);
        }
    };

    // ─── Combat ───
    const hit = async () => {
        const scene = getCurrentGameState().currentScene;
        const result = calculateHit(scene);

        if (!result.success) {
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

    return {
        moveForward, turnLeft, turnRight, hit,
        foundMonster, nearPit, atGoal
    };
}
