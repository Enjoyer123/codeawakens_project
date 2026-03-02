/**
 * Legacy level execution path (simple move/turn/hit levels).
 * Build context → Execute user code → Handle completion
 */

import { prepareExecutableCode } from '@/gameutils/blockly/core/executionCodeGeneration';
import { buildExecutionContext } from '@/gameutils/shared/execution/executionContextBuilder';
import { handleLevelCompletion } from '@/gameutils/shared/execution/levelCompletionHandler';
import { createGraphMap, createExecutionWrappers } from '@/gameutils/shared/execution/executionHelpers';
import { resetGameExecutionState } from '@/gameutils/shared/execution/executionReset';
import { mapRuntimeErrorToMessage } from './codeValidator';

const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;

/**
 * Run the Legacy execution path.
 * @param {string} code - Generated code from Blockly
 * @param {Object} params - All required params
 */
export async function runLegacyPath(code, {
    currentLevel,
    gameActions,
    isPreview,
    gameStartTime,
    scoring,
    setters,
    patternId,
    onUnlockPattern,
    onUnlockLevel,
    setExecutionError
}) {
    const { hintData, goodPatterns, userBigO } = scoring;
    const {
        setCurrentHint, setIsRunning, setGameState,
        setPlayerHp, setPlayerNodeId, setPlayerDirection,
        setIsGameOver, setGameResult, setFinalScore,
        setShowProgressModal, setIsCompleted
    } = setters;

    // 1. Reset game state
    await resetGameExecutionState({
        gameStartTime,
        setPlayerHp,
        setPlayerNodeId,
        setPlayerDirection,
        currentLevel
    });

    setCurrentHint('⚙️ กำลังประมวลผล...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Sanitize code (fix duplicate declarations)
    let sanitizedCode = code;
    if ((sanitizedCode.match(/\b(?:const|let)\s+listItems\b/g) || []).length > 1) {
        sanitizedCode = sanitizedCode.replace(/\b(?:const|let)\s+listItems\b/g, 'var listItems');
    }

    // 3. Build execution context
    const map = createGraphMap(currentLevel?.nodes || [], currentLevel?.edges || []);
    const all_nodes = (currentLevel?.nodes || []).map(node => node.id);
    const { wrappedMoveToNode, wrappedMoveAlongPath, timeoutPromise } = createExecutionWrappers();

    const context = buildExecutionContext({
        map,
        all_nodes,
        gameActions,
        wrappers: { wrappedMoveToNode, wrappedMoveAlongPath },
        currentLevel
    });

    const varName = 'result';
    const finalExecutableCode = prepareExecutableCode(sanitizedCode, { varName }, currentLevel);

    // 4. Execute code
    let executionErrorLocal = null;

    try {
        const argNames = Object.keys(context);
        const argValues = argNames.map(name => context[name]);
        const executionFn = new AsyncFunction(...argNames, '"use strict";\n' + finalExecutableCode);
        await Promise.race([executionFn(...argValues), timeoutPromise]);
    } catch (error) {
        executionErrorLocal = error;
        console.error('🔴 [Legacy] Runtime error:', error.message);
    }

    // 5. Handle level completion
    const { levelCompleted } = await handleLevelCompletion({
        currentLevel,
        testCaseResult: null,
        isPreview,
        gameStartTime,
        hintData,
        goodPatterns,
        userBigO,
        patternId,
        onUnlockPattern,
        onUnlockLevel,
        setters: {
            setCurrentHint, setIsGameOver, setGameState, setIsRunning,
            setGameResult, setFinalScore, setShowProgressModal, setIsCompleted
        }
    });

    // 6. Show error if execution failed and level not completed
    if (executionErrorLocal && !levelCompleted) {
        setGameState('ready');
        const friendlyMessage = mapRuntimeErrorToMessage(executionErrorLocal);

        if (executionErrorLocal.message?.includes('infinite loop') || executionErrorLocal.message?.includes('timeout')) {
            setCurrentHint('❌ พบ Infinite Loop - โปรแกรมทำงานนานเกินไป');
        } else {
            setCurrentHint(`❌ ${friendlyMessage}`);
        }

        setExecutionError({ title: 'เกิดข้อผิดพลาดขณะทำงาน', message: friendlyMessage });
        setIsRunning(false);
    }
}
