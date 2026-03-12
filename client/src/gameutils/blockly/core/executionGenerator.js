import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";
import { defineAllGenerators } from '@/gameutils/blockly/core/generators';

export const setupCustomGenerator = (currentLevel) => {
    const customProcGen = function (block) {
        // Initialize generator for the current workspace if needed
        try {
            if (javascriptGenerator.nameDB_ && block.workspace?.getVariableMap) {
                javascriptGenerator.nameDB_.setVariableMap(block.workspace.getVariableMap());
            }
            if (typeof javascriptGenerator.init === 'function' && block.workspace) {
                javascriptGenerator.init(block.workspace);
            }
        } catch (e) {
            // Init failed - non-critical
        }

        const funcName = javascriptGenerator.nameDB_.getName(
            block.getFieldValue('NAME') || 'unnamed',
            Blockly.Names.NameType.PROCEDURE
        );

        // Extract arguments using Blockly's built-in block methods
        const args = [];
        const variables = block.getVars();
        for (let i = 0; i < variables.length; i++) {
            args[i] = javascriptGenerator.nameDB_.getName(variables[i], Blockly.Names.NameType.VARIABLE);
        }
        const argsString = args.join(', ');

        const branch = javascriptGenerator.statementToCode(block, 'STACK') || '';
        if (!branch.trim()) {
            console.warn('[Generator] Function body is empty:', funcName);
        }

        const returnValue = block.type === 'procedures_defreturn'
            ? (javascriptGenerator.valueToCode(block, 'RETURN', javascriptGenerator.ORDER_NONE) || '')
            : '';
        const returnStatement = returnValue ? `  return ${returnValue};\n` : '';

        // Clean Mode: Standard synchronous function
        if (javascriptGenerator.isCleanMode) {
            return `function ${funcName}(${argsString}) {\n${branch}${returnStatement}}`;
        }

        // Runtime Mode: Async function with Safety Yield + Step Limit
        const stepLimitCode = "if (typeof globalThis !== 'undefined') { globalThis.__stepCount = (globalThis.__stepCount || 0) + 1; if (globalThis.__stepCount > 5000000) throw new Error('Infinite Loop / Recursion Limit Exceeded (5M steps)'); }";
        const code = `async function ${funcName}(${argsString}) {\n  if (typeof globalThis !== 'undefined' && globalThis.__isVisualRun !== false) await new Promise(r => setTimeout(r, 0));\n  ${stepLimitCode}\n${branch}${returnStatement}}`;
        return code;
    };

    // Define all standard generators first
    defineAllGenerators();

    // Override procedure blocks with the async custom generator
    javascriptGenerator.forBlock["procedures_defreturn"] = customProcGen;
    javascriptGenerator.forBlock["procedures_defnoreturn"] = customProcGen;

    return customProcGen;
};

export const verifyGenerator = (workspaceRef) => {
    if (!workspaceRef.current) return;
    const procBlocks = workspaceRef.current.getAllBlocks().filter(b => b.type === 'procedures_defreturn' || b.type === 'procedures_defnoreturn');
    if (procBlocks.length === 0) {
        console.warn('[Generator] No procedure definition blocks found');
    }
};
