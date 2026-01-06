/**
 * Configuration for Exam/Test Prerequisites
 * This file defines the requirements that must be met before taking Pre/Post tests.
 */

export const EXAM_CONFIG = {
    PRE_TEST: {
        // Usually Pre-Test is available immediately, but logic can be added here
        AVAILABLE_IMMEDIATELY: true,
    },
    POST_TEST: {
        // List of Level IDs that MUST be completed (status: 'completed' or 'passed')
        // before the Post-Test is unlocked.
        // Replace these IDs with the actual critical level IDs for your course.
        REQUIRED_LEVEL_IDS: [
            // Example: 1, 2, 3 
            // 101, 102, 103
        ],

        // Optional: Min score required in those levels?
        // REQUIRE_FULL_SCORE: false 
    }
};

/**
 * Helper to check if user qualifies for Post Test
 * @param {Array} userProgress - Array of user's progress objects (from DB/State)
 * @returns {Object} { unlocked: boolean, missingLevels: Array }
 */
export const checkPostTestUnlockStatus = (userProgress) => {
    if (!userProgress || !Array.isArray(userProgress)) return { unlocked: false, missingLevels: EXAM_CONFIG.POST_TEST.REQUIRED_LEVEL_IDS };

    const completedLevelIds = userProgress
        .filter(p => p.status === 'completed' || p.is_correct) // Adjust based on your 'status' value
        .map(p => p.level_id);

    const missingLevels = EXAM_CONFIG.POST_TEST.REQUIRED_LEVEL_IDS.filter(
        reqId => !completedLevelIds.includes(reqId)
    );

    return {
        unlocked: missingLevels.length === 0,
        missingLevels
    };
};
