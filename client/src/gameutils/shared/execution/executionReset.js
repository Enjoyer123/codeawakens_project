import {
    getCurrentGameState,
    setCurrentGameState,
    resetPlayerHp,
    getPlayerHp,
} from '../game/gameState';

import { clearPlayerCoins } from '../../entities/coinUtils';
import { clearRescuedPeople, resetAllPeople } from '../../entities/personUtils';




import { updatePlayer } from '../../phaser/player/phaserGamePlayer';
import { resetEnemy } from '../../combat/enemyUtils';



export const resetGameExecutionState = async ({
    setAttempts,
    setPlayerHp,
    setPlayerNodeId,
    setPlayerDirection,
    currentLevel
}) => {
    if (setAttempts) setAttempts(prev => prev + 1);

    // Reset to start position และ sync HP
    setCurrentGameState({
        currentNodeId: currentLevel.start_node_id,
        direction: 0,
        goalReached: false,
        moveCount: 0,
        isGameOver: false,
        playerCoins: [] // ล้างเหรียญที่เก็บไว้
    });

    // IMPORTANT: Reset HP และ sync กับ React state
    resetPlayerHp(setPlayerHp);

    // ล้างเหรียญที่เก็บไว้
    clearPlayerCoins();

    // ล้างข้อมูลคนที่ช่วยแล้ว
    clearRescuedPeople();
    await resetAllPeople();




    // Reset algo-specific visuals (Knapsack / SubsetSum / CoinChange)
    // ตอนนี้ logic reset ถูกลบไปแล้วเพราะเป็น obsolete
    // แต่ยังเก็บโครงสร้างไว้เผื่อย้อนกลับ

    // รีเซ็ตเหรียญในเกมให้กลับมาแสดง
    if (getCurrentGameState().currentScene) {
        // รีเซ็ตเหรียญที่เก็บไว้แล้วให้กลับมาแสดง
        if (getCurrentGameState().currentScene.coins) {
            getCurrentGameState().currentScene.coins.forEach(coin => {
                coin.collected = false;
                coin.sprite.setVisible(true);
                const valueText = coin.sprite.getData('valueText');
                const glow = coin.sprite.getData('glow');
                if (valueText) valueText.setVisible(true);
                if (glow) glow.setVisible(true);
            });
        }

        // รีเซ็ตคนที่ถูกช่วยไว้ให้กลับมาแสดง
        if (getCurrentGameState().currentScene.people) {
            getCurrentGameState().currentScene.people.forEach(person => {
                person.setVisible(true);
                if (person.nameLabel) {
                    person.nameLabel.setVisible(true);
                }
                if (person.rescueEffect) {
                    person.rescueEffect.setVisible(true);
                }
            });
        }
    }

    // Clear DFS visual feedback before starting (Handled by GraphPlayback)
    // Reset monsters state using new utility functions
    if (getCurrentGameState().currentScene && getCurrentGameState().currentScene.monsters) {
        getCurrentGameState().currentScene.monsters.forEach(monster => {
            monster.data.defeated = false;
            monster.data.inBattle = false;
            monster.data.isChasing = false;
            monster.data.lastAttackTime = null;
            monster.data.hp = monster.data.maxHp || 3;

            // Use new utility function to reset enemy
            resetEnemy(monster.sprite, monster.sprite.x, monster.sprite.y);
            if (monster.glow) {
                monster.glow.setVisible(true);
                monster.glow.setFillStyle(0xff0000, 0.2);
            }
            if (monster.sprite.anims) {
                const idleAnim = monster.sprite.getData('idleAnim') || 'vampire-idle';
                monster.sprite.anims.play(idleAnim, true);
            }
        });
    }

    if (setPlayerNodeId) setPlayerNodeId(currentLevel.start_node_id);
    if (setPlayerDirection) setPlayerDirection(0);

    // Set direction in game state first
    setCurrentGameState({ direction: 0 });

    // Update player position in Phaser (HP bar now handled in bottom UI)
    // Pass direction 0 (right) explicitly to ensure correct initial direction
    if (getCurrentGameState().currentScene) {
        const scene = getCurrentGameState().currentScene;
        if (scene.player) {
            scene.player.directionIndex = 0;
            scene.player.currentNodeIndex = currentLevel.start_node_id;
        }
        updatePlayer(scene, currentLevel.start_node_id, 0);
    }
};
