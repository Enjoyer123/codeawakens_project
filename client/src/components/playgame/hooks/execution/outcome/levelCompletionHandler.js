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
        setTimeSpent,
        setGameResult,
        setFinalScore,
        setShowProgressModal,
        setIsCompleted
    }
}) => {
    // 1. Prepare Victory Conditions
    console.log("🔍 CHECKING VICTORY CONDITIONS");
    console.log("🔍 Current Level ID:", currentLevel.id);
    console.log("🔍 Victory Conditions (Original):", currentLevel.victoryConditions);

    // Polyfill victory conditions for Rope Partition if missing (Critical Fix)
    let victoryConditions = currentLevel.victoryConditions;

    if ((!victoryConditions || victoryConditions.length === 0) && isRopePartitionCheck) {
        victoryConditions = [{
            type: 'function_return_test',
            description: 'ผ่าน Test Cases ทั้งหมด'
        }];
        console.log("🔍 ⚠️ Polyfilled Victory Conditions for Rope Partition:", victoryConditions);
    }

    // 2. Build Fresh State for Verification
    const currentGlobalState = getCurrentGameState();
    const freshState = {
        ...currentGlobalState,
        testCaseResult: testCaseResult // Use the local variable directly!
    };

    console.log("🔍 State for victory check:", freshState);

    // 3. Check Victory
    const victoryResult = checkVictoryConditions(victoryConditions, currentLevel, freshState);
    const levelCompleted = victoryResult.completed;
    const completionMessage = victoryResult.message;

    console.log("🔍 VICTORY RESULT:", victoryResult);

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
                setTimeSpent,
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
                setTimeSpent,
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
        setTimeSpent,
        setGameResult,
        setFinalScore,
        setShowProgressModal
    } = setters;

    // Show hint for failed conditions
    const hintMessage = generateVictoryHint(victoryResult.failedConditions, currentLevel);
    if (hintMessage) {
        setCurrentHint(hintMessage);
    }

    // Check if Game Over (HP <= 0 or other conditions if any, though here we rely on HP check usually happening elsewhere, 
    // but the original code checked HP>0 to triggers logic if NOT dead? Wait, original code:
    // if (getPlayerHp() > 0 && !currentState.isGameOver) { game over logic } -> This means if you FAILED conditions but are ALIVE, it's a Logic Game Over?
    // Yes, for puzzle failure.

    const currentState = getCurrentGameState();
    if (getPlayerHp() > 0 && !currentState.isGameOver) {
        console.log("Code execution completed but victory conditions not met - Game Over");

        setIsGameOver(true);
        setGameState("gameOver");
        setIsRunning(false);

        // Calculate time spent
        if (gameStartTime.current) {
            const endTime = Date.now();
            setTimeSpent(Math.floor((endTime - gameStartTime.current) / 1000));
        }

        setGameResult('gameover');

        // Set final score to 0
        setFinalScore({ totalScore: 0, stars: 0, pattern_bonus_score: 0 });

        // Show game over screen
        const currentState = getCurrentGameState();
        // Start combat sequence before showing game over
        const scene = currentState.currentScene;
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
        setTimeSpent,
        setShowProgressModal,
        setIsRunning,
        setGameResult
    } = setters;

    await finalizeTablesBeforeVictory(currentLevel, isTrainSchedule);

    // Victory Animation
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

    if (gameStartTime?.current) {
        const endTime = Date.now();
        setTimeSpent(Math.floor((endTime - gameStartTime.current) / 1000));
    }
    setGameResult('victory');

    // In preview mode, unlock pattern and level
    if (isPreview) {
        // Use patternId from props (the pattern being tested)
        if (patternId && onUnlockPattern) {
            await onUnlockPattern(patternId);
        } else if (onUnlockPattern) {
            // Fallback: find matched pattern if patternId not provided
            const matchedPattern = goodPatterns.find(p => p.pattern_id === patternId) || goodPatterns[0];
            if (matchedPattern) {
                await onUnlockPattern(matchedPattern.pattern_id);
            }
        }
        if (onUnlockLevel && currentLevel) {
            await onUnlockLevel(currentLevel.level_id);
        }
    } else {
        setShowProgressModal(true);
    }
    setIsRunning(false);
};
