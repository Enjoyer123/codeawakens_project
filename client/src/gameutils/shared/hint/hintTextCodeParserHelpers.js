/**
 * Parse loop block (for, while, repeat)
 */
function parseLoopBlock(lines, startIndex, loopType, times, condition) {
    const loopBlock = {
        type: loopType,
        hasNext: true,
        statement: []
    };

    if (times !== null && times !== undefined) {
        loopBlock.times = times;
    }
    if (condition) {
        loopBlock.condition = { type: 'logic_compare', raw: condition };
    }

    // Parse statements inside loop
    const statements = [];
    let braceCount = 0;
    let foundOpenBrace = false;

    for (let j = startIndex; j < lines.length; j++) {
        const currentLine = lines[j];
        const line = currentLine.split('//')[0].trim();

        if (line.includes('{')) {
            braceCount++;
            foundOpenBrace = true;
        }
        if (line.includes('}')) {
            braceCount--;
        }

        if (foundOpenBrace && braceCount > 0 && j > startIndex) {
            // Nested If
            if (line.startsWith('if (')) {
                const hasElse = checkIfHasElse(lines, j);
                const parsedIf = hasElse ? parseIfElseBlock(lines, j) : parseIfOnlyBlock(lines, j);
                statements.push(parsedIf);
                j = skipIfBlock(lines, j) - 1;
                continue;
            }

            // Nested Loop
            if (line.match(/for\s*\(/) || line.match(/while\s*\(/) || line.match(/repeat\s*\(/)) {
                const nestedLoop = parseLoopBlock(lines, j, 'for_each', null);
                statements.push(nestedLoop);
                j = skipLoopBlock(lines, j) - 1;
                continue;
            }

            // Normal Statement
            if (line && line !== '{' && line !== '}') {
                const statement = parseStatement(line);
                if (statement) {
                    statements.push(statement);
                }
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
 * Skip to the end of a loop block
 */
function skipLoopBlock(lines, startIndex) {
    let braceCount = 0;
    let foundOpenBrace = false;

    for (let j = startIndex; j < lines.length; j++) {
        const line = lines[j].split('//')[0];

        if (line.includes('{')) {
            braceCount++;
            foundOpenBrace = true;
        }
        if (line.includes('}')) {
            braceCount--;
        }

        if (foundOpenBrace && braceCount === 0) {
            return j + 1; // Return index after closing brace
        }
    }

    return lines.length;
}

/**
 * Skip to the end of an if block
 */
function skipIfBlock(lines, startIndex) {
    let braceCount = 0;
    let foundOpenBrace = false;

    for (let j = startIndex; j < lines.length; j++) {
        const line = lines[j].split('//')[0];

        if (line.includes('{')) {
            braceCount++;
            foundOpenBrace = true;
        }
        if (line.includes('}')) {
            braceCount--;
        }

        if (foundOpenBrace && braceCount === 0) {
            return j + 1; // Return index after closing brace
        }
    }

    return lines.length;
}

/**
 * Check if an if block has an else clause
 */
function checkIfHasElse(lines, ifStartIndex) {
    let braceCount = 0;
    let foundOpenBrace = false;

    for (let j = ifStartIndex; j < lines.length; j++) {
        const line = lines[j].split('//')[0].trim();

        if (line.includes('{')) {
            braceCount++;
            foundOpenBrace = true;
        }
        if (line.includes('}')) {
            braceCount--;
        }

        if (foundOpenBrace && braceCount === 0) {
            // Check next non-empty line for 'else'
            for (let k = j + 1; k < lines.length; k++) {
                const nextLine = lines[k].split('//')[0].trim();
                if (nextLine === '') continue;
                return nextLine.startsWith('else');
            }
            return false;
        }
    }

    return false;
}
