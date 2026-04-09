// Variable Block Generators (variables_get, variables_set)
// Moved from blocks/data/generators.js
import { javascriptGenerator } from "blockly/javascript";

export function defineDataGenerators() {

    // variables_get: preserves raw variable name in clean mode (avoids Blockly renaming `parent` → `parent2`)
    javascriptGenerator.forBlock["variables_get"] = function (block) {
        if (javascriptGenerator.isCleanMode) {
            const varId = block.getFieldValue('VAR');
            const varModel = block.workspace.getVariableById(varId);
            const rawName = varModel ? varModel.name : 'unknown_var';
            return [rawName, javascriptGenerator.ORDER_ATOMIC];
        }
        const varName = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
        return [varName, javascriptGenerator.ORDER_ATOMIC];
    };

    // variables_set: uses `let` on first declaration in clean mode
    javascriptGenerator.forBlock["variables_set"] = function (block) {
        const argument0 = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || '0';

        if (javascriptGenerator.isCleanMode) {
            const varId = block.getFieldValue('VAR');
            const varModel = block.workspace.getVariableById(varId);
            const rawName = varModel ? varModel.name : 'unknown_var';

            if (!javascriptGenerator.declaredVariables) {
                javascriptGenerator.declaredVariables = new Set();
            }
            if (!javascriptGenerator.declaredVariables.has(rawName)) {
                javascriptGenerator.declaredVariables.add(rawName);
                return `let ${rawName} = ${argument0};\n`;
            }
            return `${rawName} = ${argument0};\n`;
        }

        const varName = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
        return `${varName} = ${argument0};\n`;
    };

    // var_math: arithmetic operations on variables
    javascriptGenerator.forBlock["var_math"] = function (block) {
        const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
        const operator = block.getFieldValue('OP');
        const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ATOMIC) || '0';

        let code;
        switch (operator) {
            case 'ADD': code = `${variable} + ${value}`; break;
            case 'MINUS': code = `${variable} - ${value}`; break;
            case 'MULTIPLY': code = `${variable} * ${value}`; break;
            case 'DIVIDE': code = `${variable} / ${value}`; break;
            default: code = `${variable}`;
        }

        return [code, javascriptGenerator.ORDER_ADDITIVE];
    };

    // get_var_value: get the value of a variable
    javascriptGenerator.forBlock["get_var_value"] = function (block) {
        const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
        return [variable, javascriptGenerator.ORDER_ATOMIC];
    };

    // variables_game_input: gets initialization input from _getGameInput
    javascriptGenerator.forBlock["variables_game_input"] = function (block) {
        if (javascriptGenerator.isCleanMode) {
            const varId = block.getFieldValue('VAR');
            const varModel = block.workspace.getVariableById(varId);
            const rawName = varModel ? varModel.name : 'unknown_var';

            if (!javascriptGenerator.declaredVariables) {
                javascriptGenerator.declaredVariables = new Set();
            }
            if (!javascriptGenerator.declaredVariables.has(rawName)) {
                javascriptGenerator.declaredVariables.add(rawName);
                return `let ${rawName} = _getGameInput('${rawName}');\n`;
            }
            return `${rawName} = _getGameInput('${rawName}');\n`;
        }

        const varId = block.getFieldValue('VAR');
        const varModel = block.workspace.getVariableById(varId);
        const rawName = varModel ? varModel.name : 'unknown_var';
        const varName = javascriptGenerator.nameDB_.getName(varId, 'VARIABLE');
        return `${varName} = _getGameInput('${rawName}');\n`;
    };
}
