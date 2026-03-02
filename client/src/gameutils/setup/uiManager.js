// uiManager.js
// Handles drawing persistent UI overlays (like Coin/Personnel counters) on the Phaser Canvas.

import Phaser from 'phaser';

/**
 * Initializes the Goal UI on the top right of the screen if the level requires it.
 * Tracking coins and rescued people.
 */
export function setupGoalUI(scene) {
    if (!scene || !scene.levelData) return;

    const levelData = scene.levelData;

    // Check if we need to show the UI
    const hasCoins = scene.coins && scene.coins.length > 0;
    const hasPeople = levelData.people && levelData.people.length > 0;

    if (!hasCoins && !hasPeople) return;

    // Create a container fixed to the camera
    const uiContainer = scene.add.container(scene.cameras.main.width - 200, 20);
    uiContainer.setScrollFactor(0); // Fix to screen
    uiContainer.setDepth(9999);

    // Background panel
    const bg = scene.add.graphics();
    bg.fillStyle(0x3e1f0e, 0.9); // Dark amber-ish
    bg.fillRoundedRect(0, 0, 180, 150, 8);
    bg.lineStyle(2, 0x8b4513, 1);
    bg.strokeRoundedRect(0, 0, 180, 150, 8);
    uiContainer.add(bg);

    // Title
    const titleText = scene.add.text(90, 15, "ภารกิจ (Goal)", {
        fontSize: '14px',
        color: '#ffcc00',
        fontStyle: 'bold',
        fontFamily: 'Tahoma, Arial',
    }).setOrigin(0.5);
    uiContainer.add(titleText);

    let startY = 40;
    const spacing = 30;

    // Coins UI
    scene.goalUI = { container: uiContainer, bg, items: {} };

    if (hasCoins) {
        const coinIcon = scene.add.circle(20, startY + 8, 6, 0xffd700);
        const coinText = scene.add.text(35, startY, `เหรียญ: 0 / ${scene.coins.length}`, {
            fontSize: '12px',
            color: '#ffffff',
            fontFamily: 'Tahoma, Arial',
        });

        // Container for collected coin value boxes
        const coinsListContainer = scene.add.container(35, startY + 20);

        uiContainer.add([coinIcon, coinText, coinsListContainer]);
        scene.goalUI.items.coins = { text: coinText, total: scene.coins.length, current: 0, listContainer: coinsListContainer };
        startY += spacing + 25; // Extra space for the coin boxes
    }

    if (hasPeople) {
        const personIcon = scene.add.circle(20, startY + 8, 6, 0x00ffaa);
        const personText = scene.add.text(35, startY, `ช่วยเหลือ: 0 / ${levelData.people.length}`, {
            fontSize: '12px',
            color: '#ffffff',
            fontFamily: 'Tahoma, Arial',
        });
        uiContainer.add([personIcon, personText]);
        scene.goalUI.items.people = { text: personText, total: levelData.people.length, current: 0 };
        startY += spacing;
    }



    // Shrink background to fit content
    bg.clear();
    bg.fillStyle(0x3e1f0e, 0.9);
    bg.fillRoundedRect(0, 0, 180, startY + 10, 8);
    bg.lineStyle(2, 0x8b4513, 1);
    bg.strokeRoundedRect(0, 0, 180, startY + 10, 8);

    console.log("✅ [uiManager] Goal UI created");
}

/**
 * Updates the specific counter on the Goal UI.
 * type: 'coins' | 'people'
 * count: number (current collected count)
 * collectedItems: array (optional) list of collected objects (e.g. coins to show values)
 */
export function updateGoalUI(scene, type, count, collectedItems = []) {
    // Safe check to ensure scene and systems are still active
    if (!scene || !scene.sys || !scene.add || !scene.goalUI || !scene.goalUI.items[type]) return;

    const item = scene.goalUI.items[type];

    // Check if the text element has been destroyed during a scene transition or reset
    if (!item || !item.text || !item.text.active || !item.text.scene) return;

    item.current = count;

    let label = "";
    if (type === 'coins') {
        label = "เหรียญ";
        // Also update the coin values display
        if (item.listContainer) {
            item.listContainer.removeAll(true);
            let cx = 0;
            // Draw up to 5 coins
            const toDraw = collectedItems.slice(0, 5);
            toDraw.forEach((c) => {
                const box = scene.add.graphics();
                box.fillStyle(0x8b4513, 1);
                box.fillRoundedRect(cx, 0, 20, 16, 4);
                box.lineStyle(1, 0xd2691e, 1);
                box.strokeRoundedRect(cx, 0, 20, 16, 4);

                const valText = scene.add.text(cx + 10, 8, String(c.value || c), {
                    fontSize: '10px',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    fontStyle: 'bold'
                }).setOrigin(0.5);

                item.listContainer.add([box, valText]);
                cx += 24;
            });

            if (collectedItems.length > 5) {
                const moreText = scene.add.text(cx, 8, `+${collectedItems.length - 5}`, {
                    fontSize: '10px',
                    color: '#ffd700',
                    fontStyle: 'bold'
                }).setOrigin(0, 0.5);
                item.listContainer.add(moreText);
            }
        }
    }
    else if (type === 'people') label = "ช่วยเหลือ";

    item.text.setText(`${label}: ${item.current} / ${item.total}`);

    // Flash effect on text
    scene.tweens.add({
        targets: item.text,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        yoyo: true,
        ease: 'Sine.easeInOut'
    });
}
