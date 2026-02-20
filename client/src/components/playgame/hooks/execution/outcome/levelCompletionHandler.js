import {
    checkVictoryConditions,
    generateVictoryHint,
    getCurrentGameState,
    getPlayerHp
} from '../../../../../gameutils/shared/game';
import {
    showGameOver,
    showVictory,
    playCombatSequence
} from '../../../../../gameutils/phaser';
import {
    finalizeTablesBeforeVictory,
    calculateLevelScore
} from './executionScoring';
import { playVictorySequence } from './executionAnimations';

/**
 * Handles the logic for checking victory conditions and processing the level outcome.
 * This includes showing victory/game over screens, playing animations, and calculating scores.
 * 
 * @param {Object} params - Parameters for handling level completion
 */
export const handleLevelCompletion = async ({
    currentLevel,
    testCaseResult,
    isTrainSchedule,
    isRopePartitionCheck,
    isPreview,
    gameStartTime,
    hintData,
    goodPatterns,
    hintOpenCount,
    userBigO,
    patternId,
    onUnlockPattern,
    onUnlockLevel,
    setters: {
        setCurrentHint,
        setIsGameOver,
        setGameState,
        setIsRunning,
        setGameResult,
        setFinalScore,
        setShowProgressModal,
        setIsCompleted
    }
}) => {
    // 1. Prepare Victory Conditions

    // Polyfill victory conditions for Rope Partition if missing (Critical Fix)
    let victoryConditions = currentLevel.victoryConditions;

    if ((!victoryConditions || victoryConditions.length === 0) && isRopePartitionCheck) {
        victoryConditions = [{
            type: 'function_return_test',
            description: 'ผ่าน Test Cases ทั้งหมด'
        }];
    }

    // 2. Build Fresh State for Verification
    const currentGlobalState = getCurrentGameState();
    const freshState = {
        ...currentGlobalState,
        testCaseResult: testCaseResult // Use the local variable directly!
    };



    // 3. Check Victory
    const victoryResult = checkVictoryConditions(victoryConditions, currentLevel, freshState);
    const levelCompleted = victoryResult.completed;
    const completionMessage = victoryResult.message;



    // 4. Handle Outcome
    if (!levelCompleted) {
        handleFailure({
            victoryResult,
            currentLevel,
            gameStartTime,
            setters: {
                setCurrentHint,
                setIsGameOver,
                setGameState,
                setIsRunning,
                // setTimeSpent,
                setGameResult,
                setFinalScore,
                setShowProgressModal
            },
            isPreview
        });
    } else {
        await handleSuccess({
            currentLevel,
            isTrainSchedule,
            completionMessage,
            hintData,
            goodPatterns,
            hintOpenCount,
            userBigO,
            testCaseResult,
            patternId,
            onUnlockPattern,
            onUnlockLevel,
            setters: {
                setIsCompleted,
                setGameState,
                setFinalScore,
                setCurrentHint,
                // setTimeSpent,
                setShowProgressModal,
                setIsRunning,
                setGameResult
            },
            gameStartTime,
            isPreview
        });
    }

    return { levelCompleted, completionMessage };
};

/**
 * Handles the failure outcome (Game Over or just hint update)
 */
const handleFailure = async ({
    victoryResult,
    currentLevel,
    gameStartTime,
    setters,
    isPreview
}) => {
    const {
        setCurrentHint,
        setIsGameOver,
        setGameState,
        setIsRunning,
        setGameResult,
        setFinalScore,
        setShowProgressModal
    } = setters;

    // Show hint for failed conditions
    const hintMessage = generateVictoryHint(victoryResult.failedConditions, currentLevel);
    if (hintMessage) {
        setCurrentHint(hintMessage);
    }

    // Check if Game Over (HP <= 0 or puzzle failure)
    const currentState = getCurrentGameState();
    if (getPlayerHp() > 0 && !currentState.isGameOver) {
        setIsGameOver(true);
        setGameState("gameOver");
        setGameResult('gameover');
        setFinalScore({ totalScore: 0, stars: 0, pattern_bonus_score: 0 });

        // Show game over screen + combat sequence
        const scene = getCurrentGameState().currentScene;
        if (scene) {
            const isCinematicLevel = !currentLevel.nodes || currentLevel.nodes.length === 0;
            if (isCinematicLevel) {
                playCombatSequence(scene, false, () => {
                    showGameOver(scene);
                });
            } else {
                showGameOver(scene);
                // Delay before showing progress modal for node levels
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        // Show progress modal (only in normal mode)
        if (!isPreview) {
            setShowProgressModal(true);
        }

        setIsRunning(false);
        setCurrentHint("❌ ไม่ผ่านเงื่อนไขการผ่านด่าน");
        return;
    }
};

/**
 * Handles the success outcome (Level Complete)
 */
const handleSuccess = async ({
    currentLevel,
    isTrainSchedule,
    completionMessage,
    hintData,
    goodPatterns,
    hintOpenCount,
    userBigO,
    testCaseResult,
    patternId,
    onUnlockPattern,
    onUnlockLevel,
    setters,
    gameStartTime,
    isPreview
}) => {
    const {
        setIsCompleted,
        setGameState,
        setFinalScore,
        setCurrentHint,
        // setTimeSpent,
        setShowProgressModal,
        setIsRunning,
        setGameResult
    } = setters;

    await finalizeTablesBeforeVictory(currentLevel, isTrainSchedule);

    // Victory Animation (timing is handled inside playVictorySequence)
    let currentScene = getCurrentGameState().currentScene;
    await playVictorySequence(currentLevel, currentScene);

    // Update State
    setIsCompleted(true);
    setGameState("completed");

    // Scoring
    const execFinalState = getCurrentGameState();
    const scoreData = calculateLevelScore(
        execFinalState,
        currentLevel,
        hintData,
        goodPatterns,
        hintOpenCount,
        userBigO,
        testCaseResult
    );
    setFinalScore(scoreData);

    const weaponInfo = execFinalState.weaponData;
    if (completionMessage) {
        setCurrentHint(`${completionMessage} (${weaponInfo?.name || ''}) - คะแนน: ${scoreData.totalScore} ⭐${scoreData.stars}`);
    }


    setGameResult('victory');

    // In preview mode, unlock pattern and level
    if (isPreview) {
        // [New Logic] Only unlock the *specific* pattern we are previewing if the user
        // ACTUALLY used that pattern to win.
        const matchedPattern = hintData?.bestPattern;

        if (patternId && onUnlockPattern) {
            // Check if the USED pattern matches the PREVIEWED pattern AND is a 100% match
            const isExactMatch = matchedPattern &&
                String(matchedPattern.pattern_id) === String(patternId) &&
                hintData?.patternPercentage === 100;

            if (isExactMatch) {
                await onUnlockPattern(patternId);
            }
        } else if (onUnlockPattern && matchedPattern && hintData?.patternPercentage === 100) {
            // Fallback: If no specific patternId was passed pattern (100% match only)
            await onUnlockPattern(matchedPattern.pattern_id);
        }

        if (onUnlockLevel && currentLevel) {
            await onUnlockLevel(currentLevel.level_id);
        }
    } else {
        setShowProgressModal(true);
    }
    setIsRunning(false);
};
