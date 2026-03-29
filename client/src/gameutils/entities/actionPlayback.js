import { rescuePersonVisual } from './collection';
import { playSound } from '../sound/soundManager';

/**
 * Handles playing the visual animation for rescuing a person.
 * Playback pattern supports swappable visuals via `options`.
 */
export async function playRescueAnimation(scene, actionData, options = {}) {
    if (!scene || !actionData.success) return;

    playSound('rescue');

    // In the future, we can add alternative visuals based on options
    // e.g. if (options.useSpotlight) return playSpotlightRescue(scene, actionData.nodeId);

    // Default classic visual
    if (rescuePersonVisual) {
        rescuePersonVisual(scene, actionData.nodeId);
    }
}

