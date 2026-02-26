import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

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

            const returnCode = returnValue ? `  return ${returnValue};\n` : '';
            return `function ${name}(${argsString}) {\n${cleanBranch}${returnCode}}\n`;
        }

        // Normal (async) mode
        return `async function ${name}(${argsString}) {\n${branch}}`;
    };

    // Return statement generator
    javascriptGenerator.forBlock["procedures_return"] = function (block) {
        const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE) || 'null';
        return `return ${value};\n`;
    };
}
