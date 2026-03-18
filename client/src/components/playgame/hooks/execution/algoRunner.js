/**
 * Algo level execution path.
 * Execute → Test → Score → Save → Animate → Complete
 */

import * as Blockly from 'blockly/core';
import { getCurrentGameState } from '@/gameutils/shared/game/gameState';
import { extractFunctionName } from '@/gameutils/algo/codeParser';
import { executeAlgoCode } from '@/gameutils/algo/algoExecutor';
import { checkAlgoTestCases } from '@/gameutils/algo/algoTestRunner';
import { playAlgoAnimation } from '@/gameutils/algo/algoPlayback';
import { detectAlgoType } from '@/gameutils/shared/levelType';
import { calculateLevelScore } from '@/gameutils/shared/execution/executionScoring';
import { resetGameExecutionState } from '@/gameutils/shared/execution/executionReset';
import { handleLevelCompletion } from '@/gameutils/shared/execution/levelCompletionHandler';
import { saveUserProgress } from '@/services/profileService';
import { mapRuntimeErrorToMessage } from './codeValidator';

/**
 * Run the Algo execution path.
 * @param {string} code - Generated code from Blockly
 * @param {Object} params - All required params
 */
export async function runAlgoPath(code, {
    workspaceRef,
    currentLevel,
    isPreview,
    getToken,
    textCode,
    scoring,
    setters,
    patternId,
    onUnlockPattern,
    onUnlockLevel,
    setExecutionError
}) {
    const { patternData, goodPatterns, userBigO } = scoring;
    const {
        setIsRunning, setGameState, setFinalScore,
        setGameResult, setIsCompleted, setTestCaseResult,
        setPlayerHp, setPlayerNodeId, setPlayerDirection,
        setIsGameOver, setShowProgressModal
    } = setters;

    await new Promise(r => setTimeout(r, 300));

    // Phase 1: Execute pure logic (no visuals)
    const { result, trace, error } = await executeAlgoCode(code, currentLevel);

    if (error) {
        const friendlyMsg = mapRuntimeErrorToMessage(error);
        setExecutionError({ title: 'เกิดข้อผิดพลาดขณะทำงาน', message: friendlyMsg });
        setGameState('ready');
        setIsRunning(false);
        return;
    }

    // Phase 2: Check test cases
    const functionName = extractFunctionName(code);
    const testCaseResult = await checkAlgoTestCases(
        result, currentLevel.test_cases || [], functionName, code, currentLevel
    );

    if (setTestCaseResult) setTestCaseResult(testCaseResult);


    // Phase 3: If all tests pass → Score + Save immediately (before animation)
    if (testCaseResult.passed && testCaseResult.failedTests.length === 0) {

        // 3a. Calculate score
        const execState = getCurrentGameState();
        const scoreData = calculateLevelScore(execState, currentLevel, patternData, goodPatterns, userBigO);
        setFinalScore(scoreData);
        setGameResult('victory');
        setIsCompleted(true);

        // 3b. Save progress early (before animation) — if user leaves during
        //     animation, progress is already saved. Uses profileService directly
        //     because this fires before control returns to useCodeExecution.
        if (!isPreview && getToken) {
            let blocklyXml = null;
            try {
                if (workspaceRef.current) {
                    blocklyXml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspaceRef.current));
                }
            } catch (e) { /* ignore */ }

            saveUserProgress(getToken, {
                level_id: currentLevel.level_id,
                status: 'completed',
                blockly_code: blocklyXml,
                text_code: currentLevel?.textcode ? (textCode || '') : null,
                best_score: scoreData.totalScore ?? 60,
                pattern_bonus_score: scoreData.pattern_bonus_score || 0,
                is_correct: true,
                stars_earned: scoreData.stars ?? 3,
                hp_remaining: execState.playerHp ?? 100,
            }).catch(err => console.warn('⚠️ [Early Save] Failed:', err.message));
        }

        // Phase 4: Animation (optional — save already done)
        const scene = getCurrentGameState().currentScene;
        const algoType = detectAlgoType(currentLevel);

        if (Array.isArray(result) && result.length > 0 && ['DFS', 'BFS', 'DIJKSTRA'].includes(algoType)) {
            trace.push({ action: 'move_along_path', path: [...result] });
        }

        if (scene && trace.length > 0) {


            await resetGameExecutionState({
                setPlayerHp,
                setPlayerNodeId,
                setPlayerDirection,
                currentLevel
            });

            try {
                await playAlgoAnimation(scene, algoType, trace, { result });
            } catch (animError) {
                console.warn('⚠️ [Algo Animation] Interrupted:', animError.message);
            }
        }
    }

    // Phase 5: Handle level completion (victory modal / failure state)
    await handleLevelCompletion({
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
            setIsGameOver, setGameState, setIsRunning,
            setGameResult, setFinalScore, setShowProgressModal, setIsCompleted
        }
    });
}
