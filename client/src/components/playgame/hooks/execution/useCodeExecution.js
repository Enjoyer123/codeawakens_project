import {
    applyAntDpPatches
} from './analysis/executionInstrumentation';
import { initializeLevelState } from './analysis/executionStateInit';

import { generateAndInstrumentCode } from './analysis/executionCodeGeneration';
import { detectResultVariableName } from './analysis/executionVariableDetection';
import { prepareExecutableCode, installRuntimeInterceptors } from './core/executionCodePreparation';
import { cleanupGlobalOverrides, normalizeExecutionResult, handlePostExecutionVisuals } from './outcome/executionResultProcessing';
import { executeUserCode } from './core/executionRunner';
import {
    getCurrentGameState,
    getPlayerHp
} from '../../../../gameutils/shared/game';
import { useState } from 'react';
import { validateWorkspace, mapRuntimeErrorToMessage } from '../../../../gameutils/shared/codeValidator';

import { extractFunctionName } from '../../../../gameutils/shared/testcase';


import {
    moveToNode, moveAlongPath,

} from '../../../../gameutils/blockly';


import { buildExecutionContext } from './core/executionContextBuilder';
import * as TestHandler from './core/testExecutionHandler';
import { handleLevelCompletion } from './outcome/levelCompletionHandler';

console.log('TestHandler import:', TestHandler);
console.log('executeTestCases from namespace:', TestHandler.executeTestCases);

/**
 * Hook for code execution
 * @param {Object} params - Parameters object
 * @returns {Function} runCode function
 */
export function useCodeExecution({
    workspaceRef,
    currentLevel,
    setPlayerNodeId,
    setPlayerDirection,
    setPlayerHp,
    setIsCompleted,
    setIsRunning,
    setIsGameOver,
    setGameState,
    setCurrentHint,
    setShowProgressModal,
    setTimeSpent,
    setGameResult,
    setFinalScore,
    gameStartTime,
    setAttempts,
    setRescuedPeople,
    blocklyJavaScriptReady,
    codeValidation,
    isPreview,
    patternId,
    onUnlockPattern,
    onUnlockLevel,
    goodPatterns,
    hintOpenCount,
    moveForward,
    turnLeft,
    turnRight,
    hit,
    foundMonster,
    canMoveForward,
    nearPit,
    atGoal,
    setHintData,
    setTestCaseResult,
    userBigO, // Added for Big O scoring
    hintData  // Added for Big O scoring
}) {
    const [executionError, setExecutionError] = useState(null);

    const runCode = async () => {
        console.log("runCode function called!");
        console.log("workspaceRef.current:", !!workspaceRef.current);
        console.log("getCurrentGameState().currentScene:", !!getCurrentGameState().currentScene);

        // Check if system is ready (Phaser scene OR React-based level)
        // For React-based levels (like train_schedule), we don't need a Phaser scene
        const isRopePartition = currentLevel?.gameType === 'rope_partition' || currentLevel?.appliedData?.type === 'BACKTRACKING_ROPE_PARTITION';
        const isReactLevel = currentLevel?.gameType === 'train_schedule' ||
            currentLevel?.appliedData?.type === 'GREEDY_TRAIN_SCHEDULE' || isRopePartition;

        if (currentLevel?.textcode && !blocklyJavaScriptReady) {
            // ... (keep textcode checks)
        }

        // --- NEW: Block Validation ---
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
            console.log("System not ready - early return", {
                workspace: !!workspaceRef.current,
                scene: !!getCurrentGameState().currentScene,
                isReactLevel
            });
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
        setIsGameOver(false);
        setCurrentHint("🚀 กำลังเริ่มทำงาน...");

        try {
            // Clear previous test results
            if (setTestCaseResult) {
                setTestCaseResult(null);
            }

            // 1. Reset Game State using Step 1 Refactoring
            const { resetGameExecutionState, setupEmeiApi } = await import('./utils/executionReset');

            setupEmeiApi(currentLevel);

            await resetGameExecutionState({
                gameStartTime,
                setAttempts,
                setPlayerHp,
                setRescuedPeople,
                setPlayerNodeId,
                setPlayerDirection,
                currentLevel
            });

            // 2. Generate and Instrument Code (Step 7 Refactoring)
            let code = await generateAndInstrumentCode(workspaceRef, currentLevel);

            if (!code.trim()) {
                setCurrentHint("❌ ไม่พบ Blocks! กรุณาลาก Blocks จาก Toolbox");
                setGameState("ready");
                setIsRunning(false);
                return;
            }

            console.log("Generated code:", code);

            // Debug: Log full generated code for N-Queen
            if (currentLevel?.nqueenData && code.includes('async function solve')) {
                console.log('[N-Queen Debug] Full generated code:', code);

                // Extract solve function
                const solveFuncMatch = code.match(/async function solve\d*\([^)]*\)\s*\{[\s\S]*?\n\}/);
                if (solveFuncMatch) {
                    console.log('[N-Queen Debug] Solve function:', solveFuncMatch[0]);
                }
            }
            console.log("Generated code (first 1000 chars):", code.substring(0, 1000));
            console.log("Starting HP:", getPlayerHp());
            console.log("Current scene available:", !!getCurrentGameState().currentScene);
            console.log("Current game state:", getCurrentGameState());
            console.log("Knapsack data:", currentLevel?.knapsackData);

            setCurrentHint("⚙️ กำลังประมวลผล...");
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Capture return value and analyze flags EARLY (before AsyncFunction creation)
            let {
                varName,
                isCoinChange,
                isSubsetSum,
                isKnapsack,
                isNQueen,
                isTrainSchedule,
                isAntDp,
                isEmei,
                isRopePartition
            } = detectResultVariableName(code, currentLevel);

            console.log('[useCodeExecution] Variable Analysis Result:', { varName, isCoinChange, isEmei, isTrainSchedule });

            let testCaseResult = null;

            try {
                // Create graph map from level data
                const createGraphMap = (nodes, edges) => {
                    const graph = {};
                    if (!nodes || !edges) return graph;

                    // Initialize all nodes with empty arrays
                    nodes.forEach(node => {
                        graph[String(node.id)] = [];
                    });

                    // Add edges (bidirectional)
                    edges.forEach(edge => {
                        const from = String(edge.from);
                        const to = String(edge.to);
                        if (graph[from] && !graph[from].includes(Number(to))) {
                            graph[from].push(Number(to));
                        }
                        if (graph[to] && !graph[to].includes(Number(from))) {
                            graph[to].push(Number(from));
                        }
                    });

                    return graph;
                };

                const map = createGraphMap(currentLevel?.nodes || [], currentLevel?.edges || []);
                console.log("Created graph map:", map);

                // Create all_nodes array for Prim's algorithm
                const all_nodes = (currentLevel?.nodes || []).map(node => node.id);
                console.log("Created all_nodes:", all_nodes);

                // Variable detection moved before try block

                // Emei Mountain Parameters
                // isEmei is now determined by detectResultVariableName

                // Find primary test case to sync visual run parameters
                const primaryTC = currentLevel?.test_cases?.find(tc => tc.is_primary);
                const tcParams = primaryTC?.input_params ? (typeof primaryTC.input_params === 'string' ? JSON.parse(primaryTC.input_params) : primaryTC.input_params) : null;

                const maxCapacityParams = isEmei ? {
                    n: tcParams?.n || currentLevel.maxCapacityData?.nodes?.length || currentLevel.nodes?.length || 0,
                    edges: tcParams?.edges || (currentLevel.maxCapacityData?.edges || currentLevel.edges || []).map(e => [
                        e.u !== undefined ? e.u : (e.from !== undefined ? e.from : 0),
                        e.v !== undefined ? e.v : (e.to !== undefined ? e.to : 0),
                        e.weight !== undefined ? Number(e.weight) : (e.value !== undefined ? Number(e.value) : 1)
                    ]),
                    start: tcParams?.start !== undefined ? tcParams.start : (currentLevel.maxCapacityData?.start_node !== undefined ? currentLevel.maxCapacityData.start_node : (currentLevel.startNodeId || 0)),
                    end: tcParams?.end !== undefined ? tcParams.end : (currentLevel.maxCapacityData?.goal_node !== undefined ? currentLevel.maxCapacityData.goal_node : (currentLevel.goalNodeId || 6)),
                    tourists: tcParams?.tourists !== undefined ? tcParams.tourists : (currentLevel.maxCapacityData?.tourists || 99)
                } : { n: 0, edges: [], start: 0, end: 0, tourists: 0 };

                console.log("Creating AsyncFunction with code:", code);

                // SANITIZE: Avoid duplicate-declaration SyntaxErrors for `listItems`
                // Multiple Blockly-generated fragments may declare `const listItems` in injected code.
                // Convert `const|let listItems` to `var listItems` to avoid `Identifier 'listItems' has already been declared`.
                if ((code.match(/\b(?:const|let)\s+listItems\b/g) || []).length > 1) {
                    code = code.replace(/\b(?:const|let)\s+listItems\b/g, 'var listItems');
                    console.log('[useCodeExecution] Sanitized listItems declarations to `var listItems` to avoid duplicate-declare errors');
                }


                console.log("Executing function...");

                // Add timeout to prevent infinite loops - longer timeout for Dijkstra/algorithm blocks
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("Execution timeout - possible infinite loop")), 60000); // 60 seconds timeout for algorithms
                });

                // Add execution counter to detect infinite loops - higher limit for loop blocks
                let executionCount = 0;
                const maxExecutions = 5000; // Maximum number of function calls - increased for loops

                // Wrap functions to count executions
                const wrappedMoveToNode = async (nodeId) => {
                    executionCount++;
                    if (executionCount > maxExecutions) {
                        throw new Error("Too many executions - possible infinite loop");
                    }
                    return await moveToNode(nodeId);
                };

                // Wrap moveAlongPath to count executions
                const wrappedMoveAlongPath = async (path) => {
                    executionCount++;
                    if (executionCount > maxExecutions) {
                        throw new Error("Too many executions - possible infinite loop");
                    }
                    return await moveAlongPath(path);
                };



                // --- Round 12: Centralized State Initialization ---
                // Resets UI, generates init codes, and pre-instruments code (AntDP/Rope)
                const {
                    modifiedCode,
                    initCodes
                } = initializeLevelState(currentLevel, code);

                code = modifiedCode;

                // Double-check variable name by looking at actual code before creating wrapper
                // Try multiple patterns to find the actual variable assignment
                if (isCoinChange) {
                    console.log('Searching for variable assignment in Coin Change code...');
                    console.log('Code preview (last 800 chars):', code.substring(Math.max(0, code.length - 800)));

                    // Try multiple patterns - Blockly generates: variable = (await coinChange(...));
                    // Note: Blockly variables_set generator uses: variable = value;\n (no 'var' keyword)
                    // It may wrap the await expression in parentheses: result = (await coinChange(...));
                    const patterns = [
                        /(\w+)\s*=\s*\(?\s*\(?\s*await\s+coinChange\d*\s*\(/i,  // result = (await coinChange(...)) or result = await coinChange(...)
                        /(\w+)\s*=\s*await\s+coinChange\d*\s*\(/i,  // result = await coinChange(...)
                        /var\s+(\w+)\s*=\s*\(?\s*await\s+coinChange\d*\s*\(/i,  // var result = await coinChange(...)
                    ];

                    let foundVarName = null;
                    for (let i = 0; i < patterns.length; i++) {
                        const pattern = patterns[i];
                        const match = code.match(pattern);
                        if (match && match[1]) {
                            foundVarName = match[1];
                            console.log(`Found variable name using pattern ${i + 1}:`, foundVarName);
                            console.log('Matched line:', code.substring(Math.max(0, code.indexOf(match[0]) - 50), code.indexOf(match[0]) + match[0].length + 50));
                            break;
                        }
                    }

                    if (foundVarName) {
                        if (foundVarName !== varName) {
                            console.warn('Variable name mismatch! Extracted:', varName, 'but code uses:', foundVarName);
                            varName = foundVarName;
                            console.log('Updated variable name to:', varName);
                        } else {
                            console.log('Confirmed variable name from code:', varName);
                        }
                    } else {
                        console.error('Could not find variable assignment in code!');
                        console.log('Current varName:', varName);
                        console.log('Last 1000 chars of code:', code.substring(Math.max(0, code.length - 1000)));
                        // Force use 'result' as it's the most common in Coin Change example XML
                        if (varName !== 'result') {
                            console.warn('Forcing varName to "result" as fallback');
                            varName = 'result';
                        }
                    }
                }

                // Install runtime interceptors (N-Queen visual capture)
                installRuntimeInterceptors(isNQueen);

                const codeWithReturnCapture = prepareExecutableCode(code, {
                    varName,
                    isCoinChange,
                    isSubsetSum,
                    isKnapsack,
                    isNQueen,
                    isTrainSchedule,
                    isAntDp,
                    isEmei,
                    isRopePartition
                }, currentLevel, initCodes);

                console.log('[Debug Data] appliedData:', currentLevel?.appliedData);
                console.log('[Debug Data] payload trains:', currentLevel?.appliedData?.payload?.trains);



                // Prepare context for execution (all API functions and variables)
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

                const finalExecutableCode = (isEmei ? "globalThis.__useZeroBasedIndexing = true;\n" : "") + codeWithReturnCapture;

                // Execute code ONCE with return capture
                let functionReturnValue = null;
                try {
                    functionReturnValue = await executeUserCode(finalExecutableCode, context, timeoutPromise);
                    console.log("Function execution completed with return capture");


                    // Restore any globals we wrapped
                    cleanupGlobalOverrides();

                    // Normalize the return value (apply fallbacks if needed)
                    functionReturnValue = normalizeExecutionResult(functionReturnValue);

                    console.log("Function return value (normalized):", functionReturnValue);

                    // If we have a final solution (returned or from fallback), try to show it visually (so the user can see final placements)
                    await handlePostExecutionVisuals(functionReturnValue, isNQueen);
                } catch (returnError) {
                    console.warn("Could not capture return value:", returnError);

                    // CRITICAL FIX: If it's a timeout or infinite loop, we MUST re-throw it
                    // so the outer catch block can show the error popup to the user.
                    // Otherwise, the game quietly fails or continues in a broken state.
                    if (returnError.message && (
                        returnError.message.includes("timeout") ||
                        returnError.message.includes("infinite loop") ||
                        returnError.message.includes("Too many executions")
                    )) {
                        throw returnError;
                    }

                    functionReturnValue = undefined;
                    console.log("Function execution completed (with error swallowed)");
                    console.log("Function return value (fallback):", functionReturnValue);
                }

                const finalState = getCurrentGameState();
                console.log("Final state after execution:", finalState);

                // Extract function name from code
                console.log("===== EXTRACTING FUNCTION NAME =====");
                console.log("Full code length:", code.length);
                // console.log("Full code:", code);
                console.log("Code snippet (first 500 chars):", code.substring(0, 500));
                console.log("Code snippet (last 500 chars):", code.substring(Math.max(0, code.length - 500)));

                // DEBUG: Recursive N-Queen check and fix logic REMOVED.
                // This logic was causing errors for iterative algorithms (Train Schedule) by enforcing recursion rules.


                // Inject Ant DP global variables and Safety Patches (Unconditional)
                // Placed outside fragile brace detection logic to guarantee execution.
                // Inject Ant DP global variables and Safety Patches (Unconditional)
                code = applyAntDpPatches(code, isAntDp, initCodes);

                const functionName = extractFunctionName(code);
                console.log("Extracted function name:", functionName);
                console.log("=====================================");

                // Check test cases if available
                console.log("Checking test cases condition:", {
                    hasTestCases: !!currentLevel?.test_cases,
                    testCasesLength: currentLevel?.test_cases?.length || 0,
                    hasFunctionName: !!functionName,
                    testCases: currentLevel?.test_cases
                });

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

                // Handle level completion (Victory/Game Over)
                await handleLevelCompletion({
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
                        setTimeSpent,
                        setGameResult,
                        setFinalScore,
                        setShowProgressModal,
                        setIsCompleted
                    }
                });

            } catch (error) {
                setGameState("ready");
                console.log("EXECUTION ERROR - Checking victory conditions anyway");

                // Handle level completion even on error
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
                        setTimeSpent,
                        setGameResult,
                        setFinalScore,
                        setShowProgressModal,
                        setIsCompleted
                    }
                });

                if (!levelCompleted) {
                    // If not completed, show the actual error message
                    console.error("Execution error:", error);
                    const friendlyMessage = mapRuntimeErrorToMessage(error);

                    if (error.message.includes("infinite loop") || error.message.includes("timeout")) {
                        setCurrentHint("❌ พบ Infinite Loop - โปรแกรมทำงานนานเกินไป");
                    } else {
                        setCurrentHint(`❌ ${friendlyMessage}`);
                    }

                    // Show Popup
                    setExecutionError({
                        title: "เกิดข้อผิดพลาดขณะทำงาน",
                        message: friendlyMessage
                    });

                    setIsRunning(false);
                }
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
