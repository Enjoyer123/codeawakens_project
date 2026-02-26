import { generateAndInstrumentCode, prepareExecutableCode } from '@/gameutils/blockly/core/executionCodeGeneration';
import { getCurrentGameState, setCurrentGameState } from '@/gameutils/shared/game';
import { useState } from 'react';
import { validateWorkspace, mapRuntimeErrorToMessage } from '@/gameutils/shared/codeValidator';
import { extractFunctionName } from '@/gameutils/algo';
import { buildExecutionContext } from '@/gameutils/shared/execution/executionContextBuilder';
import { handleLevelCompletion } from '@/gameutils/shared/execution/levelCompletionHandler';
import { resetGameExecutionState } from '@/gameutils/shared/execution/executionReset';
import { createGraphMap, createExecutionWrappers } from '@/gameutils/shared/execution/executionHelpers';
// Obsolete knapsack imports removed

// --- Record & Playback System ---
import { executeAlgoCode, checkAlgoTestCases, playAlgoAnimation, isAlgoLevel, detectAlgoType } from '../../../../gameutils/algo';
import { calculateMoveForward, calculateTurnLeft, calculateTurnRight } from '../../../../gameutils/movement/movementCore';
import { playMoveAnimation, playTurnAnimation } from '../../../../gameutils/movement/movementPlayback';
import { calculateHit } from '../../../../gameutils/combat/combatLogic';
import { playHitAnimation } from '../../../../gameutils/combat/combatPlayback';

const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;

/**
 * Hook for code execution
 * @param {Object} params - Parameters object
 * @param {Object} params.gameActions - Movement/sensor functions { moveForward, turnLeft, ... }
 * @param {Object} params.setters - React state setters { setPlayerNodeId, setIsRunning, ... }
 * @param {Object} params.scoring - Scoring data { goodPatterns, userBigO, hintData }
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
        foundMonster, canMoveForward, nearPit, atGoal
    } = gameActions;

    const {
        setPlayerNodeId, setPlayerDirection, setPlayerHp,
        setIsCompleted, setIsRunning, setIsGameOver,
        setGameState, setCurrentHint, setShowProgressModal,
        setGameResult, setFinalScore, setRescuedPeople,
        setHintData, setTestCaseResult
    } = setters;

    const { goodPatterns, userBigO, hintData } = scoring;
    const [executionError, setExecutionError] = useState(null);

    // Provide decoupled combat wrapper
    const hit = async () => {
        const scene = getCurrentGameState().currentScene;
        const result = calculateHit(scene);

        if (!result.success) {
            setCurrentHint("❌ ไม่มีศัตรูในระยะโจมตี");
            return false;
        }

        if (scene) {
            const playbackResult = await playHitAnimation(scene, result);
            if (playbackResult.status === 'enemy_defeated') {
                setCurrentHint("⚔️ ศัตรูตายแล้ว! เดินต่อได้");
            } else if (playbackResult.status === 'missed') {
                setCurrentHint("❌ โจมตีไม่สำเร็จ");
            }
        }
        return true;
    };

    // Provide decoupled movement wrappers using the new Playback Architecture
    const moveForward = async () => {
        console.log("🚀 [NEW ARCH] Blockly calling decoupled moveForward!");
        const scene = getCurrentGameState().currentScene;
        const result = calculateMoveForward(scene);

        if (!result.success) return false;

        if (scene) {
            const playbackResult = await playMoveAnimation(scene, result);
            if (playbackResult && playbackResult.status === 'game_over') {
                setIsGameOver(true);
                setGameState("gameOver");
                if (!isPreview) {
                    setShowProgressModal(true);
                    setGameResult('gameover');
                }
                return false; // Stop further execution
            }
        }

        // ⭐ ALWAYS update the global mathematical state whether we had a scene or not
        setCurrentGameState({
            currentNodeId: result.targetNode.id,
            goalReached: result.goalReached
        });

        if (result.targetNode) {
            setPlayerNodeId(result.targetNode.id);
        }
        return false;
    };

    const turnLeft = async () => {
        const result = calculateTurnLeft();
        if (result.success) {
            setPlayerDirection(result.newDirection);
            setCurrentGameState({ direction: result.newDirection });
            const scene = getCurrentGameState().currentScene;
            if (scene) {
                await playTurnAnimation(scene, result);
            }
        }
    };

    const turnRight = async () => {
        const result = calculateTurnRight();
        if (result.success) {
            setPlayerDirection(result.newDirection);
            setCurrentGameState({ direction: result.newDirection });
            const scene = getCurrentGameState().currentScene;
            if (scene) {
                await playTurnAnimation(scene, result);
            }
        }
    };

    const runCode = async () => {
        // Block Validation
        if (!currentLevel?.textcode && workspaceRef.current) {
            const validation = validateWorkspace(workspaceRef.current, currentLevel);
            if (!validation.isValid) {
                setExecutionError({
                    title: "พบข้อผิดพลาดในบล็อกคำสั่ง",
                    message: validation.error
                });
                return;
            }
        }

        if (!workspaceRef.current || !getCurrentGameState().currentScene) {
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

            // ========================================
            // Record & Playback Path (Algo Levels)
            // ========================================
            if (isAlgoLevel(currentLevel)) {
                try {
                    let code = await generateAndInstrumentCode(workspaceRef, currentLevel);
                    if (!code.trim()) {
                        setCurrentHint("❌ ไม่พบ Blocks! กรุณาลาก Blocks จาก Toolbox");
                        setGameState("ready");
                        setIsRunning(false);
                        return;
                    }

                    setCurrentHint("⚙️ กำลังคำนวณผลลัพธ์...");
                    await new Promise(r => setTimeout(r, 300));

                    // Phase 1: Execute pure logic (no visuals)
                    const { result, trace, error } = await executeAlgoCode(code, currentLevel);

                    if (error) {
                        const friendlyMsg = mapRuntimeErrorToMessage(error);
                        setCurrentHint(`❌ ${friendlyMsg}`);
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
                    setCurrentHint(testCaseResult.message);

                    // Phase 3: Play animation if ALL test cases passed
                    if (testCaseResult.passed && testCaseResult.failedTests.length === 0) {
                        const scene = getCurrentGameState().currentScene;
                        const algoType = detectAlgoType(currentLevel);

                        // Auto-add move_along_path from the result (final path) for graph levels
                        // Because we removed the explicit block from the UI to hide this logic from students.
                        if (Array.isArray(result) && result.length > 0 && ['DFS', 'BFS', 'DIJKSTRA'].includes(algoType)) {
                            trace.push({ action: 'move_along_path', path: [...result] });
                        }

                        if (scene && trace.length > 0) {
                            setCurrentHint('🎬 กำลังแสดง Animation...');

                            // Reset UI state cleanly immediately before playback starts
                            await resetGameExecutionState({
                                gameStartTime,
                                setPlayerHp,
                                setPlayerNodeId,
                                setPlayerDirection,
                                currentLevel
                            });

                            await playAlgoAnimation(scene, algoType, trace, { result });
                        }
                    }

                    // Phase 4: Handle level completion
                    await handleLevelCompletion({
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
                            setCurrentHint, setIsGameOver, setGameState, setIsRunning,
                            setGameResult, setFinalScore, setShowProgressModal, setIsCompleted
                        }
                    });

                } catch (algoError) {
                    console.error('🔴 [Algo System] Error:', algoError);
                    setExecutionError({ title: 'Algo System Error', message: algoError.message });
                    setIsRunning(false);
                }
                return; // ออกจาก runCode (ไม่ตกไประบบเดิม)
            }

            // ========================================
            // Legacy Path (Simple Levels: Move/Turn)
            // ========================================

            // 1. Reset Game State



            await resetGameExecutionState({
                gameStartTime,
                setPlayerHp,
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

            // Simple level flags
            const isKnapsack = !!currentLevel?.knapsackData;

            const varName = 'result';



            let testCaseResult = null;

            try {
                const map = createGraphMap(currentLevel?.nodes || [], currentLevel?.edges || []);
                const all_nodes = (currentLevel?.nodes || []).map(node => node.id);

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
                    currentLevel
                });

                const finalExecutableCode = prepareExecutableCode(code, { varName }, currentLevel);

                // Execute code ONCE with return capture
                let functionReturnValue = null;
                let executionErrorLocal = null;

                try {
                    // Initialize tracking logic for specific Algos
                    if (currentLevel.knapsackData) {
                        // Obsolete knapsack table tracking removed
                    } else if (currentLevel.subsetSumData) {
                        // Add subset sum tracking here if needed
                    } else if (currentLevel.coinChangeData) {
                        // Add coin change tracking here if needed
                    }

                    // [Flow B] 3. Execute code via AsyncFunction
                    const argNames = Object.keys(context);
                    const argValues = argNames.map(name => context[name]);
                    const executionFn = new AsyncFunction(...argNames, '"use strict";\n' + finalExecutableCode);
                    functionReturnValue = await Promise.race([executionFn(...argValues), timeoutPromise]);

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
