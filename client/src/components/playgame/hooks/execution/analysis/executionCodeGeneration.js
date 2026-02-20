import { javascriptGenerator } from "blockly/javascript";
import { setupCustomGenerator, verifyGenerator } from '../utils/executionGenerator';

/**
 * Orchestrates the code generation process:
 * 1. Setup Custom Generator
 * 2. Generate Code from Workspace
 * 
 * @param {Object} workspaceRef - Reference to the Blockly workspace
 * @param {Object} currentLevel - Current level data
 * @returns {Promise<string>} The generated code
 */
export const generateAndInstrumentCode = async (workspaceRef, currentLevel) => {
    // 1. Setup the custom generator (registers it on javascriptGenerator)
    setupCustomGenerator(currentLevel);

    // Verify generator state
    verifyGenerator(workspaceRef);

    // Ensure generator has workspace variable map
    try {
        if (workspaceRef.current && javascriptGenerator.nameDB_ && workspaceRef.current.getVariableMap) {
            javascriptGenerator.nameDB_.setVariableMap(workspaceRef.current.getVariableMap());
        }
        if (typeof javascriptGenerator.init === 'function' && workspaceRef.current) {
            javascriptGenerator.init(workspaceRef.current);
        }
    } catch (e) {
        // Non-critical init warning
    }

    // Generate code
    const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
    return code;
};

/**
 * Prepares the final executable code string by wrapping user code with
 * safety globals and a return-capture statement.
 * 
 * @param {string} code - The user's generated code.
 * @param {Object} analysisResult - Algorithm flags (varName, isNQueen, isTrainSchedule).
 * @param {Object} currentLevel - The current level object.
 * @returns {string} The final executable code string.
 */
export const prepareExecutableCode = (code, analysisResult, currentLevel) => {
    const { varName, isNQueen, isTrainSchedule } = analysisResult;

    const returnStatement = `try { return ${varName}; } catch(e) { return undefined; }`;

    let finalCode = `
        // Safety: visual runs MUST yield
        if (typeof globalThis !== 'undefined') { globalThis.__isVisualRun = true; }
        // Safety: Reset step counter
        if (typeof globalThis !== 'undefined') { globalThis.__stepCount = 0; }
        
        ${code}
        ${returnStatement}
    `;

    // Train Schedule: ensure solve() is awaited
    if (isTrainSchedule) {
        finalCode = finalCode.replace(/=\s*solve\s*\(/g, '= await solve(');
    }

    return finalCode;
};
