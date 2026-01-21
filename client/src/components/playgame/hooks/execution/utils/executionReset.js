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

    getStack // imported but maybe not used in reset directly, strictly checking usage}
} from '../../../../../gameutils/shared/items';

import { updatePlayer } from '../../../../../gameutils/phaser';
import { resetEnemy } from '../../../../../gameutils/phaser';
import {
    updateTreasureDisplay,
} from '../../../../../gameutils/phaser';
import {
    resetKnapsackItemsVisual,
    resetSubsetSumWarriorsVisual,
    clearDfsVisuals,

    resetDijkstraState,

} from '../../../../../gameutils/blockly';

import { highlightPeak, highlightCableCar, showEmeiFinalResult } from '../../../../../gameutils/phaser';


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
        console.log('✅ __emei_api initialized');
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
    console.log("Game reset - HP set to:", getPlayerHp());

    // ล้างเหรียญที่เก็บไว้
    clearPlayerCoins();
    console.log("Game reset - Coins cleared");

    // ล้างข้อมูลคนที่ช่วยแล้ว
    clearRescuedPeople();
    if (setRescuedPeople) setRescuedPeople([]);
    await resetAllPeople();
    console.log("Game reset - Rescued people cleared");

    // ล้างข้อมูล stack และสมบัติ
    clearStack();

    // Reset knapsack items to original positions
    if (currentLevel?.knapsackData) {
        resetKnapsackItemsVisual();
        console.log("Game reset - Knapsack items reset");
    }

    // Reset subset sum warriors to original positions
    if (currentLevel?.subsetSumData) {
        resetSubsetSumWarriorsVisual();
        console.log("Game reset - Subset Sum warriors reset");
    }

    console.log("Game reset - Stack and treasure cleared");

    // Reset Dijkstra state
    resetDijkstraState();
    console.log("Game reset - Dijkstra state cleared");

    // อัปเดตการแสดงผลสมบัติหลังจาก reset
    if (getCurrentGameState().currentScene) {
        // NOTE: Dynamic import was in original, but here we can import directly or keep dynamic if circular dependency feared. 
        // Original: import('../../../../gameutils/phaser/setup/phaserCollection').then(({ updateTreasureDisplay }) => { updateTreasureDisplay(...) });
        // We imported updateTreasureDisplay at top level, so we use it directly.
        try {
            updateTreasureDisplay(getCurrentGameState().currentScene);
        } catch (e) {
            console.warn("Failed to update treasure display:", e);
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
            console.log("Game reset - Coins reset in scene (showing all coins)");
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
            console.log("Game reset - People reset in scene (showing all people)");
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
            console.log("Game reset - Treasures reset in scene (showing all treasures)");
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
            monster.data.hp = 3;

            // Use new utility function to reset enemy
            resetEnemy(monster.sprite, monster.sprite.x, monster.sprite.y);
            if (monster.glow) {
                monster.glow.setVisible(true);
                monster.glow.setFillStyle(0xff0000, 0.2);
            }
            if (monster.sprite.anims) {
                monster.sprite.anims.play('vampire-idle', true);
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
