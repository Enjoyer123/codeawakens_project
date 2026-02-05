import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

export const instrumentSubsetSum = (code, currentLevel) => {
    // Subset Sum (Backtrack) table instrumentation:
    // ...
    try {
        const isSubsetSumLevel = !!currentLevel?.subsetSumData;
        const looksLikeDPSubsetSum = /\bprev\b|\bcurr\b|\bitemIndex\b/.test(code);
        // Blockly may generate subsetSum, subsetSum1, subsetSum2, ...
        const subsetSumFnMatch = code.match(/(async\s+)?function\s+(subsetSum\d*)\s*\(([^)]*)\)\s*\{/);

        if (isSubsetSumLevel && subsetSumFnMatch && !looksLikeDPSubsetSum) {
            const originalName = subsetSumFnMatch[2]; // subsetSum, subsetSum1, ...
            const paramsStr = subsetSumFnMatch[3] || '';
            const implName = `__${originalName}_impl`;

            if (code.includes(implName)) {
                console.log('[useCodeExecution] 🔍 Subset Sum already instrumented for:', originalName);
            } else {
                console.log('[useCodeExecution] 🔧 Instrumenting backtrack Subset Sum for table steps:', originalName);

                const params = paramsStr.split(',').map(s => s.trim()).filter(Boolean);
                if (params.length >= 4) {
                    const arrP = params[0];
                    const indexP = params[1];
                    const sumP = params[2];
                    const targetP = params[3];

                    // Rename original function to implName and inject local variables to prevent global pollution
                    const renameRe = new RegExp(`(async\\s+)?function\\s+${originalName}\\s*\\(([^)]*)\\)\\s*\\{`);
                    if (renameRe.test(code)) {
                        code = code.replace(renameRe, (m, asyncKw, args) => {
                            return `${asyncKw || ''}function ${implName}(${args}) {\n  var coin, include, exclude;\n`;
                        });
                    } else {
                        const simpleRename = new RegExp(`(async\\s+)?function\\s+${originalName}\\s*\\(`);
                        code = code.replace(simpleRename, `$1function ${implName}(`);
                    }

                    // Insert wrapper with the original name to record steps
                    const wrapper = `
async function ${originalName}(${paramsStr}) {
  let __remain = null;
  try { __remain = (${targetP} - ${sumP}); } catch (e) {}
  try { if (__remain !== null && __remain >= 0 && typeof updateSubsetSumCellVisual === 'function') updateSubsetSumCellVisual(${indexP}, __remain, null, { kind: 'visit' }); } catch (e) {}
  const __res = await ${implName}(${arrP}, ${indexP}, ${sumP}, ${targetP});
  try { if (__remain !== null && __remain >= 0 && typeof updateSubsetSumCellVisual === 'function') updateSubsetSumCellVisual(${indexP}, __remain, __res, { kind: 'return' }); } catch (e) {}
  return __res;
}
`;

                    // Place wrapper right before the impl function definition
                    const implHeaderRe = new RegExp(`(async\\s+)?function\\s+${implName}\\s*\\(`);
                    code = code.replace(implHeaderRe, (m) => `${wrapper}\n${m}`);
                    console.log('[useCodeExecution] ✅ Backtrack Subset Sum instrumentation applied for:', originalName);
                } else {
                    console.warn('[useCodeExecution] Subset Sum wrapper skipped: unexpected param count:', params);
                }
            }
        }
    } catch (e) {
        console.warn('[useCodeExecution] Error instrumenting Subset Sum backtrack table:', e);
    }
    return code;
};

export const instrumentCoinChange = (code, currentLevel) => {
    // Coin Change (Backtrack) table instrumentation
    try {
        const isCoinChangeLevel = !!currentLevel?.coinChangeData;
        const looksLikeDPCoinChange = /\bdp\b|\bcoinIndex\b|\bcand\b/.test(code);
        const coinChangeFnMatch = code.match(/(async\s+)?function\s+(coinChange\d*)\s*\(([^)]*)\)\s*\{/);

        if (isCoinChangeLevel && coinChangeFnMatch && !looksLikeDPCoinChange) {
            const originalName = coinChangeFnMatch[2]; // coinChange, coinChange1, ...
            const paramsStr = coinChangeFnMatch[3] || '';
            const implName = `__${originalName}_impl`;

            if (code.includes(implName)) {
                console.log('[useCodeExecution] 🔍 Coin Change already instrumented for:', originalName);
            } else {
                console.log('[useCodeExecution] 🔧 Instrumenting backtrack Coin Change for table steps:', originalName);

                const params = paramsStr.split(',').map(s => s.trim()).filter(Boolean);
                if (params.length >= 3) {
                    const amountP = params[0];
                    const coinsP = params[1];
                    const indexP = params[2];

                    // Rename original function to implName and inject local variables to prevent global pollution
                    const renameRe = new RegExp(`(async\\s+)?function\\s+${originalName}\\s*\\(([^)]*)\\)\\s*\\{`);
                    if (renameRe.test(code)) {
                        code = code.replace(renameRe, (m, asyncKw, args) => {
                            return `${asyncKw || ''}function ${implName}(${args}) {\n  var coin, include, exclude;\n`;
                        });
                    } else {
                        const simpleRename = new RegExp(`(async\\s+)?function\\s+${originalName}\\s*\\(`);
                        code = code.replace(simpleRename, `$1function ${implName}(`);
                    }

                    const wrapper = `
async function ${originalName}(${paramsStr}) {
  let __amt = null;
  try { __amt = (${amountP}); } catch (e) {}
  try { if (__amt !== null && __amt >= 0 && typeof updateCoinChangeCellVisual === 'function') updateCoinChangeCellVisual(${indexP}, __amt, null, { kind: 'visit' }); } catch (e) {}
  const __res = await ${implName}(${amountP}, ${coinsP}, ${indexP});
  try { if (__amt !== null && __amt >= 0 && typeof updateCoinChangeCellVisual === 'function') updateCoinChangeCellVisual(${indexP}, __amt, __res, { kind: 'return' }); } catch (e) {}
  return __res;
}
`;

                    // Place wrapper right before the impl function definition
                    const implHeaderRe = new RegExp(`(async\\s+)?function\\s+${implName}\\s*\\(`);

                    // Inject logging for coin assignment safely
                    // We look for 'coin = ...;' and append log after it.
                    // We assume 'coin =' starts a statement.
                    code = code.replace(/coin\s*=\s*\([\s\S]+?\)\(\);/g, (match) => {
                        return `${match}\n if (typeof coin !== 'undefined' && amount <= 5) console.warn("🔍 [CC-INTERNAL] coin:", coin, "at index:", ${indexP}, "amount:", ${amountP});\n`;
                    });

                    code = code.replace(implHeaderRe, (m) => `${wrapper}\n${m}`);
                    console.log('[useCodeExecution] ✅ Backtrack Coin Change instrumentation applied for:', originalName);
                    // console.warn('[useCodeExecution] 📜 Full Coin Change Code:\n', code); // Disable full dump to reduce noise


                } else {
                    console.warn('[useCodeExecution] Coin Change wrapper skipped: unexpected param count:', params);
                }
            }
        }
    } catch (e) {
        console.warn('[useCodeExecution] Error instrumenting Coin Change backtrack table:', e);
    }
    return code;
};

export const instrumentAntDp = (code, isAntDp, antDpInitCode) => {
    // FIX PARAMETER MISMATCH for Ant DP (Main Execution)
    try {
        const antDpArgsMatch = code.match(/(?:async\s+function\s+|function\s+)(?:[\w]+)\s*\(([^)]*)\)/);
        if (antDpArgsMatch) {
            const paramNames = antDpArgsMatch[1].split(',').map(p => {
                return p.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
            }).filter(p => p !== '');

            console.log('🔍 [Main Exec] Detected Ant DP Params:', paramNames);

            if (paramNames.length > 0) {
                const argMap = {
                    'sugarGrid': 'sugarGrid',
                    'start': 'start',
                    'goal': 'goal',
                    'grid': 'sugarGrid',
                    's': 'start',
                    'g': 'goal',
                    'st': 'start',
                    'gl': 'goal',
                    'rows': 'rows',
                    'cols': 'cols'
                };

                const orderedArgs = paramNames.map(pName => {
                    const cleanName = pName.replace(/[^a-zA-Z0-9]/g, '');
                    if (argMap[cleanName]) return argMap[cleanName];
                    const lower = cleanName.toLowerCase();
                    if (lower.includes('sugar') || lower.includes('grid')) return 'sugarGrid';
                    if (lower.includes('start')) return 'start';
                    if (lower.includes('goal')) return 'goal';
                    if (lower.includes('rows')) return 'rows';
                    if (lower.includes('cols')) return 'cols';
                    return 'undefined';
                });

                const newCallArgs = orderedArgs.join(', ');
                console.log('🔍 [Main Exec] Rewriting calls to use args:', newCallArgs);

                code = code.replace(/(\b(?:async\s+)?function\s+[\w]+\s*\()|(\b[\w]+\s*\([^)]*\))/g, (match, defGroup, callGroup) => {
                    // If it matches the definition part, return as is
                    if (defGroup) return match;

                    // If it matches a call (callGroup), check if it's our function
                    if (callGroup && callGroup.includes('antDp') && !callGroup.includes('function')) {
                        // Extract function name and replace args
                        return callGroup.replace(/\(([^)]*)\)/, `(${newCallArgs})`);
                    }
                    return match;
                });
            }
        }
    } catch (err) {
        console.warn('🔍 [Main Exec] Failed to rewrite Ant DP params:', err);
    }

    if (isAntDp) {
        // SAFETY PATCHES:

        // 1. Initialize variables to 0 to prevent undefined at start (e.g., best at 0,0)
        // FORCE MANUAL INIT of common Ant DP usage to be absolutely safe (Nuclear Option)
        // Inject this after all vars are declared but before logic starts.
        code += '\n /* ANT DP SAFETY INIT */ var best = (typeof best !== "undefined" ? best : 0); var dpVal = (typeof dpVal !== "undefined" ? dpVal : 0); var result = (typeof result !== "undefined" ? result : 0); var sugar = (typeof sugar !== "undefined" ? sugar : 0); \n';
        code += '\n /* ANT DP ARRAY SAFETY */ if(typeof dp === "undefined") { var dp = []; } \n';

        // 2. Broaden Arithmetic Patch: Catch "a + b" AND "a[i] + b[j]"
        // Regex allows identifiers followed by any number of [...] groups.
        code = code.replace(/(=|return|\(|:|)\s*([a-zA-Z0-9_]+(?:\[[^\]]+\])*)\s*\+\s*([a-zA-Z0-9_]+(?:\[[^\]]+\])*)/g,
            '$1 ((Number($2)||0) + (Number($3)||0))');
    }

    return code;
};

export const applyAntDpPatches = (code, isAntDp, initCodes) => {
    if (isAntDp) {
        console.log("🔍 [AntDP Debug] Applying Unconditional Patches...");
        // Inject Ant DP helper variables
        // Only inject if not already injected (simple check)
        if (!code.includes('var sugarGrid =')) {
            code = initCodes.antDp + code;
        }

        // 1. Math.max/min Override: Treat undefined/NaN as 0
        const mathPatch = `
          const _origMax = Math.max;
          Math.max = (...args) => _origMax(...args.map(x => (x === null || x === undefined || Number.isNaN(Number(x))) ? 0 : Number(x)));
          const _origMin = Math.min;
          Math.min = (...args) => _origMin(...args.map(x => (x === null || x === undefined || Number.isNaN(Number(x))) ? 0 : Number(x)));
        `;
        // Inject at start of content
        code = mathPatch + code;

        // FIX FUNCTION SIGNATURE: Ensure 'start, goal, sugarGrid' parameters are present and correctly ordered
        const funcDefMatch = code.match(/(?:async\s+function\s+|function\s+)(antDp)\s*\(([^)]*)\)/);
        if (funcDefMatch) {
            const funcName = funcDefMatch[1];
            const paramsStr = funcDefMatch[2];
            const paramNames = paramsStr ? paramsStr.split(',').map(p => p.trim()).filter(p => p) : [];
        }

        // Ensure function calls match the (start, goal, sugarGrid) order.
        // If we see 3 arguments, we ensure they are in the expected order if they were shifted.
        // Note: We removed the previous 'antDp($2, $3, $1)' swap as it was likely causing issues.

        console.log('🔍 [AntDP Code Patch Debug] Final Code:', code);
    }
    return code;
};


export const instrumentRopePartition = (code, isRopePartition) => {
    // Rope Partition Auto-fix: Ensure 'result' variable exists and captures the solve() call
    if (isRopePartition) {
        const hasResultAssign = code.includes('result =') || code.includes('result=');

        if (!hasResultAssign) {
            console.log('[Rope Exec] Missing result assignment detected. Auto-injecting...');
            if (!code.includes('var result') && !code.includes('let result')) {
                code = 'var result;\n' + code;
            }
            console.log('[Rope Fix] Code (first 200):', code.substring(0, 200));
            const regex = /^[\s;]*(await\s+)?(solve\s*\()/gm;
            code = code.replace(regex, (match) => {
                const keyIdx = match.search(/(await|solve)/);
                return keyIdx !== -1 ? match.substring(0, keyIdx) + 'result = ' + match.substring(keyIdx) : 'result = ' + match;
            });
            console.log('[Rope Fix] Code after:', code.substring(0, 200));
        }
    }
    return code;
};

export const instrumentNQueen = (code, currentLevel, workspaceRef) => {
    // CRITICAL FIX: Check if this is N-Queen problem
    const hasSolve = code.includes('async function solve');
    const hasN = code.includes('var n') || code.includes('let n') || code.includes('n =') || code.includes('nqueen') || /\bn\b/.test(code);
    const hasBoard = code.includes('var board') || code.includes('let board') || code.includes('board[') || code.includes('board[i]') || code.includes('listVar = board') || code.includes('= board') || code.includes(' board') || /\bboard\b/.test(code);
    const isNQueenProblem = hasSolve && hasN && hasBoard;

    console.log('[useCodeExecution] 🔍 N-Queen detection:', { hasSolve, hasN, hasBoard, isNQueenProblem, hasForCol: code.includes('for (let col'), codeLength: code.length });

    if (isNQueenProblem && !code.includes('for (let col')) {
        console.warn('[useCodeExecution] ⚠️ N-Queen code missing recursive case, attempting to extract from workspace...');
        try {
            const solveBlocks = workspaceRef.current.getBlocksByType('procedures_defreturn', false);
            const solveBlock = solveBlocks.find(b => b.getFieldValue('NAME') && b.getFieldValue('NAME').toLowerCase().includes('solve'));

            if (solveBlock) {
                const stackBlock = solveBlock.getInputTargetBlock('STACK');
                if (stackBlock && stackBlock.type === 'if_only') {
                    let actualNextBlock = stackBlock.nextConnection?.targetBlock();
                    if (!actualNextBlock && stackBlock.nextConnection) {
                        const targetConnection = stackBlock.nextConnection.targetConnection;
                        if (targetConnection) actualNextBlock = targetConnection.getSourceBlock();
                        if (!actualNextBlock) {
                            const allBlocks = workspaceRef.current.getAllBlocks(false);
                            for (const block of allBlocks) {
                                if (block.previousConnection) {
                                    const targetConn = block.previousConnection.targetConnection;
                                    if (targetConn) {
                                        const sourceBlock = targetConn.getSourceBlock ? targetConn.getSourceBlock() : (targetConn.sourceBlock_ || null);
                                        if (sourceBlock && sourceBlock.id === stackBlock.id) { actualNextBlock = block; break; }
                                    }
                                }
                            }
                            if (!actualNextBlock) {
                                for (const block of allBlocks) {
                                    if (block.type === 'for_loop_dynamic' && block.getFieldValue('VAR') === 'col') {
                                        let parent = block.getSurroundParent();
                                        let isInSolveFunction = false;
                                        while (parent) {
                                            if (parent.type === 'procedures_defreturn' && parent.getFieldValue('NAME')?.toLowerCase().includes('solve')) { isInSolveFunction = true; break; }
                                            parent = parent.getSurroundParent();
                                        }
                                        if (isInSolveFunction) { actualNextBlock = block; break; }
                                    }
                                }
                            }
                        }
                    }

                    if (actualNextBlock) {
                        let nextCode = '';
                        let currentBlock = actualNextBlock;
                        let processedIds = new Set();
                        try {
                            if (workspaceRef.current && javascriptGenerator.nameDB_ && workspaceRef.current.getVariableMap) { javascriptGenerator.nameDB_.setVariableMap(workspaceRef.current.getVariableMap()); }
                            if (typeof javascriptGenerator.init === 'function' && workspaceRef.current) { javascriptGenerator.init(workspaceRef.current); }
                        } catch (e) {
                            console.warn('[useCodeExecution] Warning: could not init javascript generator before manual blockToCode:', e);
                        }

                        while (currentBlock && !processedIds.has(currentBlock.id)) {
                            processedIds.add(currentBlock.id);
                            try {
                                const blockCode = javascriptGenerator.blockToCode(currentBlock);
                                if (blockCode) {
                                    const codeStr = typeof blockCode === 'string' ? blockCode : (Array.isArray(blockCode) ? blockCode[0] : '');
                                    if (codeStr && codeStr.trim()) nextCode += codeStr;
                                }
                            } catch (e) { console.warn('[useCodeExecution] Error generating code for next block:', currentBlock.type, e); }
                            if (currentBlock.nextConnection && currentBlock.nextConnection.targetBlock()) currentBlock = currentBlock.nextConnection.targetBlock(); else break;
                        }

                        if (nextCode.trim()) {
                            const solveFuncMatch = code.match(/async\s+function\s+solve\s*\([^)]*\)\s*\{/);
                            if (solveFuncMatch) {
                                const solveStartIndex = solveFuncMatch.index;
                                let insertIndex = -1;
                                const returnNullPattern = /return\s+null\s*;/;
                                const returnNullMatch = code.substring(solveStartIndex).match(returnNullPattern);
                                if (returnNullMatch) { insertIndex = solveStartIndex + returnNullMatch.index; }
                                else {
                                    let braceCount = 0;
                                    let lastBraceIndex = -1;
                                    for (let i = solveStartIndex; i < code.length; i++) {
                                        if (code[i] === '{') braceCount++;
                                        else if (code[i] === '}') { braceCount--; if (braceCount === 0) { lastBraceIndex = i; break; } }
                                    }
                                    if (lastBraceIndex !== -1) insertIndex = lastBraceIndex;
                                }

                                if (insertIndex !== -1) {
                                    let fixedNextCode = nextCode;
                                    let fromValueCount = 0;
                                    fixedNextCode = fixedNextCode.replace(/\bconst\s+fromValue\s*=/g, () => { fromValueCount++; return fromValueCount === 1 ? 'const fromValueCol =' : (fromValueCount === 2 ? 'const fromValueCol2 =' : `const fromValueCol${fromValueCount} =`); });
                                    let toValueCount = 0;
                                    fixedNextCode = fixedNextCode.replace(/\bconst\s+toValue\s*=/g, () => { toValueCount++; return toValueCount === 1 ? 'const toValueCol =' : (toValueCount === 2 ? 'const toValueCol2 =' : `const toValueCol${toValueCount} =`); });
                                    fixedNextCode = fixedNextCode.replace(/\b(?:const|let|var)\s+listItems\s*=/g, 'const listItems_injected =');
                                    fixedNextCode = fixedNextCode.replace(/\blistItems\b/g, 'listItems_injected');
                                    fixedNextCode = fixedNextCode.replace(/for\s*\(\s*let\s+([A-Za-z_$][\\w$]*)\s*=\s*fromValue\s*;\s*\1\s*<=\s*toValue\s*;\s*\1\+\+\s*\)/g, (m, varName) => `for (let ${varName} = 0; ${varName} <= (n - 1); ${varName}++)`);
                                    fixedNextCode = fixedNextCode.replace(/\b(?:const|let|var)\s+fromValue\s*=\s*0\s*;?/g, '');
                                    fixedNextCode = fixedNextCode.replace(/\b(?:const|let|var)\s+toValue\s*=\s*\(\s*n\s*-\s*1\s*\)\s*;?/g, '');

                                    const nVar = workspaceRef.current.getVariable('n');
                                    const boardVar = workspaceRef.current.getVariable('board');
                                    const solutionVar = workspaceRef.current.getVariable('solution');
                                    let nGeneratedName = 'n'; let boardGeneratedName = 'board'; let solutionGeneratedName = 'solution';
                                    if (nVar) nGeneratedName = javascriptGenerator.nameDB_.getName(nVar.getId(), Blockly.Names.NameType.VARIABLE);
                                    if (boardVar) boardGeneratedName = javascriptGenerator.nameDB_.getName(boardVar.getId(), Blockly.Names.NameType.VARIABLE);
                                    if (solutionVar) solutionGeneratedName = javascriptGenerator.nameDB_.getName(solutionVar.getId(), Blockly.Names.NameType.VARIABLE);

                                    if (nGeneratedName !== 'n') fixedNextCode = fixedNextCode.replace(new RegExp(`\\b${nGeneratedName}\\b`, 'g'), 'n');
                                    if (boardGeneratedName !== 'board') fixedNextCode = fixedNextCode.replace(new RegExp(`\\b${boardGeneratedName}\\b`, 'g'), 'board');
                                    if (solutionGeneratedName !== 'solution') fixedNextCode = fixedNextCode.replace(new RegExp(`\\b${solutionGeneratedName}\\b`, 'g'), 'solution');

                                    const wrappedCode = '(function(){\n' + fixedNextCode + '\n})();';
                                    const markerComment = '\n/* const fromValue = 0; */\n';
                                    code = code.substring(0, insertIndex) + '\n' + markerComment + wrappedCode + '\n' + code.substring(insertIndex);

                                    try {
                                        const solveStartMatch = code.substring(0, solveStartIndex).length >= 0 ? solveStartIndex : null;
                                        let braceCount2 = 0; let solveEndIndex = -1;
                                        for (let i = solveStartIndex; i < code.length; i++) {
                                            if (code[i] === '{') braceCount2++;
                                            else if (code[i] === '}') { braceCount2--; if (braceCount2 === 0) { solveEndIndex = i; break; } }
                                        }
                                        if (solveEndIndex !== -1) {
                                            const funcBody = code.substring(solveStartIndex, solveEndIndex + 1);
                                            let cleaned = funcBody.replace(/return\s+null\s*;\s*/g, '');
                                            cleaned = cleaned.replace(/(?:return\s+solution\s*;\s*)+/g, 'return solution;\n');
                                            code = code.substring(0, solveStartIndex) + cleaned + code.substring(solveEndIndex + 1);
                                        }
                                    } catch (e) {
                                        console.warn('[useCodeExecution] Could not sanitize solve function after injection:', e);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) { console.error('[useCodeExecution] Error extracting recursive case from workspace:', e); }
    }

    if (isNQueenProblem) {
        console.log('[useCodeExecution] 🔧 Removing N-Queen stub functions...');
        code = code.replace(/\/\/\s*Check if placing queen.*?\n\s*async function safe\s*\([^)]*\)\s*\{[^}]*return false;?\s*\}/gs, '');
        code = code.replace(/\/\/\s*Place queen at.*?\n\s*(?:async\s+)?function place\s*\([^)]*\)\s*\{\s*\}/gs, '');
        code = code.replace(/\/\/\s*Remove queen from.*?\n\s*(?:async\s+)?function remove\s*\([^)]*\)\s*\{\s*\}/gs, '');
        code = code.replace(/async function safe\s*\([^)]*\)\s*\{\s*return false;?\s*\}/g, '');
        code = code.replace(/function safe\s*\([^)]*\)\s*\{\s*\}/g, '');
        code = code.replace(/(?:async\s+)?function place\s*\([^)]*\)\s*\{\s*\}/g, '');
        code = code.replace(/(?:async\s+)?function remove\s*\([^)]*\)\s*\{\s*\}/g, '');
        console.log('[useCodeExecution] 🔍 Detected N-Queen problem - applying fixes...');

        const solveRowColPattern = /solve\d*\s*\(\s*row\s*,\s*col\s*\)/g;
        code = code.replace(/if\s*\(\s*\(?\s*await\s+solve\d*\s*\(\s*row\s*,\s*col\s*\)/g, (match) => match.includes('safe') || match.includes('place') || match.includes('remove') ? match : match.replace(/solve\d*/g, 'safe'));
        code = code.replace(/else\s*\{\s*await\s+solve\d*\s*\(\s*row\s*,\s*col\s*\)/g, (match) => match.replace(/solve\d*/g, 'remove'));
        code = code.replace(/await\s+solve\d*\s*\(\s*row\s*,\s*col\s*\)\s*;/g, (match) => (!match.includes('safe') && !match.includes('place') && !match.includes('remove')) ? match.replace(/solve\d*/g, 'place') : match);
    }

    if (currentLevel?.nqueenData && code.includes('// Describe this function...')) {
        console.warn('[useCodeExecution] Detected default Blockly generator output - fixing code...');
        const funcNameMatch = code.match(/function\s+(solve\d*)\s*\(/);
        const funcName = funcNameMatch ? funcNameMatch[1] : 'solve';
        code = code.replace(new RegExp(`function\\s+(${funcName})\\s*\\([^)]*\\)\\s*\\{`, 'g'), (match, fName) => {
            const paramsMatch = match.match(/\(([^)]*)\)/);
            const originalParams = paramsMatch ? paramsMatch[1] : '';
            const correctParams = originalParams.split(',').map(p => p.trim()).filter(p => p !== 'col').join(', ');
            return `async function ${fName}(${correctParams}) {`;
        });

        const functionCallPattern = new RegExp(`(await\\s+)?\\b${funcName}\\b\\s*\\(([^)]*)\\)`, 'g');
        code = code.replace(functionCallPattern, (match, awaitKeyword, params) => {
            if (!params || params.trim().length === 0) return `${awaitKeyword ? awaitKeyword.trim() + ' ' : ''}${funcName}()`;
            const paramList = params.split(',').map(p => p.trim()).filter(p => p.length > 0);
            const filteredParams = paramList.filter(p => { const trimmed = p.trim(); if (trimmed === 'col') return false; if (trimmed.includes('row')) return true; return trimmed !== 'col'; });
            const finalParams = filteredParams.length > 0 ? [filteredParams[0]] : ['row'];
            return `${awaitKeyword ? awaitKeyword.trim() + ' ' : ''}${funcName}(${finalParams.join(', ')})`;
        });

        code = code.replace(/if\s*\(\s*\(\s*await\s+solve(\d*)\s*\(\s*row\s*,\s*col\s*\)/g, `if ((await safe(row, col`);
        code = code.replace(/if\s*\(\s*await\s+solve(\d*)\s*\(\s*row\s*,\s*col\s*\)/g, (m) => m.includes('safe') ? m : `if (await safe(row, col`);
        code = code.replace(/else\s*\{\s*await\s+solve(\d*)\s*\(\s*row\s*,\s*col\s*\)/g, `else { await remove(row, col`);
        code = code.replace(/await\s+solve(\d*)\s*\(\s*row\s*,\s*col\s*\)\s*;/g, (match, num, offset) => {
            const contextStart = Math.max(0, offset - 100);
            const contextEnd = Math.min(code.length, offset + match.length + 50);
            const context = code.substring(contextStart, contextEnd);
            if (context.includes('if') && !context.match(/;\s*if\s*\(/)) return match;
            if (context.includes('else') && !context.match(/else\s*\{[^}]*$/)) return match;
            return `await place(row, col);`;
        });

        code = code.replace(/(\b)(await\s+)?safe\s*\(/g, (m, b, a) => a ? m : `${b}await safe(`);
        code = code.replace(/(\b)(await\s+)?place\s*\(/g, (m, b, a) => a ? m : `${b}await place(`);
        code = code.replace(/(\b)(await\s+)?remove\s*\(/g, (m, b, a) => a ? m : `${b}await remove(`);

        const hasReturnSolution = code.includes('return solution');
        const hasReturnSolutionInBaseCase = /if\s*\([^)]*row[^)]*n[^)]*\)\s*\{[\s\S]*?return solution/.test(code);

        if (!hasReturnSolution || !hasReturnSolutionInBaseCase) {
            const solutionPushIndex = code.indexOf('solution.push([i, j]);');
            if (solutionPushIndex !== -1) {
                let recursiveCaseIndex = code.indexOf('for (let col', solutionPushIndex);
                if (recursiveCaseIndex === -1) recursiveCaseIndex = code.indexOf('const fromValue = 0;', solutionPushIndex);
                if (recursiveCaseIndex !== -1) {
                    const beforeRecursive = code.substring(solutionPushIndex, recursiveCaseIndex);
                    let lastBraceIndex = -1; let braceCount = 0;
                    for (let i = beforeRecursive.length - 1; i >= 0; i--) {
                        if (beforeRecursive[i] === '}') { braceCount++; if (braceCount === 1) { lastBraceIndex = solutionPushIndex + i; break; } }
                        else if (beforeRecursive[i] === '{') braceCount--;
                    }
                    if (lastBraceIndex !== -1) {
                        const beforeBrace = code.substring(Math.max(0, lastBraceIndex - 200), lastBraceIndex);
                        if (!beforeBrace.includes('return solution')) {
                            code = code.substring(0, lastBraceIndex) + '\nreturn solution;\n' + code.substring(lastBraceIndex);
                        }
                    }
                }
            }
        }
    }

    return code;
}

export const getKnapsackInitCode = (currentLevel) => {
    if (!currentLevel?.knapsackData) return '';
    const knapsackData = currentLevel.knapsackData;
    const weights = knapsackData.items ? knapsackData.items.map(item => item.weight) : [];
    const values = knapsackData.items ? knapsackData.items.map(item => item.price) : [];
    const n = weights.length;
    const capacity = knapsackData.capacity || 0;

    return `
            // Initialize knapsack variables from level data
            var weights = ${JSON.stringify(weights)};
            var values = ${JSON.stringify(values)};
            var n = ${n};
            var capacity = ${capacity};
            console.log('🔍 Knapsack variables initialized:', { weights, values, n, capacity });
          `;
};

export const getSubsetSumInitCode = (currentLevel) => {
    if (!currentLevel?.subsetSumData) return '';
    const subsetSumData = currentLevel.subsetSumData;
    const warriors = subsetSumData.warriors || [];
    const targetSum = subsetSumData.target_sum || 0;

    return `
          // Initialize subset sum variables from level data
          var warriors = ${JSON.stringify(warriors)};
          var target_sum = ${targetSum};
          console.log('🔍 Subset Sum variables initialized:', { warriors, target_sum });
        `;
};

export const getCoinChangeInitCode = (currentLevel) => {
    if (!currentLevel?.coinChangeData) return '';
    const coinChangeData = currentLevel.coinChangeData;
    const monsterPower = coinChangeData.monster_power || 32;
    const warriors = coinChangeData.warriors || [1, 5, 10, 25];

    return `
          // Initialize coin change variables from level data
          var monster_power = Math.round(Number(${monsterPower}));
          var warriors = ${JSON.stringify(warriors)}.map(w => Math.round(Number(w)));
          console.log('🔍 Coin Change variables initialized:', { monster_power, warriors });
        `;
};

export const getAntDpInitCode = (currentLevel) => {
    try {
        const applied = currentLevel?.appliedData;
        const appliedType = String(applied?.type || '');
        const isAntDp = !!(applied && appliedType.toUpperCase().includes('ANT'));
        if (isAntDp) {
            const payload = applied?.payload || {};
            const sugarGrid = Array.isArray(payload.sugarGrid) ? payload.sugarGrid : [];
            const rows = Number(payload.rows ?? sugarGrid.length ?? 0) || 0;
            const cols = Number(payload.cols ?? (Array.isArray(sugarGrid?.[0]) ? sugarGrid[0].length : 0) ?? 0) || 0;

            const normPoint = (p, fallback) => {
                const isArray = Array.isArray(p);
                const obj = (p && typeof p === 'object' && !isArray) ? p : (isArray ? { r: p[0], c: p[1] } : {});
                const rRaw = (obj.r ?? obj.row ?? obj.y ?? obj.rr);
                const cRaw = (obj.c ?? obj.col ?? obj.x ?? obj.cc);
                const rNum = Number(rRaw);
                const cNum = Number(cRaw);
                const r = Number.isFinite(rNum) ? rNum : Number(fallback?.r ?? 0);
                const c = Number.isFinite(cNum) ? cNum : Number(fallback?.c ?? 0);
                return { r, c };
            };

            const start = normPoint(payload.start, { r: 0, c: 0 });
            const goal = normPoint(payload.goal, { r: Math.max(0, rows - 1), c: Math.max(0, cols - 1) });
            const startR = Number.isFinite(Number(start.r)) ? Number(start.r) : 0;
            const startC = Number.isFinite(Number(start.c)) ? Number(start.c) : 0;
            const goalR = Number.isFinite(Number(goal.r)) ? Number(goal.r) : Math.max(0, rows - 1);
            const goalC = Number.isFinite(Number(goal.c)) ? Number(goal.c) : Math.max(0, cols - 1);

            return `
          // Initialize Applied Dynamic (Ant DP) variables from level data
          var rows = ${rows};
          var cols = ${cols};
          var sugarGrid = ${JSON.stringify(sugarGrid)};
          var start = ${JSON.stringify(start)};
          var goal = ${JSON.stringify(goal)};
          // Also inject numeric coords (robust for Blockly code that expects globals)
          var startR = ${startR};
          var startC = ${startC};
          var goalR = ${goalR};
          var goalC = ${goalC};

            console.log('🔍 Ant DP variables initialized for Main Exec:', { rows, cols, start, goal });
         `;
        }
    } catch (e) {
        console.warn('[executionInstrumentation] Could not init appliedData (Ant DP):', e);
    }
    return '';
};

export const getNQueenInitCode = (currentLevel) => {
    if (!currentLevel?.nqueenData) return '';
    const nqueenData = currentLevel.nqueenData;
    const n = nqueenData.n || 4;

    return `
          // Initialize N-Queen variables from level data
          var n = ${n};
          
          // Initialize board (2D array to track queen positions)
          var board = [];
          for (var i = 0; i < n; i++) {
            board[i] = [];
            for (var j = 0; j < n; j++) {
              board[i][j] = 0; // 0 = empty, 1 = queen
            }
          }
          
          // Helper function: Check if placing queen at (row, col) is safe
          async function safe(row, col) {
            // Visual hook: Thinking (Cyan for high contrast)
            try { if (globalThis.__nqueenVisual_api && typeof globalThis.__nqueenVisual_api.onConsider === 'function') globalThis.__nqueenVisual_api.onConsider(row, col, true); } catch(e){}
            await new Promise(r => setTimeout(r, 400)); // Slower delay (Cyan)

            var isSafe = true;
            // Check column (loop up to row)
            for (var i = 0; i < row; i++) {
              if (board[i][col] === 1) isSafe = false;
            }
            
            // Check upper-left diagonal
            for (var i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
              if (board[i][j] === 1) isSafe = false;
            }
            
            // Check upper-right diagonal
            for (var i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
              if (board[i][j] === 1) isSafe = false;
            }
            
            // Visual hook: Result (Red if unsafe, keep Cyan/Yellow if safe)
            try { if (globalThis.__nqueenVisual_api && typeof globalThis.__nqueenVisual_api.onConsider === 'function') globalThis.__nqueenVisual_api.onConsider(row, col, isSafe); } catch(e){}
            
            // If unsafe, wait longer so user "sees" the rejection
            await new Promise(r => setTimeout(r, isSafe ? 200 : 500));
            
            return isSafe;
          }
          
          // Helper function: Place queen at (row, col)
          async function place(row, col) {
            board[row][col] = 1;
            // Capture for final result
            if (!globalThis.__capturedSolution) globalThis.__capturedSolution = [];
            globalThis.__capturedSolution.push([row, col]);
            
            try { if (globalThis.__nqueenVisual_api && typeof globalThis.__nqueenVisual_api.onPlace === 'function') globalThis.__nqueenVisual_api.onPlace(row, col); } catch(e){}
            await new Promise(r => setTimeout(r, 300));
          }
          
          // Helper function: Remove queen from (row, col)
          async function remove(row, col) {
            board[row][col] = 0;
            // Remove from capture
            if (globalThis.__capturedSolution) {
               for(let i=globalThis.__capturedSolution.length-1; i>=0; i--) {
                  if(globalThis.__capturedSolution[i][0]===row && globalThis.__capturedSolution[i][1]===col) {
                      globalThis.__capturedSolution.splice(i, 1);
                      break;
                  }
               }
            }
            
            try { if (globalThis.__nqueenVisual_api && typeof globalThis.__nqueenVisual_api.onRemove === 'function') globalThis.__nqueenVisual_api.onRemove(row, col); } catch(e){}
            await new Promise(r => setTimeout(r, 300));
          }

          // Expose helpers to globalThis so Blockly-generated code can reliably call them
          // even if local scope shadowing happens elsewhere.
          try { globalThis.safe = safe; globalThis.place = place; globalThis.remove = remove; } catch (e) {}
          
          console.log('🔍 N-Queen variables initialized:', { n });
        `;
};

export const getRopePartitionInitCode = (isRopePartition) => {
    if (!isRopePartition) return '';
    return `
          // Initialize cuts array
          if (typeof cuts === 'undefined') var cuts = [];
          else cuts = [];
          
          // Helper to update visualization
          async function updateRopeVisuals() {
             try {
                if (typeof globalThis !== 'undefined' && globalThis.__ropePartition_api && typeof globalThis.__ropePartition_api.updateCuts === 'function') {
                   globalThis.__ropePartition_api.updateCuts(cuts);
                   // Add a small delay for visualization
                   await new Promise(r => setTimeout(r, globalThis.__ropePartition_delay || 300));
                }
             } catch(e) {}
          }

          // Define addCut
          async function addCut(len) {
             console.log('[Rope Exec] addCut called with:', len);
             cuts.push(len);
             console.log('[Rope Exec] current cuts:', cuts);
             await updateRopeVisuals();
          }
          
          // Define removeCut
          async function removeCut() {
             console.log('[Rope Exec] removeCut called');
             cuts.pop();
             console.log('[Rope Exec] current cuts:', cuts);
             await updateRopeVisuals();
          }
          
          // Expose to globalThis for safety
          globalThis.addCut = addCut;
          globalThis.removeCut = removeCut;
          globalThis.cuts = cuts;
          
          console.log('[Rope Exec] Rope Partition init code loaded. cuts:', cuts);
        `;
};

export const instrumentNQueenVisuals = (codeWithReturnCapture) => {
    try {
        // Protect function declarations for safe/place/remove to avoid accidental rewrites
        codeWithReturnCapture = codeWithReturnCapture
            .replace(/async\s+function\s+place\s*\(/g, '__FUNC_PLACE_ASYNC__(')
            .replace(/function\s+place\s*\(/g, '__FUNC_PLACE__(')
            .replace(/async\s+function\s+remove\s*\(/g, '__FUNC_REMOVE_ASYNC__(')
            .replace(/function\s+remove\s*\(/g, '__FUNC_REMOVE__(')
            .replace(/async\s+function\s+safe\s*\(/g, '__FUNC_SAFE_ASYNC__(')
            .replace(/function\s+safe\s*\(/g, '__FUNC_SAFE__(');

        // Ensure function declarations for 'solve' are async (safely)
        // Look for 'function solve' optionally preceded by 'async '
        codeWithReturnCapture = codeWithReturnCapture.replace(/(async\s+)?function\s+(solve)\s*\(/g, 'async function $2(');
        codeWithReturnCapture = codeWithReturnCapture.replace(/(\b)solve\s*=\s*(async\s+)?function\s*\(/g, 'solve = async function(');

        // NOTE (N-Queen): Do NOT blindly inject `await` before every `solve(` occurrence.
        // It can corrupt the function declaration into `function await solve(` -> SyntaxError ("Unexpected reserved word").
        // Blockly's procedure-call generators already emit `(await solve(...))` where required for N-Queen.

        // NOTE: We REMOVED the global replacement of place/remove/safe here because it was breaking function definitions.
        // We rely on the targeted replacements applied to `code` earlier.

        // Restore protected function definitions
        codeWithReturnCapture = codeWithReturnCapture
            .replace(/__FUNC_PLACE_ASYNC__\(/g, 'async function place(')
            .replace(/__FUNC_PLACE__\(/g, 'function place(')
            .replace(/__FUNC_REMOVE_ASYNC__\(/g, 'async function remove(')
            .replace(/__FUNC_REMOVE__\(/g, 'function remove(')
            .replace(/__FUNC_SAFE_ASYNC__\(/g, 'async function safe(')
            .replace(/__FUNC_SAFE__\(/g, 'function safe(');

        // CRITICAL (N-Queen visuals): ensure calls go through globalThis to avoid local-scope shadowing.
        // This allows our visual API + initCode helpers to always be used.
        // We only rewrite awaited call sites to avoid touching declarations.
        codeWithReturnCapture = codeWithReturnCapture
            .replace(/\bawait\s+safe\s*\(/g, 'await globalThis.safe(')
            .replace(/\bawait\s+place\s*\(/g, 'await globalThis.place(')
            .replace(/\bawait\s+remove\s*\(/g, 'await globalThis.remove(');

        // Default visual mode settings; can be overridden by UI
        // For N-Queen, prefer accumulating overlays so the user clearly sees rejected (red) cells.
        try {
            if (typeof globalThis !== 'undefined') {
                if (typeof globalThis.__nqueenVisual_mode === 'undefined') globalThis.__nqueenVisual_mode = true;
                if (typeof globalThis.__nqueenVisual_delay === 'undefined') globalThis.__nqueenVisual_delay = 300;
                // Default: don't accumulate overlays; rejected cells will flash briefly and clear.
                if (typeof globalThis.__nqueenVisual_accumulate === 'undefined') globalThis.__nqueenVisual_accumulate = false;
            }
        } catch (e) { }
        return codeWithReturnCapture;
    } catch (e) {
        console.warn('⚠️ Could not transform N-Queen code for visuals:', e);
        return codeWithReturnCapture;
    }
};

export const getSimplifiedHelpersInitCode = () => {
    return `
        /* Simplified Visual Helpers for Text Code */
        
        // Knapsack
        var selectItem = (typeof selectKnapsackItemVisual === 'function') ? selectKnapsackItemVisual : (x) => {};
        var unselectItem = (typeof unselectKnapsackItemVisual === 'function') ? unselectKnapsackItemVisual : (x) => {};
        
        // Subset Sum
        var addToSide1 = (typeof addWarriorToSide1Visual === 'function') ? addWarriorToSide1Visual : (x) => {};
        var addToSide2 = (typeof addWarriorToSide2Visual === 'function') ? addWarriorToSide2Visual : (x) => {};
        
        // Coin Change
        var trackDecision = (typeof trackCoinChangeDecision === 'function') ? trackCoinChangeDecision : (amt, idx, inc, exc) => {};
        var addWarrior = (typeof addWarriorToSelectionVisual === 'function') ? addWarriorToSelectionVisual : (x) => {};
        
        // Ant DP
        var moveAnt = (typeof antMaxWithVisual === 'function') ? function(r, c) { return antMaxWithVisual(r, c, 0, 0, []); } : (r, c) => {};

        // Rope Partition
        var pushNode = (typeof pushRopeNode === 'function') ? pushRopeNode : (cut, sum) => {};
        var popNode = (typeof popRopeNode === 'function') ? popRopeNode : () => {};
        var updateStatus = (typeof updateRopeNodeStatus === 'function') ? 
            (status) => { 
                if (typeof ropeStack !== 'undefined' && ropeStack.length > 0) {
                    updateRopeNodeStatus(ropeStack[ropeStack.length - 1], status);
                }
            } : (status) => {};
        var getCuts = (typeof getRopeCuts === 'function') ? getRopeCuts : () => [2, 3, 5];
        
        console.log('🔍 Loaded Simplified Text Code Helpers (selectItem, addToSide1, trackDecision, etc.)');
    `;
};
