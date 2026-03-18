import { showVictory } from './gameEffects';
import { playCombatSequence } from '../combat/battleAnimation';

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
        const isCinematicLevel = !currentLevel.nodes || currentLevel.nodes.length === 0;
        const isGraphLevel = currentLevel.nodes && currentLevel.nodes.length > 0 && currentLevel.edges && currentLevel.edges.length > 0;

        // 3. Pre-Banner Animation (Combat or Delay)
        if (isCinematicLevel) {
            // Check if monsters were already defeated by user code (e.g. hit() blocks)
            const monsters = currentScene.levelData?.map_entities?.filter(e => e.entity_type === 'MONSTER') || [];
            const allMonstersDefeated = !currentScene.monsters
                || monsters.length === 0
                || currentScene.monsters.every(m =>
                    m.data?.defeated || m.sprite?.getData('defeated') || m.isDefeated
                );

            if (allMonstersDefeated) {
                // Monsters already killed during code execution, skip cinematic
                await new Promise(r => setTimeout(r, 500));
            } else {
                // No combat happened yet, play the full cinematic sequence
                await new Promise((resolve) => {
                    playCombatSequence(currentScene, true, () => {
                        resolve();
                    });
                });
            }
        }

        // 4. Show Victory Banner
        showVictory(currentScene);

        // 5. Post-Banner Delay based on level type
        if (isCinematicLevel) {
            await new Promise(r => setTimeout(r, 500));
        } else if (isGraphLevel) {
            await new Promise(r => setTimeout(r, 300));
        } else {
            await new Promise(r => setTimeout(r, 300));
        }
    } else {
        // Total fallback if no scene logic works
        await new Promise(r => setTimeout(r, 2000));
    }
};
