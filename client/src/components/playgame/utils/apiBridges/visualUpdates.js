/**
 * Visual Update Utilities
 * 
 * This module contains utility functions for updating game visuals
 * based on algorithm execution state.
 * 
 * Extracted from GameCore.jsx for better organization.
 */

import { getCurrentGameState } from '../../../../gameutils/shared/game';
import { updateTrainScheduleVisuals, updateRopePartitionVisuals } from '../../../../gameutils/phaser';

/**
 * Update Train Schedule Visuals if needed
 * 
 * @param {Object} currentLevel - Current level data
 * @param {Object} hintData - Hint data containing assignments
 */
export const updateTrainScheduleVisualsIfNeeded = (currentLevel, hintData) => {
    if (currentLevel?.gameType === 'train_schedule' && hintData?.assignments) {
        const scene = getCurrentGameState().currentScene;
        if (scene) {
            console.log('[GameCore] Triggering Train Schedule Visuals from Core', hintData.assignments);
            updateTrainScheduleVisuals(scene, hintData.assignments);
        }
    }
};

/**
 * Update Rope Partition Visuals if needed
 * 
 * @param {Object} currentLevel - Current level data
 * @param {Object} hintData - Hint data containing rope partition state
 */
export const updateRopePartitionVisualsIfNeeded = (currentLevel, hintData) => {
    const isRopePartition = currentLevel?.gameType === 'rope_partition' ||
        currentLevel?.appliedData?.type === 'BACKTRACKING_ROPE_PARTITION';

    if (isRopePartition && hintData) {
        const scene = getCurrentGameState().currentScene;
        if (scene) {
            // Passing the whole hintData as it contains the rich state object (current, total, status, etc)
            updateRopePartitionVisuals(scene, hintData);
        }
    }
};
