export const calculateLevelScore = (
    finalState,
    userBigO
) => {
    // Determine Pattern Type ID (Sent to API)
    let patternTypeId = finalState.patternTypeId || 0;

    // We no longer calculate score on the frontend.
    // The backend provides the Single Source of Truth for Security & Consistency.
    return {
        patternTypeId,
        userBigO,
        // Empty fallbacks for UI before Backend responds
        stars: 0,
        totalScore: 0,
        pattern_bonus_score: 0,
        bigOPenalty: 0
    };
};
