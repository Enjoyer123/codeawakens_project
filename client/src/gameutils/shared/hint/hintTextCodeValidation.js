// Text Code Validation Functions for Hint System
import {
  parseIfBlock,
  parseIfElseBlock,
  parseIfOnlyBlock,
  parseLoopBlock,
  parseForIndexBlock,
  parseStatement,
  checkIfHasElse,
  skipIfBlock,
  skipElseBlock,
  skipLoopBlock,
  parseFunctionDefinition
} from './hintTextCodeParser';

/**
 * ตรวจสอบว่า text code ตรงกับ blocks หรือไม่
 */
export function validateTextCode(textCode, workspace) {
  try {
    if (!textCode.trim()) {
      return {
        isValid: false,
        message: "กรุณาเขียนโค้ด"
      };
    }

    // ตรวจสอบว่า workspace มีอยู่และมี blocks
    if (!workspace || !workspace.getAllBlocks || workspace.getAllBlocks().length === 0) {
      return {
        isValid: false,
        message: "ไม่มี blocks ใน workspace"
      };
    }

    // ตรวจสอบว่า Blockly มีอยู่
    if (!window.Blockly) {
      console.warn("Blockly ไม่พร้อมใช้งาน");
      return {
        isValid: false,
        message: "ระบบแปลงโค้ดยังไม่พร้อมใช้งาน"
      };
    }

    // แสดงข้อมูล blocks ที่วางไว้
    console.log("📦 Blocks in workspace:");
    const allBlocks = workspace.getAllBlocks();
    allBlocks.forEach((block, index) => {
      console.log(`Block ${index}:`, {
        type: block.type,
        id: block.id,
        nextConnection: block.nextConnection ? "has next" : "no next",
        previousConnection: block.previousConnection ? "has previous" : "no previous"
      });
    });

    // แปลง blocks เป็นโครงสร้างที่เข้าใจได้
    const blockStructure = convertBlocksToStructure(allBlocks);
    console.log("🏗️ Block structure:", blockStructure);

    // แปลง text code เป็นโครงสร้างที่เข้าใจได้
    const codeStructure = convertTextCodeToStructure(textCode);
    console.log("🏗️ Code structure:", codeStructure);

    // เปรียบเทียบโครงสร้าง
    try {
      compareStructures(blockStructure, codeStructure);
      console.log("🔍 Structure comparison result: true");
      return {
        isValid: true,
        message: "โค้ดตรงกับ blocks แล้ว!"
      };
    } catch (validationError) {
      // If it's a validation error (from compareStructures), use its message directly
      console.log("🔍 Structure comparison result: false", validationError.message);
      return {
        isValid: false,
        message: validationError.message
      };
    }

  } catch (error) {
    console.error("Error validating text code:", error);
    return {
      isValid: false,
      message: `เกิดข้อผิดพลาดในการตรวจสอบโค้ด: ${error.message}`
    };
  }
}

/**
 * แปลง blocks เป็นโครงสร้างที่เข้าใจได้
 */
/**
 * แปลง blocks เป็นโครงสร้างที่เข้าใจได้ (รองรับหลาย Root Blocks)
 */
function convertBlocksToStructure(blocks) {
  // หา root blocks ทั้งหมด (block ที่ไม่มี previous connection หรือไม่ถูกเชื่อมต่อนั่นเอง)
  const rootBlocks = blocks.filter(block => {
    // ไม่มี previous connection หรือ previous connection ไม่เชื่อมต่อกับ block อื่น
    const hasNoPrevious = !block.previousConnection;
    // หรือเป็น top-level block 
    const isTopLevel = !block.getParent();
    // Exclude Value Blocks (dangling expressions like variables_get)
    const isValueBlock = !!block.outputConnection;

    return isTopLevel && !isValueBlock;
  });

  // Sort definition blocks first? Or by Y position?
  // Usually definitions are separate.
  // We should sort by Y coordinate to match text code order (top-down)
  rootBlocks.sort((a, b) => a.getRelativeToSurfaceXY().y - b.getRelativeToSurfaceXY().y);

  console.log(`🎯 Found ${rootBlocks.length} root blocks:`, rootBlocks.map(b => b.type));

  let combinedStructure = [];
  rootBlocks.forEach(root => {
    const chain = convertBlocksToStructureFromRoot(root);
    // We concat them to form one linear execution logic representation?
    // OR we just keep them as separate flows? 
    // Text code structure is usually linear [Function, Call]
    // So concat is probably fine.
    combinedStructure = combinedStructure.concat(chain);
  });

  return combinedStructure;
}

/**
 * แปลง blocks เป็นโครงสร้างจาก root block
 */
function convertBlocksToStructureFromRoot(rootBlock) {
  const structure = [];
  let currentBlock = rootBlock;

  while (currentBlock) {
    const blockInfo = {
      type: currentBlock.type,
      hasNext: !!currentBlock.nextConnection
    };

    // ตรวจสอบ statement blocks (เช่น if block, function definition)
    if (currentBlock.getInputTargetBlock) {
      let childBlock = currentBlock.getInputTargetBlock('DO');
      if (!childBlock) {
        childBlock = currentBlock.getInputTargetBlock('DO0'); // controls_if uses DO0
      }
      if (!childBlock) {
        childBlock = currentBlock.getInputTargetBlock('IF_DO'); // Custom if_else uses IF_DO
      }
      if (!childBlock) {
        childBlock = currentBlock.getInputTargetBlock('STACK'); // Procedures use STACK
      }

      if (childBlock) {
        console.log(`🔍 Found statement block in ${currentBlock.type}:`, childBlock.type);
        blockInfo.statement = convertBlocksToStructureFromRoot(childBlock);
      }

      // Check for ELSE part (custom or standard if identifiable via input)
      let elseBlock = currentBlock.getInputTargetBlock('ELSE');
      if (!elseBlock) elseBlock = currentBlock.getInputTargetBlock('ELSE_DO'); // Custom else

      if (elseBlock) {
        console.log(`🔍 Found ELSE block in ${currentBlock.type}:`, elseBlock.type);
        blockInfo.elseStatement = convertBlocksToStructureFromRoot(elseBlock);
      }
    }

    // ตรวจสอบ value blocks (เช่น condition)
    if (currentBlock.getInputTargetBlock) {
      let conditionBlock = currentBlock.getInputTargetBlock('CONDITION');
      if (!conditionBlock) conditionBlock = currentBlock.getInputTargetBlock('IF0'); // controls_if uses IF0
      if (!conditionBlock) conditionBlock = currentBlock.getInputTargetBlock('BOOL'); // loops often use BOOL

      if (conditionBlock) {
        console.log(`🔍 Found condition block in ${currentBlock.type}:`, conditionBlock.type);
        blockInfo.condition = {
          type: conditionBlock.type
        };
      } else if (currentBlock.type === 'controls_if' || currentBlock.type === 'if_only') {
        console.log(`⚠️ WARNING: ${currentBlock.type} block (id: ${currentBlock.id}) has NO condition!`);
        console.log(`  Checked inputs: CONDITION=${!!currentBlock.getInputTargetBlock('CONDITION')}, IF0=${!!currentBlock.getInputTargetBlock('IF0')}`);
      }
    }

    // Special handling for variables_set:
    // If it sets a variable from a function call, we want to capture that function call structure
    // because Text Code parser sees 'var x = func()' as a function_call.
    if (currentBlock.type === 'variables_set') {
      const valueBlock = currentBlock.getInputTargetBlock ? currentBlock.getInputTargetBlock('VALUE') : null;

      // Check if it's a function call (procedures or custom functions)
      // Exclude array/dict access blocks (lists_get_at_index, dict_get, lists_get_last) as they're value expressions, not statements
      const isFunctionCall = valueBlock && (
        valueBlock.type === 'procedures_callreturn' ||
        valueBlock.type === 'procedures_callnoreturn' ||
        valueBlock.type === 'lists_find_min_index' ||
        valueBlock.type === 'lists_add_item' ||
        valueBlock.type === 'lists_remove_at_index' ||
        valueBlock.type === 'lists_remove_last_return' || // pop() is a statement
        valueBlock.type === 'lists_remove_first_return' || // shift() is a statement
        valueBlock.type === 'lists_concat' ||
        valueBlock.type === 'lists_getIndex' || // Standard Blockly get/remove block
        valueBlock.type === 'graph_get_neighbors_with_weight' ||
        valueBlock.type === 'graph_get_neighbors' ||
        valueBlock.type === 'graph_get_all_edges' || // Kruskal: getAllEdges
        valueBlock.type === 'graph_sort_edges' ||    // Kruskal: sortByWeight (Old)
        valueBlock.type === 'lists_sort_by_weight' || // Kruskal: Actual block name
        valueBlock.type === 'dsu_find' ||            // Kruskal: dsu_find
        valueBlock.type.includes('_vis_') // Visualization helpers
      );

      if (isFunctionCall) {
        console.log(`🔍 Found function call inside variables_set:`, valueBlock.type);
        structure.push({
          type: valueBlock.type,
          hasNext: !!currentBlock.nextConnection
        });
      }

      // Always move to next for variables_set (whether we captured logic or not)
      if (currentBlock.nextConnection && currentBlock.nextConnection.targetBlock()) {
        currentBlock = currentBlock.nextConnection.targetBlock();
      } else {
        currentBlock = null;
      }
      continue;
    }

    // Skip other logic-only blocks
    if (currentBlock.type === 'math_change' || currentBlock.type === 'rope_visual_init') {
      if (currentBlock.nextConnection && currentBlock.nextConnection.targetBlock()) {
        currentBlock = currentBlock.nextConnection.targetBlock();
      } else {
        currentBlock = null;
      }
      continue;
    }

    // Special handling for procedures_defreturn:
    // Add implicit return ONLY if there's no explicit return at the end
    if (currentBlock.type === 'procedures_defreturn') {
      const statements = blockInfo.statement || [];
      const lastStatement = statements.length > 0 ? statements[statements.length - 1] : null;
      const hasExplicitReturn = lastStatement &&
        (lastStatement.type === 'procedures_return' ||
          lastStatement.type === 'procedures_ifreturn' ||
          lastStatement.type === 'if_else' ||
          (lastStatement.type === 'controls_if' && lastStatement.elseStatement && lastStatement.elseStatement.length > 0));

      if (!hasExplicitReturn) {
        console.log(`🔍 Adding implicit return for procedures_defreturn (no explicit return found)`);
        if (!blockInfo.statement) blockInfo.statement = [];
        blockInfo.statement.push({
          type: 'procedures_return',
          hasNext: false
        });
      } else {
        console.log(`✅ Explicit return found, skipping implicit return`);
      }
    }

    structure.push(blockInfo);
    console.log(`📝 Added block to structure:`, blockInfo);

    // ไปยัง block ถัดไป
    if (currentBlock.nextConnection) {
      const nextBlock = currentBlock.nextConnection.targetBlock();
      console.log(`➡️ [Traversal] Block ${currentBlock.type} has next connection. Target: ${nextBlock ? nextBlock.type : 'NULL'}`);
      if (nextBlock) {
        currentBlock = nextBlock;
      } else {
        currentBlock = null;
      }
    } else {
      console.log(`⏹️ [Traversal] Block ${currentBlock.type} has NO next connection.`);
      currentBlock = null;
    }
  }

  return structure;
}

/**
 * แปลง text code เป็นโครงสร้างที่เข้าใจได้
 * รองรับบล็อกทั้งหมดที่มีใน database
 */
function convertTextCodeToStructure(textCode) {
  const lines = textCode.split('\n'); // Get all lines, including empty and comments
  const structure = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim(); // Trim the current line for processing and logging

    console.log(`[Parser] Line ${i}: "${line}"`); // Debug Log for each line

    // Skip empty lines or comment lines after logging them
    if (!line || line.startsWith('//')) continue;

    // ===== MOVEMENT BLOCKS =====
    if (line.includes('await moveForward()')) {
      structure.push({ type: 'move_forward', hasNext: true });
    }
    else if (line.includes('await turnLeft()')) {
      structure.push({ type: 'turn_left', hasNext: true });
    }
    else if (line.includes('await turnRight()')) {
      structure.push({ type: 'turn_right', hasNext: true });
    }
    else if (line.includes('await hit()')) {
      structure.push({ type: 'hit', hasNext: true });
    }

    // ===== COIN BLOCKS =====
    else if (line.includes('await collectCoin()')) {
      structure.push({ type: 'collect_coin', hasNext: true });
    }

    // ===== PERSON RESCUE BLOCKS =====
    else if (line.includes('await rescuePerson()')) {
      structure.push({ type: 'rescue_person', hasNext: true });
    }
    else if (line.includes('await rescuePersonAtNode(')) {
      const match = line.match(/rescuePersonAtNode\((\d+)\)/);
      const nodeId = match ? parseInt(match[1]) : 0;
      structure.push({
        type: 'rescue_person_at_node',
        hasNext: true,
        nodeId: nodeId
      });
    }

    // ===== CONDITION BLOCKS =====
    else if (line.includes('if (foundMonster())')) {
      structure.push(parseIfBlock(lines, i, 'found_monster'));
      i = skipIfBlock(lines, i);
    }
    else if (line.includes('if (canMoveForward())')) {
      structure.push(parseIfBlock(lines, i, 'can_move_forward'));
      i = skipIfBlock(lines, i);
    }
    else if (line.includes('if (nearPit())')) {
      structure.push(parseIfBlock(lines, i, 'near_pit'));
      i = skipIfBlock(lines, i);
    }
    else if (line.includes('if (atGoal())')) {
      structure.push(parseIfBlock(lines, i, 'at_goal'));
      i = skipIfBlock(lines, i);
    }
    else if (line.includes('if (hasPerson())')) {
      structure.push(parseIfBlock(lines, i, 'has_person'));
      i = skipIfBlock(lines, i);
    }
    else if (line.includes('if (hasTreasure())')) {
      structure.push(parseIfBlock(lines, i, 'has_treasure'));
      i = skipIfBlock(lines, i);
    }
    else if (line.includes('if (haveCoin())')) {
      structure.push(parseIfBlock(lines, i, 'has_coin'));
      i = skipIfBlock(lines, i);
    }

    // ===== IF-ELSE BLOCKS =====
    else if (line.startsWith('if (') && !line.includes('foundMonster') && !line.includes('canMove')) {
      const hasElse = checkIfHasElse(lines, i);
      if (hasElse) {
        structure.push(parseIfElseBlock(lines, i));
      } else {
        structure.push(parseIfOnlyBlock(lines, i));
      }
      i = skipIfBlock(lines, i);
    }

    // ===== LOOP BLOCKS =====
    else if (line.match(/\brepeat\b/) || line.match(/\bfor\b/) || line.match(/\bwhile\b/)) {
      // Support `repeat(n) { ... }` syntax (user-friendly repeat)
      const repeatMatch = line.match(/repeat\s*\(\s*(\d+)\s*\)\s*\{/);
      if (repeatMatch) {
        // ... existing logic ...
        const times = parseInt(repeatMatch[1], 10);
        structure.push(parseLoopBlock(lines, i, 'repeat', times));
        i = skipLoopBlock(lines, i);
        continue;
      }
      // Relaxed repeat match (without brace)
      const repeatMatchRelaxed = line.match(/repeat\s*\(\s*(\d+)\s*\)/);
      if (repeatMatchRelaxed) {
        const times = parseInt(repeatMatchRelaxed[1], 10);
        structure.push(parseLoopBlock(lines, i, 'repeat', times));
        i = skipLoopBlock(lines, i);
        continue;
      }

      // More flexible for-loop detection (including for-of)
      const forHeaderMatch = line.match(/for\s*\(\s*(?:let|const|var)\s+(\w+)\s*=\s*(\d+)\s*;\s*\1\s*(<|<=)\s*(\d+)\s*;/);
      const forOfMatch = line.match(/for\s*\(\s*(?:let|const|var)\s+(\w+)\s+of\s+(\w+)\s*\)/);

      if (forHeaderMatch) {
        const start = parseInt(forHeaderMatch[2], 10);
        const operator = forHeaderMatch[3];
        const limit = parseInt(forHeaderMatch[4], 10);
        const times = operator === '<' ? Math.max(0, limit - start) : Math.max(0, limit - start + 1);
        structure.push(parseLoopBlock(lines, i, 'repeat', times));
        i = skipLoopBlock(lines, i);
        continue;
      } else if (forOfMatch) {
        // For-of treated as repeat (indefinite/dynamic)
        structure.push(parseLoopBlock(lines, i, 'repeat', 0));
        i = skipLoopBlock(lines, i);
        continue;
      }

      const whileMatch = line.match(/while\s*\((.*?)\)/);
      if (whileMatch) {
        const condition = whileMatch[1];
        structure.push(parseLoopBlock(lines, i, 'while_loop', null, condition));
        i = skipLoopBlock(lines, i);
        continue;
      }
    }

    // ===== FUNCTION DEFINITION =====
    else if (line.startsWith('function ') || line.startsWith('async function ')) {
      structure.push(parseFunctionDefinition(lines, i));
      i = skipLoopBlock(lines, i); // Reuse skipLoopBlock as it just counts braces
    }

    // ===== SORTING / COIN BLOCKS (STATEMENTS) =====
    else if (line.includes('swapCoins(')) {
      structure.push({ type: 'swap_coins', hasNext: true });
    }
    else if (line.includes('compareCoins(')) {
      structure.push({ type: 'compare_coins', hasNext: true });
    }

    // ===== ROPE PARTITION HELPERS =====
    else if (line.match(/pushNode\s*\(/) || line.includes('rope_vis_enter')) {
      console.log(`TYPE DETECTED: rope_vis_enter for line: "${line}"`);
      structure.push({ type: 'rope_vis_enter', hasNext: true });
    }
    else if (line.match(/popNode\s*\(/) || line.includes('rope_vis_exit')) {
      console.log(`TYPE DETECTED: rope_vis_exit for line: "${line}"`);
      structure.push({ type: 'rope_vis_exit', hasNext: true });
    }
    else if (line.match(/updateStatus\s*\(/) || line.includes('rope_vis_status')) {
      console.log(`TYPE DETECTED: rope_vis_status for line: "${line}"`);
      structure.push({ type: 'rope_vis_status', hasNext: true });
    }
    // rope_get_cuts is a VALUE block (input), not a statement, so we DO NOT push it to structure


    // ===== FUNCTION CALLS =====
    else {
      const statement = parseStatement(line);
      if (statement) {
        structure.push(statement);
      } else {
        // Fallback: Legacy simple function call detection
        const funcCallMatch = line.match(/(\w+)\s*\(/);
        if (funcCallMatch &&
          !line.startsWith('if') &&
          !line.startsWith('while') &&
          !line.startsWith('for') &&
          !line.includes('getCuts') &&
          !line.includes('function ')) {
          structure.push({ type: 'function_call', name: funcCallMatch[1], hasNext: true });
        }
      }
    }
    // Note: other for-index patterns (e.g., <= with different formatting) will be covered by the flexible regex above
  }

  return structure;
}

/**
 * เปรียบเทียบโครงสร้าง blocks และ code
 * Throws error if mismatch
 */
function compareStructures(blockStructure, codeStructure, path = "") {
  let blockIdx = 0;
  let codeIdx = 0;

  while (blockIdx < blockStructure.length && codeIdx < codeStructure.length) {
    const block = blockStructure[blockIdx];
    const code = codeStructure[codeIdx];
    const currentPath = path ? `${path} -> Block ${blockIdx}` : `Block ${blockIdx}`;

    console.log(`🔍 Comparing at ${currentPath}: Block type='${block.type}' vs Code type='${code.type}' Name='${code.name || 'N/A'}' Content='${code.raw || 'N/A'}'`);

    // FLEXIBLE VALIDATION: Skip extra variable declarations in text code
    // If code has a variables_set but block doesn't, skip the code statement
    // FLEXIBLE VALIDATION: Skip extra variable declaration OR safe function calls in text code
    // If code has a variables_set or function call but block doesn't match it (and isn't compatible), skip the code statement
    const safeSkipTypes = ['variables_set', 'dsu_find', 'graph_get_neighbors', 'graph_get_neighbors_with_weight', 'graph_get_all_edges', 'lists_sort_by_weight', 'function_call', 'lists_add_item', 'lists_remove_at_index', 'dict_set', 'controls_flow_statements'];
    if (safeSkipTypes.includes(code.type) && block.type !== code.type && !areTypesCompatible(block.type, code.type)) {
      console.log(`⏭️ Skipping extra statement in text code at ${currentPath}: ${code.type}`);
      codeIdx++;
      continue;
    }

    // 0. CHECK FOR IMPLICIT ELSE PATTERN (Priority)
    // Even if types are compatible (e.g. controls_if matching if_only),
    // we must check if this is an "Implicit Else" structure (return/break inside if).
    if (block.elseStatement && block.elseStatement.length > 0 && code.type === 'if_only') {
      const codeStmts = code.statement || [];
      const lastStmt = codeStmts.length > 0 ? codeStmts[codeStmts.length - 1] : null;
      // Allow returns and other flow control as terminals
      const isTerminal = lastStmt && (['return_statement', 'rope_vis_exit', 'procedures_return', 'break_statement', 'continue_statement'].includes(lastStmt.type));

      if (isTerminal) {
        console.log(`🔄 Detected Implicit Else pattern at ${currentPath}`);

        // Check Condition
        try {
          compareConditions(block, code);
        } catch (e) {
          throw new Error(`เงื่อนไขใน IF ไม่ตรงกันที่ ${currentPath}: ${e.message}`);
        }

        // Check IF Statements
        try {
          compareStructures(block.statement || [], code.statement || [], `${currentPath} (IF)`);
        } catch (e) {
          throw new Error(`คำสั่งภายใน IF ไม่ตรงกัน: ${e.message}`);
        }

        // Check ELSE Statements (against remaining code)
        const blockElse = block.elseStatement || [];
        const remainingCode = codeStructure.slice(codeIdx + 1);

        try {
          compareStructures(blockElse, remainingCode, `${currentPath} (Implicit ELSE)`);
        } catch (e) {
          throw new Error(`ส่วน ELSE (code ที่เหลือ) ไม่ตรงกับ Block ELSE: ${e.message}`);
        }

        // Success - Skip everything consummed
        blockIdx++;
        codeIdx += (1 + remainingCode.length);
        continue;
      }
    }

    // 1. Check basic compatibility
    if (!areTypesCompatible(block.type, code.type)) {
      // Attempt to handle Implicit Else Pattern:
      if (areTypesCompatible(block.type, 'if_else_block') && code.type === 'if_only') {
        const codeStmts = code.statement || [];
        const lastStmt = codeStmts.length > 0 ? codeStmts[codeStmts.length - 1] : null;
        const isTerminal = lastStmt && (['return_statement', 'rope_vis_exit', 'procedures_return'].includes(lastStmt.type));

        if (isTerminal) {
          console.log(`🔄 Checking Implicit Else pattern at ${currentPath}...`);

          // Check Condition
          try {
            compareConditions(block, code);
          } catch (e) {
            throw new Error(`เงื่อนไขใน IF ไม่ตรงกันที่ ${currentPath}: ${e.message}`);
          }

          // Check IF Statements
          try {
            compareStructures(block.statement || [], code.statement || [], `${currentPath} (IF)`);
          } catch (e) {
            throw new Error(`คำสั่งภายใน IF ไม่ตรงกัน: ${e.message}`);
          }

          // Check ELSE Statements
          const blockElse = block.elseStatement || [];
          const remainingCode = codeStructure.slice(codeIdx + 1);

          try {
            compareStructures(blockElse, remainingCode, `${currentPath} (Implicit ELSE)`);
          } catch (e) {
            throw new Error(`ส่วน ELSE (code ที่เหลือ) ไม่ตรงกับ Block ELSE: ${e.message}`);
          }

          // Success
          blockIdx++;
          codeIdx += (1 + remainingCode.length);
          continue;
        }
      }

      throw new Error(`คำสั่งไม่ตรงกันที่ ${currentPath}: คาดหวัง '${mapTypeToThai(block.type)}' แต่พบ '${mapTypeToThai(code.type)}'`);
    }

    // 2. Compare Internals (Normal case)

    // Check Statements
    const blockStmts = block.statement || [];
    const codeStmts = code.statement || [];
    try {
      compareStructures(blockStmts, codeStmts, `${currentPath} (Statements)`);
    } catch (e) {
      throw new Error(`คำสั่งภายใน '${mapTypeToThai(block.type)}' ไม่ตรงกัน: ${e.message}`);
    }

    // Check Else Statements (Explicit else check)
    if (block.elseStatement) {
      const codeElse = code.elseStatement || [];
      try {
        compareStructures(block.elseStatement, codeElse, `${currentPath} (Else)`);
      } catch (e) {
        throw new Error(`คำสั่งภายใน ELSE ไม่ตรงกัน: ${e.message}`);
      }
    }

    // Check Conditions
    compareConditions(block, code);

    blockIdx++;
    codeIdx++;
  }

  // Check for leftover items
  if (blockIdx < blockStructure.length) {
    const missingBlock = blockStructure[blockIdx];
    throw new Error(`ขาดคำสั่ง '${mapTypeToThai(missingBlock.type)}' ที่ ${path ? path : 'ด้านล่างสุด'}`);
  }
  if (codeIdx < codeStructure.length) {
    // Skip any leftover variables_set OR safe type in code (flexible validation)
    const safeSkipTypes = ['variables_set', 'dsu_find', 'graph_get_neighbors', 'graph_get_neighbors_with_weight', 'graph_get_all_edges', 'lists_sort_by_weight', 'function_call', 'lists_add_item', 'lists_remove_at_index', 'dict_set', 'controls_flow_statements'];
    while (codeIdx < codeStructure.length && safeSkipTypes.includes(codeStructure[codeIdx].type)) {
      console.log(`⏭️ Skipping leftover statement in text code at end of ${path || 'root'}: ${codeStructure[codeIdx].type}`);
      codeIdx++;
    }

    // If there are still leftover items after skipping variables, throw error
    if (codeIdx < codeStructure.length) {
      const extraCode = codeStructure[codeIdx];
      throw new Error(`มีคำสั่งเกินมา '${mapTypeToThai(extraCode.type)}' ที่ ${path ? path : 'ด้านล่างสุด'}`);
    }
  }

  return true;
}

function compareConditions(block, code) {
  console.log(`🔍 compareConditions: block.type='${block.type}', code.type='${code.type}', block.condition=${!!block.condition}, code.condition=${!!code.condition}`);

  // Skip condition check for for_each loops (they don't have conditions in JS)
  if (block.type === 'for_each_in_list' || block.type === 'for_each' ||
    code.type === 'for_each_in_list' || code.type === 'for_each') {
    console.log(`✅ Skipping condition check for for_each loop`);
    return true;
  }

  if (block.condition && code.condition) {
    // Exact match
    if (block.condition.type === code.condition.type) {
      return true;
    }

    // Fuzzy Logic Matches
    // Case 1: Block expects 'logic_operation' (AND/OR), but Code Parser always assigns 'logic_compare'.
    if (block.condition.type === 'logic_operation' && code.condition.type === 'logic_compare') {
      const raw = code.condition.raw || '';
      // Check if raw code contains logical operators (&&, ||)
      if (raw.includes('&&') || raw.includes('||')) {
        console.log(`✅ Fuzzy logic match: Accepted '${raw}' as logic_operation`);
        return true;
      }
    }

    // Case 2: Block expects 'logic_negate' (NOT), but Code Parser assigns 'logic_compare'.
    if (block.condition.type === 'logic_negate' && code.condition.type === 'logic_compare') {
      const raw = code.condition.raw || '';
      if (raw.trim().startsWith('!') || raw.includes('!')) {
        console.log(`✅ Fuzzy logic match: Accepted '${raw}' as logic_negate`);
        return true;
      }
      // Allow "length > 0" as equivalent to !isEmpty (logic_negate)
      if (raw.includes('length > 0')) {
        console.log(`✅ Fuzzy logic match: Accepted '${raw}' as logic_negate (!isEmpty)`);
        return true;
      }
    }

    // Case 3: Block expects 'logic_operation', but Code is 'logic_negate' (starts with !)
    if (block.condition.type === 'logic_operation' && code.condition.type === 'logic_negate') {
      const raw = code.condition.raw || '';
      if (raw.includes('&&') || raw.includes('||')) {
        console.log(`✅ Fuzzy logic match: Accepted '${raw}' as logic_operation (complex negated condition)`);
        return true;
      }
    }

    // Case 4: Block expects 'logic_not_in', but Code is 'logic_negate' with .includes()
    if (block.condition.type === 'logic_not_in' && code.condition.type === 'logic_negate') {
      const raw = code.condition.raw || '';
      if (raw.includes('.includes(')) {
        console.log(`✅ Fuzzy logic match: Accepted '${raw}' as logic_not_in (!list.includes)`);
        return true;
      }
    }

    // Case 5: N-Queen custom function blocks
    if (block.condition.type === 'nqueen_is_safe' && (code.condition.type === 'procedures_callreturn' || code.condition.type === 'function_call')) {
      const raw = code.condition.raw || '';
      if (raw.includes('safe')) {
        console.log(`✅ Fuzzy logic match: Accepted '${raw}' as nqueen_is_safe`);
        return true;
      }
    }

    // Case 6: Generic game functions (Found Monster, Can Move) fallback
    const gameTypeMapping = {
      'found_monster': 'foundMonster',
      'can_move_forward': 'canMoveForward',
      'near_pit': 'nearPit',
      'at_goal': 'atGoal',
      'has_person': 'hasPerson',
      'has_treasure': 'hasTreasure',
      'has_coin': 'haveCoin'
    };

    if (gameTypeMapping[block.condition.type] && (code.condition.type === 'procedures_callreturn' || code.condition.type === 'function_call')) {
      const raw = code.condition.raw || '';
      if (raw.includes(gameTypeMapping[block.condition.type])) {
        console.log(`✅ Fuzzy logic match: Accepted '${raw}' as ${block.condition.type}`);
        return true;
      }
    }

    // Strict Type Fail
    // Add specific message for "Expected logic_operation"
    const typeName = (t) => {
      if (t === 'logic_operation') return 'ตรรกะซ้อน (AND / OR)';
      if (t === 'logic_negate') return 'นิเสธ (NOT)';
      if (t === 'logic_compare') return 'การเปรียบเทียบ';
      if (t === 'found_monster') return 'ตรวจพบมอนสเตอร์ (foundMonster)';
      if (t === 'can_move_forward') return 'ตรวจการเดิน (canMoveForward)';
      if (t === 'near_pit') return 'ตรวจหลุม (nearPit)';
      if (t === 'at_goal') return 'ตรวจเป้าหมาย (atGoal)';
      return t;
    };

    throw new Error(`เงื่อนไขไม่ตรงกัน: คาดหวัง '${typeName(block.condition.type)}' แต่พบ '${typeName(code.condition.type)}'`);

  } else if (block.condition !== code.condition) {
    // One is null, one is not?
    if (!block.condition && !code.condition) return true;
    throw new Error(`การระบุเงื่อนไขไม่ตรงกัน (มี/ไม่มี เงื่อนไข)`);
  }
  return true;
}

/**
 * ตรวจสอบความเข้ากันได้ของประเภท Block และ Code
 */
function areTypesCompatible(blockType, codeType) {
  if (blockType === codeType) return true;

  const mapping = {
    'procedures_defreturn': 'function_definition',
    'procedures_defnoreturn': 'function_definition',
    'procedures_callreturn': 'function_call',
    'procedures_callnoreturn': 'function_call',
    'nqueen_place': 'function_call',
    'nqueen_remove': 'function_call',
    'nqueen_is_safe': 'function_call',
    'rope_vis_enter': 'rope_vis_enter', // Identity mapping for clarity
    'rope_vis_exit': 'rope_vis_exit',
    'rope_vis_status': 'rope_vis_status',

    // Loops
    'controls_forEach': 'repeat', // We map for block to repeat structure
    'controls_repeat_ext': 'repeat',
    'controls_whileUntil': 'while_loop',
    'while_loop': 'while_loop', // Ensure while_loop block maps

    // Conditions
    'controls_if': 'if_block',
    'controls_ifelse': 'if_else_block',
    'logic_compare': 'condition_block',

    // Returns
    'procedures_return': 'return_statement',
    'procedures_ifreturn': 'return_statement',

    // Advanced Assignments (Dicts/Lists)
    'dict_set': 'variables_set', // a[b] = c is assignment
    'lists_setIndex': 'dict_set', // list[i] = v is dict_set in parser
  };

  // Check direct mapping
  if (mapping[blockType] === codeType) return true;

  // Manual overrides for lists_setIndex and Functional Blocks assigned to variables
  if ((blockType === 'lists_setIndex' || blockType === 'lists_add_item' ||
    blockType === 'graph_get_all_edges' || blockType === 'lists_sort_by_weight' ||
    blockType === 'graph_get_neighbors' || blockType === 'graph_get_neighbors_with_weight' ||
    blockType === 'dsu_find' || blockType === 'dsu_union' ||
    blockType === 'procedures_callreturn' ||
    blockType === 'lists_find_max_index') &&
    (codeType === 'variables_set' || codeType === 'dict_set')) {
    return true;
  }

  // Fuzzy match for function calls (generic)
  if (codeType === 'function_call') {
    return blockType === 'procedures_callreturn' ||
      blockType === 'procedures_callnoreturn' ||
      blockType === 'variables_set' || // Allow assignment of function call result
      blockType === 'dict_set' || // Allow assignment of function call result
      blockType === 'coin_change_track_decision' ||
      blockType === 'coin_change_add_warrior_to_selection' ||
      blockType === 'lists_add_item' ||
      blockType === 'lists_remove_at_index' ||
      blockType === 'lists_find_min_index' ||
      blockType === 'lists_get_at_index' ||
      blockType === 'lists_get_last' ||
      blockType === 'lists_concat' ||
      blockType === 'lists_getIndex' || // Allow pop/get/remove (Blockly standard)
      blockType === 'lists_remove_first_return' || // shift
      blockType === 'lists_remove_last_return' || // pop
      blockType === 'lists_contains' ||
      blockType === 'graph_get_neighbors_with_weight' ||
      blockType === 'graph_get_neighbors' ||
      blockType === 'graph_get_all_edges' || // Kruskal
      blockType === 'graph_sort_edges' ||    // Kruskal (Legacy)
      blockType === 'lists_sort_by_weight' || // Kruskal (Actual)
      blockType === 'dsu_find' ||            // Kruskal
      blockType === 'move_along_path' ||
      blockType === 'sort_trains' ||
      blockType === 'assign_train_visual' ||
      blockType === 'lists_find_max_index' ||
      blockType === 'emei_highlight_peak' ||
      blockType === 'emei_highlight_path' ||
      blockType === 'emei_show_final_result';
  }

  // Fuzzy match for If
  if (blockType === 'controls_if') {
    return codeType === 'if_block' || codeType === 'if_only_block' || codeType === 'if_else_block' ||
      codeType === 'if_only' || codeType === 'if_else'; // Add parser output types
  }

  // Fuzzy match for Loops
  if (blockType === 'controls_forEach' || blockType === 'controls_for' || blockType === 'controls_whileUntil' || blockType === 'while_loop' || blockType === 'for_each_in_list' || blockType === 'for_loop_dynamic') {
    return codeType === 'for_loop' || codeType === 'while_loop' || codeType === 'repeat' || codeType === 'loop' || codeType === 'for_each' || codeType === 'for_index' || codeType === 'function_call' || codeType === 'for_loop_dynamic';
  }

  return mapping[blockType] === codeType;
}

function mapTypeToThai(type) {
  const map = {
    'move_forward': 'เดินหน้า',
    'turn_left': 'เลี้ยวซ้าย',
    'turn_right': 'เลี้ยวขวา',
    'hit': 'โจมตี',
    'collect_coin': 'เก็บเหรียญ',
    'rope_vis_enter': 'pushNode (เข้าโหนด)',
    'rope_vis_exit': 'popNode (ออกโหนด)',
    'rope_vis_status': 'updateStatus',
    'controls_if': 'เงื่อนไข (If)',
    'controls_ifelse': 'เงื่อนไข (If-Else)',
    'controls_forEach': 'วนลูป (Loop)',
    'for_each_in_list': 'วนลูป (For Each)',
    'while_loop': 'วนลูป (While)',
    'procedures_defreturn': 'ฟังก์ชันหลัก',
    'procedures_callreturn': 'เรียกฟังก์ชัน',
    'procedures_return': 'คืนค่า (Return)',
    'math_number': 'ตัวเลข',
    'variables_set': 'กำหนดค่าตัวแปร',
    'dict_set': 'ตั้งค่าใน Dictionary',
    'lists_add_item': 'เพิ่มลงใน List',
    'lists_remove_at_index': 'ลบออกจาก List',
    'lists_find_min_index': 'หาค่าต่ำสุดใน List',
    'coin_change_track_decision': 'บันทึกการตัดสินใจ',
    'nqueen_is_safe': 'ตรวจสอบความปลอดภัย (safe)',
    'nqueen_place': 'วางควีน (place)',
    'nqueen_remove': 'ยกควีนออก (remove)',
    'found_monster': 'ตรวจพบมอนสเตอร์ (foundMonster)',
    'can_move_forward': 'ตรวจการเดิน (canMoveForward)',
    'near_pit': 'ตรวจหลุม (nearPit)',
    'at_goal': 'ตรวจเป้าหมาย (atGoal)',
    'has_person': 'ตรวจคน (hasPerson)',
    'has_treasure': 'ตรวจสมบัติ (hasTreasure)',
    'has_coin': 'ตรวจเหรียญ (haveCoin)'
  };
  return map[type] || type;
}
