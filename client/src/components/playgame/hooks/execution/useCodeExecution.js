/**
 * Code execution orchestrator.
 * Validates workspace → generates code → delegates to Algo or Legacy runner.
 */

import { useState } from 'react';
import { getCurrentGameState } from '@/gameutils/shared/game';
import { generateAndInstrumentCode } from '@/gameutils/blockly/core/executionCodeGeneration';
import { isAlgoLevel } from '@/gameutils/algo';
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
    blocklyJavaScriptReady,
    codeValidation,
    isPreview,
    patternId,
    onUnlockPattern,
    onUnlockLevel,
    gameStartTime,
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
            setters.setCurrentHint('⚠️ ระบบไม่พร้อมใช้งาน');
            return;
        }

        if (currentLevel?.textcode && !blocklyJavaScriptReady) {
            setters.setCurrentHint('⚠️ กรุณารอระบบโหลดสักครู่...');
            return;
        }

        if (currentLevel?.textcode && !codeValidation.isValid) {
            setters.setCurrentHint(`⚠️ ${codeValidation.message}`);
            return;
        }

        // ─── 2. Start execution ───
        setters.setIsRunning(true);
        setters.setGameState('running');
        setters.setIsCompleted(false);
        setters.setIsGameOver(false);
        setters.setCurrentHint('🚀 กำลังเริ่มทำงาน...');
        if (setters.setTestCaseResult) setters.setTestCaseResult(null);

        try {
            // ─── 3. Generate code from Blockly ───
            const code = await generateAndInstrumentCode(workspaceRef, currentLevel);

            if (!code.trim()) {
                setters.setCurrentHint('❌ ไม่พบ Blocks! กรุณาลาก Blocks จาก Toolbox');
                setters.setGameState('ready');
                setters.setIsRunning(false);
                return;
            }

            // ─── 4. Delegate to the right runner ───
            if (isAlgoLevel(currentLevel)) {
                await runAlgoPath(code, {
                    workspaceRef, currentLevel, isPreview, gameStartTime,
                    getToken, textCode, scoring, setters,
                    patternId, onUnlockPattern, onUnlockLevel, setExecutionError
                });
            } else {
                await runLegacyPath(code, {
                    currentLevel, gameActions, isPreview, gameStartTime,
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
