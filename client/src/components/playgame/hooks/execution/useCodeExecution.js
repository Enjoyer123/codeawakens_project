/**
 * Code execution orchestrator.
 * Validates workspace → generates code → delegates to Algo or Legacy runner.
 */

import { useState } from 'react';
import { getCurrentGameState } from '@/gameutils/shared/game/gameState';
import { generateAndInstrumentCode } from '@/gameutils/blockly/core/executionCodeGeneration';
import { isAlgoLevel } from '@/gameutils/shared/levelType';
import { validateWorkspace } from './codeValidator';
import { createGameActions } from './gameActions';
import { runAlgoPath } from './algoRunner';
import { runLegacyPath } from './legacyRunner';

/**
 * Hook for code execution
 * @returns {{ runCode: Function, executionError: Object|null, clearExecutionError: Function }}
 */
export function useCodeExecution({
    workspaceRef,
    currentLevel,
    codeValidation,
    isPreview,
    patternId,
    blocklyLoaded,
    onUnlockPattern,
    onUnlockLevel,
    getToken,
    textCode,
    setters,
    scoring
}) {
    const [executionError, setExecutionError] = useState(null);
    const gameActions = createGameActions(setters, currentLevel, isPreview);

    const runCode = async () => {
        // ─── 1. Validation ───
        // Orphaned blocks check applies to ALL levels (including textcode)
        if (workspaceRef.current) {
            const validation = validateWorkspace(workspaceRef.current, currentLevel);
            if (!validation.isValid) {
                setExecutionError({ title: 'พบข้อผิดพลาดในบล็อกคำสั่ง', message: validation.error });
                return;
            }
        }

        if (!workspaceRef.current || !getCurrentGameState().currentScene) {
            return;
        }

        if (currentLevel?.textcode && !blocklyLoaded) {
            return;
        }

        if (currentLevel?.textcode && !codeValidation.isValid) {
            return;
        }

        // ─── 2. Start execution ───
        setters.setIsRunning(true);
        setters.setGameState('running');
        setters.setIsCompleted(false);
        setters.setIsGameOver(false);
        if (setters.setTestCaseResult) setters.setTestCaseResult(null);

        try {
            // ─── 3. Generate code from Blockly ───
            const code = await generateAndInstrumentCode(workspaceRef, currentLevel);
            console.log("Generated code:", code);

            if (!code.trim()) {
                setters.setGameState('ready');
                setters.setIsRunning(false);
                return;
            }

            // ─── 4. Delegate to the right runner ───
            console.log("isAlgoLevel(currentLevel):", isAlgoLevel(currentLevel));
            if (isAlgoLevel(currentLevel)) {
                await runAlgoPath(code, {
                    workspaceRef, currentLevel, isPreview,
                    getToken, textCode, scoring, setters,
                    patternId, onUnlockPattern, onUnlockLevel, setExecutionError
                });
            } else {
                await runLegacyPath(code, {
                    currentLevel, gameActions, isPreview,
                    scoring, setters,
                    patternId, onUnlockPattern, onUnlockLevel, setExecutionError
                });
            }

        } catch (error) {
            console.error('🔴 [useCodeExecution] Unexpected error:', error);
            setExecutionError({ title: 'Execution Error', message: error.message });
        } finally {
            setters.setIsRunning(false);
        }
    };

    return {
        runCode,
        executionError,
        clearExecutionError: () => setExecutionError(null)
    };
}
