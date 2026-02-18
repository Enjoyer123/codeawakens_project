// Blockly Data Structure Generators (Variables, Dictionaries, Stack, Lists)
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";
import { getVariableSetHook } from "../../core/algorithm_hooks";

/**
 * Define generators for dictionary and DSU blocks
 */
export function defineDictionaryGenerators() {

    // Normalize dictionary key to 'r' or 'c' for Prim's algorithm (row/column)
    // Strips parentheses from Blockly codegen and normalizes quote format
    const coerceRcKeyCode = (keyCode) => {
        let s = String(keyCode || '').trim();
        // Strip wrapping parentheses from Blockly codegen
        while (s.startsWith('(') && s.endsWith(')')) {
            s = s.slice(1, -1).trim();
        }
        if (/^['"]r['"]$/i.test(s)) return `'r'`;
        if (/^['"]c['"]$/i.test(s)) return `'c'`;
        return keyCode;
    };

    javascriptGenerator.forBlock["dict_create"] = function (block) {
        return ["{}", javascriptGenerator.ORDER_ATOMIC];
    };

    javascriptGenerator.forBlock["dict_set"] = function (block) {
        const dict = javascriptGenerator.valueToCode(block, 'DICT', javascriptGenerator.ORDER_MEMBER) || '{}';
        const key = javascriptGenerator.valueToCode(block, 'KEY', javascriptGenerator.ORDER_MEMBER) || 'null';
        const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';
        const keyCodeCoerced = coerceRcKeyCode(key);

        // Clean Mode
        if (javascriptGenerator.isCleanMode) {
            return `${dict}[${keyCodeCoerced}] = ${value};\n`;
        }

        // Runtime: delegate to context-injected dictSet (handles MST visual)
        const dictName = dict.trim();
        return `await dictSet(${dict}, ${keyCodeCoerced}, ${value}, '${dictName}');\n`;
    };

    javascriptGenerator.forBlock["dict_get"] = function (block) {
        const dict = javascriptGenerator.valueToCode(block, 'DICT', javascriptGenerator.ORDER_MEMBER) || '{}';
        const key = javascriptGenerator.valueToCode(block, 'KEY', javascriptGenerator.ORDER_MEMBER) || 'null';
        const keyCodeCoerced = coerceRcKeyCode(key);

        return [`${dict}[${keyCodeCoerced}]`, javascriptGenerator.ORDER_MEMBER];
    };

    javascriptGenerator.forBlock["dict_has_key"] = function (block) {
        const dict = javascriptGenerator.valueToCode(block, 'DICT', javascriptGenerator.ORDER_MEMBER) || '{}';
        const key = javascriptGenerator.valueToCode(block, 'KEY', javascriptGenerator.ORDER_MEMBER) || 'null';
        return [`${dict}.hasOwnProperty(${key})`, javascriptGenerator.ORDER_RELATIONAL];
    };

    javascriptGenerator.forBlock["dsu_find"] = function (block) {
        const parent = javascriptGenerator.valueToCode(block, 'PARENT', javascriptGenerator.ORDER_MEMBER) || '{}';
        const node = javascriptGenerator.valueToCode(block, 'NODE', javascriptGenerator.ORDER_MEMBER) || '0';
        if (javascriptGenerator.isCleanMode) {
            return [`dsu_find(${parent}, ${node})`, javascriptGenerator.ORDER_FUNCTION_CALL];
        }
        return [`await dsuFind(${parent}, ${node})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["dsu_union"] = function (block) {
        const parent = javascriptGenerator.valueToCode(block, 'PARENT', javascriptGenerator.ORDER_MEMBER) || '{}';
        const rank = javascriptGenerator.valueToCode(block, 'RANK', javascriptGenerator.ORDER_MEMBER) || '{}';
        const rootU = javascriptGenerator.valueToCode(block, 'ROOT_U', javascriptGenerator.ORDER_MEMBER) || '0';
        const rootV = javascriptGenerator.valueToCode(block, 'ROOT_V', javascriptGenerator.ORDER_MEMBER) || '0';
        if (javascriptGenerator.isCleanMode) {
            return `dsu_union(${parent}, ${rank}, ${rootU}, ${rootV});\n`;
        }
        return `await dsuUnion(${parent}, ${rank}, ${rootU}, ${rootV});\n`;
    };
}

/**
 * Define generators for variable and list blocks
 */
export function defineDataGenerators() {
    // Variables
    javascriptGenerator.forBlock["variables_get"] = function (block) {
        // Clean Mode: Use raw name from model to avoid renaming 'parent' -> 'parent2'
        if (javascriptGenerator.isCleanMode) {
            const varId = block.getFieldValue('VAR');
            const varModel = block.workspace.getVariableById(varId);
            const rawName = varModel ? varModel.name : 'unknown_var';
            return [rawName, javascriptGenerator.ORDER_ATOMIC];
        }

        const varName = javascriptGenerator.nameDB_.getName(
            block.getFieldValue('VAR'),
            'VARIABLE'
        );
        return [varName, javascriptGenerator.ORDER_ATOMIC];
    };



    javascriptGenerator.forBlock["variables_set"] = function (block) {
        const argument0 = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || '0';

        // Clean Mode
        if (javascriptGenerator.isCleanMode) {
            // ... (Keep existing Clean Mode logic, which is fine)
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

        const varName = javascriptGenerator.nameDB_.getName(
            block.getFieldValue('VAR'),
            'VARIABLE'
        );
        let code = varName + ' = ' + argument0 + ';\n';

        // Special case: MST algorithms need to track weight updates visually
        const varId = block.getFieldValue('VAR');
        const varModel = block.workspace.getVariableById(varId);
        const rawName = varModel ? varModel.name : varName;

        if (rawName) {
            const hookCode = getVariableSetHook(rawName);
            if (hookCode) {
                code += hookCode;
            }
        }

        return code;
    };
}


