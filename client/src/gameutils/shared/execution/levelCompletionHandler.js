import {
    checkVictoryConditions,
    generateVictoryHint,
} from '../game/victoryUtils';
import {
    getCurrentGameState,
    getPlayerHp
} from '../game/gameState';
import {
    showGameOver,
} from '../../effects/gameEffects';

import { playCombatSequence } from '../../combat/battleAnimation';
import {
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
    patternData,
    goodPatterns,
    userBigO,
    patternId,
    onUnlockPattern,
    onUnlockLevel,
    setters: {

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
            setters: {
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
            patternData,
            goodPatterns,
            userBigO,
            patternId,
            onUnlockPattern,
            onUnlockLevel,
            setters: {
                setIsCompleted,
                setGameState,
                setFinalScore,
                setShowProgressModal,
                setIsRunning,
                setGameResult
            },
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
    setters,
    isPreview
}) => {
    const {
        setIsGameOver,
        setGameState,
        setIsRunning,
        setGameResult,
        setFinalScore,
        setShowProgressModal
    } = setters;

    // Show hint for failed conditions
    const hintMessage = generateVictoryHint(victoryResult.failedConditions, currentLevel);


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

        return;
    }
};

/**
 * Handles the success outcome (Level Complete)
 */
const handleSuccess = async ({
    currentLevel,
    completionMessage,
    patternData,
    goodPatterns,
    userBigO,
    patternId,
    onUnlockPattern,
    onUnlockLevel,
    setters,
    isPreview
}) => {
    const {
        setIsCompleted,
        setGameState,
        setFinalScore,
        setShowProgressModal,
        setIsRunning,
        setGameResult
    } = setters;

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
        patternData,
        goodPatterns,
        userBigO
    );
    setFinalScore(scoreData);


    setGameResult('victory');

    // In preview mode, unlock pattern and level
    if (isPreview) {
        const matchedPattern = patternData?.bestPattern;
        const isPerfectMatch = patternData?.patternPercentage === 100;

        if (isPerfectMatch) {
            let patternUnlocked = false;

            // Unlock specific pattern if provided and matched
            if (patternId && onUnlockPattern) {
                const isExactMatch = matchedPattern && String(matchedPattern.pattern_id) === String(patternId);
                if (isExactMatch) {
                    await onUnlockPattern(patternId);
                    patternUnlocked = true;
                }
            }
            // Otherwise unlock whatever 100% pattern was matched
            else if (onUnlockPattern && matchedPattern) {
                await onUnlockPattern(matchedPattern.pattern_id);
                patternUnlocked = true;
            }

            // Only unlock the level if a pattern was successfully validated at 100%
            // and the level is not already published/unlocked
            if (patternUnlocked && onUnlockLevel && currentLevel && !currentLevel.is_unlocked) {
                await onUnlockLevel(currentLevel.level_id);
            }
        }

    } else {
        setShowProgressModal(true);
    }
    setIsRunning(false);
};
