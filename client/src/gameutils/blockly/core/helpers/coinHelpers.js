// Coin Helper Functions
import {


    getPlayerCoins,
    addCoinToPlayer,
    swapPlayerCoins,
    comparePlayerCoins,
    getPlayerCoinValue,
    getPlayerCoinCount,
    arePlayerCoinsSorted
} from '../../../shared/items';

import { getCurrentGameState, getCurrentScene } from '../../../shared/game';
import { collectCoinByPlayer, haveCoinAtPosition } from '../../../phaser/setup/phaserCollection';

// Coin collection functions
export async function collectCoin() {
    const currentState = getCurrentGameState();
    if (currentState.goalReached || currentState.isGameOver) return;

    console.log("Collect coin function called");
    await new Promise((resolve) => setTimeout(resolve, 200));

    const scene = getCurrentScene();

    if (scene && scene.player) {
        console.log(`collectCoin called - player at (${scene.player.x}, ${scene.player.y})`);
        const collected = collectCoinByPlayer(scene, scene.player.x, scene.player.y);

        if (collected) {
            const playerX = scene.player.x;
            const playerY = scene.player.y;

            const collectedCoins = scene.coins.filter(coin => {
                if (!coin.collected) return false;

                const distance = Math.sqrt(
                    Math.pow(playerX - coin.x, 2) + Math.pow(playerY - coin.y, 2)
                );

                return distance <= 100;
            });

            if (collectedCoins.length === 0) {
                const recentlyCollected = scene.coins.filter(coin => {
                    if (!coin.collected) return false;
                    const existingCoins = getPlayerCoins();
                    const alreadyInInventory = existingCoins.some(playerCoin => playerCoin.id === coin.id);
                    return !alreadyInInventory;
                });
                collectedCoins.push(...recentlyCollected);
            }

            for (const collectedCoin of collectedCoins) {
                const existingCoins = getPlayerCoins();
                const alreadyCollected = existingCoins.some(coin => coin.id === collectedCoin.id);

                if (!alreadyCollected) {
                    addCoinToPlayer({
                        id: collectedCoin.id,
                        value: collectedCoin.value,
                        x: collectedCoin.x,
                        y: collectedCoin.y
                    });
                }
            }
        }
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
}

export function haveCoin() {
    const currentState = getCurrentGameState();
    if (currentState.goalReached || currentState.isGameOver) return false;

    const scene = getCurrentScene();

    if (scene && scene.player) {
        return haveCoinAtPosition(scene, scene.player.x, scene.player.y);
    }

    return false;
}

// Coin sorting functions
export async function swapCoins(index1, index2) {
    const currentState = getCurrentGameState();
    if (currentState.goalReached || currentState.isGameOver) return;

    await new Promise((resolve) => setTimeout(resolve, 200));
    swapPlayerCoins(index1, index2);
    await new Promise((resolve) => setTimeout(resolve, 300));
}

export function compareCoins(index1, index2, operator) {
    return comparePlayerCoins(index1, index2, operator);
}

export function getCoinValue(index) {
    return getPlayerCoinValue(index);
}

export function getCoinCount() {
    return getPlayerCoinCount();
}

export function isSorted(order) {
    return arePlayerCoinsSorted(order);
}
