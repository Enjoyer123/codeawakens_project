import {
    getCurrentGameState,
    setCurrentGameState
} from '../game';
import { calculateFinalScore } from '@/components/playgame/utils/scoreUtils';



/**
 * Ensures all algorithm visualization tables (Knapsack, etc.) are finalized/flushed
 * and their playback has completed before we declare victory.
 * This prevents the "Victory" banner from appearing while the table is still animating.
 */
export const finalizeTablesBeforeVictory = async (currentLevel) => {
    try {
        // Flush any buffered steps into game state


        // Make Victory/visuals wait until the table playback has finished.
        // Do NOT auto-speed-up here; we respect the table's current speed.
        try {
            const gs = getCurrentGameState();
            const updates = {};

            if (currentLevel?.knapsackData && gs?.knapsackState) {
                updates.knapsackState = {
                    ...gs.knapsackState,
                    playback: {
                        ...(gs.knapsackState.playback || {}),
                        // Ensure playback is running so it can actually finish
                        requestedIsPlaying: true,
                    }
                };
            }
            if (currentLevel?.subsetSumData && gs?.subsetSumState) {
                updates.subsetSumState = {
                    ...gs.subsetSumState,
                    playback: {
                        ...(gs.subsetSumState.playback || {}),
                        requestedIsPlaying: true,
                    }
                };
            }
            if (currentLevel?.coinChangeData && gs?.coinChangeState) {
                const total = Array.isArray(gs.coinChangeState.steps) ? gs.coinChangeState.steps.length : 0;
                const cursor = Number(gs.coinChangeState.playback?.cursor ?? 0);
                const remaining = Math.max(0, total - cursor);
                const currentSpeed = Number(gs.coinChangeState.playback?.speedMs ?? 250);
                const estimatedMs = remaining * (Number.isFinite(currentSpeed) && currentSpeed > 0 ? currentSpeed : 250);

                // CoinChange can produce many steps; if it would take too long, speed it up (but still wait for completion).
                const TARGET_MAX_WAIT_MS = 180000; // 3 minutes
                const shouldAutoSpeed = remaining > 0 && estimatedMs > TARGET_MAX_WAIT_MS;
                const requestedSpeedMs = shouldAutoSpeed
                    ? Math.max(10, Math.ceil(TARGET_MAX_WAIT_MS / Math.max(1, remaining)))
                    : undefined;

                updates.coinChangeState = {
                    ...gs.coinChangeState,
                    playback: {
                        ...(gs.coinChangeState.playback || {}),
                        requestedIsPlaying: true,
                        ...(shouldAutoSpeed ? { requestedSpeedMs } : {}),
                    }
                };
            }

            if (Object.keys(updates).length > 0) setCurrentGameState(updates);
        } catch (e) { }
    } catch (e) { /* ignore */ }
};

/**
 * Calculates the final score based on pattern match and Big O correctness.
 * Formula: 60 (base) + patternBonus (0/20/40) - bigOPenalty (0/20)
 */
export const calculateLevelScore = (
    finalState,
    currentLevel,
    hintData,
    goodPatterns,
    userBigO
) => {
    // Determine Pattern Type ID
    let patternTypeId = finalState.patternTypeId;
    if (!patternTypeId) patternTypeId = 0;

    // Determine Target Big O (Only if pattern is matched)
    let targetBigO = null;
    if (patternTypeId > 0) {
        targetBigO = hintData?.bestPatternBigO || hintData?.bestPattern?.big_o || hintData?.bestPattern?.bigO;

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
