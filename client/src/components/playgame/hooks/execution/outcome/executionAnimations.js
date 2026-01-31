import { showVictory, playCombatSequence } from '../../../../../gameutils/phaser';

/**
 * Handles the complete victory animation sequence including:
 * - Finding the active scene (with fallback)
 * - Determining animation type (Rescue vs Normal)
 * - Handling Cinematic vs Node level differences
 * - Playing Combat Sequence (if cinematic)
 * - Showing Victory Banner
 * - Waiting for banner animations
 * 
 * @param {Object} currentLevel - The level data object
 * @param {Object} initialScene - The initial Phaser scene (optional)
 * @returns {Promise<void>} Resolves when the entire sequence is complete (ready for state updates)
 */
export const playVictorySequence = async (currentLevel, initialScene) => {
    let currentScene = initialScene;

    // 1. Ensure we have a valid active scene
    if (!currentScene || !currentScene.sys || !currentScene.sys.isActive()) {
        // Fallback: Try global search
        try {
            if (window.game && window.game.scene && window.game.scene.scenes) {
                currentScene = window.game.scene.scenes.find(s => s.sys && s.sys.isActive() && s.sys.settings.key === 'GameScene');
            }
        } catch (e) {
            console.error('Global scene search failed', e);
        }
    }

    if (currentScene) {
        // 2. Determine configuration
        const victoryType = currentLevel.goalType === "ช่วยคน" ? 'rescue' : 'normal';
        const isCinematicLevel = !currentLevel.nodes || currentLevel.nodes.length === 0;
        const isGraphLevel = currentLevel.nodes && currentLevel.nodes.length > 0 && currentLevel.edges && currentLevel.edges.length > 0;

        // 3. Pre-Banner Animation (Combat or Delay)
        if (isCinematicLevel) {
            // Cinematic: Wait for combat animation to complete
            await new Promise((resolve) => {
                playCombatSequence(currentScene, true, () => {
                    resolve();
                });
            });
        } else {
            // Graph/Regular: No pre-banner delay needed
            // Visual effects will play naturally
        }

        // 4. Show Victory Banner
        showVictory(currentScene, victoryType);

        // 5. Post-Banner Delay based on level type
        if (isCinematicLevel) {
            // Cinematic: Short delay to let banner appear, then show modal
            await new Promise(r => setTimeout(r, 500));
        } else if (isGraphLevel) {
            // Graph: Minimal delay (just walks to goal node, no special effects)
            await new Promise(r => setTimeout(r, 300));
        } else {
            // Regular level: Minimal delay, show modal almost immediately
            await new Promise(r => setTimeout(r, 300));
        }
    } else {
        // Total fallback if no scene logic works (e.g. headless or broken state)
        await new Promise(r => setTimeout(r, 2000));
    }
};
