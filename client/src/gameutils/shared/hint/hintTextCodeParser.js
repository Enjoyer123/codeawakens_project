// Text Code Parser Functions for Hint System
/**
 * Parse if block with condition
 */
export function parseIfBlock(lines, startIndex, conditionType) {
  const ifBlock = {
    type: 'if_only',
    hasNext: true,
    condition: { type: conditionType }
  };

  // หา statement blocks ข้างใน if
  const statementBlocks = [];
  let braceCount = 0;
  let foundOpenBrace = false;

  for (let j = startIndex; j < lines.length; j++) {
    const currentLine = lines[j];

    if (currentLine.includes('{')) {
      braceCount++;
      foundOpenBrace = true;
    }
    if (currentLine.includes('}')) {
      braceCount--;
    }

    if (foundOpenBrace && braceCount > 0 && j > startIndex) {
      // Parse statements inside if block
      if (currentLine.includes('await moveForward()')) {
        statementBlocks.push({ type: 'move_forward', hasNext: true });
      } else if (currentLine.includes('await hit()')) {
        statementBlocks.push({ type: 'hit', hasNext: true });
      } else if (currentLine.includes('await turnLeft()')) {
        statementBlocks.push({ type: 'turn_left', hasNext: true });
      } else if (currentLine.includes('await turnRight()')) {
        statementBlocks.push({ type: 'turn_right', hasNext: true });
      } else if (currentLine.includes('await collectCoin()')) {
        statementBlocks.push({ type: 'collect_coin', hasNext: true });
      } else if (currentLine.includes('await rescuePerson()')) {
        statementBlocks.push({ type: 'rescue_person', hasNext: true });
      }
    }

    if (foundOpenBrace && braceCount === 0) {
      break;
    }
  }

  ifBlock.statement = statementBlocks;
  return ifBlock;
}

/**
 * Parse if-else block
 */
export function parseIfElseBlock(lines, startIndex) {
  const ifElseBlock = {
    type: 'if_else',
    hasNext: true
  };

  // Parse condition
  const conditionMatch = lines[startIndex].match(/if \((.*?)\)/);
  ifElseBlock.condition = conditionMatch ? conditionMatch[1] : '';

  // Parse if statements
  const ifStatements = [];
  const elseStatements = [];
  let braceCount = 0;
  let foundElse = false;
  let foundOpenBrace = false;

  for (let j = startIndex; j < lines.length; j++) {
    const currentLine = lines[j];

    if (currentLine.includes('{')) {
      braceCount++;
      foundOpenBrace = true;
    }
    if (currentLine.includes('}')) {
      braceCount--;
    }

    if (currentLine.includes('else') && braceCount === 0) {
      foundElse = true;
      continue;
    }

    if (foundOpenBrace && braceCount > 0 && j > startIndex) {
      const statement = parseStatement(currentLine);
      if (statement) {
        if (foundElse) {
          elseStatements.push(statement);
        } else {
          ifStatements.push(statement);
        }
      }
    }

    if (foundOpenBrace && braceCount === 0 && foundElse) {
      break;
    }
  }

  ifElseBlock.ifStatements = ifStatements;
  ifElseBlock.elseStatements = elseStatements;
  return ifElseBlock;
}

/**
 * Parse if-only block
 */
export function parseIfOnlyBlock(lines, startIndex) {
  const ifBlock = {
    type: 'if_only',
    hasNext: true
  };

  // Parse condition
  const conditionMatch = lines[startIndex].match(/if \((.*?)\)/);
  ifBlock.condition = conditionMatch ? conditionMatch[1] : '';

  // Parse statements
  const statements = [];
  let braceCount = 0;
  let foundOpenBrace = false;

  for (let j = startIndex; j < lines.length; j++) {
    const currentLine = lines[j];

    if (currentLine.includes('{')) {
      braceCount++;
      foundOpenBrace = true;
    }
    if (currentLine.includes('}')) {
      braceCount--;
    }

    if (foundOpenBrace && braceCount > 0 && j > startIndex) {
      // Support nested control structures inside loops (if / if-else / other loops)
      if (currentLine.startsWith('if (')) {
        // Determine if it's an if-else or if-only and parse accordingly
        const hasElse = checkIfHasElse(lines, j);
        const parsedIf = hasElse ? parseIfElseBlock(lines, j) : parseIfOnlyBlock(lines, j);
        statements.push(parsedIf);
        // Skip the inner if block lines
        j = skipIfBlock(lines, j);
        continue;
      }

      // Fallback to single-statement parsing (moveForward, hit, turn, etc.)
      const statement = parseStatement(currentLine);
      if (statement) {
        statements.push(statement);
      }
    }

    if (foundOpenBrace && braceCount === 0) {
      break;
    }
  }

  ifBlock.statement = statements;
  return ifBlock;
}

/**
 * Parse loop block (repeat/while)
 */
export function parseLoopBlock(lines, startIndex, loopType, times = null, condition = null) {
  const loopBlock = {
    type: loopType,
    hasNext: true
  };

  if (times !== null) {
    loopBlock.times = times;
  }
  if (condition !== null) {
    loopBlock.condition = condition;
  }

  // Parse statements inside loop
  const statements = [];
  let braceCount = 0;
  let foundOpenBrace = false;

  for (let j = startIndex; j < lines.length; j++) {
    const currentLine = lines[j];

    if (currentLine.includes('{')) {
      braceCount++;
      foundOpenBrace = true;
    }
    if (currentLine.includes('}')) {
      braceCount--;
    }

    if (foundOpenBrace && braceCount > 0 && j > startIndex) {
      // Support nested control structures inside loops (if / if-else / other loops)
      if (currentLine.startsWith('if (')) {
        const hasElse = checkIfHasElse(lines, j);
        const parsedIf = hasElse ? parseIfElseBlock(lines, j) : parseIfOnlyBlock(lines, j);
        statements.push(parsedIf);
        // Skip inner if block
        j = skipIfBlock(lines, j);
        continue;
      }

      // Nested repeat(n) { ... }
      const nestedRepeat = currentLine.match(/repeat\s*\(\s*(\d+)\s*\)\s*\{/);
      if (nestedRepeat) {
        const nestedTimes = parseInt(nestedRepeat[1], 10);
        statements.push(parseLoopBlock(lines, j, 'repeat', nestedTimes));
        j = skipLoopBlock(lines, j);
        continue;
      }

      // Nested for(...) with numeric bounds
      const nestedFor = currentLine.match(/for\s*\(\s*(?:let|const|var)\s+(\w+)\s*=\s*(\d+)\s*;\s*\1\s*(<|<=)\s*(\d+)\s*;/);
      if (nestedFor) {
        const nestedStart = parseInt(nestedFor[2], 10);
        const nestedOp = nestedFor[3];
        const nestedLimit = parseInt(nestedFor[4], 10);
        const nestedTimes = nestedOp === '<' ? Math.max(0, nestedLimit - nestedStart) : Math.max(0, nestedLimit - nestedStart + 1);
        statements.push(parseLoopBlock(lines, j, 'repeat', nestedTimes));
        j = skipLoopBlock(lines, j);
        continue;
      }

      // Nested while(...) { ... }
      const nestedWhile = currentLine.match(/while\s*\((.*?)\)/);
      if (nestedWhile && currentLine.includes('{')) {
        const nestedCond = nestedWhile[1];
        statements.push(parseLoopBlock(lines, j, 'while_loop', null, nestedCond));
        j = skipLoopBlock(lines, j);
        continue;
      }

      // Fallback to single-statement parsing (moveForward, hit, turn, etc.)
      const statement = parseStatement(currentLine);
      if (statement) {
        statements.push(statement);
      }
    }

    if (foundOpenBrace && braceCount === 0) {
      break;
    }
  }

  loopBlock.statement = statements;
  return loopBlock;
}

/**
 * Parse for-index block
 */
export function parseForIndexBlock(lines, startIndex, varName, from, to) {
  const forBlock = {
    type: 'for_index',
    hasNext: true,
    variable: varName,
    from: from,
    to: to
  };

  // Parse statements inside for loop
  const statements = [];
  let braceCount = 0;
  let foundOpenBrace = false;

  for (let j = startIndex; j < lines.length; j++) {
    const currentLine = lines[j];

    if (currentLine.includes('{')) {
      braceCount++;
      foundOpenBrace = true;
    }
    if (currentLine.includes('}')) {
      braceCount--;
    }

    if (foundOpenBrace && braceCount > 0 && j > startIndex) {
      const statement = parseStatement(currentLine);
      if (statement) {
        statements.push(statement);
      }
    }

    if (foundOpenBrace && braceCount === 0) {
      break;
    }
  }

  forBlock.statement = statements;
  return forBlock;
}

/**
 * Parse single statement
 */
export function parseStatement(line) {
  if (line.includes('await moveForward()')) {
    return { type: 'move_forward', hasNext: true };
  } else if (line.includes('await turnLeft()')) {
    return { type: 'turn_left', hasNext: true };
  } else if (line.includes('await turnRight()')) {
    return { type: 'turn_right', hasNext: true };
  } else if (line.includes('await hit()')) {
    return { type: 'hit', hasNext: true };
  } else if (line.includes('await collectCoin()')) {
    return { type: 'collect_coin', hasNext: true };
  } else if (line.includes('await rescuePerson()')) {
    return { type: 'rescue_person', hasNext: true };
  } else if (line.includes('swapCoins(')) {
    return { type: 'swap_coins', hasNext: true };
  } else if (line.includes('compareCoins(')) {
    return { type: 'compare_coins', hasNext: true };
  } else if (line.match(/(\w+)\s*\(/) && !line.startsWith('if') && !line.startsWith('while') && !line.startsWith('for') && !line.includes('function') && !line.startsWith('return')) {
    const match = line.match(/(\w+)\s*\(/);
    return { type: 'function_call', name: match[1], hasNext: true };
  }
  return null;
}

/**
 * ตรวจสอบว่า if block มี else หรือไม่
 */
export function checkIfHasElse(lines, startIndex) {
  let braceCount = 0;
  let foundOpenBrace = false;

  for (let j = startIndex; j < lines.length; j++) {
    const currentLine = lines[j];

    if (currentLine.includes('{')) {
      braceCount++;
      foundOpenBrace = true;
    }
    if (currentLine.includes('}')) {
      braceCount--;
    }

    if (foundOpenBrace && braceCount === 0) {
      // Check if next line is else
      if (j + 1 < lines.length && lines[j + 1].includes('else')) {
        return true;
      }
      return false;
    }
  }
  return false;
}

/**
 * ข้าม if block
 */
export function skipIfBlock(lines, startIndex) {
  let braceCount = 0;
  let foundOpenBrace = false;

  for (let j = startIndex; j < lines.length; j++) {
    const currentLine = lines[j];

    if (currentLine.includes('{')) {
      braceCount++;
      foundOpenBrace = true;
    }
    if (currentLine.includes('}')) {
      braceCount--;
    }

    if (foundOpenBrace && braceCount === 0) {
      // Check if next line is else
      if (j + 1 < lines.length && lines[j + 1].includes('else')) {
        // Skip else block too
        return skipElseBlock(lines, j + 1);
      }
      return j;
    }
  }
  return startIndex;
}

/**
 * ข้าม else block
 */
export function skipElseBlock(lines, startIndex) {
  let braceCount = 0;
  let foundOpenBrace = false;

  for (let j = startIndex; j < lines.length; j++) {
    const currentLine = lines[j];

    if (currentLine.includes('{')) {
      braceCount++;
      foundOpenBrace = true;
    }
    if (currentLine.includes('}')) {
      braceCount--;
    }

    if (foundOpenBrace && braceCount === 0) {
      return j;
    }
  }
  return startIndex;
}

/**
 * ข้าม loop block
 */
export function skipLoopBlock(lines, startIndex) {
  let braceCount = 0;
  let foundOpenBrace = false;

  for (let j = startIndex; j < lines.length; j++) {
    const currentLine = lines[j];

    if (currentLine.includes('{')) {
      braceCount++;
      foundOpenBrace = true;
    }
    if (currentLine.includes('}')) {
      braceCount--;
    }

    if (foundOpenBrace && braceCount === 0) {
      return j;
    }
  }
  return startIndex;
}

/**
 * Parse function definition
 */
export function parseFunctionDefinition(lines, startIndex) {
  const functionBlock = {
    type: 'function_definition',
    hasNext: true
  };

  const currentLine = lines[startIndex];
  const functionMatch = currentLine.match(/function\s+(\w+)\s*\(/);
  if (functionMatch) {
    functionBlock.name = functionMatch[1];
  }

  // Parse statements inside function
  const statements = [];
  let braceCount = 0;
  let foundOpenBrace = false;

  for (let j = startIndex; j < lines.length; j++) {
    const line = lines[j];

    if (line.includes('{')) {
      braceCount++;
      foundOpenBrace = true;
    }
    if (line.includes('}')) {
      braceCount--;
    }

    if (foundOpenBrace && braceCount > 0 && j > startIndex) {
      // Recursively parse structures
      if (line.startsWith('if (')) {
        const hasElse = checkIfHasElse(lines, j);
        const parsedIf = hasElse ? parseIfElseBlock(lines, j) : parseIfOnlyBlock(lines, j);
        statements.push(parsedIf);
        j = skipIfBlock(lines, j);
        continue;
      }

      // Check for loops
      if (line.match(/repeat\s*\(/) || line.match(/for\s*\(/) || line.match(/while\s*\(/)) {
        if (line.match(/repeat\s*\(/)) {
          const match = line.match(/repeat\s*\(\s*(\d+)\s*\)/);
          const times = match ? parseInt(match[1], 10) : 0;
          statements.push(parseLoopBlock(lines, j, 'repeat', times));
        } else if (line.match(/while\s*\(/)) {
          const match = line.match(/while\s*\((.*?)\)/);
          const cond = match ? match[1] : '';
          statements.push(parseLoopBlock(lines, j, 'while_loop', null, cond));
        } else {
          // Basic for loop mapping to repeat (simplification)
          const forHeaderMatch = line.match(/for\s*\(\s*(?:let|const|var)\s+(\w+)\s*=\s*(\d+)\s*;\s*\1\s*(<|<=)\s*(\d+)\s*;/);
          let times = 0;
          if (forHeaderMatch) {
            const start = parseInt(forHeaderMatch[2], 10);
            const operator = forHeaderMatch[3];
            const limit = parseInt(forHeaderMatch[4], 10);
            times = operator === '<' ? Math.max(0, limit - start) : Math.max(0, limit - start + 1);
          }
          statements.push(parseLoopBlock(lines, j, 'repeat', times));
        }
        j = skipLoopBlock(lines, j);
        continue;
      }

      const statement = parseStatement(line);
      if (statement) {
        statements.push(statement);
      }
    }

    if (foundOpenBrace && braceCount === 0) {
      break;
    }
  }

  functionBlock.statement = statements;
  return functionBlock;
}

