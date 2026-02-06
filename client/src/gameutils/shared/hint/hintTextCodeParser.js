// Text Code Parser Functions for Hint System
/**
 * Identify condition type from raw code string
 */
function identifyConditionType(conditionRaw) {
  const trimmed = conditionRaw.trim();
  if (trimmed.startsWith('!')) return 'logic_negate';
  if (trimmed.includes('.includes(')) return 'lists_contains';
  if (trimmed.includes('foundMonster()')) return 'found_monster';
  if (trimmed.includes('canMoveForward()')) return 'can_move_forward';
  if (trimmed.includes('nearPit()')) return 'near_pit';
  if (trimmed.includes('atGoal()')) return 'at_goal';
  if (trimmed.includes('hasPerson()')) return 'has_person';
  if (trimmed.includes('hasTreasure()')) return 'has_treasure';
  if (trimmed.includes('haveCoin()')) return 'has_coin';
  if (trimmed.includes('nqueen_is_safe') || trimmed.includes('isSafe(')) return 'nqueen_is_safe';

  if (trimmed.match(/^\s*\w+\s*\(/)) {
    // Other function calls
    return 'procedures_callreturn';
  }

  return 'logic_compare';
}

/**
 * Parse if block with condition
 */
export function parseIfBlock(lines, startIndex, conditionType) {
  const ifBlock = {
    type: 'if_only',
    hasNext: true,
    condition: { type: conditionType }
  };

  const statementBlocks = [];
  let braceCount = 0;
  let foundOpenBrace = false;

  for (let j = startIndex; j < lines.length; j++) {
    const rawLine = lines[j];
    const codePart = rawLine.split('//')[0];

    // --- 1. Check for nested blocks BEFORE counting braces ---
    // (In parseIfBlock, which is usually for Movement/Person, we don't expect deep nesting but standardizing anyway)
    if (j > startIndex) {
      const lineTrim = codePart.trim();
      if (lineTrim.startsWith('if (')) {
        const hasElse = checkIfHasElse(lines, j);
        statementBlocks.push(hasElse ? parseIfElseBlock(lines, j) : parseIfOnlyBlock(lines, j));
        j = skipIfBlock(lines, j);
        continue;
      }
      if (lineTrim.match(/repeat\b|for\b|while\b/)) {
        // Simplistic loop detection for here
        const nestedRepeatMatch = lineTrim.match(/repeat\s*\(\s*(\d+)\s*\)/);
        const nestedTimes = nestedRepeatMatch ? parseInt(nestedRepeatMatch[1], 10) : 0;
        statementBlocks.push(parseLoopBlock(lines, j, 'repeat', nestedTimes));
        j = skipLoopBlock(lines, j);
        continue;
      }
    }

    // --- 2. Process braces for non-skipped lines ---
    const openCount = (codePart.match(/{/g) || []).length;
    const closeCount = (codePart.match(/}/g) || []).length;

    if (openCount > 0) {
      if (!foundOpenBrace) foundOpenBrace = true;
      braceCount += openCount;
    }
    if (closeCount > 0) {
      braceCount -= closeCount;
    }

    // --- 3. Process statements ---
    if (foundOpenBrace && braceCount > 0 && j > startIndex) {
      const line = codePart.trim();
      if (line && line !== '{' && line !== '}') {
        const statement = parseStatement(line);
        if (statement) {
          statementBlocks.push(statement);
        }
      }
    }

    // --- 4. Break condition ---
    if (foundOpenBrace && braceCount <= 0) {
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

  // Extract condition with balanced parenthesis
  let conditionRaw = '';
  const line = lines[startIndex];
  const startP = line.indexOf('(');
  if (startP !== -1) {
    let open = 0;
    for (let k = startP; k < line.length; k++) {
      if (line[k] === '(') open++;
      if (line[k] === ')') open--;
      if (open === 0) {
        conditionRaw = line.substring(startP + 1, k);
        break;
      }
    }
  }

  const conditionType = identifyConditionType(conditionRaw);

  ifElseBlock.condition = {
    type: conditionType,
    raw: conditionRaw
  };

  const ifStatements = [];
  const elseStatements = [];
  let braceCount = 0;
  let foundElse = false;
  let foundOpenBrace = false;

  for (let j = startIndex; j < lines.length; j++) {
    const rawLine = lines[j];
    const codePart = rawLine.split('//')[0];

    // --- 1. Check for Nested Blocks BEFORE counting braces ---
    if (foundOpenBrace && braceCount > 0 && j > startIndex) {
      const lineTrim = codePart.trim();
      if (lineTrim.startsWith('if (')) {
        const hasElseNested = checkIfHasElse(lines, j);
        const parsedIf = hasElseNested ? parseIfElseBlock(lines, j) : parseIfOnlyBlock(lines, j);

        if (foundElse) elseStatements.push(parsedIf);
        else ifStatements.push(parsedIf);

        j = skipIfBlock(lines, j);
        continue;
      }

      if (lineTrim.match(/repeat\b|for\b|while\b/) && (codePart.includes('{') || lineTrim.match(/repeat\s*\(\d+\)/))) {
        // Identify Loop Type and Parse
        let loopBlock;
        const nestedRepeat = codePart.match(/repeat\s*\(\s*(\d+)\s*\)/);
        const nestedWhile = codePart.match(/while\s*\((.*?)\)/);
        const nestedForEach = codePart.match(/for\s*\(.*?of.*?\)/) || codePart.match(/\.(forEach|map)\b/);
        const nestedForRange = codePart.match(/for\s*\(\s*(?:let|const|var)\s+(\w+)\s*=\s*(.+?)\s*;\s*\1\s*(<|<=)\s*(.+?)\s*;/);

        if (nestedRepeat) {
          loopBlock = parseLoopBlock(lines, j, 'repeat', parseInt(nestedRepeat[1], 10));
        } else if (nestedWhile) {
          loopBlock = parseLoopBlock(lines, j, 'while_loop', null, nestedWhile[1]);
        } else if (nestedForEach) {
          loopBlock = parseLoopBlock(lines, j, 'for_each', null);
        } else if (nestedForRange) {
          const startVal = nestedForRange[2].trim();
          const op = nestedForRange[3];
          const limitVal = nestedForRange[4].trim();
          if (/^\d+$/.test(startVal) && /^\d+$/.test(limitVal)) {
            const s = parseInt(startVal, 10);
            const l = parseInt(limitVal, 10);
            const times = op === '<' ? l - s : l - s + 1;
            loopBlock = parseLoopBlock(lines, j, 'repeat', Math.max(0, times));
          } else {
            loopBlock = parseLoopBlock(lines, j, 'for_loop_dynamic', null);
          }
        }

        if (loopBlock) {
          if (foundElse) elseStatements.push(loopBlock);
          else ifStatements.push(loopBlock);
          j = skipLoopBlock(lines, j);
          continue;
        }
      }
    }

    // --- 2. Identify Structural Ends/Switches & Process Braces ---
    const openCount = (codePart.match(/{/g) || []).length;
    const closeCount = (codePart.match(/}/g) || []).length;

    if (openCount > 0) {
      if (!foundOpenBrace) foundOpenBrace = true;
      braceCount += openCount;
    }
    if (closeCount > 0) {
      braceCount -= closeCount;
    }

    // Check for switch to ELSE (after brace processing)
    if (!foundElse && braceCount === 1 && /}\s*else/.test(codePart)) {
      foundElse = true;
    }
    // กรณี else ขึ้นบรรทัดใหม่
    if (braceCount <= 1 && codePart.includes('else') && !foundElse) {
      foundElse = true;
    }

    // --- 3. Process Simple Statements ---
    if (foundOpenBrace && braceCount > 0 && j > startIndex) {
      const isPureStructure = codePart.trim() === '}' || codePart.trim() === '{' || codePart.trim() === 'else {' || codePart.trim() === '} else {';
      if (!isPureStructure) {
        const statement = parseStatement(codePart);
        if (statement) {
          if (foundElse) elseStatements.push(statement);
          else ifStatements.push(statement);
        }
      }
    }

    // --- 4. Break condition ---
    if (foundOpenBrace && braceCount <= 0) {
      // If the closing brace is followed by 'else' on the same line, or 'else' on the next line,
      // we don't break yet, as it's part of the same if-else construct.
      if (codePart.includes('else')) {
        foundElse = true;
        continue;
      }
      if (j + 1 < lines.length && lines[j + 1].trim().startsWith('else')) {
        continue;
      }
      break;
    }
  }

  ifElseBlock.statement = ifStatements;
  ifElseBlock.elseStatement = elseStatements;
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

  // Extract condition with balanced parenthesis
  let conditionRaw = '';
  const line = lines[startIndex];
  const startP = line.indexOf('(');
  if (startP !== -1) {
    let open = 0;
    for (let k = startP; k < line.length; k++) {
      if (line[k] === '(') open++;
      if (line[k] === ')') open--;
      if (open === 0) {
        conditionRaw = line.substring(startP + 1, k);
        break;
      }
    }
  }

  const conditionType = identifyConditionType(conditionRaw);

  ifBlock.condition = {
    type: conditionType,
    raw: conditionRaw
  };

  const statements = [];
  // const line = lines[startIndex]; // Already declared above

  // console.log(`[parseIfOnlyBlock] Condition Raw: "${conditionRaw}"`);

  if (!line.includes('{')) {
    let openP = 0;
    let splitIdx = -1;
    for (let k = 0; k < line.length; k++) {
      if (line[k] === '(') openP++;
      if (line[k] === ')') {
        openP--;
        if (openP === 0 && line.substring(0, k).includes('if')) {
          splitIdx = k + 1;
          break;
        }
      }
    }

    if (splitIdx !== -1) {
      const stmtStr = line.substring(splitIdx).trim();
      if (stmtStr) {
        const cleanStmt = stmtStr.replace(/;$/, '');
        const parsed = parseStatement(cleanStmt);
        if (parsed) {
          statements.push(parsed);
        }
      }
    }
  } else {
    let braceCount = 0;
    let foundOpenBrace = false;

    for (let j = startIndex; j < lines.length; j++) {
      const currentLine = lines[j];
      const codePart = currentLine.split('//')[0];

      // --- 1. Check for nested blocks BEFORE counting braces ---
      if (foundOpenBrace && braceCount > 0 && j > startIndex) {
        const lineTrim = codePart.trim();
        if (lineTrim.startsWith('if (')) {
          const hasElse = checkIfHasElse(lines, j);
          statements.push(hasElse ? parseIfElseBlock(lines, j) : parseIfOnlyBlock(lines, j));
          j = skipIfBlock(lines, j);
          continue;
        }

        if (lineTrim.match(/repeat\b|for\b|while\b/) && (codePart.includes('{') || lineTrim.match(/repeat\s*\(\d+\)/))) {
          let loopBlock;
          const nestedRepeat = codePart.match(/repeat\s*\(\s*(\d+)\s*\)/);
          const nestedWhile = codePart.match(/while\s*\((.*?)\)/);
          const nestedForEach = codePart.match(/for\s*\(.*?of.*?\)/) || codePart.match(/\.(forEach|map)\b/);
          const nestedForRange = codePart.match(/for\s*\(\s*(?:let|const|var)\s+(\w+)\s*=\s*(.+?)\s*;\s*\1\s*(<|<=)\s*(.+?)\s*;/);

          if (nestedRepeat) {
            loopBlock = parseLoopBlock(lines, j, 'repeat', parseInt(nestedRepeat[1], 10));
          } else if (nestedWhile) {
            loopBlock = parseLoopBlock(lines, j, 'while_loop', null, nestedWhile[1]);
          } else if (nestedForEach) {
            loopBlock = parseLoopBlock(lines, j, 'for_each', null);
          } else if (nestedForRange) {
            const startVal = nestedForRange[2].trim();
            const op = nestedForRange[3];
            const limitVal = nestedForRange[4].trim();
            if (/^\d+$/.test(startVal) && /^\d+$/.test(limitVal)) {
              const s = parseInt(startVal, 10);
              const l = parseInt(limitVal, 10);
              const times = op === '<' ? l - s : l - s + 1;
              loopBlock = parseLoopBlock(lines, j, 'repeat', Math.max(0, times));
            } else {
              loopBlock = parseLoopBlock(lines, j, 'for_loop_dynamic', null);
            }
          }

          if (loopBlock) {
            statements.push(loopBlock);
            j = skipLoopBlock(lines, j);
            continue;
          }
        }
      }

      // --- 2. Process Braces ---
      const openCount = (codePart.match(/{/g) || []).length;
      const closeCount = (codePart.match(/}/g) || []).length;

      if (openCount > 0) {
        if (!foundOpenBrace) foundOpenBrace = true;
        braceCount += openCount;
      }
      if (closeCount > 0) {
        braceCount -= closeCount;
      }

      // --- 3. Process Statements ---
      if (foundOpenBrace && braceCount > 0 && j > startIndex) {
        const line = codePart.trim();
        if (line && line !== '{' && line !== '}') {
          const statement = parseStatement(line);
          if (statement) {
            statements.push(statement);
          }
        }
      }

      // --- 4. Break condition ---
      if (foundOpenBrace && braceCount <= 0) {
        break;
      }
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
    const conditionType = identifyConditionType(condition);

    loopBlock.condition = {
      type: conditionType,
      raw: condition
    };
  }

  const statements = [];
  let braceCount = 0;
  let foundOpenBrace = false;

  for (let j = startIndex; j < lines.length; j++) {
    const rawLine = lines[j];
    const codePart = rawLine.split('//')[0];

    // --- 1. Check for nested blocks BEFORE counting braces ---
    if (foundOpenBrace && braceCount > 0 && j > startIndex) {
      const lineTrim = codePart.trim();
      if (lineTrim.startsWith('if (')) {
        const hasElse = checkIfHasElse(lines, j);
        statements.push(hasElse ? parseIfElseBlock(lines, j) : parseIfOnlyBlock(lines, j));
        j = skipIfBlock(lines, j);
        continue;
      }

      if (lineTrim.match(/repeat\b|for\b|while\b/) && (codePart.includes('{') || lineTrim.match(/repeat\s*\(\d+\)/))) {
        let loopBlock;
        const nestedRepeat = codePart.match(/repeat\s*\(\s*(\d+)\s*\)/);
        const nestedWhile = codePart.match(/while\s*\((.*?)\)/);
        const nestedForEach = codePart.match(/for\s*\(.*?of.*?\)/) || codePart.match(/\.(forEach|map)\b/);
        const nestedForRange = codePart.match(/for\s*\(\s*(?:let|const|var)\s+(\w+)\s*=\s*(.+?)\s*;\s*\1\s*(<|<=)\s*(.+?)\s*;/);

        if (nestedRepeat) {
          loopBlock = parseLoopBlock(lines, j, 'repeat', parseInt(nestedRepeat[1], 10));
        } else if (nestedWhile) {
          loopBlock = parseLoopBlock(lines, j, 'while_loop', null, nestedWhile[1]);
        } else if (nestedForEach) {
          loopBlock = parseLoopBlock(lines, j, 'for_each', null);
        } else if (nestedForRange) {
          const sVal = nestedForRange[2].trim();
          const op = nestedForRange[3];
          const lVal = nestedForRange[4].trim();
          if (/^\d+$/.test(sVal) && /^\d+$/.test(lVal)) {
            const s = parseInt(sVal, 10);
            const l = parseInt(lVal, 10);
            const times = op === '<' ? l - s : l - s + 1;
            loopBlock = parseLoopBlock(lines, j, 'repeat', Math.max(0, times));
          } else {
            loopBlock = parseLoopBlock(lines, j, 'for_loop_dynamic', null);
          }
        }

        if (loopBlock) {
          statements.push(loopBlock);
          j = skipLoopBlock(lines, j);
          continue;
        }
      }
    }

    // --- 2. Process Braces ---
    const openCount = (codePart.match(/{/g) || []).length;
    const closeCount = (codePart.match(/}/g) || []).length;

    if (openCount > 0) {
      if (!foundOpenBrace) foundOpenBrace = true;
      braceCount += openCount;
    }
    if (closeCount > 0) {
      braceCount -= closeCount;
    }

    // --- 3. Process Statements ---
    if (foundOpenBrace && braceCount > 0 && j > startIndex) {
      const statement = parseStatement(codePart);
      if (statement) {
        statements.push(statement);
      }
    }

    // --- 4. Break Condition ---
    if (foundOpenBrace && braceCount <= 0) {
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

  const statements = [];
  let braceCount = 0;
  let foundOpenBrace = false;

  for (let j = startIndex; j < lines.length; j++) {
    const currentLine = lines[j];
    const codePart = currentLine.split('//')[0];

    // --- 1. Check for nested blocks BEFORE counting braces ---
    if (foundOpenBrace && braceCount > 0 && j > startIndex) {
      const lineTrim = codePart.trim();
      if (lineTrim.startsWith('if (')) {
        const hasElse = checkIfHasElse(lines, j);
        statements.push(hasElse ? parseIfElseBlock(lines, j) : parseIfOnlyBlock(lines, j));
        j = skipIfBlock(lines, j);
        continue;
      }

      if (lineTrim.match(/repeat\b|for\b|while\b/) && (codePart.includes('{') || lineTrim.match(/repeat\s*\(\d+\)/))) {
        let loopBlock;
        const nestedRepeat = codePart.match(/repeat\s*\(\s*(\d+)\s*\)/);
        const nestedWhile = codePart.match(/while\s*\((.*?)\)/);
        const nestedForEach = codePart.match(/for\s*\(.*?of.*?\)/) || codePart.match(/\.(forEach|map)\b/);
        const nestedForIndex = codePart.match(/for\s*\(\s*(?:let|const|var)\s+(\w+)\s*=\s*(.+?)\s*;\s*\1\s*(<|<=)\s*(.+?)\s*;/);

        if (nestedRepeat) {
          loopBlock = parseLoopBlock(lines, j, 'repeat', parseInt(nestedRepeat[1], 10));
        } else if (nestedWhile) {
          loopBlock = parseLoopBlock(lines, j, 'while_loop', null, nestedWhile[1]);
        } else if (nestedForEach) {
          loopBlock = parseLoopBlock(lines, j, 'for_each', null);
        } else if (nestedForIndex) {
          const s = nestedForIndex[2].trim();
          const op = nestedForIndex[3];
          const l = nestedForIndex[4].trim();
          if (/^\d+$/.test(s) && /^\d+$/.test(l)) {
            const startVal = parseInt(s, 10);
            const limitVal = parseInt(l, 10);
            const times = op === '<' ? limitVal - startVal : limitVal - startVal + 1;
            loopBlock = parseLoopBlock(lines, j, 'repeat', Math.max(0, times));
          } else {
            loopBlock = parseForIndexBlock(lines, j, nestedForIndex[1], s, l);
          }
        }

        if (loopBlock) {
          statements.push(loopBlock);
          j = skipLoopBlock(lines, j);
          continue;
        }
      }
    }

    // --- 2. Process Braces ---
    const openCount = (codePart.match(/{/g) || []).length;
    const closeCount = (codePart.match(/}/g) || []).length;

    if (openCount > 0) {
      if (!foundOpenBrace) foundOpenBrace = true;
      braceCount += openCount;
    }
    if (closeCount > 0) {
      braceCount -= closeCount;
    }

    // --- 3. Process Statements ---
    if (foundOpenBrace && braceCount > 0 && j > startIndex) {
      const statement = parseStatement(codePart);
      if (statement) {
        statements.push(statement);
      }
    }

    // --- 4. Break condition ---
    if (foundOpenBrace && braceCount <= 0) {
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
  // --- Check Highest Priority Keywords ---
  if (line.includes('move_along_path')) {
    return { type: 'move_along_path', hasNext: true };
  }

  if (line.includes('getNeighborsWithWeight')) {
    return { type: 'graph_get_neighbors_with_weight', hasNext: true };
  }

  // --- Check for Dict/Array Set: variable[key] = value ---
  if (line.match(/(\w+)\s*\[[^\]]+\]\s*=/)) {
    return { type: 'dict_set', hasNext: true };
  }
  // -----------------------------------------------------

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

  } else if (line.includes('subset_sum_add_warrior_to_side1(')) {
    return { type: 'subset_sum_add_warrior_to_side1', hasNext: true };
  } else if (line.includes('subset_sum_add_warrior_to_side2(')) {
    return { type: 'subset_sum_add_warrior_to_side2', hasNext: true };

  } else if (line.match(/pushNode\s*\(/) || line.includes('rope_vis_enter')) {
    return { type: 'rope_vis_enter', hasNext: true };
  } else if (line.match(/popNode\s*\(/) || line.includes('rope_vis_exit')) {
    return { type: 'rope_vis_exit', hasNext: true };
  } else if (line.match(/updateStatus\s*\(/) || line.includes('rope_vis_status')) {
    return { type: 'rope_vis_status', hasNext: true };

  } else if (line.includes('dsu_union(') && !line.includes('=')) {
    return { type: 'dsu_union', hasNext: true };
  } else if (line.includes('dsu_find(')) {
    return { type: 'dsu_find', hasNext: true };

    // Check for array method calls (pop, shift)
  } else if (line.match(/\w+\.pop\s*\(/)) {
    return { type: 'lists_remove_last_return', hasNext: true };
  } else if (line.match(/\w+\.shift\s*\(/)) {
    return { type: 'lists_remove_first_return', hasNext: true };

  } else if (line.trim().startsWith('return')) {
    return { type: 'return_statement', hasNext: false };

  } else if (line.trim().startsWith('break')) {
    return { type: 'controls_flow_statements', hasNext: false };
  } else if (line.trim().startsWith('continue')) {
    return { type: 'controls_flow_statements', hasNext: false };


  } else if (line.includes('lists_find_min_index')) {
    return { type: 'lists_find_min_index', hasNext: true };
  } else if (line.includes('removeAt')) {
    return { type: 'lists_remove_at_index', hasNext: true };
  } else if (line.includes('.push(') && !line.includes('visited.push')) {
    return { type: 'lists_add_item', hasNext: true };
  } else if (line.includes('visited.push')) {
    return { type: 'lists_add_item', hasNext: true };
  } else if (line.includes('PQ.push')) {
    return { type: 'lists_add_item', hasNext: true };
  } else if (line.includes('.concat(')) {
    return { type: 'lists_concat', hasNext: true };



  } else if (line.match(/(?:(\w+)\.)?(\w+)\s*\(/) &&
    !line.startsWith('if') &&
    !line.startsWith('while') &&
    !line.startsWith('for') &&
    !line.includes('function') &&
    !line.startsWith('return') &&
    !line.includes('Math.') &&
    !line.includes('getCuts') &&
    !line.includes('move_along_path') &&
    !line.includes('getAllEdges') &&
    !line.includes('sortByWeight') &&
    !line.includes('getNeighbors') &&
    !line.includes('dsu_find') &&
    !line.includes('dsu_union') &&
    !line.includes('.sort(') &&
    !line.includes('.reverse(') &&
    !line.includes('console.')) {


    const match = line.match(/(?:(\w+)\.)?(\w+)\s*\(/);
    const functionName = match[2] || match[1];

    if (functionName === 'forEach') {
      return { type: 'for_each', hasNext: true };
    }

    return { type: 'function_call', name: functionName, hasNext: true };

  } else if (line.match(/(?:let|const|var)?\s*[\w\.\[\]"']+\s*=/)) {
    if (line.includes('lists_find_min_index')) {
      return { type: 'lists_find_min_index', hasNext: true };
    }
    return { type: 'variables_set', hasNext: true };
  }

  return null;
}

// --- แก้ไข: ใช้การนับวงเล็บแบบ Char-by-Char เพื่อความแม่นยำสูงสุดในการหา else ---
// --- แก้ไข: ใช้การนับวงเล็บแบบ Char-by-Char เพื่อความแม่นยำสูงสุดในการหา else ---
export function checkIfHasElse(lines, startIndex) {
  let openBraces = 0;
  let foundOpenBrace = false;

  for (let j = startIndex; j < lines.length; j++) {
    const line = lines[j].split('//')[0];

    for (let k = 0; k < line.length; k++) {
      const char = line[k];
      if (char === '{') {
        openBraces++;
        foundOpenBrace = true;
      }
      if (char === '}') openBraces--;

      // ถ้าวงเล็บปิดครบคู่ (จบ IF block) และเราเคยเจอวงเล็บเปิดมาก่อนแล้ว
      if (openBraces === 0 && foundOpenBrace) {
        // เช็คต่อท้ายบรรทัดเดียวกัน
        const restOfLine = line.substring(k + 1);
        if (restOfLine.trim().startsWith('else')) {
          return true;
        }

        // เช็คบรรทัดถัดไป (ถ้าบรรทัดนี้ไม่มี else ต่อท้าย)
        if (k === line.length - 1 || !restOfLine.trim()) {
          for (let m = j + 1; m < lines.length; m++) {
            const nextLine = lines[m].split('//')[0].trim();
            if (!nextLine) continue; // ข้ามบรรทัดว่าง
            if (nextLine.startsWith('else')) {
              return true;
            }
            return false; // เจอโค้ดอื่นที่ไม่ใช่ else
          }
          // ถ้าเป็นบรรทัดสุดท้ายของไฟล์แล้วไม่เจอ else
          return false;
        }
        // ยังไม่จบบรรทัดและไม่ใช่ else
        return false;
      }
    }
  }
  return false;
}

export function skipIfBlock(lines, startIndex) {
  let braceCount = 0;
  let foundOpenBrace = false;

  for (let j = startIndex; j < lines.length; j++) {
    const currentLine = lines[j];
    const codePart = currentLine.split('//')[0];

    const openCount = (codePart.match(/{/g) || []).length;
    const closeCount = (codePart.match(/}/g) || []).length;

    if (openCount > 0) {
      if (!foundOpenBrace) foundOpenBrace = true;
      braceCount += openCount;
    }
    if (closeCount > 0) {
      braceCount -= closeCount;
    }

    if (foundOpenBrace && braceCount <= 0) {
      if (codePart.includes('else')) {
        return skipElseBlock(lines, j);
      }
      if (j + 1 < lines.length && lines[j + 1].trim().startsWith('else')) {
        return skipElseBlock(lines, j + 1);
      }
      return j;
    }

    // Safety: if we never find an open brace on the first line or subsequent ones, 
    // and it's not a block-if, skip it (it's a single line if without braces, which we don't fully support yet but shouldn't hang)
    if (j === startIndex && !codePart.includes('{')) {
      return j;
    }
  }
  return lines.length - 1;
}

export function skipElseBlock(lines, startIndex) {
  let braceCount = 0;
  let foundOpenBrace = false;
  for (let j = startIndex; j < lines.length; j++) {
    const currentLine = lines[j];
    const codePart = currentLine.split('//')[0];

    const openCount = (codePart.match(/{/g) || []).length;
    const closeCount = (codePart.match(/}/g) || []).length;

    if (openCount > 0) {
      if (!foundOpenBrace) foundOpenBrace = true;
      braceCount += openCount;
    }
    if (closeCount > 0) {
      braceCount -= closeCount;
    }

    if (foundOpenBrace && braceCount <= 0) {
      return j;
    }

    if (j === startIndex && !codePart.includes('{')) {
      return j;
    }
  }
  return lines.length - 1;
}

export function skipLoopBlock(lines, startIndex) {
  let braceCount = 0;
  let foundOpenBrace = false;
  for (let j = startIndex; j < lines.length; j++) {
    const currentLine = lines[j];
    const codePart = currentLine.split('//')[0];

    const openCount = (codePart.match(/{/g) || []).length;
    const closeCount = (codePart.match(/}/g) || []).length;

    if (openCount > 0) {
      if (!foundOpenBrace) foundOpenBrace = true;
      braceCount += openCount;
    }
    if (closeCount > 0) {
      braceCount -= closeCount;
    }

    if (foundOpenBrace && braceCount <= 0) {
      return j;
    }

    if (j === startIndex && !codePart.includes('{')) {
      return j;
    }
  }
  return lines.length - 1;
}

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
  const statements = [];
  let braceCount = 0;
  let foundOpenBrace = false;
  if (lines[startIndex].split('//')[0].includes('{')) {
    braceCount = 1;
    foundOpenBrace = true;
  }
  for (let j = startIndex + 1; j < lines.length; j++) {
    const rawLine = lines[j];
    const codePart = rawLine.split('//')[0];

    // --- 1. Check for nested blocks BEFORE counting braces ---
    if (foundOpenBrace && braceCount > 0 && j > startIndex) {
      const lineTrim = codePart.trim();
      if (lineTrim.startsWith('if (')) {
        const hasElse = checkIfHasElse(lines, j);
        statements.push(hasElse ? parseIfElseBlock(lines, j) : parseIfOnlyBlock(lines, j));
        j = skipIfBlock(lines, j);
        continue;
      }
      if (lineTrim.match(/repeat\b|for\b|while\b/) && (codePart.includes('{') || lineTrim.match(/repeat\s*\(\d+\)/))) {
        let loopBlock;
        const nRep = codePart.match(/repeat\s*\(\s*(\d+)\s*\)/);
        const nWhile = codePart.match(/while\s*\((.*?)\)/);
        const nForEach = codePart.match(/for\s*\(.*?of.*?\)/) || codePart.match(/\.(forEach|map)\b/);
        const nForRange = codePart.match(/for\s*\(\s*(?:let|const|var)\s+(\w+)\s*=\s*(.+?)\s*;\s*\1\s*(<|<=)\s*(.+?)\s*;/);

        if (nRep) {
          loopBlock = parseLoopBlock(lines, j, 'repeat', parseInt(nRep[1], 10));
        } else if (nWhile) {
          loopBlock = parseLoopBlock(lines, j, 'while_loop', null, nWhile[1]);
        } else if (nForEach) {
          loopBlock = parseLoopBlock(lines, j, 'for_each', null);
        } else if (nForRange) {
          const s = nForRange[2].trim();
          const op = nForRange[3];
          const l = nForRange[4].trim();
          if (/^\d+$/.test(s) && /^\d+$/.test(l)) {
            const sVal = parseInt(s, 10);
            const lVal = parseInt(l, 10);
            const times = op === '<' ? lVal - sVal : lVal - sVal + 1;
            loopBlock = parseLoopBlock(lines, j, 'repeat', Math.max(0, times));
          } else {
            loopBlock = parseLoopBlock(lines, j, 'for_loop_dynamic', null);
          }
        }

        if (loopBlock) {
          statements.push(loopBlock);
          j = skipLoopBlock(lines, j);
          continue;
        }
      }
    }

    // --- 2. Process Braces ---
    const openCount = (codePart.match(/{/g) || []).length;
    const closeCount = (codePart.match(/}/g) || []).length;

    if (openCount > 0) {
      if (!foundOpenBrace) foundOpenBrace = true;
      braceCount += openCount;
    }
    if (closeCount > 0) {
      braceCount -= closeCount;
    }

    if (foundOpenBrace && braceCount <= 0) {
      break;
    }

    // --- 3. Process Statements ---
    if (foundOpenBrace && braceCount > 0 && j > startIndex) {
      const statement = parseStatement(rawLine);
      if (statement) {
        statements.push(statement);
      }
    }
  }
  functionBlock.statement = statements;
  return functionBlock;
}