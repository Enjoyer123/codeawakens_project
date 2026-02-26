import {
    checkVictoryConditions,
    generateVictoryHint,
    getCurrentGameState,
    getPlayerHp
} from '../game';
import {
    showGameOver,
    showVictory
} from '../../effects/gameEffects';
import { updatePlayer } from '../../phaser/player/phaserGamePlayer';
import { resetEnemy } from '../../combat/enemyUtils';
import {
    finalizeTablesBeforeVictory,
    calculateLevelScore
} from './executionScoring';
import { playVictorySequence } from '../../effects/executionAnimations';

/**
 * Handles the logic for checking victory conditions and processing the level outcome.
 * This includes showing victory/game over screens, playing animations, and calculating scores.
 * 
 * @param {Object} params - Parameters for handling level completion
 */
export const handleLevelCompletion = async ({
    currentLevel,
    testCaseResult,
    isPreview,
    gameStartTime,
    hintData,
    goodPatterns,
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
    // 1. Check Victory
    const victoryConditions = currentLevel.victoryConditions;

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
                setGameResult,
                setFinalScore,
                setShowProgressModal
            },
            isPreview
        });
    } else {
        await handleSuccess({
            currentLevel,
            completionMessage,
            hintData,
            goodPatterns,
            userBigO,
            patternId,
            onUnlockPattern,
            onUnlockLevel,
            setters: {
                setIsCompleted,
                setGameState,
                setFinalScore,
                setCurrentHint,
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
    completionMessage,
    hintData,
    goodPatterns,
    userBigO,
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
        setShowProgressModal,
        setIsRunning,
        setGameResult
    } = setters;

    await finalizeTablesBeforeVictory(currentLevel);

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
        userBigO
    );
    setFinalScore(scoreData);

    const weaponInfo = execFinalState.weaponData;
    if (completionMessage) {
        setCurrentHint(`${completionMessage} (${weaponInfo?.name || ''}) - คะแนน: ${scoreData.totalScore} ⭐${scoreData.stars}`);
    }


    setGameResult('victory');

    // In preview mode, unlock pattern and level
    if (isPreview) {
        const matchedPattern = hintData?.bestPattern;

        if (patternId && onUnlockPattern) {
            const isExactMatch = matchedPattern &&
                String(matchedPattern.pattern_id) === String(patternId) &&
                hintData?.patternPercentage === 100;

            if (isExactMatch) {
                await onUnlockPattern(patternId);
            }
        } else if (onUnlockPattern && matchedPattern && hintData?.patternPercentage === 100) {
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
