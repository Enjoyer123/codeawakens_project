// Blockly Procedure Definition Generators
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

// Algorithm-specific hooks for procedure definitions
const PROCEDURE_HOOKS = {
    knapsack: {
        argsCount: 4,
        paramValidation: (args) => `
        // Validate knapsack parameters
        if (!Array.isArray(${args[0]}) || !Array.isArray(${args[1]}) || 
            typeof ${args[2]} !== 'number' || isNaN(${args[2]}) ||
            typeof ${args[3]} !== 'number' || isNaN(${args[3]})) {
          console.error('knapsack: Invalid parameters', { w: ${args[0]}, v: ${args[1]}, i: ${args[2]}, j: ${args[3]} });
          return 0;
        }
      `
    },
    coinchange: {
        localVars: ['include', 'exclude', 'includeResult']
    }
};

// Clean mode return value fallbacks for known algorithms
const CLEAN_MODE_RETURNS = {
    PRIM: 'MST_weight',
    subsetSum: 'false',
    knapsack: '0'
};

export function defineProcedureDefGenerators() {
    // Simple function definition/call generators
    javascriptGenerator.forBlock["function_definition"] = function (block) {
        const functionName = block.getFieldValue('FUNCTION_NAME');
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
        const name = javascriptGenerator.nameDB_.getName(
            block.getFieldValue('NAME') || 'unnamed',
            'PROCEDURE'
        );
        const args = [];

        // Read function parameters from mutation DOM
        try {
            if (block.mutationToDom) {
                const mutation = block.mutationToDom();
                if (mutation) {
                    const argNodes = mutation.querySelectorAll ? mutation.querySelectorAll('arg') : mutation.getElementsByTagName('arg');
                    for (let i = 0; i < argNodes.length; i++) {
                        const argName = argNodes[i].getAttribute('name');
                        if (argName) {
                            args[i] = javascriptGenerator.nameDB_.getName(argName, 'VARIABLE');
                        } else {
                            args[i] = javascriptGenerator.nameDB_.getName(`arg${i}`, 'VARIABLE');
                        }
                    }
                }
            }
        } catch (e) {
            console.error('[procedureDefGenerators] Error reading function parameters:', e);
        }

        // Apply algorithm-specific hooks
        let paramValidation = '';
        let localVarDeclarations = '';

        const hook = Object.entries(PROCEDURE_HOOKS)
            .find(([key]) => name.toLowerCase().includes(key));

        if (hook) {
            const [, config] = hook;
            if (config.paramValidation && (!config.argsCount || args.length === config.argsCount)) {
                paramValidation = config.paramValidation(args);
            }
            if (config.localVars) {
                const vars = config.localVars.map(v =>
                    javascriptGenerator.nameDB_.getName(v, 'VARIABLE')
                );
                localVarDeclarations = `let ${vars.join(', ')};\n`;
            }
        }

        const argsString = args.length > 0 ? args.join(', ') : '';
        const branch = javascriptGenerator.statementToCode(block, 'STACK');

        // Clean Mode: synchronous function generation
        if (javascriptGenerator.isCleanMode) {
            javascriptGenerator.declaredVariables = new Set(args);
            const cleanBranch = javascriptGenerator.statementToCode(block, 'STACK');

            // Resolve return value
            let returnValue = '';
            if (block.getInput('RETURN')) {
                returnValue = javascriptGenerator.valueToCode(block, 'RETURN', javascriptGenerator.ORDER_NONE);
            }
            if (!returnValue && block.getInput('VALUE')) {
                returnValue = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE);
            }
            returnValue = returnValue || '';

            // Fallback return for known algorithms
            if (!returnValue) {
                const trimmedBranch = cleanBranch.trim();
                const lastLine = trimmedBranch.split('\n').pop() || '';
                if (!lastLine.trim().startsWith('return') && CLEAN_MODE_RETURNS[name]) {
                    returnValue = CLEAN_MODE_RETURNS[name];
                }
            }

            const returnCode = returnValue ? `  return ${returnValue};\n` : '';
            return `function ${name}(${argsString}) {\n${cleanBranch}${returnCode}}\n`;
        }

        // Normal (async) mode
        return `async function ${name}(${argsString}) {\n${paramValidation}${localVarDeclarations}${branch}}`;
    };

    // Return statement generator
    javascriptGenerator.forBlock["procedures_return"] = function (block) {
        const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE) || 'null';
        return `return ${value};\n`;
    };
}
