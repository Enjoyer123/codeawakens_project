import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";
import { defineAllGenerators } from '@/gameutils/blockly/core/generators';

export const setupCustomGenerator = (currentLevel) => {
    const customProcGen = function (block) {
        const name = javascriptGenerator.nameDB_.getName(
            block.getFieldValue('NAME') || 'unnamed',
            Blockly.Names.NameType.PROCEDURE
        );
        const args = [];
        // Ensure generator has a variable map and is initialized for this workspace
        try {
            if (javascriptGenerator.nameDB_ && block.workspace && block.workspace.getVariableMap) {
                javascriptGenerator.nameDB_.setVariableMap(block.workspace.getVariableMap());
            }
            if (typeof javascriptGenerator.init === 'function' && block.workspace) {
                javascriptGenerator.init(block.workspace);
            }
        } catch (e) {
            // Generator init failed - non-critical
        }
        // Read function parameters ONLY from mutation DOM
        try {
            if (block.mutationToDom) {
                const mutation = block.mutationToDom();
                if (mutation) {
                    const argNodes = mutation.querySelectorAll ? mutation.querySelectorAll('arg') : mutation.getElementsByTagName('arg');
                    for (let i = 0; i < argNodes.length; i++) {
                        const argNode = argNodes[i];
                        const argName = argNode.getAttribute('name');
                        if (argName) {
                            args[i] = javascriptGenerator.nameDB_.getName(
                                argName,
                                Blockly.Names.NameType.VARIABLE
                            );
                        }
                    }
                }
            }
        } catch (e) {
            // Error reading mutation DOM
        }

        let argsString = '';
        if (args.length > 0) {
            argsString = args.join(', ');
        }

        // Parameter validation has been removed per user request

        let branch = javascriptGenerator.statementToCode(block, 'STACK');

        // Sanitize branch: remove stray returns that may be duplicated by Blockly fragments
        try {
            branch = branch.replace(/return\s*;\s*$/gm, '');
        } catch (e) {
            // Sanitization failed — non-critical
        }


        if (!branch || branch.trim().length === 0) {
            console.warn('[Generator] Function body is empty:', name);
        }

        // Generate return statement (only for procedures_defreturn)
        const returnValue = block.type === 'procedures_defreturn'
            ? (javascriptGenerator.valueToCode(block, 'RETURN', javascriptGenerator.ORDER_NONE) || '')
            : '';

        // --- 2. Inject Visual Hooks (Phase 2) ---

        let finalBranch = branch;
        let finalReturnValue = returnValue;

        // Note: Visual Hooks (updateSubsetSumCellVisual, updateCoinChangeCellVisual) 
        // have been removed as they are obsolete with the new playback system.

        const returnStatement = finalReturnValue ? `  return ${finalReturnValue};\n` : '';

        // Clean Mode: simple function for display (no async, no safety code)
        if (javascriptGenerator.isCleanMode) {
            return `function ${name}(${argsString}) {\n${finalBranch}${returnStatement}}`;
        }

        // Runtime Mode: async function with Safety Yield + Step Limit
        const stepLimitCode = "if (typeof globalThis !== 'undefined') { globalThis.__stepCount = (globalThis.__stepCount || 0) + 1; if (globalThis.__stepCount > 5000000) throw new Error('Infinite Loop / Recursion Limit Exceeded (5M steps)'); }";
        const code = `async function ${name}(${argsString}) {\n  if (typeof globalThis !== 'undefined' && globalThis.__isVisualRun !== false) await new Promise(r => setTimeout(r, 0));\n  ${stepLimitCode}\n${finalBranch}${returnStatement}}`;
        return code;
    };

    // 1. First, define all standard generators (this sets a generic procedures_defreturn)
    defineAllGenerators();

    // 2. Then override with our custom async version (must come AFTER defineAllGenerators)
    javascriptGenerator.forBlock["procedures_defreturn"] = customProcGen;
    javascriptGenerator.forBlock["procedures_defnoreturn"] = customProcGen;

    return customProcGen;
};

export const verifyGenerator = (workspaceRef) => {
    if (!workspaceRef.current) return;
    // Verify procedure blocks exist
    const procBlocks = workspaceRef.current.getAllBlocks().filter(b => b.type === 'procedures_defreturn');
    if (procBlocks.length === 0) {
        console.warn('[Generator] No procedure definition blocks found');
    }
};
