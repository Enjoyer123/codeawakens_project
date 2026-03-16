import { useMemo } from 'react';

/**
 * Extracts and parses the `enabledBlocks` configuration from `levelData`.
 * Required for `useSharedBlockly` to determine which blocks should populate the toolbox.
 *  
 * @param {Object} levelData - The level data fetched from the DB
 * @returns {Object} A dictionary mapping block_keys to booleans (e.g. { move_forward: true })
 */
export const useEnabledBlocks = (levelData) => {
    return useMemo(() => {
        if (!levelData) return {};
        const enabledBlocksObj = {};

        // Parse from level_blocks relational array (Newer format)
        if (Array.isArray(levelData.level_blocks)) {
            levelData.level_blocks.forEach((blockInfo) => {
                if (blockInfo?.block?.block_key) {
                    enabledBlocksObj[blockInfo.block.block_key] = true;
                }
            });
        }

        // Parse from enabled_blocks raw JSON column (Legacy/Fallback format)
        if (Object.keys(enabledBlocksObj).length === 0) {
            if (typeof levelData.enabled_blocks === 'object' && levelData.enabled_blocks !== null) {
                Object.assign(enabledBlocksObj, levelData.enabled_blocks);
            } else if (typeof levelData.enabled_blocks === 'string') {
                try {
                    Object.assign(enabledBlocksObj, JSON.parse(levelData.enabled_blocks) || {});
                } catch (e) {
                    console.warn("Failed to parse levelData.enabled_blocks JSON string", e);
                }
            }
        }

        // Absolute Fallback if no blocks were found
        if (Object.keys(enabledBlocksObj).length === 0) {
            enabledBlocksObj.move_forward = true;
            enabledBlocksObj.turn_left = true;
            enabledBlocksObj.turn_right = true;
        }

        return enabledBlocksObj;
    }, [levelData]);
};
