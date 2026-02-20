import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";
import { defineAllGenerators } from '@/gameutils/blockly';

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

        // Add parameter validation for knapsack function
        let paramValidation = '';
        if (name.toLowerCase().includes('knapsack') && args.length === 4) {
            // Check if capacity is valid (not undefined or null)
            const capacityVar = args[0]; // Assuming first arg is capacity or we check all
            paramValidation = `
  if (${capacityVar} === undefined || ${capacityVar} === null) { 
      console.warn('Knapsack called with undefined/null capacity, returning 0');
      return 0; 
  }
`;
        }



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

        // Generate return statement if any
        const returnValue = javascriptGenerator.valueToCode(block, 'RETURN', javascriptGenerator.ORDER_NONE) || '';

        // --- 2. Inject Visual Hooks (Phase 2) ---

        let finalBranch = branch;
        let finalReturnValue = returnValue;

        // Subset Sum
        if (/subsetSum\d*/.test(name)) {
            const indexArg = args[1] || 'index';
            const sumArg = args[2] || 'curr_sum';
            const targetArg = args[3] || 'target_sum';

            // Visit Hook
            finalBranch = `
    try { 
        if (typeof updateSubsetSumCellVisual === 'function') {
            updateSubsetSumCellVisual(${indexArg}, ${targetArg} - ${sumArg}, null, { kind: 'visit' }); 
        }
    } catch (e) {}
    ${finalBranch}`;

            // Return Hook
            if (finalReturnValue) {
                finalReturnValue = `(function() {
    const __res = ${finalReturnValue};
    try { 
         if (typeof updateSubsetSumCellVisual === 'function') {
            updateSubsetSumCellVisual(${indexArg}, ${targetArg} - ${sumArg}, __res, { kind: 'return' }); 
         }
    } catch (e) {}
    return __res;
})()`;
            }
        }

        // Coin Change
        if (/coinChange\d*/.test(name)) {
            const amountArg = args[0] || 'amount';
            const indexArg = args[2] || 'index';

            // Visit Hook
            finalBranch = `
    try { 
        if (typeof updateCoinChangeCellVisual === 'function') {
            updateCoinChangeCellVisual(${indexArg}, ${amountArg}, null, { kind: 'visit' }); 
        }
    } catch (e) {}
    ${finalBranch}`;

            // Return Hook
            if (finalReturnValue) {
                finalReturnValue = `(function() {
    const __res = ${finalReturnValue};
    try { 
         if (typeof updateCoinChangeCellVisual === 'function') {
            updateCoinChangeCellVisual(${indexArg}, ${amountArg}, __res, { kind: 'return' }); 
         }
    } catch (e) {}
    return __res;
})()`;
            }
        }

        const returnStatement = finalReturnValue ? `  return ${finalReturnValue};\n` : '';

        // Generate async function with Safety Yield (conditional)
        // Skip yield if __isVisualRun is false (background testing)

        // Safety Step Limit: Increment and check counter
        const stepLimitCode = "if (typeof globalThis !== 'undefined') { globalThis.__stepCount = (globalThis.__stepCount || 0) + 1; if (globalThis.__stepCount > 5000000) throw new Error('Infinite Loop / Recursion Limit Exceeded (5M steps)'); }";
        const code = `async function ${name}(${argsString}) {\n  if (typeof globalThis !== 'undefined' && globalThis.__isVisualRun !== false) await new Promise(r => setTimeout(r, 0));\n  ${stepLimitCode}\n${paramValidation}${finalBranch}${returnStatement}}`;
        return code;
    };

    // 1. First, define all standard generators (this sets a generic procedures_defreturn)
    defineAllGenerators();

    // 2. Then override with our custom version (must come AFTER defineAllGenerators)
    javascriptGenerator.forBlock["procedures_defreturn"] = customProcGen;

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
