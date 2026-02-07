// Blockly Procedure Definition Generators
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

export function defineProcedureDefGenerators() {
    // Function definition generators
    javascriptGenerator.forBlock["function_definition"] = function (block) {
        const functionName = block.getFieldValue('FUNCTION_NAME');
        const argument = javascriptGenerator.valueToCode(block, 'ARGUMENT', javascriptGenerator.ORDER_ATOMIC) || '0';
        const functionBody = javascriptGenerator.statementToCode(block, 'FUNCTION_BODY');
        return `async function ${functionName}(arg) {\n${functionBody}}\n`;
    };

    javascriptGenerator.forBlock["function_call"] = function (block) {
        const functionName = block.getFieldValue('FUNCTION_NAME');
        const argument = javascriptGenerator.valueToCode(block, 'ARGUMENT', javascriptGenerator.ORDER_ATOMIC) || '0';
        return `await ${functionName}(${argument});\n`;
    };

    // Override procedures_defreturn to generate async function
    javascriptGenerator.forBlock["procedures_defreturn"] = function (block) {
        console.log('[CUSTOM GENERATOR] procedures_defreturn called');
        const name = javascriptGenerator.nameDB_.getName(
            block.getFieldValue('NAME') || 'unnamed',
            'PROCEDURE'
        );
        console.log('[CUSTOM GENERATOR] Function name:', name);
        const args = [];

        // CRITICAL: Read function parameters ONLY from mutation DOM
        try {
            if (block.mutationToDom) {
                const mutation = block.mutationToDom();
                if (mutation) {
                    const argNodes = mutation.querySelectorAll ? mutation.querySelectorAll('arg') : mutation.getElementsByTagName('arg');
                    console.log('[CUSTOM GENERATOR] Mutation DOM arg nodes:', argNodes.length);
                    for (let i = 0; i < argNodes.length; i++) {
                        const argNode = argNodes[i];
                        const argName = argNode.getAttribute('name');
                        if (argName) {
                            args[i] = javascriptGenerator.nameDB_.getName(
                                argName,
                                'VARIABLE'
                            );
                        }
                    }
                } else {
                    console.warn('[CUSTOM GENERATOR] mutationToDom() returned null or undefined');
                }
            } else {
                console.warn('[CUSTOM GENERATOR] block.mutationToDom is not a function');
            }

            console.log('[CUSTOM GENERATOR] Final args (from mutation only):', args);
        } catch (e) {
            console.error('[CUSTOM GENERATOR] Error reading function parameters:', e);
        }

        // Add parameter validation for knapsack function
        let paramValidation = '';
        if (name.toLowerCase().includes('knapsack') && args.length === 4) {
            paramValidation = `
        // Validate knapsack parameters
        if (!Array.isArray(${args[0]}) || !Array.isArray(${args[1]}) || 
            typeof ${args[2]} !== 'number' || isNaN(${args[2]}) ||
            typeof ${args[3]} !== 'number' || isNaN(${args[3]})) {
          console.error('knapsack: Invalid parameters', { w: ${args[0]}, v: ${args[1]}, i: ${args[2]}, j: ${args[3]} });
          return 0;
        }
      `;
        }

        // Add variable declarations for coinChange function
        let localVarDeclarations = '';
        if (name.toLowerCase().includes('coinchange')) {
            const includeVar = javascriptGenerator.nameDB_.getName('include', 'VARIABLE');
            const excludeVar = javascriptGenerator.nameDB_.getName('exclude', 'VARIABLE');
            const includeResultVar = javascriptGenerator.nameDB_.getName('includeResult', 'VARIABLE');
            localVarDeclarations = `let ${includeVar}, ${excludeVar}, ${includeResultVar};\n`;
        }

        const argsString = args.length > 0 ? args.join(', ') : '';
        const branch = javascriptGenerator.statementToCode(block, 'STACK');

        // Clean Mode
        if (javascriptGenerator.isCleanMode) {
            // Collect all variables used in this block's scope (rudimentary approach)
            // We can regex the branch for simple variable names or use nameDB
            // Standard Blockly puts vars at top of code.
            // We want them inside.
            // Let's assume common vars: distance, parent, PQ, visited, MST_weight
            // A better way is to iterate variables in workspace, but that's global.
            // Let's manually inject the specific variables expected for Prim/Dijkstra for now
            // OR, just use "let " prefix for the first assignment? No, that's hard to track.
            // Track declared variables to support "let x = ..." on first use
            // Add arguments to the set so we don't redeclare them
            javascriptGenerator.declaredVariables = new Set(args);

            // Generate body code
            // Note: declaredVariables is populated above.
            const cleanBranch = javascriptGenerator.statementToCode(block, 'STACK');

            // Generate return code
            let returnValue = '';

            // Safely check inputs
            if (block.getInput('RETURN')) {
                returnValue = javascriptGenerator.valueToCode(block, 'RETURN', javascriptGenerator.ORDER_NONE);
            }
            if (!returnValue && block.getInput('VALUE')) {
                returnValue = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE);
            }

            returnValue = returnValue || '';

            // Fallback for algorithms if return is empty and branch doesn't already end with a return
            if (!returnValue) {
                const trimmedBranch = cleanBranch.trim();
                const branchLines = trimmedBranch.split('\n');
                const lastLine = branchLines[branchLines.length - 1] || '';
                if (!lastLine.trim().startsWith('return')) {
                    if (name === 'PRIM') returnValue = 'MST_weight';
                    else if (name === 'subsetSum') returnValue = 'false';
                    else if (name === 'knapsack') returnValue = '0';
                }
            }

            let returnCode = returnValue ? `  return ${returnValue};\n` : '';

            return `function ${name}(${argsString}) {\n${cleanBranch}${returnCode}}\n`;
        }

        const code = `async function ${name}(${argsString}) {\n${paramValidation}${localVarDeclarations}${branch}}`;
        console.log('[CUSTOM GENERATOR] Generated code:', code.substring(0, 200));
        console.log('[CUSTOM GENERATOR] Generator function:', typeof javascriptGenerator.forBlock["procedures_defreturn"]);
        return code;
    };

    // Return statement generator for procedures_defreturn
    javascriptGenerator.forBlock["procedures_return"] = function (block) {
        const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE) || 'null';

        try {
            let parentBlock = block.getParent();
            let isKnapsack = false;

            while (parentBlock) {
                if (parentBlock.type === 'procedures_defreturn') {
                    const funcName = parentBlock.getFieldValue('NAME') || '';
                    if (funcName.toLowerCase().includes('knapsack')) {
                        isKnapsack = true;
                        break;
                    }
                }
                parentBlock = parentBlock.getParent();
            }

            if (isKnapsack && typeof value === 'string' && value.includes('Math.max')) {
                return `return ${value};\n`;
            }
        } catch (e) {
            console.debug('Error checking knapsack context:', e);
        }

        return `return ${value};\n`;
    };
}
