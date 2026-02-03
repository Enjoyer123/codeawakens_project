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
    const isValid = compareStructures(blockStructure, codeStructure);
    console.log("🔍 Structure comparison result:", isValid);

    if (isValid) {
      return {
        isValid: true,
        message: "โค้ดตรงกับ blocks แล้ว!"
      };
    } else {
      return {
        isValid: false,
        message: "โค้ดไม่ตรงกับ blocks ที่วางไว้"
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
function convertBlocksToStructure(blocks) {
  // หา root block (block ที่ไม่มี previous connection ที่เชื่อมต่อกับ block อื่น)
  const rootBlock = blocks.find(block => {
    // ไม่มี previous connection หรือ previous connection ไม่เชื่อมต่อกับ block อื่น
    const hasNoPrevious = !block.previousConnection;
    const hasUnconnectedPrevious = block.previousConnection && !block.previousConnection.targetBlock();

    // ไม่ใช่ value block
    const isNotValueBlock = !block.outputConnection &&
      block.type !== 'found_monster' &&
      block.type !== 'can_move_forward' &&
      block.type !== 'can_turn_left' &&
      block.type !== 'can_turn_right';

    return (hasNoPrevious || hasUnconnectedPrevious) && isNotValueBlock;
  });

  if (!rootBlock) {
    console.log("❌ No root block found, trying alternative method...");

    // วิธีสำรอง: หา block แรกที่ไม่ใช่ value block
    const alternativeRoot = blocks.find(block =>
      !block.outputConnection &&
      block.type !== 'found_monster' &&
      block.type !== 'can_move_forward' &&
      block.type !== 'can_turn_left' &&
      block.type !== 'can_turn_right'
    );

    if (alternativeRoot) {
      console.log("🎯 Alternative root block found:", alternativeRoot.type);
      return convertBlocksToStructureFromRoot(alternativeRoot);
    }

    console.log("❌ No suitable root block found");
    return [];
  }

  console.log("🎯 Root block found:", rootBlock.type);
  return convertBlocksToStructureFromRoot(rootBlock);
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

    // ตรวจสอบ statement blocks (เช่น if block)
    if (currentBlock.getInputTargetBlock) {
      const doBlock = currentBlock.getInputTargetBlock('DO');
      if (doBlock) {
        console.log(`🔍 Found statement block in ${currentBlock.type}:`, doBlock.type);
        blockInfo.statement = convertBlocksToStructureFromRoot(doBlock);
      }
    }

    // ตรวจสอบ value blocks (เช่น condition)
    if (currentBlock.getInputTargetBlock) {
      const conditionBlock = currentBlock.getInputTargetBlock('CONDITION');
      if (conditionBlock) {
        console.log(`🔍 Found condition block in ${currentBlock.type}:`, conditionBlock.type);
        blockInfo.condition = {
          type: conditionBlock.type
        };
      }
    }

    structure.push(blockInfo);
    console.log(`📝 Added block to structure:`, blockInfo);

    // ไปยัง block ถัดไป
    if (currentBlock.nextConnection && currentBlock.nextConnection.targetBlock()) {
      currentBlock = currentBlock.nextConnection.targetBlock();
    } else {
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
  const lines = textCode.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));
  const structure = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

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
    else if (line.includes('repeat') || line.includes('for') || line.includes('while')) {
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

      // More flexible for-loop detection
      const forHeaderMatch = line.match(/for\s*\(\s*(?:let|const|var)\s+(\w+)\s*=\s*(\d+)\s*;\s*\1\s*(<|<=)\s*(\d+)\s*;/);
      if (forHeaderMatch) {
        const varName = forHeaderMatch[1];
        const start = parseInt(forHeaderMatch[2], 10);
        const operator = forHeaderMatch[3];
        const limit = parseInt(forHeaderMatch[4], 10);
        const times = operator === '<' ? Math.max(0, limit - start) : Math.max(0, limit - start + 1);
        structure.push(parseLoopBlock(lines, i, 'repeat', times));
        // Note: Could map to 'for_index' if we wanted stricter checking
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
    else if (line.startsWith('function ')) {
      structure.push(parseFunctionDefinition(lines, i));
      i = skipLoopBlock(lines, i); // Reuse skipLoopBlock as it just counts braces
    }

    // ===== SORTING / COIN BLOCKS (STATEMENTS) =====
    else if (line.includes('swapCoins(')) {
      structure.push({ type: 'swap_coins', hasNext: true });
    }
    else if (line.includes('compareCoins(')) {
      // Only add as statement logic if it's a standalone call (not inside if)
      // But usually verifyTextCode iterates lines. If `if (compareCoins())` is passed,
      // it's handled by parseIfBlock calling parseStatement? 
      // parseStatement needs to support generic calls too.
      structure.push({ type: 'compare_coins', hasNext: true });
    }

    // ===== FUNCTION CALLS =====
    else {
      const funcCallMatch = line.match(/(\w+)\s*\(/);
      if (funcCallMatch && !line.startsWith('if') && !line.startsWith('while') && !line.startsWith('for')) {
        structure.push({ type: 'function_call', name: funcCallMatch[1], hasNext: true });
      }
    }
    // Note: other for-index patterns (e.g., <= with different formatting) will be covered by the flexible regex above
  }

  return structure;
}

/**
 * เปรียบเทียบโครงสร้าง blocks และ code
 */
function compareStructures(blockStructure, codeStructure) {
  if (blockStructure.length !== codeStructure.length) {
    console.log("❌ Different lengths:", blockStructure.length, "vs", codeStructure.length);
    return false;
  }

  for (let i = 0; i < blockStructure.length; i++) {
    const block = blockStructure[i];
    const code = codeStructure[i];

    if (block.type !== code.type) {
      console.log(`❌ Different types at ${i}:`, block.type, "vs", code.type);
      return false;
    }

    // ตรวจสอบ statement blocks
    const blockStmts = block.statement || [];
    const codeStmts = code.statement || [];

    if (!compareStructures(blockStmts, codeStmts)) {
      console.log(`❌ Different statements at ${i}`);
      return false;
    }

    // ตรวจสอบ condition blocks
    if (block.condition && code.condition) {
      if (block.condition.type !== code.condition.type) {
        console.log(`❌ Different conditions at ${i}:`, block.condition.type, "vs", code.condition.type);
        return false;
      }
    } else if (block.condition !== code.condition) {
      console.log(`❌ Different condition presence at ${i}`);
      return false;
    }
  }

  console.log("✅ Structures match!");
  return true;
}

