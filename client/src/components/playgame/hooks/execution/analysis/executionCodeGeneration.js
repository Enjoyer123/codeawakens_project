import { javascriptGenerator } from "blockly/javascript";
import { setupCustomGenerator, verifyGenerator } from '../utils/executionGenerator';
import { instrumentSubsetSum } from './instrumentSubsetSum';
import { instrumentCoinChange } from './instrumentCoinChange';
import { instrumentNQueen } from './instrumentNQueen';

/**
 * Orchestrates the code generation process:
 * 1. Setup Custom Generator
 * 2. Generate Code from Workspace
 * 3. Sanitize Code
 * 4. Instrument Algorithms
 * 5. Validate Code
 * 
 * @param {Object} workspaceRef - Reference to the Blockly workspace
 * @param {Object} currentLevel - Current level data
 * @returns {Promise<string>} The generated and instrumented code
 */
export const generateAndInstrumentCode = async (workspaceRef, currentLevel) => {
    // 1. Setup the custom generator
    const customProcGen = setupCustomGenerator(currentLevel);

    // Verify generator state
    verifyGenerator(workspaceRef);

    // Generate code with our custom generator guaranteed to be in place
    let code = '';
    try {
        // One final override before generating using Object.defineProperty
        Object.defineProperty(javascriptGenerator.forBlock, "procedures_defreturn", {
            value: customProcGen,
            writable: true,
            configurable: true,
            enumerable: true
        });

        // Double-check before generating
        const finalCheck = javascriptGenerator.forBlock["procedures_defreturn"];
        const finalCheckStr = finalCheck?.toString() || '';
        const isOurCustomGen = finalCheckStr.includes('CUSTOM GENERATOR');
        console.log('[useCodeExecution] Final check before workspaceToCode - is custom:', isOurCustomGen);
        console.log('[useCodeExecution] Final check - generator preview:', finalCheckStr.substring(0, 200));

        // If generator is not our custom one, try one more override
        if (!isOurCustomGen) {
            console.error('[useCodeExecution] WARNING: Generator is NOT our custom one! Forcing override again...');
            Object.defineProperty(javascriptGenerator.forBlock, "procedures_defreturn", {
                value: customProcGen,
                writable: true,
                configurable: true,
                enumerable: true
            });
        }

        // Ensure generator has workspace variable map and is initialized before converting workspace to code
        try {
            if (workspaceRef.current && javascriptGenerator.nameDB_ && workspaceRef.current.getVariableMap) {
                javascriptGenerator.nameDB_.setVariableMap(workspaceRef.current.getVariableMap());
            }
            if (typeof javascriptGenerator.init === 'function' && workspaceRef.current) {
                javascriptGenerator.init(workspaceRef.current);
            }
        } catch (e) {
            console.warn('[useCodeExecution] Warning: could not init javascript generator before workspaceToCode:', e);
        }

        code = javascriptGenerator.workspaceToCode(workspaceRef.current);
    } catch (e) {
        console.error('[useCodeExecution] Error generating code:', e);
        throw e;
    }

    // Log the generated code to see what's actually being generated
    console.log('[useCodeExecution] ✅ Code generation completed!');
    console.log('[useCodeExecution] Generated code preview (before fix):', code.substring(0, 1500));

    // 2. Global sanitization pass
    try {
        let modified = false;

        const returnSolutionMatches = code.match(/return\s+solution\s*;/g) || [];
        if (returnSolutionMatches.length > 1) {
            console.warn('[useCodeExecution] 🔧 Found', returnSolutionMatches.length, 'duplicate "return solution;" occurrences - collapsing to one');
            code = code.replace(/(?:return\s+solution\s*;\s*)+/g, 'return solution;\n');
            modified = true;
        }

        if (modified) {
            console.log('[useCodeExecution] 🔧 Code sanitized (global pass). New length:', code.length);
            console.log('[useCodeExecution] Generated code preview (after global sanitize):', code.substring(0, 1500));
        } else {
            console.log('[useCodeExecution] 🔍 No global sanitization needed');
        }
    } catch (e) {
        console.warn('[useCodeExecution] Could not perform global sanitization:', e);
    }

    // Subset Sum & Coin Change Instrumentation
    code = instrumentSubsetSum(code, currentLevel);
    code = instrumentCoinChange(code, currentLevel);

    // N-Queen Instrumentation and Fixes
    code = instrumentNQueen(code, currentLevel, workspaceRef);


    const hasAsyncSolve = code.includes('async function solve');
    const hasSyncSolve = /function\s+solve\s*\(/.test(code) && !/async\s+function\s+solve/.test(code);

    if (hasSyncSolve && !hasAsyncSolve) {
        console.error('[useCodeExecution] ERROR: Generated code has sync solve function (missing async)!');
        console.error('[useCodeExecution] Expected: async function solve(...)');
    }

    const solveFunctionMatch = code.match(/function\s+(\w+)\s*\(([^)]*)\)/);
    if (solveFunctionMatch) {
        const funcName = solveFunctionMatch[1];
        const funcParams = solveFunctionMatch[2];
        console.log('[useCodeExecution] First found function:', funcName, 'with params:', funcParams);
    }

    return code;
};
