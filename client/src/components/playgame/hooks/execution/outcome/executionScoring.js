import {
    getCurrentGameState,
    setCurrentGameState
} from '../../../../../gameutils/shared/game';
import { calculateFinalScore } from '../../../utils/scoreUtils';
import { flushKnapsackStepsNow, waitForKnapsackPlaybackDone } from '../../../../../gameutils/blockly/algorithms/knapsack/knapsackStateManager';
import { flushSubsetSumStepsNow, waitForSubsetSumPlaybackDone } from '../../../../../gameutils/blockly/algorithms/subset_sum/subsetSumStateManager';
import { flushCoinChangeStepsNow, waitForCoinChangePlaybackDone } from '../../../../../gameutils/blockly/algorithms/coin_change/coinChangeStateManager';
import { flushAntDpStepsNow, waitForAntDpPlaybackDone, waitForAntDpVisualIdle } from '../../../../../gameutils/blockly/algorithms/ant_dp/antDpStateManager';
import { showAntDpFinalPath } from '../../../../../gameutils/blockly';

/**
 * Ensures all algorithm visualization tables (Knapsack, etc.) are finalized/flushed
 * and their playback has completed before we declare victory.
 * This prevents the "Victory" banner from appearing while the table is still animating.
 */
export const finalizeTablesBeforeVictory = async (currentLevel, isTrainSchedule) => {
    try {
        // Flush any buffered steps into game state
        if (currentLevel?.knapsackData) { try { flushKnapsackStepsNow(); } catch (e) { } }
        if (currentLevel?.subsetSumData) { try { flushSubsetSumStepsNow(); } catch (e) { } }
        if (currentLevel?.coinChangeData) { try { flushCoinChangeStepsNow(); } catch (e) { } }
        if (currentLevel?.appliedData?.type?.includes('ANT')) {
            try { flushAntDpStepsNow(); } catch (e) { }
            try { await showAntDpFinalPath(); } catch (e) { }
        }

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
            // Ant DP: if debug table is enabled, ensure playback is running so it can finish.
            if (currentLevel?.appliedData?.type?.includes('ANT') && gs?.antDpState?.playback) {
                updates.antDpState = {
                    ...gs.antDpState,
                    playback: {
                        ...(gs.antDpState.playback || {}),
                        requestedIsPlaying: true,
                    }
                };
            }
            if (Object.keys(updates).length > 0) setCurrentGameState(updates);
        } catch (e) { }

        // Wait for the playback cursor to reach the end (guarded by timeout)
        try {
            const waits = [];
            const calcTimeoutMs = (stateKey) => {
                const st = getCurrentGameState()?.[stateKey];
                const total = Array.isArray(st?.steps) ? st.steps.length : 0;
                const cursor = Number(st?.playback?.cursor ?? 0);
                const remaining = Math.max(0, total - cursor);
                const speed = Number(st?.playback?.requestedSpeedMs ?? st?.playback?.speedMs ?? 250);
                const estimated = remaining * (Number.isFinite(speed) && speed > 0 ? speed : 250) + 800;
                // allow long enough for the user to actually watch the table; still cap to prevent hanging forever
                return Math.max(1500, Math.min(600000, estimated));
            };

            if (currentLevel?.knapsackData) waits.push(waitForKnapsackPlaybackDone({ timeoutMs: calcTimeoutMs('knapsackState'), pollMs: 40 }));
            if (currentLevel?.subsetSumData) waits.push(waitForSubsetSumPlaybackDone({ timeoutMs: calcTimeoutMs('subsetSumState'), pollMs: 40 }));
            if (currentLevel?.coinChangeData) waits.push(waitForCoinChangePlaybackDone({ timeoutMs: calcTimeoutMs('coinChangeState'), pollMs: 40 }));
            if (currentLevel?.appliedData?.type?.includes('ANT')) {
                // Always wait for queued Phaser animations (ant walking / highlights) so they don't continue after Victory.
                waits.push(waitForAntDpVisualIdle({ timeoutMs: 600000, pollMs: 40 }));
                // Only wait for Ant DP table playback if the debug table is enabled (it is the only thing that updates cursor).
                const antPbTotal = Number(getCurrentGameState()?.antDpState?.playback?.total ?? 0);
                if (antPbTotal > 0) waits.push(waitForAntDpPlaybackDone({ timeoutMs: calcTimeoutMs('antDpState'), pollMs: 40 }));
            }
            if (waits.length) await Promise.allSettled(waits);
        } catch (e) { /* ignore */ }
    } catch (e) { /* ignore */ }

    // Special wait for Train Schedule Visualization
    if (isTrainSchedule) {
        const assignments = globalThis.assignments || [];
        if (assignments.length > 0) {
            const trainAnimDuration = assignments.length * 600 + 1500;
            console.log(`⏳ Waiting ${trainAnimDuration}ms for Train Schedule animation...`);
            await new Promise(r => setTimeout(r, trainAnimDuration));
        }
    }
};

/**
 * Calculates the final score including test case bonuses, Big O bonuses, etc.
 */
export const calculateLevelScore = (
    finalState,
    currentLevel,
    hintData,
    goodPatterns,
    hintOpenCount,
    userBigO,
    testCaseResultLocal = null
) => {
    // Calculate Test Case Bonus
    let testCaseBonus = 0;
    const resultToCheck = testCaseResultLocal || finalState.testCaseResult;

    if (resultToCheck) {
        const secondaryTests = [];
        if (resultToCheck.passedTests) {
            resultToCheck.passedTests.forEach(tc => {
                if (!tc.is_primary) secondaryTests.push({ passed: true });
            });
        }
        if (resultToCheck.failedTests) {
            resultToCheck.failedTests.forEach(tc => {
                if (!tc.is_primary) secondaryTests.push({ passed: false });
            });
        }

        if (secondaryTests.length > 0) {
            const passedCount = secondaryTests.filter(t => t.passed).length;
            testCaseBonus = (passedCount / secondaryTests.length) * 20;
            console.log(`[Score] Bonus: ${passedCount}/${secondaryTests.length} passed -> +${testCaseBonus}`);
        }
    }

    // Determine Pattern Type ID
    let patternTypeId = finalState.patternTypeId;
    if (!patternTypeId && goodPatterns && goodPatterns.length > 0) {
        const bestPattern = goodPatterns.find(p => p.pattern_type_id);
        if (bestPattern) patternTypeId = bestPattern.pattern_type_id;
    }
    if (!patternTypeId) patternTypeId = 0;

    // Determine Target Big O
    let targetBigO = hintData?.bestPatternBigO || hintData?.bestPattern?.big_o || hintData?.bestPattern?.bigO;

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

    // Calculate Final Score
    const scoreData = calculateFinalScore(
        finalState.isGameOver,
        patternTypeId,
        hintOpenCount,
        userBigO,
        targetBigO,
        testCaseBonus
    );

    return scoreData;
};
