/**
 * Legacy level execution path (simple move/turn/hit levels).
 * Build context → Execute user code → Handle completion
 */


import { buildExecutionContext } from '@/gameutils/shared/execution/executionContextBuilder';
import { handleLevelCompletion } from '@/gameutils/shared/execution/levelCompletionHandler';
import { createGraphMap, createExecutionWrappers } from '@/gameutils/shared/execution/executionHelpers';
import { resetGameExecutionState } from '@/gameutils/shared/execution/executionReset';
import { mapRuntimeErrorToMessage } from './codeValidator';

const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;

/** Wraps user code with safety flags and a return statement */
function prepareExecutableCode(code, varName) {
    return `
        // Safety: visual runs MUST yield
        if (typeof globalThis !== 'undefined') { globalThis.__isVisualRun = true; }
        // Safety: Reset step counter
        if (typeof globalThis !== 'undefined') { globalThis.__stepCount = 0; }
        
        ${code}
        try { return ${varName}; } catch(e) { return undefined; }
    `;
}

/**
 * Run the Legacy execution path.
 * @param {string} code - Generated code from Blockly
 * @param {Object} params - All required params
 */
export async function runLegacyPath(code, {
    currentLevel,
    gameActions,
    isPreview,
    scoring,
    setters,
    patternId,
    onUnlockPattern,
    onUnlockLevel,
    setExecutionError
}) {
    const { patternData, goodPatterns, userBigO } = scoring;
    const {
        setIsRunning, setGameState,
        setPlayerHp, setPlayerNodeId, setPlayerDirection,
        setIsGameOver, setGameResult, setFinalScore,
        setShowProgressModal, setIsCompleted
    } = setters;

    // 1. Reset game state
    await resetGameExecutionState({
        setPlayerHp,
        setPlayerNodeId,
        setPlayerDirection,
        currentLevel
    });

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

    const finalExecutableCode = prepareExecutableCode(sanitizedCode, 'result');

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

    // 6. Show error if execution failed and level not completed
    if (executionErrorLocal && !levelCompleted) {
        setGameState('ready');
        const friendlyMessage = mapRuntimeErrorToMessage(executionErrorLocal);
        setExecutionError({ title: 'เกิดข้อผิดพลาดขณะทำงาน', message: friendlyMessage });
        setIsRunning(false);
    }
}
