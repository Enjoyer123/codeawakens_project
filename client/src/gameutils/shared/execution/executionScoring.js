import { calculateFinalScore } from '@/components/playgame/utils/scoreUtils';


/**
 * Calculates the final score based on pattern match and Big O correctness.
 * Formula: 60 (base) + patternBonus (0/20/40) - bigOPenalty (0/20)
 */
export const calculateLevelScore = (
    finalState,
    currentLevel,
    patternData,
    goodPatterns,
    userBigO
) => {
    // Determine Pattern Type ID
    let patternTypeId = finalState.patternTypeId;
    if (!patternTypeId) patternTypeId = 0;

    // Determine Target Big O (Only if pattern is matched)
    let targetBigO = null;
    if (patternTypeId > 0) {
        targetBigO = patternData?.bestPatternBigO || patternData?.bestPattern?.big_o || patternData?.bestPattern?.bigO;

        // Fallback 1: Try to find in goodPatterns using patternTypeId
        if (!targetBigO && patternTypeId && goodPatterns) {
            const matchedP = goodPatterns.find(p => p.pattern_type_id === patternTypeId);
            if (matchedP) {
                targetBigO = matchedP.bigO || matchedP.big_o;
            }
        }

        // Fallback 2: Try currentLevel directly
        if (!targetBigO && currentLevel) {
            targetBigO = currentLevel.big_o || currentLevel.bigO;
        }
    }

    // Calculate Final Score
    const scoreData = calculateFinalScore(
        finalState.isGameOver,
        patternTypeId,
        userBigO,
        targetBigO
    );

    return scoreData;
};
