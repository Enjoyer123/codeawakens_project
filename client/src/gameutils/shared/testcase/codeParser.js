/**
 * Code Parser Utilities
 * Extract function name from Blockly code
 */

/**
 * Extract function name from Blockly code
 * @param {string} code - Blockly generated JavaScript code
 * @returns {string|null} - Function name (เช่น "DFS", "BFS", "DIJ", "PRIM", "KRUSKAL") หรือ null
 */
export function extractFunctionName(code) {
    if (!code || typeof code !== 'string') {
        console.log('🔍 [extractFunctionName] No code or not a string');
        return null;
    }

    console.log('🔍 [extractFunctionName] Code length:', code.length);
    // console.log('🔍 [extractFunctionName] Code preview:', code.substring(0, 500));

    // Look for function calls: DFS(...), BFS(...), DIJ(...), PRIM(...), KRUSKAL(...), KNAPSACK(...), subsetSum(...), coinChange(...), solve(...), antDp(...)
    // Try multiple patterns to match different code generation styles
    const functionPatterns = [
        // Blockly generator format: (await DFS(...)) or var path = (await DFS(...))
        /(?:var\s+\w+\s*=\s*)?\(?\s*await\s+(DFS|BFS|DIJ|PRIM|KRUSKAL|KNAPSACK|subsetSum|SUBSETSUM|SUBSET_SUM|coinChange|COINCHANGE|COIN_CHANGE|solveRope|SOLVEROPE|solve|SOLVE|NQUEEN|N_QUEEN|maxCapacity|MAXCAPACITY|MAX_CAPACITY)\s*\(/i,
        // Standard: var path = DFS(...) or path = DFS(...)
        /(?:var\s+\w+\s*=\s*)?(?:await\s+)?(DFS|BFS|DIJ|PRIM|KRUSKAL|KNAPSACK|subsetSum|SUBSETSUM|SUBSET_SUM|coinChange|COINCHANGE|COIN_CHANGE|solveRope|SOLVEROPE|solve|SOLVE|NQUEEN|N_QUEEN|maxCapacity|MAXCAPACITY|MAX_CAPACITY)\s*\(/i,
        // Assignment: result = DFS(...) or path = DFS(...)
        /\w+\s*=\s*(?:await\s+)?(?:\(?\s*await\s+)?(DFS|BFS|DIJ|PRIM|KRUSKAL|KNAPSACK|subsetSum|SUBSETSUM|SUBSET_SUM|coinChange|COINCHANGE|COIN_CHANGE|solveRope|SOLVEROPE|solve|SOLVE|NQUEEN|N_QUEEN|maxCapacity|MAXCAPACITY|MAX_CAPACITY)\s*\(/i,
        // Direct call: DFS(...) or await DFS(...)
        /(?:await\s+)?(DFS|BFS|DIJ|PRIM|KRUSKAL|KNAPSACK|subsetSum|SUBSETSUM|SUBSET_SUM|coinChange|COINCHANGE|COIN_CHANGE|solveRope|SOLVEROPE|solve|SOLVE|NQUEEN|N_QUEEN|maxCapacity|MAXCAPACITY|MAX_CAPACITY)\s*\(/i,
        // Function definition: function DFS(...) or async function DFS(...)
        /(?:async\s+)?function\s+(DFS|BFS|DIJ|PRIM|KRUSKAL|KNAPSACK|subsetSum|SUBSETSUM|SUBSET_SUM|coinChange|COINCHANGE|COIN_CHANGE|solveRope|SOLVEROPE|solve|SOLVE|NQUEEN|N_QUEEN|maxCapacity|MAXCAPACITY|MAX_CAPACITY)\s*\(/i,
        // Arrow function: const DFS = (...) => or const DFS = async (...) =>
        /(?:const|let|var)\s+(DFS|BFS|DIJ|PRIM|KRUSKAL|KNAPSACK|subsetSum|SUBSETSUM|SUBSET_SUM|coinChange|COINCHANGE|COIN_CHANGE|solveRope|SOLVEROPE|solve|SOLVE|NQUEEN|N_QUEEN|maxCapacity|MAXCAPACITY|MAX_CAPACITY)\s*=\s*(?:async\s+)?\(/i
    ];

    for (let i = 0; i < functionPatterns.length; i++) {
        const pattern = functionPatterns[i];
        const match = code.match(pattern);
        if (match && match[1]) {
            let functionName = match[1].toUpperCase();
            // Normalize subsetSum variants to SUBSETSUM
            if (functionName === 'SUBSETSUM' || functionName === 'SUBSET_SUM' || match[1].toLowerCase() === 'subsetsum') {
                functionName = 'SUBSETSUM';
            }
            // Normalize coinChange variants to COINCHANGE
            if (functionName === 'COINCHANGE' || functionName === 'COIN_CHANGE' || match[1].toLowerCase() === 'coinchange') {
                functionName = 'COINCHANGE';
            }
            // Normalize solve/N-Queen variants to NQUEEN
            if (functionName === 'NQUEEN' || functionName === 'N_QUEEN') {
                functionName = 'NQUEEN';
            }

            // Normalize maxCapacity variants to MAXCAPACITY
            if (functionName === 'MAXCAPACITY' || functionName === 'MAX_CAPACITY' || match[1].toLowerCase() === 'maxcapacity') {
                functionName = 'MAXCAPACITY';
            }
            console.log('🔍 [extractFunctionName] Found function:', match[1], '->', functionName, 'using pattern', i);
            return functionName;
        }
    }

    // If no match found, try to find any procedure call in the code
    // Look for common patterns like: procedureName(arg1, arg2, ...)
    const procedureCallPattern = /(\w+)\s*\([^)]*\)/g;
    const allMatches = [...code.matchAll(procedureCallPattern)];
    console.log('🔍 [extractFunctionName] All function calls found:', allMatches.map(m => m[1]));

    // Check if any of the matches is a known algorithm function (with or without numbers)
    for (const match of allMatches) {
        const originalName = match[1];
        const name = originalName.toUpperCase();
        // Check if it starts with known algorithm names (DFS2, DFS3, BFS2, etc.)
        // Also check for camelCase names like subsetSum -> SUBSETSUM, coinChange -> COINCHANGE
        const algorithmNames = ['DFS', 'BFS', 'DIJ', 'PRIM', 'KRUSKAL', 'KNAPSACK', 'SUBSETSUM', 'SUBSET_SUM', 'COINCHANGE', 'COIN_CHANGE', 'NQUEEN', 'N_QUEEN', 'SOLVE', 'SOLVEROPE', 'MAXCAPACITY', 'MAX_CAPACITY'];
        // Check for camelCase variations (subsetSum, SubsetSum, SUBSETSUM, etc.)
        if (name === 'SUBSETSUM' || name.startsWith('SUBSETSUM') || originalName.toLowerCase() === 'subsetsum') {
            console.log('🔍 [extractFunctionName] Found function from all matches:', originalName, '->', 'SUBSETSUM');
            return 'SUBSETSUM';
        }
        // Check for coinChange variations (coinChange, CoinChange, COINCHANGE, etc.)
        if (name === 'COINCHANGE' || name.startsWith('COINCHANGE') || name === 'COIN_CHANGE' || originalName.toLowerCase() === 'coinchange') {
            console.log('🔍 [extractFunctionName] Found function from all matches:', originalName, '->', 'COINCHANGE');
            return 'COINCHANGE';
        }
        // Check for solveRope variations
        if (name === 'SOLVEROPE' || name.startsWith('SOLVEROPE') || originalName.toLowerCase().startsWith('solverope')) {
            console.log('🔍 [extractFunctionName] Found function from all matches:', originalName, '->', 'SOLVEROPE');
            return 'SOLVEROPE';
        }
        // Check for solve (generic) - keep as SOLVE
        if (name === 'SOLVE' || name.startsWith('SOLVE') || originalName.toLowerCase().startsWith('solve')) {
            console.log('🔍 [extractFunctionName] Found function from all matches:', originalName, '->', 'SOLVE');
            return 'SOLVE';
        }
        // Check for N-Queen variations
        if (name === 'NQUEEN' || name === 'N_QUEEN') {
            console.log('🔍 [extractFunctionName] Found function from all matches:', originalName, '->', 'NQUEEN');
            return 'NQUEEN';
        }

        // Check for maxCapacity variations
        if (name === 'MAXCAPACITY' || name.startsWith('MAXCAPACITY') || name === 'MAX_CAPACITY' || originalName.toLowerCase() === 'maxcapacity') {
            console.log('🔍 [extractFunctionName] Found function from all matches:', originalName, '->', 'MAXCAPACITY');
            return 'MAXCAPACITY';
        }
        for (const algoName of algorithmNames) {
            if (name.startsWith(algoName)) {
                console.log('🔍 [extractFunctionName] Found function from all matches:', originalName, '->', algoName);
                return algoName; // Return the base name without numbers
            }
        }
    }

    console.log('🔍 [extractFunctionName] No function name found');
    return null;
}
