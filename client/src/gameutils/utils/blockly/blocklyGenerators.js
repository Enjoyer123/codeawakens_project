// Blockly JavaScript Generators
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";
import { getCurrentGameState } from '../gameUtils';

// Dictionary generators
function defineDictionaryGenerators() {
  console.log('🔧 Registering dictionary generators...');

  // Coerce miswired dictionary key code into the intended "r"/"c" string keys.
  // Users often drop variable blocks like G/C/D (or renamed variants like c2, g_ , (G)) instead of text blocks.
  const coerceRcKeyCode = (keyCode) => {
    try {
      let s = String(keyCode || '').trim();
      // Strip wrapping parentheses that sometimes appear in generated expressions
      while (s.startsWith('(') && s.endsWith(')')) {
        s = s.slice(1, -1).trim();
      }
      // If it's already quoted "r"/"c", keep it
      if (/^['"]r['"]$/i.test(s)) return `'r'`;
      if (/^['"]c['"]$/i.test(s)) return `'c'`;
      // Get first alphabetic char from the code (handles g_, c2, goalKeyR, etc.)
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

    // Check if setting parent dictionary (for Prim's algorithm MST visualization)
    const dictCode = dict.trim();
    const isParent = dictCode.includes('parent') || dictCode.includes('Parent');

    if (isParent) {
      // Update MST edges visualization after setting parent with delay (like Kruskal)
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
    // Safe get: avoid crashing when dict is undefined/null
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

  // DSU operations for Kruskal's algorithm
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

  console.log('✅ Dictionary generators registered:', Object.keys(javascriptGenerator.forBlock).filter(k => k.startsWith('dict_') || k.startsWith('dsu_')));
}

export function defineAllGenerators() {
  console.log('[defineAllGenerators] Starting generator definition...');
  // Dictionary generators (must be called first)
  defineDictionaryGenerators();

  const originalGenerators = {};
  const saveGen = (type) => {
    if (javascriptGenerator.forBlock[type]) {
      originalGenerators[type] = javascriptGenerator.forBlock[type];
    }
  };

  // Variables: safe get to avoid ReferenceError for undeclared globals (common when learners forget to initialize a var)
  // NOTE: `typeof x` is safe even if x was never declared (in non-TDZ cases), which is how most Blockly code runs here.
  javascriptGenerator.forBlock["variables_get"] = function (block) {
    const varName = javascriptGenerator.nameDB_.getName(
      block.getFieldValue('VAR'),
      Blockly.Names.NameType.VARIABLE
    );
    return [varName, javascriptGenerator.ORDER_ATOMIC];
  };

  // Movement generators
  javascriptGenerator.forBlock["move_forward"] = function (block) {
    return "await moveForward();\n";
  };

  javascriptGenerator.forBlock["turn_left"] = function (block) {
    return "await turnLeft();\n";
  };

  javascriptGenerator.forBlock["turn_right"] = function (block) {
    return "await turnRight();\n";
  };

  javascriptGenerator.forBlock["hit"] = function (block) {
    return "await hit();\n";
  };

  javascriptGenerator.forBlock["move_to_node"] = function (block) {
    const nodeId = javascriptGenerator.valueToCode(block, 'NODE_ID', javascriptGenerator.ORDER_ATOMIC) || '0';
    return `await moveToNode(${nodeId});\n`;
  };

  javascriptGenerator.forBlock["move_along_path"] = function (block) {
    const path = javascriptGenerator.valueToCode(block, 'PATH', javascriptGenerator.ORDER_NONE) || '[]';
    return `await moveAlongPath(${path});\n`;
  };

  // Logic generators
  javascriptGenerator.forBlock["if_else"] = function (block) {
    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', javascriptGenerator.ORDER_NONE) || 'false';
    const ifCode = javascriptGenerator.statementToCode(block, 'IF_DO');
    const elseCode = javascriptGenerator.statementToCode(block, 'ELSE_DO');
    // Blockly automatically handles next blocks via statementToCode in parent generators
    // The parent block generator (e.g., procedures_defreturn) will call statementToCode
    // which will automatically process the next connection chain
    return `if (${condition}) {\n${ifCode}} else {\n${elseCode}}\n`;
  };

  javascriptGenerator.forBlock["if_only"] = function (block) {
    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', javascriptGenerator.ORDER_NONE) || 'false';
    const doCode = javascriptGenerator.statementToCode(block, 'DO');
    return `if (${condition}) {\n${doCode}}\n`;
  };

  javascriptGenerator.forBlock["if_return"] = function (block) {
    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', javascriptGenerator.ORDER_NONE) || 'false';
    return `if (${condition}) {\n  return;\n}\n`;
  };

  javascriptGenerator.forBlock["logic_compare"] = function (block) {
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_ATOMIC);
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_ATOMIC);
    const operator = block.getFieldValue('OP');

    const valueA = (a && a.trim()) ? a : '0';
    const valueB = (b && b.trim()) ? b : '0';

    let op;
    switch (operator) {
      case 'EQ': op = '=='; break;
      case 'NEQ': op = '!='; break;
      case 'LT': op = '<'; break;
      case 'LTE': op = '<='; break;
      case 'GT': op = '>'; break;
      case 'GTE': op = '>='; break;
      default: op = '==';
    }

    const code = `(function() {
      const _vA = ${valueA};
      const _vB = ${valueB};
      const _nA = Number(_vA);
      const _nB = Number(_vB);
      const _res = _nA ${op} _nB;
      // Only log numeric comparisons to avoid spamming string/null comparisons.
      // We log evaluated values to avoid code explosion from logging raw source strings.
      if (!isNaN(_nA) && !isNaN(_nB)) {
        console.log('[DEBUG-COMPARE] ' + _nA + ' ${op} ' + _nB + ' result:', _res);
      }
      return _res;
    })()`;
    return [code, javascriptGenerator.ORDER_RELATIONAL];
  };

  javascriptGenerator.forBlock["logic_boolean"] = function (block) {
    const bool = block.getFieldValue('BOOL');
    return [`${bool === 'TRUE'}`, javascriptGenerator.ORDER_ATOMIC];
  };

  javascriptGenerator.forBlock["logic_null"] = function (block) {
    return ["null", javascriptGenerator.ORDER_ATOMIC];
  };

  javascriptGenerator.forBlock["logic_negate"] = function (block) {
    const bool = javascriptGenerator.valueToCode(block, 'BOOL', javascriptGenerator.ORDER_LOGICAL_NOT) || 'false';
    return [`(!${bool})`, javascriptGenerator.ORDER_LOGICAL_NOT];
  };

  javascriptGenerator.forBlock["logic_operation"] = function (block) {
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_LOGICAL_AND) || 'false';
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_LOGICAL_AND) || 'false';
    const operator = block.getFieldValue('OP');

    const op = operator === 'AND' ? '&&' : '||';
    const order = operator === 'AND' ? javascriptGenerator.ORDER_LOGICAL_AND : javascriptGenerator.ORDER_LOGICAL_OR;

    return [`(${a} ${op} ${b})`, order];
  };

  javascriptGenerator.forBlock["found_monster"] = function (block) {
    return ['foundMonster()', javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["can_move_forward"] = function (block) {
    return ['canMoveForward()', javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["near_pit"] = function (block) {
    return ['nearPit()', javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["at_goal"] = function (block) {
    return ['atGoal()', javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  // Loop generators
  javascriptGenerator.forBlock["repeat"] = function (block) {
    const times = block.getFieldValue('TIMES');
    const doCode = javascriptGenerator.statementToCode(block, 'DO');
    return `for (let i = 0; i < ${times}; i++) {\n${doCode}}\n`;
  };

  javascriptGenerator.forBlock["while_loop"] = function (block) {
    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', javascriptGenerator.ORDER_NONE) || 'false';
    const doCode = javascriptGenerator.statementToCode(block, 'DO');
    // Special logging for Dijkstra PQ loop
    const isPQCheck = condition.includes('PQ') || condition.includes('pq');
    const logTag = isPQCheck ? '[DEBUG-LOOP-PQ]' : '[DEBUG-LOOP-WHILE]';

    return `
    console.log(${JSON.stringify(logTag)} + " Entering loop - condition: " + ${JSON.stringify(condition)});
    while (${condition}) {
      ${doCode}
      console.log(${JSON.stringify(logTag)} + " Iteration end - re-checking: " + ${JSON.stringify(condition)});
    }
    console.log(${JSON.stringify(logTag)} + " Exited loop");
    \n`;
  };

  // Override controls_for to use LET for recursion safety
  javascriptGenerator.forBlock["controls_for"] = function (block) {
    const variable = javascriptGenerator.nameDB_.getName(
      block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE);
    const from = javascriptGenerator.valueToCode(block, 'FROM',
      javascriptGenerator.ORDER_ASSIGNMENT) || '0';
    const to = javascriptGenerator.valueToCode(block, 'TO',
      javascriptGenerator.ORDER_ASSIGNMENT) || '0';
    const increment = javascriptGenerator.valueToCode(block, 'BY',
      javascriptGenerator.ORDER_ASSIGNMENT) || '1';

    const branch = javascriptGenerator.statementToCode(block, 'DO');

    // Use block-scoped 'let' to ensure safe recursion
    return `
    console.log('[DEBUG-LOOP-FOR] Start:', { var: '${variable}', from: ${from}, to: ${to} });
    for (let ${variable} = ${from}; ${variable} <= ${to}; ${variable} += ${increment}) {
       ${branch}
    }
    console.log('[DEBUG-LOOP-FOR] End:', { var: '${variable}' });
    \n`;
  };

  // Coin generators
  javascriptGenerator.forBlock["collect_coin"] = function (block) {
    return 'await collectCoin();\n';
  };

  javascriptGenerator.forBlock["have_coin"] = function (block) {
    return ['haveCoin()', javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["swap_coins"] = function (block) {
    const index1 = javascriptGenerator.valueToCode(block, 'INDEX1', javascriptGenerator.ORDER_ATOMIC) || '0';
    const index2 = javascriptGenerator.valueToCode(block, 'INDEX2', javascriptGenerator.ORDER_ATOMIC) || '0';
    return `await swapCoins(${index1}, ${index2});\n`;
  };

  javascriptGenerator.forBlock["compare_coins"] = function (block) {
    const index1 = javascriptGenerator.valueToCode(block, 'INDEX1', javascriptGenerator.ORDER_ATOMIC) || '0';
    const index2 = javascriptGenerator.valueToCode(block, 'INDEX2', javascriptGenerator.ORDER_ATOMIC) || '0';
    const operator = block.getFieldValue('OP');
    return [`compareCoins(${index1}, ${index2}, '${operator}')`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["get_coin_value"] = function (block) {
    const index = javascriptGenerator.valueToCode(block, 'INDEX', javascriptGenerator.ORDER_ATOMIC) || '0';
    return [`getCoinValue(${index})`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["coin_count"] = function (block) {
    return ['getCoinCount()', javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["is_sorted"] = function (block) {
    const order = block.getFieldValue('ORDER');
    return [`isSorted('${order}')`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["for_each_coin"] = function (block) {
    const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE);
    const branch = javascriptGenerator.statementToCode(block, 'DO');

    const code = `
    const coins = getPlayerCoins();
    for (let coinIndex = 0; coinIndex < coins.length; coinIndex++) {
        const ${variable} = coins[coinIndex];
        ${branch}
    }
    `;
    return code;
  };

  javascriptGenerator.forBlock["for_index"] = function (block) {
    const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE);
    const from = block.getFieldValue('FROM');
    const to = block.getFieldValue('TO');
    const branch = javascriptGenerator.statementToCode(block, 'DO');

    const code = `
    for (let ${variable} = ${from}; ${variable} <= ${to}; ${variable}++) {
        ${branch}
    }
    `;
    return code;
  };

  javascriptGenerator.forBlock["for_loop_dynamic"] = function (block) {
    const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE);
    const from = javascriptGenerator.valueToCode(block, 'FROM', javascriptGenerator.ORDER_ATOMIC) || '0';
    const to = javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_ATOMIC) || '0';
    const branch = javascriptGenerator.statementToCode(block, 'DO');

    // IMPORTANT:
    // - Do NOT declare helper vars like `const fromValue...` here.
    //   Blockly's generator scrubber already appends next-block code and can cause duplication;
    //   helper var redeclarations then become a SyntaxError.
    // - Inline `from`/`to` directly in the `for` header (safe for nesting).
    const normFrom = `((v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; })(${from})`;
    const normTo = `((v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; })(${to})`;
    const code = `
    for (let ${variable} = ${normFrom}; ${variable} <= ${normTo}; ${variable}++) {
        ${branch}
    }
    `;
    return code;
  };

  // Math generators
  javascriptGenerator.forBlock["math_number"] = function (block) {
    const num = block.getFieldValue('NUM');
    return [`${num}`, javascriptGenerator.ORDER_ATOMIC];
  };

  javascriptGenerator.forBlock["math_arithmetic"] = function (block) {
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_ATOMIC);
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_ATOMIC);
    const operator = block.getFieldValue('OP');

    const valueA = (a && a.trim()) ? a : '0';
    const valueB = (b && b.trim()) ? b : '0';

    let op;
    switch (operator) {
      case 'ADD': op = '+'; break;
      case 'MINUS': op = '-'; break;
      case 'MULTIPLY': op = '*'; break;
      case 'DIVIDE': op = '/'; break;
      case 'MODULO': op = '%'; break;
      default: op = '+';
    }

    return [`(${valueA} ${op} ${valueB})`, javascriptGenerator.ORDER_ATOMIC];
  };

  javascriptGenerator.forBlock["math_max"] = function (block) {
    console.log('[GENERATOR] math_max being called');
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_ATOMIC) || '0';
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_ATOMIC) || '0';

    const valueA = (a && a.trim()) ? a : '0';
    const valueB = (b && b.trim()) ? b : '0';

    try {
      // Check if this is inside a knapsack function
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

      if (isKnapsack) {
        // Find function definition block for knapsack parameters
        let funcDefBlock = block.getParent();
        while (funcDefBlock && funcDefBlock.type !== 'procedures_defreturn') {
          funcDefBlock = funcDefBlock.getParent();
        }

        if (funcDefBlock) {
          let iParamName = 'i';
          let jParamName = 'j';
          try {
            if (funcDefBlock.mutationToDom) {
              const mutation = funcDefBlock.mutationToDom();
              const argNodes = mutation && (mutation.querySelectorAll ? mutation.querySelectorAll('arg') : mutation.getElementsByTagName('arg'));
              if (argNodes && argNodes.length >= 4) {
                const iArg = argNodes[2] && argNodes[2].getAttribute ? argNodes[2].getAttribute('name') : null;
                const jArg = argNodes[3] && argNodes[3].getAttribute ? argNodes[3].getAttribute('name') : null;
                if (iArg) iParamName = javascriptGenerator.nameDB_.getName(iArg, Blockly.Names.NameType.VARIABLE);
                if (jArg) jParamName = javascriptGenerator.nameDB_.getName(jArg, Blockly.Names.NameType.VARIABLE);
              }
            }
          } catch (e) { }

          let itemVarName = null;
          let capVarName = null;
          try {
            let p = block.getParent();
            while (p) {
              if (p.type === 'for_loop_dynamic' || p.type === 'for_index' || p.type === 'controls_for') {
                const varField = p.getFieldValue && p.getFieldValue('VAR');
                if (varField) {
                  const resolved = javascriptGenerator.nameDB_.getName(varField, Blockly.Names.NameType.VARIABLE);
                  if (resolved === 'item') itemVarName = resolved;
                  if (resolved === 'cap') capVarName = resolved;
                }
              }
              p = p.getParent();
            }
          } catch (e) { }

          const iState = itemVarName || iParamName;
          const jState = capVarName || jParamName;
          return [`await knapsackMaxWithVisual(${valueA}, ${valueB}, ${iState}, ${jState})`, javascriptGenerator.ORDER_FUNCTION_CALL];
        }
      }

      // Default to Ant DP for non-knapsack max blocks (to ensure debug logs run)
      // Attempt to resolve loop variables r and c
      let rVarName = 'typeof r !== "undefined" ? r : 0';
      let cVarName = 'typeof c !== "undefined" ? c : 0';
      try {
        let p = block.getParent();
        while (p) {
          if (p.type === 'for_loop_dynamic' || p.type === 'for_index' || p.type === 'controls_for') {
            const varField = p.getFieldValue && p.getFieldValue('VAR');
            if (varField) {
              const resolved = javascriptGenerator.nameDB_.getName(varField, Blockly.Names.NameType.VARIABLE);
              if (resolved === 'r') rVarName = 'r';
              if (resolved === 'c') cVarName = 'c';
            }
          }
          p = p.getParent();
        }
      } catch (e) { }

      // Injected log to confirm call
      const logCode = `console.log('--- Calling antMaxWithVisual at (' + (${rVarName}) + ',' + (${cVarName}) + ') ---')`;
      return [`(${logCode}, await antMaxWithVisual(${valueA}, ${valueB}, ${rVarName}, ${cVarName}))`, javascriptGenerator.ORDER_FUNCTION_CALL];

    } catch (e) {
      console.error('Generator error in math_max:', e);
    }

    return [`Math.max(${valueA}, ${valueB})`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };
  saveGen("math_max");

  javascriptGenerator.forBlock["math_min"] = function (block) {
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_ATOMIC);
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_ATOMIC);

    const valueA = (a && a.trim()) ? a : '0';
    const valueB = (b && b.trim()) ? b : '0';

    return [`Math.min(${valueA}, ${valueB})`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["math_single"] = function (block) {
    const operator = block.getFieldValue('OP');
    const num = javascriptGenerator.valueToCode(block, 'NUM', javascriptGenerator.ORDER_NONE) || '0';
    let code;
    switch (operator) {
      case 'CEIL': code = `Math.ceil(${num})`; break;
      case 'FLOOR': code = `Math.floor(${num})`; break;
      case 'ROUND': code = `Math.round(${num})`; break;
      case 'ROOT': code = `Math.sqrt(${num})`; break;
      default: code = `${num}`;
    }
    return [code, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["math_min_max"] = function (block) {
    const operator = block.getFieldValue('OP');
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_ATOMIC) || '0';
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_ATOMIC) || '0';

    // Wrapped in a self-executing function for safe numeric conversion and logging
    const code = `(function() {
      const _vA = ${a};
      const _vB = ${b};
      const _nA = Number(_vA);
      const _nB = Number(_vB);
      const _res = ${operator === 'MAX' ? 'Math.max(_nA, _nB)' : 'Math.min(_nA, _nB)'};
      if (isNaN(_res)) console.warn('[DEBUG-MATH] math_min_max resulted in NaN:', { a: _nA, b: _nB, op: '${operator}' });
      else if (_nA !== 1000000 || _nB !== 1000000) { // Don't log INF-INF comparisons to avoid spam
         // We log evaluated values to avoid code explosion.
         console.log('[DEBUG-MATH] ' + ${JSON.stringify(operator)} + '(' + _nA + ', ' + _nB + ') result:', _res);
      }
      return _res;
    })()`;
    return [code, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  // Knapsack visual feedback generators
  javascriptGenerator.forBlock["knapsack_select_item"] = function (block) {
    const itemIndex = javascriptGenerator.valueToCode(block, 'ITEM_INDEX', javascriptGenerator.ORDER_NONE) || '0';
    return `await selectKnapsackItemVisual(${itemIndex});\n`;
  };

  javascriptGenerator.forBlock["knapsack_unselect_item"] = function (block) {
    const itemIndex = javascriptGenerator.valueToCode(block, 'ITEM_INDEX', javascriptGenerator.ORDER_NONE) || '0';
    return `await unselectKnapsackItemVisual(${itemIndex});\n`;
  };

  // Subset Sum visual feedback generators
  javascriptGenerator.forBlock["subset_sum_add_warrior_to_side1"] = function (block) {
    const warriorIndex = javascriptGenerator.valueToCode(block, 'WARRIOR_INDEX', javascriptGenerator.ORDER_NONE) || '0';
    return `await addWarriorToSide1Visual(${warriorIndex});\n`;
  };

  // Coin Change visual feedback generators
  javascriptGenerator.forBlock["coin_change_add_warrior_to_selection"] = function (block) {
    const warriorIndex = javascriptGenerator.valueToCode(block, 'WARRIOR_INDEX', javascriptGenerator.ORDER_NONE) || '0';
    return `await addWarriorToSelectionVisual(${warriorIndex});\n`;
  };

  javascriptGenerator.forBlock["coin_change_track_decision"] = function (block) {
    const amount = javascriptGenerator.valueToCode(block, 'AMOUNT', javascriptGenerator.ORDER_NONE) || '0';
    const index = javascriptGenerator.valueToCode(block, 'INDEX', javascriptGenerator.ORDER_NONE) || '0';
    const include = javascriptGenerator.valueToCode(block, 'INCLUDE', javascriptGenerator.ORDER_NONE) || '-1';
    const exclude = javascriptGenerator.valueToCode(block, 'EXCLUDE', javascriptGenerator.ORDER_NONE) || '-1';
    return `trackCoinChangeDecision(${amount}, ${index}, ${include}, ${exclude});\n`;
  };

  javascriptGenerator.forBlock["subset_sum_add_warrior_to_side2"] = function (block) {
    const warriorIndex = javascriptGenerator.valueToCode(block, 'WARRIOR_INDEX', javascriptGenerator.ORDER_NONE) || '0';
    return `await addWarriorToSide2Visual(${warriorIndex});\n`;
  };

  javascriptGenerator.forBlock["text"] = function (block) {
    const text = block.getFieldValue('TEXT');
    return [`"${text}"`, javascriptGenerator.ORDER_ATOMIC];
  };

  javascriptGenerator.forBlock["math_compare"] = function (block) {
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_ATOMIC) || '0';
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_ATOMIC) || '0';
    const operator = block.getFieldValue('OP');

    let op;
    switch (operator) {
      case 'EQ': op = '==='; break;
      case 'NEQ': op = '!=='; break;
      case 'LT': op = '<'; break;
      case 'LTE': op = '<='; break;
      case 'GT': op = '>'; break;
      case 'GTE': op = '>='; break;
      default: op = '===';
    }

    // Wrapped in a self-executing function for safe numeric conversion and logging
    // IMPORTANT: Dijkstra bottleneck depends on (min_cap > capacities[v])
    const code = `(function() {
      const valA = (typeof ${a} === 'number') ? ${a} : Number(${a});
      const valB = (typeof ${b} === 'number') ? ${b} : Number(${b});
      const res = valA ${op} valB;
      // Only log numeric comparisons to avoid spamming string/null comparisons
      if (!isNaN(valA) && !isNaN(valB)) {
        console.log('[DEBUG-COMPARE]', { a: valA, b: valB, op: '${op}', result: res });
      }
      return res;
    })()`;
    return [code, javascriptGenerator.ORDER_RELATIONAL];
  };

  // Variable generators
  javascriptGenerator.forBlock["var_math"] = function (block) {
    const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE);
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

  javascriptGenerator.forBlock["get_var_value"] = function (block) {
    const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE);
    return [variable, javascriptGenerator.ORDER_ATOMIC];
  };

  // Override variables_set to detect MST_weight updates
  javascriptGenerator.forBlock["variables_set"] = function (block) {
    const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE);
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';

    // Check if setting MST_weight variable - use both field value and resolved name
    const varFieldValue = block.getFieldValue('VAR');
    const varName = variable || varFieldValue;
    const varNameLower = String(varName).toLowerCase();

    // Check if setting MST_weight variable - check multiple variations
    // Blockly variable names might have underscores or be camelCase
    const isMSTWeight = varNameLower === 'mst_weight' ||
      varNameLower === 'mstweight' ||
      varNameLower.includes('mst_weight') ||
      varNameLower.includes('mstweight');

    if (isMSTWeight) {
      // Update MST weight state after assignment
      console.log('✅ Detected MST_weight update:', { varName, variable, value });
      return `${variable} = ${value};\nupdateMSTWeight(${variable});\n`;
    }

    // Default behavior
    return `${variable} = ${value};\n`;
  };

  // Person rescue generators
  javascriptGenerator.forBlock["rescue_person_at_node"] = function (block) {
    const nodeId = javascriptGenerator.valueToCode(block, 'NODE_ID', javascriptGenerator.ORDER_ATOMIC) || '0';
    return `await rescuePersonAtNode(${nodeId});\n`;
  };

  javascriptGenerator.forBlock["has_person"] = function (block) {
    return [`hasPerson()`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["person_rescued"] = function (block) {
    return [`personRescued()`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["person_count"] = function (block) {
    return [`getPersonCount()`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["all_people_rescued"] = function (block) {
    return [`allPeopleRescued()`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["for_each_person"] = function (block) {
    const statements = javascriptGenerator.statementToCode(block, 'DO');
    return `for (let i = 0; i < 10; i++) {\n${statements}\n}\n`;
  };

  // Stack generators
  javascriptGenerator.forBlock["push_node"] = function (block) {
    return `await pushNode();\n`;
  };

  javascriptGenerator.forBlock["pop_node"] = function (block) {
    return `await popNode();\n`;
  };

  javascriptGenerator.forBlock["keep_item"] = function (block) {
    return `keepItem();\n`;
  };

  javascriptGenerator.forBlock["has_treasure"] = function (block) {
    return [`hasTreasure()`, javascriptGenerator.ORDER_ATOMIC];
  };

  javascriptGenerator.forBlock["treasure_collected"] = function (block) {
    return [`treasureCollected()`, javascriptGenerator.ORDER_ATOMIC];
  };

  javascriptGenerator.forBlock["stack_empty"] = function (block) {
    return [`stackEmpty()`, javascriptGenerator.ORDER_ATOMIC];
  };

  javascriptGenerator.forBlock["stack_count"] = function (block) {
    return [`stackCount()`, javascriptGenerator.ORDER_ATOMIC];
  };

  // Function generators
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
  // This is needed because we use await inside the function
  javascriptGenerator.forBlock["procedures_defreturn"] = function (block) {
    console.log('[CUSTOM GENERATOR] procedures_defreturn called');
    const name = javascriptGenerator.nameDB_.getName(
      block.getFieldValue('NAME') || 'unnamed',
      Blockly.Names.NameType.PROCEDURE
    );
    console.log('[CUSTOM GENERATOR] Function name:', name);
    const args = [];
    // CRITICAL: Read function parameters ONLY from mutation DOM
    // DO NOT use getVars() because it returns ALL variables in the function body (including loop variables like 'col')
    // We only want parameters from the mutation, not variables from the function body
    try {
      if (block.mutationToDom) {
        const mutation = block.mutationToDom();
        if (mutation) {
          // Use querySelectorAll for better compatibility
          const argNodes = mutation.querySelectorAll ? mutation.querySelectorAll('arg') : mutation.getElementsByTagName('arg');
          console.log('[CUSTOM GENERATOR] Mutation DOM arg nodes:', argNodes.length);
          for (let i = 0; i < argNodes.length; i++) {
            const argNode = argNodes[i];
            const argName = argNode.getAttribute('name');
            if (argName) {
              // Use the argument name directly - it's already a variable name from mutation
              args[i] = javascriptGenerator.nameDB_.getName(
                argName,
                Blockly.Names.NameType.VARIABLE
              );
            }
          }
        } else {
          console.warn('[CUSTOM GENERATOR] mutationToDom() returned null or undefined');
        }
      } else {
        console.warn('[CUSTOM GENERATOR] block.mutationToDom is not a function');
      }

      // DO NOT use getVars() as fallback - it includes loop variables and other function body variables
      // Only use mutation DOM to get parameters
      console.log('[CUSTOM GENERATOR] Final args (from mutation only):', args);
    } catch (e) {
      console.error('[CUSTOM GENERATOR] Error reading function parameters:', e);
      // If there's an error, args will remain empty array, which is correct for parameterless functions
    }

    // Add parameter validation for knapsack function
    let paramValidation = '';
    if (name.toLowerCase().includes('knapsack') && args.length === 4) {
      // For knapsack(w, v, i, j), validate parameters
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
      // Declare local variables that are used but not parameters
      const includeVar = javascriptGenerator.nameDB_.getName('include', Blockly.Names.NameType.VARIABLE);
      const excludeVar = javascriptGenerator.nameDB_.getName('exclude', Blockly.Names.NameType.VARIABLE);
      const includeResultVar = javascriptGenerator.nameDB_.getName('includeResult', Blockly.Names.NameType.VARIABLE);
      localVarDeclarations = `let ${includeVar}, ${excludeVar}, ${includeResultVar};\n`;
    }

    const argsString = args.length > 0 ? args.join(', ') : '';
    const branch = javascriptGenerator.statementToCode(block, 'STACK');

    // Generate async function
    // The branch already contains return statements from procedures_return blocks
    const code = `async function ${name}(${argsString}) {\n${paramValidation}${localVarDeclarations}${branch}}`;
    console.log('[CUSTOM GENERATOR] Generated code:', code.substring(0, 200));
    console.log('[CUSTOM GENERATOR] Generator function:', typeof javascriptGenerator.forBlock["procedures_defreturn"]);
    return code;
  };

  // Verify that our generator was set
  console.log('[defineAllGenerators] procedures_defreturn generator set:', typeof javascriptGenerator.forBlock["procedures_defreturn"]);

  // Return statement generator for procedures_defreturn
  javascriptGenerator.forBlock["procedures_return"] = function (block) {
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE) || 'null';

    // Check if we're inside a knapsack function and the return value uses math_max
    // If so, add visual feedback for item selection
    try {
      let parentBlock = block.getParent();
      let isKnapsack = false;

      // Walk up the block tree to find the function definition
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

      // If this is knapsack and value contains math_max, it's the final return
      // We'll add visual feedback by wrapping the return value
      if (isKnapsack && typeof value === 'string' && value.includes('Math.max')) {
        // Extract the variable i from the function context (would need to parse, but simpler approach)
        // For now, we'll just return normally - visual feedback will be handled differently
        return `return ${value};\n`;
      }
    } catch (e) {
      // If any error, just return normally
      console.debug('Error checking knapsack context:', e);
    }

    return `return ${value};\n`;
  };

  // Procedure call generators - CRITICAL: Handle "unnamed" and invalid procedures
  javascriptGenerator.forBlock["procedures_callreturn"] = function (block) {
    // Get procedure name - try multiple methods
    let procedureName = null;
    let isNQueenHelper = false;

    try {
      // CRITICAL: For N-Queen helper functions, check mutation FIRST (most reliable source)
      // Mutation has: <mutation name="safe"> or <mutation name="place"> or <mutation name="remove">
      if (block.mutationToDom) {
        try {
          const mutation = block.mutationToDom();
          if (mutation) {
            // Try multiple ways to get the name attribute
            let mutationName = null;
            if (mutation.getAttribute) {
              mutationName = mutation.getAttribute('name');
            } else if (mutation.getAttributeNS) {
              mutationName = mutation.getAttributeNS(null, 'name');
            } else if (mutation.attributes && mutation.attributes.name) {
              mutationName = mutation.attributes.name.value;
            } else if (mutation.querySelector) {
              // If mutation is a document, try to get the mutation element
              const mutationEl = mutation.querySelector ? mutation.querySelector('mutation') : mutation;
              if (mutationEl && mutationEl.getAttribute) {
                mutationName = mutationEl.getAttribute('name');
              }
            }

            console.log(`[blocklyGenerators] 🔍 Mutation element:`, mutation);
            console.log(`[blocklyGenerators] 🔍 Mutation name extracted: "${mutationName}"`);

            // For N-Queen helper functions, use mutation name directly
            if (mutationName && (mutationName === 'safe' || mutationName === 'place' || mutationName === 'remove')) {
              procedureName = mutationName;
              isNQueenHelper = true;
              console.log(`[blocklyGenerators] ✅ Found N-Queen helper name from mutation attribute: ${procedureName}`);
            }
          }
        } catch (e) {
          console.warn('Error reading mutation:', e);
        }
      }

      // CRITICAL: Check NAME field (should match mutation) - but ONLY if mutation didn't give us a name
      // For N-Queen helper functions, we trust mutation/NAME field over getProcParam()
      if (!procedureName) {
        const nameField = block.getField('NAME');
        if (nameField) {
          const nameFromField = nameField.getValue();
          if (nameFromField === 'safe' || nameFromField === 'place' || nameFromField === 'remove') {
            procedureName = nameFromField;
            isNQueenHelper = true;
            console.log(`[blocklyGenerators] ✅ Found N-Queen helper name from NAME field: "${procedureName}"`);
          } else if (nameFromField) {
            procedureName = nameFromField;
            console.log(`[blocklyGenerators] procedures_callreturn: Got name from NAME field: "${procedureName}"`);
          }
        }
      }

      // Fallback to getFieldValue directly
      if (!procedureName) {
        const nameFromGetFieldValue = block.getFieldValue('NAME');
        if (nameFromGetFieldValue === 'safe' || nameFromGetFieldValue === 'place' || nameFromGetFieldValue === 'remove') {
          procedureName = nameFromGetFieldValue;
          isNQueenHelper = true;
          console.log(`[blocklyGenerators] ✅ Found N-Queen helper name from getFieldValue: "${procedureName}"`);
        } else if (nameFromGetFieldValue) {
          procedureName = nameFromGetFieldValue;
          console.log(`[blocklyGenerators] procedures_callreturn: Got name from getFieldValue: "${procedureName}"`);
        }
      }

      // CRITICAL: For N-Queen helper functions, NEVER use getProcParam() as it resolves to wrong procedure
      // getProcParam() may resolve to 'solve' from workspace procedure map
      // Only use getProcParam() if we don't have a name yet AND it's not an N-Queen helper function
      if (!procedureName && !isNQueenHelper && typeof block.getProcParam === 'function') {
        procedureName = block.getProcParam();
        console.log(`[blocklyGenerators] procedures_callreturn: Got name from getProcParam: "${procedureName}"`);
      }

      // CRITICAL: Final check BEFORE generating code - if procedureName is 'solve' but mutation/NAME says safe/place/remove
      // This prevents Blockly from resolving to wrong procedure name
      if (procedureName === 'solve') {
        // Check mutation first
        if (block.mutationToDom) {
          try {
            const mutation = block.mutationToDom();
            if (mutation) {
              // Try multiple ways to get the name attribute
              let mutationName = null;
              if (mutation.getAttribute) {
                mutationName = mutation.getAttribute('name');
              } else if (mutation.getAttributeNS) {
                mutationName = mutation.getAttributeNS(null, 'name');
              } else if (mutation.attributes && mutation.attributes.name) {
                mutationName = mutation.attributes.name.value;
              } else if (mutation.querySelector) {
                const mutationEl = mutation.querySelector ? mutation.querySelector('mutation') : mutation;
                if (mutationEl && mutationEl.getAttribute) {
                  mutationName = mutationEl.getAttribute('name');
                }
              }

              if (mutationName === 'safe' || mutationName === 'place' || mutationName === 'remove') {
                console.warn(`[blocklyGenerators] ⚠️ Override: procedureName was 'solve' but mutation says '${mutationName}'. Using mutation.`);
                procedureName = mutationName;
              }
            }
          } catch (e) {
            console.warn('Error checking mutation in final check:', e);
          }
        }

        // Also check NAME field
        if (procedureName === 'solve') {
          const nameFieldFinal = block.getField('NAME');
          if (nameFieldFinal) {
            const nameFromFieldFinal = nameFieldFinal.getValue();
            if (nameFromFieldFinal === 'safe' || nameFromFieldFinal === 'place' || nameFromFieldFinal === 'remove') {
              console.warn(`[blocklyGenerators] ⚠️ Override: procedureName was 'solve' but NAME field says '${nameFromFieldFinal}'. Using NAME field.`);
              procedureName = nameFromFieldFinal;
            }
          }
        }
      }

      // Debug logging for ALL procedure calls (to debug N-Queen issue)
      console.log(`[blocklyGenerators] procedures_callreturn: Final procedureName = "${procedureName}"`);

      // Debug logging for N-Queen helper functions
      if (procedureName === 'safe' || procedureName === 'place' || procedureName === 'remove') {
        console.log(`[blocklyGenerators] ✅ Confirmed N-Queen helper function: ${procedureName}`);
      }
    } catch (e) {
      console.warn('Error getting procedure name:', e);
    }

    // Validate procedure name
    // CRITICAL: Don't fallback for N-Queen helper functions (safe, place, remove)
    // These will be injected into the generated code
    // Update isNQueenHelper flag if we have a procedure name
    if (procedureName && (procedureName === 'safe' || procedureName === 'place' || procedureName === 'remove')) {
      isNQueenHelper = true;
    }

    if (!procedureName || procedureName === 'unnamed' || procedureName === 'undefined' ||
      (typeof procedureName === 'string' && procedureName.trim() === '')) {
      // Invalid procedure name - try to get from workspace procedure map
      // BUT skip fallback for N-Queen helper functions
      if (!isNQueenHelper) {
        console.warn('Procedure call block has invalid name, trying to fix:', procedureName);

        try {
          const workspace = block.workspace;
          if (workspace) {
            const procedureMap = workspace.getProcedureMap();
            if (procedureMap) {
              const procedures = procedureMap.getProcedures();
              if (procedures.length > 0) {
                // Use first available procedure
                procedureName = procedures[0].getName();
                console.log('Using first available procedure:', procedureName);
              } else {
                // No procedures available - return null
                console.warn('No procedures available in workspace');
                return ['null', javascriptGenerator.ORDER_ATOMIC];
              }
            }
          }
        } catch (e) {
          console.warn('Error trying to fix procedure name:', e);
          return ['null', javascriptGenerator.ORDER_ATOMIC];
        }
      } else {
        // For N-Queen helper functions, allow them even if not defined
        // They will be injected into the generated code
        console.log(`[blocklyGenerators] ✅ Allowing N-Queen helper function (will be injected): ${procedureName}`);
      }

      // If still invalid after trying to fix (and not N-Queen helper)
      const finalIsNQueenHelper = procedureName === 'safe' || procedureName === 'place' || procedureName === 'remove';
      if (!finalIsNQueenHelper && (!procedureName || procedureName === 'unnamed' || procedureName === 'undefined' ||
        (typeof procedureName === 'string' && procedureName.trim() === ''))) {
        return ['null', javascriptGenerator.ORDER_ATOMIC];
      }
    }

    // Get arguments
    const args = [];
    if (block.arguments_ && block.arguments_.length > 0) {
      for (let i = 0; i < block.arguments_.length; i++) {
        const argCode = javascriptGenerator.valueToCode(block, 'ARG' + i, javascriptGenerator.ORDER_NONE) || 'null';
        args.push(argCode);
      }
    }

    const argsString = args.length > 0 ? args.join(', ') : '';
    // Since the function is async, we need to await it
    // Wrap in parentheses to allow await in expression context
    return [`(await ${procedureName}(${argsString}))`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["procedures_callnoreturn"] = function (block) {
    // Get procedure name - try multiple methods
    let procedureName = null;
    let isNQueenHelper = false;

    try {
      // CRITICAL: For N-Queen helper functions, check mutation FIRST (most reliable source)
      // Mutation has: <mutation name="safe"> or <mutation name="place"> or <mutation name="remove">
      if (block.mutationToDom) {
        try {
          const mutation = block.mutationToDom();
          if (mutation) {
            // Try multiple ways to get the name attribute
            let mutationName = null;
            if (mutation.getAttribute) {
              mutationName = mutation.getAttribute('name');
            } else if (mutation.getAttributeNS) {
              mutationName = mutation.getAttributeNS(null, 'name');
            } else if (mutation.attributes && mutation.attributes.name) {
              mutationName = mutation.attributes.name.value;
            } else if (mutation.querySelector) {
              // If mutation is a document, try to get the mutation element
              const mutationEl = mutation.querySelector ? mutation.querySelector('mutation') : mutation;
              if (mutationEl && mutationEl.getAttribute) {
                mutationName = mutationEl.getAttribute('name');
              }
            }

            console.log(`[blocklyGenerators] 🔍 Mutation element (no-return):`, mutation);
            console.log(`[blocklyGenerators] 🔍 Mutation name extracted (no-return): "${mutationName}"`);

            // For N-Queen helper functions, use mutation name directly
            if (mutationName && (mutationName === 'safe' || mutationName === 'place' || mutationName === 'remove')) {
              procedureName = mutationName;
              isNQueenHelper = true;
              console.log(`[blocklyGenerators] ✅ Found N-Queen helper name from mutation attribute (no-return): ${procedureName}`);
            }
          }
        } catch (e) {
          console.warn('Error reading mutation (no-return):', e);
        }
      }

      // CRITICAL: Check NAME field (should match mutation) - but ONLY if mutation didn't give us a name
      // For N-Queen helper functions, we trust mutation/NAME field over getProcParam()
      if (!procedureName) {
        const nameField = block.getField('NAME');
        if (nameField) {
          const nameFromField = nameField.getValue();
          if (nameFromField === 'safe' || nameFromField === 'place' || nameFromField === 'remove') {
            procedureName = nameFromField;
            isNQueenHelper = true;
            console.log(`[blocklyGenerators] ✅ Found N-Queen helper name from NAME field (no-return): "${procedureName}"`);
          } else if (nameFromField) {
            procedureName = nameFromField;
            console.log(`[blocklyGenerators] procedures_callnoreturn: Got name from NAME field: "${procedureName}"`);
          }
        }
      }

      // Fallback to getFieldValue directly
      if (!procedureName) {
        const nameFromGetFieldValue = block.getFieldValue('NAME');
        if (nameFromGetFieldValue === 'safe' || nameFromGetFieldValue === 'place' || nameFromGetFieldValue === 'remove') {
          procedureName = nameFromGetFieldValue;
          isNQueenHelper = true;
          console.log(`[blocklyGenerators] ✅ Found N-Queen helper name from getFieldValue (no-return): "${procedureName}"`);
        } else if (nameFromGetFieldValue) {
          procedureName = nameFromGetFieldValue;
          console.log(`[blocklyGenerators] procedures_callnoreturn: Got name from getFieldValue: "${procedureName}"`);
        }
      }

      // CRITICAL: For N-Queen helper functions, NEVER use getProcParam() as it resolves to wrong procedure
      // getProcParam() may resolve to 'solve' from workspace procedure map
      // Only use getProcParam() if we don't have a name yet AND it's not an N-Queen helper function
      if (!procedureName && !isNQueenHelper && typeof block.getProcParam === 'function') {
        procedureName = block.getProcParam();
        console.log(`[blocklyGenerators] procedures_callnoreturn: Got name from getProcParam: "${procedureName}"`);
      }

      // CRITICAL: Final check BEFORE generating code - if procedureName is 'solve' but mutation/NAME says safe/place/remove
      // This prevents Blockly from resolving to wrong procedure name
      if (procedureName === 'solve') {
        // Check mutation first
        if (block.mutationToDom) {
          try {
            const mutation = block.mutationToDom();
            if (mutation) {
              // Try multiple ways to get the name attribute
              let mutationName = null;
              if (mutation.getAttribute) {
                mutationName = mutation.getAttribute('name');
              } else if (mutation.getAttributeNS) {
                mutationName = mutation.getAttributeNS(null, 'name');
              } else if (mutation.attributes && mutation.attributes.name) {
                mutationName = mutation.attributes.name.value;
              } else if (mutation.querySelector) {
                const mutationEl = mutation.querySelector ? mutation.querySelector('mutation') : mutation;
                if (mutationEl && mutationEl.getAttribute) {
                  mutationName = mutationEl.getAttribute('name');
                }
              }

              if (mutationName === 'safe' || mutationName === 'place' || mutationName === 'remove') {
                console.warn(`[blocklyGenerators] ⚠️ Override: procedureName was 'solve' but mutation says '${mutationName}' (no-return). Using mutation.`);
                procedureName = mutationName;
              }
            }
          } catch (e) {
            console.warn('Error checking mutation in final check (no-return):', e);
          }
        }

        // Also check NAME field
        if (procedureName === 'solve') {
          const nameFieldFinal = block.getField('NAME');
          if (nameFieldFinal) {
            const nameFromFieldFinal = nameFieldFinal.getValue();
            if (nameFromFieldFinal === 'safe' || nameFromFieldFinal === 'place' || nameFromFieldFinal === 'remove') {
              console.warn(`[blocklyGenerators] ⚠️ Override: procedureName was 'solve' but NAME field says '${nameFromFieldFinal}' (no-return). Using NAME field.`);
              procedureName = nameFromFieldFinal;
            }
          }
        }
      }

      // Debug logging for ALL procedure calls (to debug N-Queen issue)
      console.log(`[blocklyGenerators] procedures_callnoreturn: Final procedureName = "${procedureName}"`);

      // Debug logging for N-Queen helper functions
      if (procedureName === 'safe' || procedureName === 'place' || procedureName === 'remove') {
        console.log(`[blocklyGenerators] ✅ Confirmed N-Queen helper function (no-return): ${procedureName}`);
      }
    } catch (e) {
      console.warn('Error getting procedure name:', e);
    }

    // Validate procedure name
    // CRITICAL: Don't fallback for N-Queen helper functions (safe, place, remove)
    // These will be injected into the generated code
    // Update isNQueenHelper flag if we have a procedure name
    if (procedureName && (procedureName === 'safe' || procedureName === 'place' || procedureName === 'remove')) {
      isNQueenHelper = true;
    }

    if (!procedureName || procedureName === 'unnamed' || procedureName === 'undefined' ||
      (typeof procedureName === 'string' && procedureName.trim() === '')) {
      // Invalid procedure name - try to get from workspace procedure map
      // BUT skip fallback for N-Queen helper functions
      if (!isNQueenHelper) {
        console.warn('Procedure call block has invalid name, trying to fix:', procedureName);

        try {
          const workspace = block.workspace;
          if (workspace) {
            const procedureMap = workspace.getProcedureMap();
            if (procedureMap) {
              const procedures = procedureMap.getProcedures();
              if (procedures.length > 0) {
                // Use first available procedure
                procedureName = procedures[0].getName();
                console.log('Using first available procedure:', procedureName);
              } else {
                // No procedures available - return comment
                console.warn('No procedures available in workspace');
                return '// Invalid procedure call\n';
              }
            }
          }
        } catch (e) {
          console.warn('Error trying to fix procedure name:', e);
          return '// Invalid procedure call\n';
        }
      } else {
        // For N-Queen helper functions, allow them even if not defined
        // They will be injected into the generated code
        console.log(`[blocklyGenerators] ✅ Allowing N-Queen helper function (no-return, will be injected): ${procedureName}`);
      }

      // If still invalid after trying to fix (and not N-Queen helper)
      const finalIsNQueenHelper = procedureName === 'safe' || procedureName === 'place' || procedureName === 'remove';
      if (!finalIsNQueenHelper && (!procedureName || procedureName === 'unnamed' || procedureName === 'undefined' ||
        (typeof procedureName === 'string' && procedureName.trim() === ''))) {
        return '// Invalid procedure call\n';
      }
    }

    // Get arguments
    const args = [];
    if (block.arguments_ && block.arguments_.length > 0) {
      for (let i = 0; i < block.arguments_.length; i++) {
        const argCode = javascriptGenerator.valueToCode(block, 'ARG' + i, javascriptGenerator.ORDER_NONE) || 'null';
        args.push(argCode);
      }
    }

    const argsString = args.length > 0 ? args.join(', ') : '';

    // Debug logging for N-Queen helper functions
    if (procedureName === 'safe' || procedureName === 'place' || procedureName === 'remove') {
      console.log(`[blocklyGenerators] Generating code for ${procedureName}(${argsString}) (no-return)`);
    }

    return `await ${procedureName}(${argsString});\n`;
  };

  // List Operations generators
  // Create empty list generator
  javascriptGenerator.forBlock["lists_create_empty"] = function (block) {
    return ["[]", javascriptGenerator.ORDER_ATOMIC];
  };

  javascriptGenerator.forBlock["lists_add_item"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const item = javascriptGenerator.valueToCode(block, 'ITEM', javascriptGenerator.ORDER_NONE) || 'null';

    // Try to detect if this is adding to visited, container, PQ, or MST_edges for visual feedback
    // This is a simple heuristic - could be improved
    const listCode = list.trim();
    const isVisited = listCode.includes('visited') || listCode.includes('visit');
    const isContainer = listCode.includes('container') || listCode.includes('stack');
    const isPQ = listCode.includes('PQ') || listCode.includes('pq');
    const isMSTEdges = listCode.includes('MST_edges') || listCode.includes('mst_edges');

    if (isVisited) {
      // Adding to visited list - mark as visited with visual feedback
      // markVisitedWithVisual will update Dijkstra state internally
      return `${list}.push(${item});\nconsole.log('[DEBUG-PQ-PUSH] Added to visited:', ${item});\nawait markVisitedWithVisual(${item});\n`;
    } else if (isContainer) {
      // Adding to container - might be a path, show path update
      // Container format: path directly
      return `${list}.push(${item});\nconsole.log('[DEBUG-PQ-PUSH] Added to container:', ${item});\nawait showPathUpdateWithVisual(${item});\n`;
    } else if (isPQ) {
      // PQ format: [distance, path] - don't await to avoid slowing down
      // Just push, visual feedback will be shown when node is selected from PQ
      // Update Dijkstra PQ state for real-time table
      return `${list}.push(${item});\nconsole.log('[DEBUG-PQ-PUSH] Added to PQ:', JSON.stringify(${item}));\nupdateDijkstraPQ(${list});\n`;
    } else if (isMSTEdges) {
      // Adding edge to MST_edges list (for Kruskal's algorithm)
      // Show MST edges visualization
      return `${list}.push(${item});\nconsole.log('[DEBUG-MST-PUSH] Added to MST:', JSON.stringify(${item}));\nshowMSTEdgesFromList(${list});\n`;
    }

    return `${list}.push(${item});\nconsole.log('[DEBUG-LIST-PUSH] Added to list:', ${item});\n`;
  };

  javascriptGenerator.forBlock["lists_remove_last"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return `${list}.pop();\n`;
  };

  javascriptGenerator.forBlock["lists_remove_last_return"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`${list}.pop()`, javascriptGenerator.ORDER_MEMBER];
  };

  javascriptGenerator.forBlock["lists_get_last"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`(function() {
      try {
        const listVar = (${list});
        if (!listVar || !Array.isArray(listVar) || listVar.length === 0) return undefined;
        return listVar[listVar.length - 1];
      } catch (e) {
        console.warn('lists_get_last error:', e);
        return undefined;
      }
    })()`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["lists_remove_first_return"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`${list}.shift()`, javascriptGenerator.ORDER_MEMBER];
  };

  javascriptGenerator.forBlock["lists_get_first"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`(function() {
      try {
        const listVar = (${list});
        if (!listVar || !Array.isArray(listVar) || listVar.length === 0) return undefined;
        return listVar[0];
      } catch (e) {
        console.warn('lists_get_first error:', e);
        return undefined;
      }
    })()`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  // Standard Blockly block: lists_getIndex (GET / GET_REMOVE / REMOVE)
  // Override to prevent crashes when list/index are undefined/NaN.
  javascriptGenerator.forBlock["lists_getIndex"] = function (block) {
    const mode = block.getFieldValue('MODE');
    const where = block.getFieldValue('WHERE');
    const list = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]';
    const at = javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_ATOMIC) || '0';

    const body = `(function() {
      try {
        const listVar = (${list});
        if (!listVar || !Array.isArray(listVar)) return undefined;
        let idx;
        if ('${where}' === 'FIRST') idx = 0;
        else if ('${where}' === 'LAST') idx = listVar.length - 1;
        else if ('${where}' === 'RANDOM') idx = Math.floor(Math.random() * listVar.length);
        else {
          const rawIdx = (${at});
          const n = (typeof rawIdx === 'number') ? rawIdx : Number(rawIdx);
          if (!Number.isFinite(n)) return undefined;
          idx = ('${where}' === 'FROM_END') ? (listVar.length - 1 - n) : n;
        }

        if (!Number.isFinite(idx) || idx < 0 || idx >= listVar.length) return undefined;

        if ('${mode}' === 'GET') return listVar[idx];
        if ('${mode}' === 'GET_REMOVE') return listVar.splice(idx, 1)[0];
        if ('${mode}' === 'REMOVE') { listVar.splice(idx, 1); return undefined; }
        return undefined;
      } catch (e) {
        console.warn('lists_getIndex error:', e);
        return undefined;
      }
    })()`;

    // lists_getIndex can be value-output or statement depending on MODE.
    if (mode === 'REMOVE') {
      return `${body};\n`;
    }
    return [body, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["lists_contains"] = function (block) {
    const item = javascriptGenerator.valueToCode(block, 'ITEM', javascriptGenerator.ORDER_EQUALITY) || 'null';
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`${list}.includes(${item})`, javascriptGenerator.ORDER_EQUALITY];
  };

  javascriptGenerator.forBlock["lists_concat"] = function (block) {
    const list1 = javascriptGenerator.valueToCode(block, 'LIST1', javascriptGenerator.ORDER_ADDITION) || '[]';
    const list2 = javascriptGenerator.valueToCode(block, 'LIST2', javascriptGenerator.ORDER_ADDITION) || '[]';
    return [`${list1}.concat(${list2})`, javascriptGenerator.ORDER_ADDITION];
  };

  javascriptGenerator.forBlock["lists_isEmpty"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`${list}.length === 0`, javascriptGenerator.ORDER_EQUALITY];
  };

  // List length generator
  javascriptGenerator.forBlock["lists_length"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]';
    // Add safety check to prevent undefined.length error
    return [`(function() { const listVar = ${list}; return listVar && Array.isArray(listVar) ? listVar.length : 0; })()`, javascriptGenerator.ORDER_MEMBER];
  };

  javascriptGenerator.forBlock["lists_find_min_index"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const exclude = javascriptGenerator.valueToCode(block, 'EXCLUDE', javascriptGenerator.ORDER_MEMBER) || 'null';
    return [`await findMinIndex(${list}, ${exclude})`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["lists_find_max_index"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const exclude = javascriptGenerator.valueToCode(block, 'EXCLUDE', javascriptGenerator.ORDER_MEMBER) || 'null';
    return [`await findMaxIndex(${list}, ${exclude})`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["lists_get_at_index"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    // Robustly try both 'INDEX' and 'AT' names, falling back to '0' if both are empty/missing
    let indexCode = '';
    if (block.getInput('INDEX')) {
      indexCode = javascriptGenerator.valueToCode(block, 'INDEX', javascriptGenerator.ORDER_SUBTRACTION);
    }
    if (!indexCode && block.getInput('AT')) {
      indexCode = javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_SUBTRACTION);
    }
    const index = indexCode || '0';

    // Hyper-safe version with CHECKPOINTS [Step 149]
    return [`(function() { 
      try {
        const _safe_list_ = (${list});
        const _safe_idx_raw_ = (${index});
        let _safe_result_ = undefined;
        

        // Robust checks (using if-else to prevent execution fall-through if returns are stripped)
        // Nuclear Option: Disabled explicit validation because of phantom undefined issues.
        // If _safe_list_ is invalid, standard JS access will throw and be caught by the outer catch.
        _safe_result_ = (_safe_list_ && _safe_list_[Number(_safe_idx_raw_)]);
        
        if (typeof _safe_list_ !== 'undefined' && _safe_list_ && Array.isArray(_safe_list_)) {
          // Only log if it's one of our key arrays for Dijkstra (simple heuristic)
          if (_safe_list_.length < 20) {
            console.log('[DEBUG-GET]', { index: _safe_idx_raw_, value: _safe_result_ });
          }
        }

        return _safe_result_ !== undefined ? _safe_result_ : null;
      } catch (e) {
        console.error('lists_get_at_index [Safe] Unexpected error:', e);
        return null;
      }
    })()`, javascriptGenerator.ORDER_MEMBER];
  };

  // Override lists_setIndex to use 0-based indexing for Emei/Graph compatibility
  javascriptGenerator.forBlock["lists_setIndex"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const mode = block.getFieldValue('MODE') || 'SET';
    const where = block.getFieldValue('WHERE') || 'FROM_START';
    const at = javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_ADDITION) || '0';
    const value = javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';

    return `(function() {
      try {
        const listVar = ${list};
        const val = ${value};
        let idx;
        // Force 0-based indexing for FROM_START to match our graph nodes
        // BUT also support legacy 1-based indexing for standard levels via flag
        const isZeroBased = (typeof globalThis !== 'undefined' && globalThis.__useZeroBasedIndexing);
        
        if ('${where}' === 'FROM_START') {
           if (isZeroBased) {
             idx = Number(${at});
           } else {
             // Standard Blockly behavior: 1-based -> 0-based
             idx = Number(${at}) - 1;
           }
        } else if ('${where}' === 'FROM_END') {
           idx = (listVar ? listVar.length : 0) - 1 - Number(${at});
        } else if ('${where}' === 'FIRST') {
           idx = 0;
        } else if ('${where}' === 'LAST') {
           idx = (listVar ? listVar.length : 0) - 1;
        } else {
           if (isZeroBased) {
             idx = Number(${at});
           } else {
             idx = Number(${at}) - 1;
           }
        }

        if (listVar && Array.isArray(listVar) && Number.isFinite(idx) && idx >= 0) {
            if ('${mode}' === 'SET') {
                listVar[idx] = val;
            } else if ('${mode}' === 'INSERT') {
                listVar.splice(idx, 0, val);
            }
        }
      } catch (e) { console.warn('lists_setIndex error:', e); }
    })();\n`;
  };

  javascriptGenerator.forBlock["lists_remove_at_index"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const index = javascriptGenerator.valueToCode(block, 'INDEX', javascriptGenerator.ORDER_ATOMIC) || '0';
    return `(function() {
      const _b_list = ${list};
      const _b_idx = ${index};
      console.log('[DEBUG-REMOVE]', { list: '${list}', idx: _b_idx });
      if (_b_list && Array.isArray(_b_list)) _b_list.splice(_b_idx, 1);
    })();\n`;
  };

  // Override lists_setIndex for REMOVE mode
  // This MUST override Blockly's standard generator
  javascriptGenerator.forBlock["lists_setIndex"] = function (block) {
    const mode = block.getFieldValue('MODE');
    const where = block.getFieldValue('WHERE');
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const at = javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_ATOMIC) || '0';

    console.log(`🔧 lists_setIndex generator called: mode=${mode}, where=${where}, list=${list}, at=${at}`);

    if (mode === 'REMOVE') {
      // Remove item at index using splice
      if (where === 'FROM_START') {
        const code = `(function() {
  try {
    const listVar = ${list};
    const idx = (typeof ${at} === 'number') ? ${at} : Number(${at});
    if (!listVar || !Array.isArray(listVar) || !Number.isFinite(idx) || idx < 0 || idx >= listVar.length) {
      console.warn('lists_setIndex: Invalid REMOVE', { listVar, idx, listLength: listVar?.length });
      return;
    }
    listVar.splice(idx, 1);
  } catch (e) {
    console.error('lists_setIndex REMOVE error:', e);
  }
})();\n`;
        console.log(`🔧 Generated REMOVE code (safe): ${code}`);
        return code;
      } else if (where === 'FROM_END') {
        const code = `(function() {
  try {
    const listVar = ${list};
    const atIdx = (typeof ${at} === 'number') ? ${at} : Number(${at});
    if (!listVar || !Array.isArray(listVar) || !Number.isFinite(atIdx)) {
      console.warn('lists_setIndex: Invalid REMOVE', { listVar, idx: atIdx, listLength: listVar?.length });
      return;
    }
    const idx = (listVar.length - 1 - atIdx);
    if (!Number.isFinite(idx) || idx < 0 || idx >= listVar.length) {
      console.warn('lists_setIndex: Invalid REMOVE', { listVar, idx, listLength: listVar?.length });
      return;
    }
    listVar.splice(idx, 1);
  } catch (e) {
    console.error('lists_setIndex REMOVE error:', e);
  }
})();\n`;
        console.log(`🔧 Generated REMOVE code (safe): ${code}`);
        return code;
      } else {
        // FIRST or LAST
        if (where === 'FIRST') {
          const code = `(function() {
  try {
    const listVar = ${list};
    if (!listVar || !Array.isArray(listVar) || listVar.length <= 0) {
      console.warn('lists_setIndex: Invalid REMOVE', { listVar, idx: 0, listLength: listVar?.length });
      return;
    }
    listVar.splice(0, 1);
  } catch (e) {
    console.error('lists_setIndex REMOVE error:', e);
  }
})();\n`;
          console.log(`🔧 Generated REMOVE code (safe): ${code}`);
          return code;
        } else {
          const code = `(function() {
  try {
    const listVar = ${list};
    if (!listVar || !Array.isArray(listVar) || listVar.length <= 0) {
      console.warn('lists_setIndex: Invalid REMOVE', { listVar, idx: -1, listLength: listVar?.length });
      return;
    }
    listVar.splice(listVar.length - 1, 1);
  } catch (e) {
    console.error('lists_setIndex REMOVE error:', e);
  }
})();\n`;
          console.log(`🔧 Generated REMOVE code (safe): ${code}`);
          return code;
        }
      }
    } else if (mode === 'GET') {
      // Get item at index
      if (where === 'FROM_START') {
        return [`(function() {
  try {
    const listVar = ${list};
    let idx = (typeof ${at} === 'number') ? ${at} : Number(${at});
    if (!Number.isFinite(idx)) { try { idx = parseInt(${at}, 10); } catch (e) { } }
    if (!listVar || !Array.isArray(listVar) || !Number.isFinite(idx) || idx < 0 || idx >= listVar.length) {
      console.warn('lists_setIndex: Invalid GET', { listVar, idx, listLength: listVar?.length });
      return undefined;
    }
    return listVar[idx];
  } catch (e) {
    console.error('lists_setIndex GET error:', e);
    return undefined;
  }
})()`, javascriptGenerator.ORDER_MEMBER];
      } else if (where === 'FROM_END') {
        return [`(function() {
  try {
    const listVar = ${list};
    let atIdx = (typeof ${at} === 'number') ? ${at} : Number(${at});
    if (!Number.isFinite(atIdx)) { try { atIdx = parseInt(${at}, 10); } catch (e) { } }
    if (!listVar || !Array.isArray(listVar) || !Number.isFinite(atIdx)) {
      console.warn('lists_setIndex: Invalid GET', { listVar, idx: atIdx, listLength: listVar?.length });
      return undefined;
    }
    const idx = listVar.length - 1 - atIdx;
    if (!Number.isFinite(idx) || idx < 0 || idx >= listVar.length) {
      console.warn('lists_setIndex: Invalid GET', { listVar, idx, listLength: listVar?.length });
      return undefined;
    }
    return listVar[idx];
  } catch (e) {
    console.error('lists_setIndex GET error:', e);
    return undefined;
  }
})()`, javascriptGenerator.ORDER_MEMBER];
      } else {
        // FIRST or LAST
        if (where === 'FIRST') {
          return [`(function() {
  try {
    const listVar = ${list};
    if (!listVar || !Array.isArray(listVar) || listVar.length <= 0) {
      console.warn('lists_setIndex: Invalid GET', { listVar, idx: 0, listLength: listVar?.length });
      return undefined;
    }
    return listVar[0];
  } catch (e) {
    console.error('lists_setIndex GET error:', e);
    return undefined;
  }
})()`, javascriptGenerator.ORDER_MEMBER];
        } else {
          return [`(function() {
  try {
    const listVar = ${list};
    if (!listVar || !Array.isArray(listVar) || listVar.length <= 0) {
      console.warn('lists_setIndex: Invalid GET', { listVar, idx: -1, listLength: listVar?.length });
      return undefined;
    }
    return listVar[listVar.length - 1];
  } catch (e) {
    console.error('lists_setIndex GET error:', e);
    return undefined;
  }
})()`, javascriptGenerator.ORDER_MEMBER];
        }
      }
    } else {
      // SET mode - use standard Blockly generator if available
      // Fallback to splice
      const value = javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';
      if (where === 'FROM_START') {
        // Subset Sum DP table hook:
        // Detect pattern: curr[cap] = ... inside a for_loop_dynamic over itemIndex/cap.
        // If matched, emit an extra (guarded) call to updateSubsetSumCellVisual(itemIndex, cap, curr[cap] value).
        let subsetSumHook = '';
        // Coin Change DP table hook:
        // Detect pattern: dp[a] = ... inside a for_loop_dynamic over coinIndex and amount loop a.
        // If matched, emit updateCoinChangeCellVisual(coinIndex, a, dp[a] value).
        let coinChangeHook = '';
        // Ant DP table hook:
        // Detect pattern: dpRow[c] = ... inside nested for_loop_dynamic over r and c.
        // If matched, emit updateAntDpCellVisual(r, c, dpRow[c] value).
        let antDpHook = '';
        try {
          const listTrim = String(list || '').trim();
          const atTrim = String(at || '').trim();

          // Coin Change: dp[amount] updates
          try {
            const isDp = /\bdp\b/.test(listTrim);
            let coinIndexVarName = null;
            try {
              let p = block.getParent();
              while (p) {
                if (p.type === 'for_loop_dynamic' || p.type === 'for_index' || p.type === 'controls_for') {
                  const varField = p.getFieldValue && p.getFieldValue('VAR');
                  if (varField) {
                    const resolved = javascriptGenerator.nameDB_.getName(varField, Blockly.Names.NameType.VARIABLE);
                    if (resolved === 'coinIndex') coinIndexVarName = resolved;
                  }
                }
                p = p.getParent();
              }
            } catch (e) { }

            if (isDp) {
              const rowExpr = coinIndexVarName || '0';
              coinChangeHook = `try { if (typeof updateCoinChangeCellVisual === 'function') updateCoinChangeCellVisual(${rowExpr}, ${atTrim}, ${value}, { kind: 'set' }); } catch (e) {}\n`;
            }
          } catch (e) { }

          const isCurr = /\bcurr\b/.test(listTrim);
          const isCap = /\bcap\b/.test(atTrim);
          let itemVarName = null;
          try {
            let p = block.getParent();
            while (p) {
              if (p.type === 'for_loop_dynamic' || p.type === 'for_index' || p.type === 'controls_for') {
                const varField = p.getFieldValue && p.getFieldValue('VAR');
                if (varField) {
                  const resolved = javascriptGenerator.nameDB_.getName(varField, Blockly.Names.NameType.VARIABLE);
                  if (resolved === 'itemIndex') itemVarName = resolved;
                }
              }
              p = p.getParent();
            }
          } catch (e) { }

          if (isCurr && isCap && itemVarName) {
            subsetSumHook = `try { if (typeof updateSubsetSumCellVisual === 'function') updateSubsetSumCellVisual(${itemVarName}, ${atTrim}, ${value}); } catch (e) {}\n`;
          }

          // Ant DP: dpRow[c] updates inside loops (r, c)
          try {
            const listTrim = String(list || '').trim();
            const isDpRow = /\bdpRow\b/i.test(listTrim) || /\bdp\b/i.test(listTrim); // Support dp[r][c] or dpRow[c]
            let rVarName = 'typeof r !== "undefined" ? r : 0';
            let cVarName = 'typeof c !== "undefined" ? c : 0';
            try {
              let p = block.getParent();
              while (p) {
                if (p.type === 'for_loop_dynamic' || p.type === 'for_index' || p.type === 'controls_for') {
                  const varField = p.getFieldValue && p.getFieldValue('VAR');
                  if (varField) {
                    const resolved = javascriptGenerator.nameDB_.getName(varField, Blockly.Names.NameType.VARIABLE);
                    if (resolved === 'r') rVarName = 'r';
                    if (resolved === 'c') cVarName = 'c';
                  }
                }
                p = p.getParent();
              }
            } catch (e) { }

            if (isDpRow) {
              // Safety: Ensure we don't send NaN to the visualizer
              antDpHook = `try { if (typeof updateAntDpCellVisual === 'function') updateAntDpCellVisual(${rVarName}, ${cVarName}, (Number(${value}) || 0)); } catch (e) {}\n`;
            }
          } catch (e) { }
        } catch (e) { }

        return `(function() {
  try {
    const _b_list = ${list};
    const _b_at = ${at};
    const _b_val = ${value};
    let _b_idx = (typeof _b_at === 'number') ? _b_at : Number(_b_at);
    // If idx is something weird (e.g., string-like), try parsing once more
    if (!Number.isFinite(_b_idx)) {
      try { _b_idx = parseInt(_b_at, 10); } catch (e) { /* ignore */ }
    }
    // For SET we allow auto-grow (like JS arrays). Only block truly invalid indices.
    const isIndexOk = (typeof _b_idx === 'number') && (_b_idx === _b_idx) && _b_idx >= 0;
    const isArrayLike = !!_b_list && (Array.isArray(_b_list) || typeof _b_list.length === 'number');
    if (!isArrayLike || !isIndexOk) {
      console.warn('[DIAGNOSTIC] lists_setIndex: Invalid SET', { _b_list, _b_idx, listLength: _b_list?.length });
      return;
    }
    // JS arrays can grow via direct assignment; allow SET past current length.
    try {
      if (typeof _b_list.length === 'number' && _b_idx >= _b_list.length) _b_list.length = _b_idx + 1;
    } catch (e) { /* ignore */ }
    
    if ('${mode}' === 'INSERT') {
      _b_list.splice(_b_idx, 0, _b_val);
      console.log('[DEBUG-INSERT] ' + ${JSON.stringify(list)} + '[' + _b_idx + '] = ' + _b_val);
    } else {
      _b_list[_b_idx] = _b_val;
      console.log('[DEBUG-SET] ' + ${JSON.stringify(list)} + '[' + _b_idx + '] = ' + _b_val);
    }
${subsetSumHook}${coinChangeHook}${antDpHook}
  } catch (e) {
    console.error('lists_setIndex error:', e);
  }
})();\n`;
      } else if (where === 'FROM_END') {
        return `(function() {
  try {
    const listVar = ${list};
    const atIdx = (typeof ${at} === 'number') ? ${at} : Number(${at});
    if (!listVar || !Array.isArray(listVar) || !Number.isFinite(atIdx)) {
      // Invalid SET - ignored
      return;
    }
    const idx = (listVar.length - 1 - atIdx);
    if (!Number.isFinite(idx) || idx < 0 || idx >= listVar.length) {
      console.warn('lists_setIndex: Invalid SET', { listVar, idx, listLength: listVar?.length });
      return;
    }
    listVar[idx] = ${value};
  } catch (e) {
    console.error('lists_setIndex SET error:', e);
  }
})();\n`;
      } else {
        if (where === 'FIRST') {
          return `(function() {
  try {
    const listVar = ${list};
    if (!listVar || !Array.isArray(listVar) || listVar.length <= 0) {
      console.warn('lists_setIndex: Invalid SET', { listVar, idx: 0, listLength: listVar?.length });
      return;
    }
    listVar[0] = ${value};
  } catch (e) {
    console.error('lists_setIndex SET error:', e);
  }
})();\n`;
        } else {
          return `(function() {
  try {
    const listVar = ${list};
    if (!listVar || !Array.isArray(listVar) || listVar.length <= 0) {
      console.warn('lists_setIndex: Invalid SET', { listVar, idx: -1, listLength: listVar?.length });
      return;
    }
    listVar[listVar.length - 1] = ${value};
  } catch (e) {
    console.error('lists_setIndex SET error:', e);
  }
})();\n`;
        }
      }
    }
  };

  javascriptGenerator.forBlock["for_each_in_list"] = function (block) {
    const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE);
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const branch = javascriptGenerator.statementToCode(block, 'DO');

    // Check if this is iterating over edges (for Kruskal's algorithm)
    const listCode = list.trim();
    const isEdges = listCode.includes('edges') || listCode.includes('Edges');
    const varName = variable || block.getFieldValue('VAR') || 'item';
    const isEdgeData = varName.includes('edge') || varName.includes('Edge');

    // Check if list is an async expression (contains await)
    const isAsync = list.includes('await');

    if (isAsync) {
      // If list is async, we need to await it first
      let code = `
      const listItems = await (${list});
      for (let i = 0; i < listItems.length; i++) {
          const ${variable} = listItems[i];`;

      // Add visual feedback for Kruskal's algorithm (iterating over edges)
      if (isEdges && isEdgeData) {
        code += `
          // Visual feedback: highlight edge being considered
          if (Array.isArray(${variable}) && ${variable}.length >= 3) {
            const u = ${variable}[0];
            const v = ${variable}[1];
            const weight = ${variable}[2];
            const currentState = getCurrentGameState();
            if (currentState && currentState.currentScene) {
              await highlightKruskalEdge(currentState.currentScene, u, v, weight, 800);
            }
          }`;
      }

      code += `
          ${branch}
      }
      `;
      return code;
    } else {
      let code = `
      const listItems = await ${list};
      for (let i = 0; i < (listItems ? listItems.length : 0); i++) {
          const ${variable} = listItems[i];`;

      // Add visual feedback for Kruskal's algorithm (iterating over edges)
      if (isEdges && isEdgeData) {
        code += `
          // Visual feedback: highlight edge being considered
          if (Array.isArray(${variable}) && ${variable}.length >= 3) {
            const u = ${variable}[0];
            const v = ${variable}[1];
            const weight = ${variable}[2];
            const currentState = getCurrentGameState();
            if (currentState && currentState.currentScene) {
              await highlightKruskalEdge(currentState.currentScene, u, v, weight, 800);
            }
          }`;
      }

      code += `
          ${branch}
      }
      `;
      return code;
    }
  };

  // Graph Operations generators
  javascriptGenerator.forBlock["graph_get_neighbors"] = function (block) {
    const graph = javascriptGenerator.valueToCode(block, 'GRAPH', javascriptGenerator.ORDER_MEMBER) || '{}';
    const node = javascriptGenerator.valueToCode(block, 'NODE', javascriptGenerator.ORDER_MEMBER) || '0';
    // Use synchronous visual version for expression context
    // This provides visual feedback without requiring await
    return [`getGraphNeighborsWithVisualSync(${graph}, ${node})`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["graph_get_node_value"] = function (block) {
    const node = javascriptGenerator.valueToCode(block, 'NODE', javascriptGenerator.ORDER_ATOMIC) || '0';
    return [`getNodeValue(${node})`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["graph_get_current_node"] = function (block) {
    return [`getCurrentNode()`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["graph_get_all_edges"] = function (block) {
    const graph = javascriptGenerator.valueToCode(block, 'GRAPH', javascriptGenerator.ORDER_MEMBER) || '{}';
    return [`getAllEdges(${graph})`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["lists_sort_by_weight"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`sortEdgesByWeight(${list})`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["graph_get_neighbors_with_weight"] = function (block) {
    const graph = javascriptGenerator.valueToCode(block, 'GRAPH', javascriptGenerator.ORDER_MEMBER) || '{}';
    const node = javascriptGenerator.valueToCode(block, 'NODE', javascriptGenerator.ORDER_MEMBER) || '0';
    // Use async visual version for expression context (with delays like Kruskal)
    // This provides visual feedback with delays to match Kruskal speed
    return [`await getGraphNeighborsWithWeightWithVisualSync(${graph}, ${node})`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  // Logic Operators generators
  javascriptGenerator.forBlock["logic_not_in"] = function (block) {
    const item = javascriptGenerator.valueToCode(block, 'ITEM', javascriptGenerator.ORDER_EQUALITY) || 'null';
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`!${list}.includes(${item})`, javascriptGenerator.ORDER_LOGICAL_NOT];
  };

  // DFS Visual Feedback generators
  javascriptGenerator.forBlock["graph_get_neighbors_visual"] = function (block) {
    const graph = javascriptGenerator.valueToCode(block, 'GRAPH', javascriptGenerator.ORDER_NONE) || 'null';
    const node = javascriptGenerator.valueToCode(block, 'NODE', javascriptGenerator.ORDER_NONE) || '0';
    return [`await getGraphNeighborsWithVisual(${graph}, ${node})`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["mark_visited_visual"] = function (block) {
    const node = javascriptGenerator.valueToCode(block, 'NODE', javascriptGenerator.ORDER_NONE) || '0';
    return `await markVisitedWithVisual(${node});\n`;
  };

  javascriptGenerator.forBlock["show_path_visual"] = function (block) {
    const path = javascriptGenerator.valueToCode(block, 'PATH', javascriptGenerator.ORDER_NONE) || '[]';
    return `await showPathUpdateWithVisual(${path});\n`;
  };

  // Store references to our custom generators before any potential overwrites
  // We use the already declared originalGenerators object
  originalGenerators["math_max"] = javascriptGenerator.forBlock["math_max"];
  originalGenerators["lists_setIndex"] = javascriptGenerator.forBlock["lists_setIndex"];
  originalGenerators["procedures_defreturn"] = javascriptGenerator.forBlock["procedures_defreturn"];
  originalGenerators["math_arithmetic"] = javascriptGenerator.forBlock["math_arithmetic"];
  originalGenerators["variables_get"] = javascriptGenerator.forBlock["variables_get"];

  // NUCLEAR FORCE: Re-apply our custom generators at the VERY END
  // We REMOVE "lists_setIndex" from here because we WANT our custom 0-based override to stay!
  const criticals = ["math_max", "variables_get", "math_arithmetic", "procedures_defreturn"];
  criticals.forEach(type => {
    if (originalGenerators[type]) {
      javascriptGenerator.forBlock[type] = originalGenerators[type];
      console.log(`[defineAllGenerators] 🚀 Nuclear Force Champion: ${type}`);
    }
  });

  // Final verification
  const finalGen = javascriptGenerator.forBlock["procedures_defreturn"];
  const isCustom = finalGen?.toString().includes('CUSTOM GENERATOR');
  console.log('[defineAllGenerators] Final check - procedures_defreturn generator is our custom one:', isCustom);

  console.log('[defineAllGenerators] Finished generator definition.');

  // Emei Mountain Visuals
  javascriptGenerator.forBlock["emei_highlight_peak"] = function (block) {
    const node = javascriptGenerator.valueToCode(block, "NODE", javascriptGenerator.ORDER_NONE) || "0";
    return `await highlightPeak(${node});\n`;
  };

  javascriptGenerator.forBlock["emei_highlight_cable_car"] = function (block) {
    const u = javascriptGenerator.valueToCode(block, "U", javascriptGenerator.ORDER_NONE) || "0";
    const v = javascriptGenerator.valueToCode(block, "V", javascriptGenerator.ORDER_NONE) || "0";
    const capacity = javascriptGenerator.valueToCode(block, "CAPACITY", javascriptGenerator.ORDER_NONE) || "0";
    return `await highlightCableCar(${u}, ${v}, ${capacity});\n`;
  };

  javascriptGenerator.forBlock["emei_show_final_result"] = function (block) {
    const bottleneck = javascriptGenerator.valueToCode(block, "BOTTLENECK", javascriptGenerator.ORDER_NONE) || "0";
    const rounds = javascriptGenerator.valueToCode(block, "ROUNDS", javascriptGenerator.ORDER_NONE) || "0";
    return `await showEmeiFinalResult(${bottleneck}, ${rounds});\n`;
  };

  javascriptGenerator.forBlock["emei_highlight_path"] = function (block) {
    const parent = javascriptGenerator.valueToCode(block, "PARENT", javascriptGenerator.ORDER_NONE) || "[]";
    const end = javascriptGenerator.valueToCode(block, "END", javascriptGenerator.ORDER_NONE) || "0";
    const bottleneck = javascriptGenerator.valueToCode(block, "BOTTLENECK", javascriptGenerator.ORDER_NONE) || "0";
    // Internal reconstruction and highlighting
    return `await (async function() {
      console.log('🚩 [emei_highlight_path] START');
      // Clear previous search visuals (red arrows) to show nice result
      try { 
        if (typeof clearDfsVisuals === 'function') {
           console.log('🚩 [emei_highlight_path] Calling clearDfsVisuals...');
           clearDfsVisuals(getCurrentGameState().currentScene); 
        } else {
           console.warn('🚩 [emei_highlight_path] clearDfsVisuals NOT FOUND');
        }
      } catch (e) {
        console.warn('🚩 [emei_highlight_path] Error clearing visuals:', e);
      }
      
      let _curr = ${end};
      let _p = ${parent};
      console.log('🚩 [emei_highlight_path] End Node:', _curr);
      console.log('🚩 [emei_highlight_path] Parent Array:', JSON.stringify(_p));

      let _path_edges = [];
      while (_curr !== undefined && _p[_curr] !== undefined) {
        let _u = _p[_curr];
        if (_u === -1) break; // Use explicit break for -1 sentinel
        _path_edges.push({u: _u, v: _curr});
        _curr = _u;
      }
      console.log('🚩 [emei_highlight_path] Reconstructed Path Edges:', JSON.stringify(_path_edges));

      // Highlight in reverse order (from start to end)
      for (let i = _path_edges.length - 1; i >= 0; i--) {
        const _edge = _path_edges[i];
        console.log('🚩 [emei_highlight_path] Highlighting edge:', _edge.u, '->', _edge.v);
        await highlightCableCar(_edge.u, _edge.v, ${bottleneck});
      }
      console.log('🚩 [emei_highlight_path] DONE');
    })();\n`;
  };
}
