import { javascriptGenerator } from "blockly/javascript";
import { setupCustomGenerator, verifyGenerator } from './executionGenerator';

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
