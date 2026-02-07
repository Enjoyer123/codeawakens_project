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
            // Simply dict[key] = value
            // For parent dict updates in Prim, we might loose visualization, but clean code is priority.
            // If we want visualization line `showMSTEdges`, we should inject it cleanly?
            // User wants "clean code".
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
      console.log('[DEBUG-MST] Updated parent[' + keyVar + '] = ' + ${value} + '. Showing edges...');
      const currentState = getCurrentGameState();
      if (currentState && currentState.currentScene) {
        showMSTEdges(currentState.currentScene, dictVar);
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
         console.warn('[DEBUG-MST] No scene found for visualization');
      }
    } else {
      console.warn('[DEBUG-MST] Invalid parent dict for key: ' + keyVar);
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
    if (dictVar && (typeof dictVar === 'object' || typeof dictVar === 'function')) {
      dictVar[keyVar] = (${value});
      console.log('[DEBUG-DICT-SET] Set ' + keyVar + ' = ' + ${value});
    } else {
      console.warn('[DEBUG-DICT-SET] Invalid dict for key: ' + keyVar);
    }
  } catch (e) {
    console.warn('dict_set error:', e);
  }
})();\n`;
    };

    javascriptGenerator.forBlock["dict_get"] = function (block) {
        const dict = javascriptGenerator.valueToCode(block, 'DICT', javascriptGenerator.ORDER_MEMBER) || '{}';
        const key = javascriptGenerator.valueToCode(block, 'KEY', javascriptGenerator.ORDER_MEMBER) || 'null';
        const keyCodeCoerced = coerceRcKeyCode(key);

        // Clean Mode
        if (javascriptGenerator.isCleanMode) {
            return [`${dict}[${keyCodeCoerced}]`, javascriptGenerator.ORDER_MEMBER];
        }

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
            const varId = block.getFieldValue('VAR'); // Get ID
            const varModel = block.workspace.getVariableById(varId); // Get Model
            const rawName = varModel ? varModel.name : 'unknown_var'; // Get Name

            // Check if declared
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

        // Check if updating MST_weight
        // We must check code variable name properly used in the block.
        // The most robust way is to lookup the variable model by ID.
        let variableName = '';
        try {
            const varId = block.getFieldValue('VAR');
            const variableModel = block.workspace.getVariableById(varId);
            if (variableModel) {
                variableName = variableModel.name;
            }
            // Enable logging to debug
            console.log(`[GEN-DEBUG] variables_set: ID=${varId}, Name=${variableName}, Model Found=${!!variableModel}`);
        } catch (e) {
            console.warn('Error looking up variable name:', e);
        }

        // Fallback if model lookup fails (e.g. during some export processes)
        if (!variableName) {
            variableName = block.getField('VAR') ? block.getField('VAR').getText() : '';
            console.log(`[GEN-DEBUG] Fallback Name=${variableName}`);
        }

        // Console log to debug what we are seeing
        // console.log('[DEBUG-GEN] variables_set for:', variableName);

        // Check if updating MST_weight (Case insensitive and trimmed)
        const normalizedVarName = (variableName || '').trim();
        const isMST = normalizedVarName.toLowerCase() === 'mst_weight' || normalizedVarName === 'MST_weight';

        if (isMST) {
            console.log('[GEN-DEBUG] MATCHED MST_weight (Fuzzy)! Injecting update code...');
            code += `console.log('!!! DEBUG-MST-WEIGHT-BLOCK START !!!');\n`;
            code += `console.log('Variable used: ${varName}');\n`;
            code += `if (typeof updateMSTWeight === 'function') { \n`;
            code += `  console.log('Calling updateMSTWeight...');\n`;
            code += `  updateMSTWeight(${varName}); \n`;
            code += `} else { console.warn('updateMSTWeight NOT FOUND'); }\n`;
            code += `console.log('[DEBUG-MST-WEIGHT] Updated MST_weight = ' + ${varName});\n`;
        } else {
            console.log(`[GEN-DEBUG] Ignored variable set: "${variableName}" (ID=${block.getFieldValue('VAR')})`);
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
