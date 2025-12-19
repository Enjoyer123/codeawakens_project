// Blockly JavaScript Generators
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";
import { getCurrentGameState } from '../gameUtils';

// Dictionary generators
function defineDictionaryGenerators() {
  console.log('🔧 Registering dictionary generators...');
  
  javascriptGenerator.forBlock["dict_create"] = function (block) {
    return ["{}", javascriptGenerator.ORDER_ATOMIC];
  };

  javascriptGenerator.forBlock["dict_set"] = function (block) {
    const dict = javascriptGenerator.valueToCode(block, 'DICT', javascriptGenerator.ORDER_MEMBER) || '{}';
    const key = javascriptGenerator.valueToCode(block, 'KEY', javascriptGenerator.ORDER_MEMBER) || 'null';
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';
    
    // Check if setting parent dictionary (for Prim's algorithm MST visualization)
    const dictCode = dict.trim();
    const isParent = dictCode.includes('parent') || dictCode.includes('Parent');
    
    if (isParent) {
      // Update MST edges visualization after setting parent with delay (like Kruskal)
      return `${dict}[${key}] = ${value};\nconst currentState = getCurrentGameState();\nif (currentState && currentState.currentScene) {\n  showMSTEdges(currentState.currentScene, ${dict});\n  await new Promise(resolve => setTimeout(resolve, 500));\n}\n`;
    }
    
    return `${dict}[${key}] = ${value};\n`;
  };

  javascriptGenerator.forBlock["dict_get"] = function (block) {
    const dict = javascriptGenerator.valueToCode(block, 'DICT', javascriptGenerator.ORDER_MEMBER) || '{}';
    const key = javascriptGenerator.valueToCode(block, 'KEY', javascriptGenerator.ORDER_MEMBER) || 'null';
    return [`${dict}[${key}]`, javascriptGenerator.ORDER_MEMBER];
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
  // Dictionary generators (must be called first)
  defineDictionaryGenerators();
  
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
      case 'EQ': op = '==='; break;
      case 'NEQ': op = '!=='; break;
      case 'LT': op = '<'; break;
      case 'LTE': op = '<='; break;
      case 'GT': op = '>'; break;
      case 'GTE': op = '>='; break;
      default: op = '===';
    }
    
    return [`(${valueA} ${op} ${valueB})`, javascriptGenerator.ORDER_ATOMIC];
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
    return `while (${condition}) {\n${doCode}}\n`;
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
    
    const code = `
    const fromValue = ${from};
    const toValue = ${to};
    for (let ${variable} = fromValue; ${variable} <= toValue; ${variable}++) {
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
    
    return [`(${a} ${op} ${b})`, javascriptGenerator.ORDER_ATOMIC];
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
    const name = javascriptGenerator.nameDB_.getName(
      block.getFieldValue('NAME') || 'unnamed',
      Blockly.Names.NameType.PROCEDURE
    );
    const args = [];
    const variables = block.getVars();
    for (let i = 0; i < variables.length; i++) {
      args[i] = javascriptGenerator.nameDB_.getName(
        variables[i],
        Blockly.Names.NameType.VARIABLE
      );
    }
    const argsString = args.length > 0 ? args.join(', ') : '';
    const branch = javascriptGenerator.statementToCode(block, 'STACK');
    
    // Generate async function
    // The branch already contains return statements from procedures_return blocks
    const code = `async function ${name}(${argsString}) {\n${branch}}`;
    return code;
  };

  // Return statement generator for procedures_defreturn
  javascriptGenerator.forBlock["procedures_return"] = function (block) {
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE) || 'null';
    return `return ${value};\n`;
  };

  // Procedure call generators - CRITICAL: Handle "unnamed" and invalid procedures
  javascriptGenerator.forBlock["procedures_callreturn"] = function (block) {
    // Get procedure name - try multiple methods
    let procedureName = null;
    try {
      // Try getProcParam first (Blockly standard method)
      if (typeof block.getProcParam === 'function') {
        procedureName = block.getProcParam();
      }
      // Fallback to getFieldValue
      if (!procedureName) {
        const nameField = block.getField('NAME');
        if (nameField) {
          procedureName = nameField.getValue();
        }
      }
      // Last resort: try getFieldValue directly
      if (!procedureName) {
        procedureName = block.getFieldValue('NAME');
      }
    } catch (e) {
      console.warn('Error getting procedure name:', e);
    }
    
    // Validate procedure name
    if (!procedureName || procedureName === 'unnamed' || procedureName === 'undefined' || 
        (typeof procedureName === 'string' && procedureName.trim() === '')) {
      // Invalid procedure name - try to get from workspace procedure map
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
      
      // If still invalid after trying to fix
      if (!procedureName || procedureName === 'unnamed' || procedureName === 'undefined' || 
          (typeof procedureName === 'string' && procedureName.trim() === '')) {
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
    try {
      // Try getProcParam first (Blockly standard method)
      if (typeof block.getProcParam === 'function') {
        procedureName = block.getProcParam();
      }
      // Fallback to getFieldValue
      if (!procedureName) {
        const nameField = block.getField('NAME');
        if (nameField) {
          procedureName = nameField.getValue();
        }
      }
      // Last resort: try getFieldValue directly
      if (!procedureName) {
        procedureName = block.getFieldValue('NAME');
      }
    } catch (e) {
      console.warn('Error getting procedure name:', e);
    }
    
    // Validate procedure name
    if (!procedureName || procedureName === 'unnamed' || procedureName === 'undefined' || 
        (typeof procedureName === 'string' && procedureName.trim() === '')) {
      // Invalid procedure name - try to get from workspace procedure map
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
      
      // If still invalid after trying to fix
      if (!procedureName || procedureName === 'unnamed' || procedureName === 'undefined' || 
          (typeof procedureName === 'string' && procedureName.trim() === '')) {
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
    return `${procedureName}(${argsString});\n`;
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
      return `${list}.push(${item});\nawait markVisitedWithVisual(${item});\n`;
    } else if (isContainer) {
      // Adding to container - might be a path, show path update
      // Container format: path directly
      return `${list}.push(${item});\nawait showPathUpdateWithVisual(${item});\n`;
    } else if (isPQ) {
      // PQ format: [distance, path] - don't await to avoid slowing down
      // Just push, visual feedback will be shown when node is selected from PQ
      // Update Dijkstra PQ state for real-time table
      return `${list}.push(${item});\nupdateDijkstraPQ(${list});\n`;
    } else if (isMSTEdges) {
      // Adding edge to MST_edges list (for Kruskal's algorithm)
      // Show MST edges visualization
      return `${list}.push(${item});\nshowMSTEdgesFromList(${list});\n`;
    }
    
    return `${list}.push(${item});\n`;
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
    return [`${list}[${list}.length - 1]`, javascriptGenerator.ORDER_MEMBER];
  };

  javascriptGenerator.forBlock["lists_remove_first_return"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`${list}.shift()`, javascriptGenerator.ORDER_MEMBER];
  };

  javascriptGenerator.forBlock["lists_get_first"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`${list}[0]`, javascriptGenerator.ORDER_MEMBER];
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

  javascriptGenerator.forBlock["lists_find_min_index"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`await findMinIndex(${list})`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["lists_get_at_index"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const index = javascriptGenerator.valueToCode(block, 'INDEX', javascriptGenerator.ORDER_SUBTRACTION) || '0';
    return [`(${list})[${index}]`, javascriptGenerator.ORDER_MEMBER];
  };

  javascriptGenerator.forBlock["lists_remove_at_index"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const index = javascriptGenerator.valueToCode(block, 'INDEX', javascriptGenerator.ORDER_ATOMIC) || '0';
    return `${list}.splice(${index}, 1);\n`;
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
        const code = `${list}.splice(${at}, 1);\n`;
        console.log(`🔧 Generated REMOVE code: ${code}`);
        return code;
      } else if (where === 'FROM_END') {
        const code = `${list}.splice(${list}.length - 1 - ${at}, 1);\n`;
        console.log(`🔧 Generated REMOVE code: ${code}`);
        return code;
      } else {
        // FIRST or LAST
        if (where === 'FIRST') {
          const code = `${list}.splice(0, 1);\n`;
          console.log(`🔧 Generated REMOVE code: ${code}`);
          return code;
        } else {
          const code = `${list}.splice(${list}.length - 1, 1);\n`;
          console.log(`🔧 Generated REMOVE code: ${code}`);
          return code;
        }
      }
    } else if (mode === 'GET') {
      // Get item at index
      if (where === 'FROM_START') {
        return [`${list}[${at}]`, javascriptGenerator.ORDER_MEMBER];
      } else if (where === 'FROM_END') {
        return [`${list}[${list}.length - 1 - ${at}]`, javascriptGenerator.ORDER_MEMBER];
      } else {
        // FIRST or LAST
        if (where === 'FIRST') {
          return [`${list}[0]`, javascriptGenerator.ORDER_MEMBER];
        } else {
          return [`${list}[${list}.length - 1]`, javascriptGenerator.ORDER_MEMBER];
        }
      }
    } else {
      // SET mode - use standard Blockly generator if available
      // Fallback to splice
      const value = javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';
      if (where === 'FROM_START') {
        return `${list}[${at}] = ${value};\n`;
      } else if (where === 'FROM_END') {
        return `${list}[${list}.length - 1 - ${at}] = ${value};\n`;
      } else {
        if (where === 'FIRST') {
          return `${list}[0] = ${value};\n`;
        } else {
          return `${list}[${list}.length - 1] = ${value};\n`;
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
      const listItems = ${list};
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
}

