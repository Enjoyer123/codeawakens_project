// Blockly Data Structure Generators (Variables, Dictionaries, Stack, Lists)
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

/**
 * Define generators for dictionary and DSU blocks
 */
export function defineDictionaryGenerators() {
    console.log('🔧 Registering dictionary generators...');

    const coerceRcKeyCode = (keyCode) => {
        try {
            let s = String(keyCode || '').trim();
            while (s.startsWith('(') && s.endsWith(')')) {
                s = s.slice(1, -1).trim();
            }
            if (/^['"]r['"]$/i.test(s)) return `'r'`;
            if (/^['"]c['"]$/i.test(s)) return `'c'`;
            const m = s.match(/[A-Za-z]/);
            const letter = m ? String(m[0]).toLowerCase() : null;
            if (letter === 'r' || letter === 'g' || letter === 'd') return `'r'`;
            if (letter === 'c') return `'c'`;
            return keyCode;
        } catch (e) {
            return keyCode;
        }
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

        const dictCode = dict.trim();
        const isParent = dictCode.includes('parent') || dictCode.includes('Parent');

        if (isParent) {
            return `(async function() {
  try {
    const dictVar = (${dict});
    const keyVar = (${keyCodeCoerced});
    if (dictVar && (typeof dictVar === 'object' || typeof dictVar === 'function')) {
      dictVar[keyVar] = (${value});
      
      // Visualization for Prim's Algorithm
      const currentState = getCurrentGameState();
      if (currentState && currentState.currentScene && typeof showMSTEdges === 'function') {
        showMSTEdges(currentState.currentScene, dictVar);
        await new Promise(resolve => setTimeout(resolve, 500)); // Animation delay
      }
    }
  } catch (e) {
    console.warn('dict_set (parent) visualization error:', e);
  }
})();\n`;
        }

        // Standard assignment for other dictionaries
        return `${dict}[${keyCodeCoerced}] = ${value};\n`;
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

        // Restore MST visualization (Standard Mode only)
        // Check if the variable is 'MST_weight'
        const varId = block.getFieldValue('VAR');
        const varModel = block.workspace.getVariableById(varId);
        const rawName = varModel ? varModel.name : varName;

        if (rawName && rawName.trim().toLowerCase() === 'mst_weight') {
            code += `if (typeof updateMSTWeight === 'function') { updateMSTWeight(${varName}); }\n`;
        }

        return code;
    };

    // Stack operations
    javascriptGenerator.forBlock["stack_push"] = function (block) {
        const val = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE) || 'null';
        return `await pushNode(${val});\n`;
    };

    javascriptGenerator.forBlock["stack_pop"] = function (block) {
        return [`await popNode()`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["stack_empty"] = function (block) {
        return [`stackEmpty()`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["stack_count"] = function (block) {
        return [`stackCount()`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["stack_clear"] = function (block) {
        return `clearStack();\n`;
    };
}
