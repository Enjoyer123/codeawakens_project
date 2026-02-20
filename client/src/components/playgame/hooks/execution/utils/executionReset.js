import {
    getCurrentGameState,
    setCurrentGameState,
    resetPlayerHp,
    getPlayerHp,
} from '../../../../../gameutils/shared/game';

import {
    clearPlayerCoins,
    clearRescuedPeople,
    resetAllPeople,
    clearStack,
} from '../../../../../gameutils/shared/items';

import { updatePlayer, resetEnemy, updateTreasureDisplay, highlightPeak, highlightCableCar, showEmeiFinalResult } from '../../../../../gameutils/phaser';
import {
    resetKnapsackItemsVisual,
    resetSubsetSumWarriorsVisual,
    clearDfsVisuals,
    resetDijkstraState,
    resetCoinChangeTableState,
    resetCoinChangeVisual,
    resetCoinChangeSelectionTracking,
    resetSubsetSumTableState,
    resetSubsetSumTrackingVisual,
} from '../../../../../gameutils/blockly';


export const setupEmeiApi = (currentLevel) => {
    // Setup Cable Car API bridge for visual feedback
    const isEmeiMountain = currentLevel?.level_name?.includes('ง้อไบ๊') ||
        currentLevel?.level_name?.toLowerCase().includes('emei') ||
        currentLevel?.level_name === 'minimum' ||
        currentLevel?.appliedData?.type === 'GRAPH_MAX_CAPACITY';

    if (isEmeiMountain) {
        globalThis.__emei_api = {
            highlightPeak: (nodeId) => highlightPeak(nodeId),
            highlightCableCar: (u, v, capacity) => highlightCableCar(u, v, capacity),
            showFinalResult: (bottleneck, rounds) => showEmeiFinalResult(bottleneck, rounds)
        };
    }
};

export const resetGameExecutionState = async ({
    gameStartTime,
    setAttempts,
    setPlayerHp,
    setRescuedPeople,
    setPlayerNodeId,
    setPlayerDirection,
    currentLevel
}) => {
    // Start timing the attempt
    if (gameStartTime) gameStartTime.current = Date.now();
    if (setAttempts) setAttempts(prev => prev + 1);

    // Reset to start position และ sync HP
    setCurrentGameState({
        currentNodeId: currentLevel.startNodeId,
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
    if (setRescuedPeople) setRescuedPeople([]);
    await resetAllPeople();

    // ล้างข้อมูล stack และสมบัติ
    clearStack();

    // Reset knapsack items to original positions
    if (currentLevel?.knapsackData) {
        resetKnapsackItemsVisual();
    }

    // Reset subset sum warriors to original positions
    if (currentLevel?.subsetSumData) {
        resetSubsetSumWarriorsVisual();
        try { resetSubsetSumTableState(); } catch (e) { }
        try { resetSubsetSumTrackingVisual(); } catch (e) { }
    }

    // Reset coin change state
    if (currentLevel?.coinChangeData) {
        const scene = getCurrentGameState().currentScene;
        if (scene) {
            try { resetCoinChangeVisual(scene, true); } catch (e) { }
        }
        try { resetCoinChangeTableState(); } catch (e) { }
        try { resetCoinChangeSelectionTracking(); } catch (e) { }
    }
    resetDijkstraState();

    // อัปเดตการแสดงผลสมบัติหลังจาก reset
    if (getCurrentGameState().currentScene) {
        try {
            updateTreasureDisplay(getCurrentGameState().currentScene);
        } catch (e) {
            // Non-critical
        }
    }

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

        // รีเซ็ตสมบัติที่เก็บไว้ให้กลับมาแสดง
        if (getCurrentGameState().currentScene.treasures) {
            getCurrentGameState().currentScene.treasures.forEach(treasure => {
                treasure.setVisible(true);
                if (treasure.nameLabel) {
                    treasure.nameLabel.setVisible(true);
                }
                if (treasure.glowEffect) {
                    treasure.glowEffect.setVisible(true);
                }
            });
        }
    }

    // Clear DFS visual feedback before starting
    const currentScene = getCurrentGameState().currentScene;
    if (currentScene) {
        clearDfsVisuals(currentScene);
    }

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

    if (setPlayerNodeId) setPlayerNodeId(currentLevel.startNodeId);
    if (setPlayerDirection) setPlayerDirection(0);

    // Set direction in game state first
    setCurrentGameState({ direction: 0 });

    // Update player position in Phaser (HP bar now handled in bottom UI)
    // Pass direction 0 (right) explicitly to ensure correct initial direction
    if (getCurrentGameState().currentScene) {
        const scene = getCurrentGameState().currentScene;
        if (scene.player) {
            scene.player.directionIndex = 0;
            scene.player.currentNodeIndex = currentLevel.startNodeId;
        }
        updatePlayer(scene, currentLevel.startNodeId, 0);
    }
};
