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

        const dictCode = dict.trim();
        const isParent = dictCode.includes('parent') || dictCode.includes('Parent');

        if (isParent) {
            return `(async function() {
  try {
    const dictVar = (${dict});
    const keyVar = (${keyCodeCoerced});
    if (!dictVar || (typeof dictVar !== 'object' && typeof dictVar !== 'function')) return;
    dictVar[keyVar] = (${value});
    const currentState = getCurrentGameState();
    if (currentState && currentState.currentScene) {
      showMSTEdges(currentState.currentScene, dictVar);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (e) {
    console.warn('dict_set (parent) error:', e);
  }
})();\n`;
        }

        return `(function() {
  try {
    const dictVar = (${dict});
    const keyVar = (${keyCodeCoerced});
    if (!dictVar || (typeof dictVar !== 'object' && typeof dictVar !== 'function')) return;
    dictVar[keyVar] = (${value});
  } catch (e) {
    console.warn('dict_set error:', e);
  }
})();\n`;
    };

    javascriptGenerator.forBlock["dict_get"] = function (block) {
        const dict = javascriptGenerator.valueToCode(block, 'DICT', javascriptGenerator.ORDER_MEMBER) || '{}';
        const key = javascriptGenerator.valueToCode(block, 'KEY', javascriptGenerator.ORDER_MEMBER) || 'null';
        const keyCodeCoerced = coerceRcKeyCode(key);
        return [`(function() { 
  try { 
    const dictVar = (${dict}); 
    const keyVar = (${keyCodeCoerced}); 
    if (dictVar && (typeof dictVar === 'object' || typeof dictVar === 'function')) {
        return dictVar[keyVar] !== undefined ? dictVar[keyVar] : null;
    }
    return null;
  } catch (e) { 
    console.warn('dict_get error:', e); 
    return null; 
  } 
})()`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["dict_has_key"] = function (block) {
        const dict = javascriptGenerator.valueToCode(block, 'DICT', javascriptGenerator.ORDER_MEMBER) || '{}';
        const key = javascriptGenerator.valueToCode(block, 'KEY', javascriptGenerator.ORDER_MEMBER) || 'null';
        return [`${dict}.hasOwnProperty(${key})`, javascriptGenerator.ORDER_RELATIONAL];
    };

    javascriptGenerator.forBlock["dsu_find"] = function (block) {
        const parent = javascriptGenerator.valueToCode(block, 'PARENT', javascriptGenerator.ORDER_MEMBER) || '{}';
        const node = javascriptGenerator.valueToCode(block, 'NODE', javascriptGenerator.ORDER_MEMBER) || '0';
        return [`await dsuFind(${parent}, ${node})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["dsu_union"] = function (block) {
        const parent = javascriptGenerator.valueToCode(block, 'PARENT', javascriptGenerator.ORDER_MEMBER) || '{}';
        const rank = javascriptGenerator.valueToCode(block, 'RANK', javascriptGenerator.ORDER_MEMBER) || '{}';
        const rootU = javascriptGenerator.valueToCode(block, 'ROOT_U', javascriptGenerator.ORDER_MEMBER) || '0';
        const rootV = javascriptGenerator.valueToCode(block, 'ROOT_V', javascriptGenerator.ORDER_MEMBER) || '0';
        return `await dsuUnion(${parent}, ${rank}, ${rootU}, ${rootV});\n`;
    };
}

/**
 * Define generators for variable and list blocks
 */
export function defineDataGenerators() {
    // Variables
    javascriptGenerator.forBlock["variables_get"] = function (block) {
        const varName = javascriptGenerator.nameDB_.getName(
            block.getFieldValue('VAR'),
            Blockly.Names.NameType.VARIABLE
        );
        return [varName, javascriptGenerator.ORDER_ATOMIC];
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
