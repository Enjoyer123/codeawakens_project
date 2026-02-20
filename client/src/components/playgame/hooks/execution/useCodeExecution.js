import { generateAndInstrumentCode, prepareExecutableCode } from './analysis/executionCodeGeneration';
import { detectAlgorithmFlags } from './analysis/algorithmDetector';
import { handlePostExecutionVisuals } from './outcome/executionResultProcessing';
import { getCurrentGameState } from '../../../../gameutils/shared/game';
import { useState } from 'react';
import { validateWorkspace, mapRuntimeErrorToMessage } from '../../../../gameutils/shared/codeValidator';
import { extractFunctionName } from '../../../../gameutils/shared/testcase';
import { buildExecutionContext } from './core/executionContextBuilder';
import * as TestHandler from './core/testExecutionHandler';
import { handleLevelCompletion } from './outcome/levelCompletionHandler';
import { resetGameExecutionState, setupEmeiApi } from './utils/executionReset';
import { createGraphMap, buildEmeiParams, createExecutionWrappers } from './utils/executionHelpers';
import {
    resetKnapsackSelectionTracking, startKnapsackSelectionTracking
} from '../../../../gameutils/blockly/algorithms/knapsack/visuals';

const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;

/**
 * Hook for code execution
 * @param {Object} params - Parameters object
 * @param {Object} params.gameActions - Movement/sensor functions { moveForward, turnLeft, ... }
 * @param {Object} params.setters - React state setters { setPlayerNodeId, setIsRunning, ... }
 * @param {Object} params.scoring - Scoring data { goodPatterns, hintOpenCount, userBigO, hintData }
 * @returns {{ runCode: Function, executionError: Object|null, clearExecutionError: Function }}
 */
export function useCodeExecution({
    workspaceRef,
    currentLevel,
    blocklyJavaScriptReady,
    codeValidation,
    isPreview,
    patternId,
    onUnlockPattern,
    onUnlockLevel,
    gameStartTime,
    gameActions,
    setters,
    scoring
}) {
    // Destructure groups for use inside runCode
    const {
        moveForward, turnLeft, turnRight, hit,
        foundMonster, canMoveForward, nearPit, atGoal
    } = gameActions;

    const {
        setPlayerNodeId, setPlayerDirection, setPlayerHp,
        setIsCompleted, setIsRunning, setIsGameOver,
        setGameState, setCurrentHint, setShowProgressModal,
        setGameResult, setFinalScore, setRescuedPeople,
        setHintData, setTestCaseResult
    } = setters;

    const { goodPatterns, hintOpenCount, userBigO, hintData } = scoring;
    const [executionError, setExecutionError] = useState(null);

    const runCode = async () => {
        // Check if system is ready (Phaser scene OR React-based level)
        // For React-based levels (like train_schedule), we don't need a Phaser scene
        const isRopePartition = currentLevel?.gameType === 'rope_partition' || currentLevel?.appliedData?.type === 'BACKTRACKING_ROPE_PARTITION';
        const isReactLevel = currentLevel?.gameType === 'train_schedule' ||
            currentLevel?.appliedData?.type === 'GREEDY_TRAIN_SCHEDULE' || isRopePartition;

        // Block Validation
        if (!currentLevel?.textcode && workspaceRef.current) {
            const validation = validateWorkspace(workspaceRef.current);
            if (!validation.isValid) {
                setExecutionError({
                    title: "พบข้อผิดพลาดในบล็อกคำสั่ง",
                    message: validation.error
                });
                return;
            }
        }

        if (!workspaceRef.current || (!getCurrentGameState().currentScene && !isReactLevel)) {
            setCurrentHint("⚠️ ระบบไม่พร้อมใช้งาน");
            return;
        }

        if (currentLevel?.textcode && !blocklyJavaScriptReady) {
            setCurrentHint("⚠️ กรุณารอระบบโหลดสักครู่...");
            return;
        }

        if (currentLevel?.textcode && !codeValidation.isValid) {
            setCurrentHint(`⚠️ ${codeValidation.message}`);
            return;
        }

        setIsRunning(true);
        setGameState("running");
        setIsCompleted(false);
        setIsGameOver(false);
        setCurrentHint("🚀 กำลังเริ่มทำงาน...");

        try {
            // Clear previous test results
            if (setTestCaseResult) {
                setTestCaseResult(null);
            }

            // 1. Reset Game State

            setupEmeiApi(currentLevel);

            await resetGameExecutionState({
                gameStartTime,
                // setAttempts,
                setPlayerHp,
                setRescuedPeople,
                setPlayerNodeId,
                setPlayerDirection,
                currentLevel
            });

            // [Flow B] 1. Generate Code
            // Blockly แปลงบล็อกเป็น JavaScript String ผ่าน javascriptGenerator.workspaceToCode
            let code = await generateAndInstrumentCode(workspaceRef, currentLevel);

            if (!code.trim()) {
                setCurrentHint("❌ ไม่พบ Blocks! กรุณาลาก Blocks จาก Toolbox");
                setGameState("ready");
                setIsRunning(false);
                return;
            }



            setCurrentHint("⚙️ กำลังประมวลผล...");
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Detect algorithm flags (before AsyncFunction creation)
            const {
                isCoinChange,
                isSubsetSum,
                isKnapsack,
                isNQueen,
                isTrainSchedule,
                isEmei,
                isRopePartition
            } = detectAlgorithmFlags(code, currentLevel);

            const varName = 'result';



            let testCaseResult = null;

            try {
                const map = createGraphMap(currentLevel?.nodes || [], currentLevel?.edges || []);
                const all_nodes = (currentLevel?.nodes || []).map(node => node.id);
                const maxCapacityParams = isEmei ? buildEmeiParams(currentLevel) : { n: 0, edges: [], start: 0, end: 0, tourists: 0 };

                // SANITIZE: Avoid duplicate-declaration SyntaxErrors for `listItems`
                if ((code.match(/\b(?:const|let)\s+listItems\b/g) || []).length > 1) {
                    code = code.replace(/\b(?:const|let)\s+listItems\b/g, 'var listItems');
                }


                const { wrappedMoveToNode, wrappedMoveAlongPath, timeoutPromise } = createExecutionWrappers();

                // [Flow B] 2. Prepare Context & Code                // Prepare context for execution (all API functions and variables)
                // [Flow B] 4. Visual Feedback (Injection)
                // Inject Functions (เช่น moveForward, turnLeft) เข้าไปใน Scope
                // ฟังก์ชัน moveForward ในโค้ด จะไปเรียก Phaser ให้เล่น Animation เดิน
                const context = buildExecutionContext({
                    map,
                    all_nodes,
                    gameActions: {
                        moveForward, turnLeft, turnRight, hit, foundMonster,
                        canMoveForward, nearPit, atGoal
                    },
                    wrappers: {
                        wrappedMoveToNode,
                        wrappedMoveAlongPath
                    },
                    currentLevel,
                    emeiParams: isEmei ? maxCapacityParams : undefined
                });

                const finalExecutableCode = (isEmei ? "globalThis.__useZeroBasedIndexing = true;\n" : "") +
                    prepareExecutableCode(code, { varName, isNQueen, isTrainSchedule }, currentLevel);

                // Execute code ONCE with return capture
                let functionReturnValue = null;
                let executionErrorLocal = null;

                try {
                    // Initialize knapsack selection tracking before execution
                    if (isKnapsack) {
                        resetKnapsackSelectionTracking();
                        startKnapsackSelectionTracking();
                    }

                    // [Flow B] 3. Execute code via AsyncFunction
                    const argNames = Object.keys(context);
                    const argValues = argNames.map(name => context[name]);
                    const executionFn = new AsyncFunction(...argNames, '"use strict";\n' + finalExecutableCode);
                    functionReturnValue = await Promise.race([executionFn(...argValues), timeoutPromise]);

                    await handlePostExecutionVisuals(functionReturnValue, isNQueen);

                    const functionName = extractFunctionName(code);

                    testCaseResult = await TestHandler.executeTestCases({
                        functionReturnValue,
                        currentLevel,
                        functionName,
                        code,
                        map,
                        all_nodes,
                        setTestCaseResult,
                        setCurrentHint,
                        setHintData,
                        isTrainSchedule
                    });

                } catch (error) {
                    executionErrorLocal = error;
                    console.error('🔴 [useCodeExecution] Runtime error during execution:', error.message, error);
                    // Re-throw timeout/infinite loop errors for user-facing popup
                    if (error.message && (
                        error.message.includes("timeout") ||
                        error.message.includes("infinite loop") ||
                        error.message.includes("Too many executions")
                    )) {
                        // We still want to handle level completion (e.g. failure) so we don't throw here
                        // just mark it
                    } else {
                        // Other runtime errors
                        functionReturnValue = undefined;
                    }
                }

                // Unified Level Completion Handling
                const { levelCompleted } = await handleLevelCompletion({
                    currentLevel,
                    testCaseResult,
                    isTrainSchedule,
                    isRopePartitionCheck: currentLevel.gameType === 'rope_partition' || currentLevel.appliedData?.type === 'BACKTRACKING_ROPE_PARTITION',
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
                });

                // Error Handling (if not completed)
                if (executionErrorLocal && !levelCompleted) {
                    setGameState("ready");
                    console.error("Execution error:", executionErrorLocal);
                    const friendlyMessage = mapRuntimeErrorToMessage(executionErrorLocal);

                    if (executionErrorLocal.message && (executionErrorLocal.message.includes("infinite loop") || executionErrorLocal.message.includes("timeout"))) {
                        setCurrentHint("❌ พบ Infinite Loop - โปรแกรมทำงานนานเกินไป");
                    } else {
                        setCurrentHint(`❌ ${friendlyMessage}`);
                    }

                    setExecutionError({
                        title: "เกิดข้อผิดพลาดขณะทำงาน",
                        message: friendlyMessage
                    });
                    setIsRunning(false);
                }

            } catch (completionError) {
                console.error("Completion Error:", completionError);
                setExecutionError({ title: "Completion Error", message: completionError.message });
                setIsRunning(false);
            }

        } finally {
            setIsRunning(false);
        }
    };

    return {
        runCode,
        executionError,
        clearExecutionError: () => setExecutionError(null)
    };
}
