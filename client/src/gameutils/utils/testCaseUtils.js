/**
 * Test Case Utilities
 * สำหรับตรวจสอบ return value ของ function กับ test cases
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
  console.log('🔍 [extractFunctionName] Code preview:', code.substring(0, 500));
  
  // Look for function calls: DFS(...), BFS(...), DIJ(...), PRIM(...), KRUSKAL(...), KNAPSACK(...), subsetSum(...), coinChange(...), solve(...)
  // Try multiple patterns to match different code generation styles
  const functionPatterns = [
    // Blockly generator format: (await DFS(...)) or var path = (await DFS(...))
    /(?:var\s+\w+\s*=\s*)?\(?\s*await\s+(DFS|BFS|DIJ|PRIM|KRUSKAL|KNAPSACK|subsetSum|SUBSETSUM|SUBSET_SUM|coinChange|COINCHANGE|COIN_CHANGE|solve|SOLVE|NQUEEN|N_QUEEN)\s*\(/i,
    // Standard: var path = DFS(...) or path = DFS(...)
    /(?:var\s+\w+\s*=\s*)?(?:await\s+)?(DFS|BFS|DIJ|PRIM|KRUSKAL|KNAPSACK|subsetSum|SUBSETSUM|SUBSET_SUM|coinChange|COINCHANGE|COIN_CHANGE|solve|SOLVE|NQUEEN|N_QUEEN)\s*\(/i,
    // Assignment: result = DFS(...) or path = DFS(...)
    /\w+\s*=\s*(?:await\s+)?(?:\(?\s*await\s+)?(DFS|BFS|DIJ|PRIM|KRUSKAL|KNAPSACK|subsetSum|SUBSETSUM|SUBSET_SUM|coinChange|COINCHANGE|COIN_CHANGE|solve|SOLVE|NQUEEN|N_QUEEN)\s*\(/i,
    // Direct call: DFS(...) or await DFS(...)
    /(?:await\s+)?(DFS|BFS|DIJ|PRIM|KRUSKAL|KNAPSACK|subsetSum|SUBSETSUM|SUBSET_SUM|coinChange|COINCHANGE|COIN_CHANGE|solve|SOLVE|NQUEEN|N_QUEEN)\s*\(/i,
    // Function definition: function DFS(...) or async function DFS(...)
    /(?:async\s+)?function\s+(DFS|BFS|DIJ|PRIM|KRUSKAL|KNAPSACK|subsetSum|SUBSETSUM|SUBSET_SUM|coinChange|COINCHANGE|COIN_CHANGE|solve|SOLVE|NQUEEN|N_QUEEN)\s*\(/i,
    // Arrow function: const DFS = (...) => or const DFS = async (...) =>
    /(?:const|let|var)\s+(DFS|BFS|DIJ|PRIM|KRUSKAL|KNAPSACK|subsetSum|SUBSETSUM|SUBSET_SUM|coinChange|COINCHANGE|COIN_CHANGE|solve|SOLVE|NQUEEN|N_QUEEN)\s*=\s*(?:async\s+)?\(/i
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
      if (functionName === 'SOLVE' || functionName === 'NQUEEN' || functionName === 'N_QUEEN' || match[1].toLowerCase() === 'solve') {
        functionName = 'NQUEEN';
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
        const algorithmNames = ['DFS', 'BFS', 'DIJ', 'PRIM', 'KRUSKAL', 'KNAPSACK', 'SUBSETSUM', 'SUBSET_SUM', 'COINCHANGE', 'COIN_CHANGE', 'NQUEEN', 'N_QUEEN', 'SOLVE'];
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
        // Check for solve/N-Queen variations (solve, Solve, SOLVE, solve2, solve3, etc.)
        if (name === 'SOLVE' || name.startsWith('SOLVE') || name === 'NQUEEN' || name === 'N_QUEEN' || originalName.toLowerCase().startsWith('solve')) {
          console.log('🔍 [extractFunctionName] Found function from all matches:', originalName, '->', 'NQUEEN');
          return 'NQUEEN';
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

/**
 * Compare actual output with expected output based on comparison type
 * @param {*} actual - Actual return value
 * @param {*} expected - Expected return value
 * @param {string} comparisonType - Type of comparison: "exact", "array_equals", "number_equals", "contains"
 * @returns {boolean} - True if match, false otherwise
 */
export function compareOutput(actual, expected, comparisonType = 'exact') {
  console.log('🔍     [compareOutput] Comparing:', {
    actual: JSON.stringify(actual),
    expected: JSON.stringify(expected),
    comparisonType
  });
  
  let result = false;
  
  switch (comparisonType) {
    case 'exact':
      // For boolean values, normalize and compare
      // Handle both boolean and JSONB boolean (which might be stored as boolean or string)
      let normalizedActual = actual;
      let normalizedExpected = expected;
      
      // Normalize boolean values
      if (actual === 'true' || actual === true) normalizedActual = true;
      else if (actual === 'false' || actual === false) normalizedActual = false;
      
      if (expected === 'true' || expected === true) normalizedExpected = true;
      else if (expected === 'false' || expected === false) normalizedExpected = false;
      
      // If both are booleans (after normalization), compare directly
      if (typeof normalizedActual === 'boolean' && typeof normalizedExpected === 'boolean') {
        result = normalizedActual === normalizedExpected;
        console.log('🔍     [compareOutput] Boolean comparison:', { 
          actual, expected, 
          normalizedActual, normalizedExpected, 
          result 
        });
      } else {
        // Use JSON.stringify for other types
      result = JSON.stringify(actual) === JSON.stringify(expected);
        console.log('🔍     [compareOutput] Exact comparison (JSON):', {
          actualStr: JSON.stringify(actual),
          expectedStr: JSON.stringify(expected),
          result
        });
      }
      break;
    
    case 'array_equals':
      // Compare arrays element by element
      if (!Array.isArray(actual) || !Array.isArray(expected)) {
        console.log('🔍     [compareOutput] Array comparison failed: one is not an array', {
          actualIsArray: Array.isArray(actual),
          expectedIsArray: Array.isArray(expected)
        });
        result = false;
        break;
      }
      if (actual.length !== expected.length) {
        console.log('🔍     [compareOutput] Array length mismatch:', {
          actualLength: actual.length,
          expectedLength: expected.length
        });
        result = false;
        break;
      }
      result = actual.every((val, idx) => {
        const match = val === expected[idx];
        if (!match) {
          console.log(`🔍     [compareOutput] Element mismatch at index ${idx}:`, {
            actual: val,
            expected: expected[idx]
          });
        }
        return match;
      });
      console.log('🔍     [compareOutput] Array comparison:', result);
      break;
    
    case 'number_equals':
      // Compare numbers (allow for floating point differences)
      const actualNum = Number(actual);
      const expectedNum = Number(expected);
      result = !isNaN(actualNum) && !isNaN(expectedNum) && actualNum === expectedNum;
      console.log('🔍     [compareOutput] Number comparison:', {
        actualNum,
        expectedNum,
        result
      });
      break;
    
    case 'contains':
      // Check if expected is contained in actual (for arrays)
      if (Array.isArray(actual) && Array.isArray(expected)) {
        result = expected.every(item => actual.includes(item));
        console.log('🔍     [compareOutput] Contains comparison:', result);
      } else {
        result = false;
        console.log('🔍     [compareOutput] Contains comparison failed: not arrays');
      }
      break;
    
    default:
      console.warn('⚠️ Unknown comparison type:', comparisonType);
      result = JSON.stringify(actual) === JSON.stringify(expected);
      console.log('🔍     [compareOutput] Default (exact) comparison:', result);
  }
  
  return result;
}

/**
 * Check function return value against test cases
 * @param {*} functionReturnValue - Return value from executed function (for primary test case only)
 * @param {Array} testCases - Array of test cases from level
 * @param {string} functionName - Name of the function that was called
 * @param {string} code - The Blockly generated code (to extract function definition)
 * @param {Object} gameFunctions - Game functions to pass to the function
 * @param {Object} graphMap - The graph map to pass as first parameter
 * @param {Array} allNodes - All nodes array for Prim's algorithm
 * @returns {Object} - { passed: boolean, passedTests: Array, failedTests: Array, message: string }
 */
export async function checkTestCases(functionReturnValue, testCases, functionName, code, gameFunctions, graphMap, allNodes) {
  console.log('🔍 checkTestCases called:', {
    functionReturnValue,
    testCasesCount: testCases?.length,
    functionName
  });
  
  // DEBUG: Check if code has recursive case for N-Queen
  if (functionName === 'NQUEEN' || functionName === 'nQueen' || code.includes('async function solve')) {
    // Find the solve function in the code
    const solveFuncMatch = code.match(/async\s+function\s+solve\d*\s*\([^)]*\)\s*\{/);
    if (solveFuncMatch) {
      const funcStartIndex = solveFuncMatch.index;
      const funcStartBraceIndex = code.indexOf('{', funcStartIndex);
      
      // Count braces to find the complete function
      let braceCount = 1;
      let funcEndIndex = funcStartBraceIndex + 1;
      for (let i = funcStartBraceIndex + 1; i < code.length; i++) {
        if (code[i] === '{') braceCount++;
        if (code[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            funcEndIndex = i + 1;
            break;
          }
        }
      }
      
      const fullSolveFunction = code.substring(funcStartIndex, funcEndIndex);
      const hasRecursiveCase = fullSolveFunction.includes('for (let col') || 
                              (fullSolveFunction.indexOf('const fromValue = 0;', fullSolveFunction.indexOf('return solution')) !== -1);
      
      console.log('🔍 [checkTestCases] Full code has recursive case:', hasRecursiveCase);
      console.log('🔍 [checkTestCases] Full solve function length:', fullSolveFunction.length);
      if (!hasRecursiveCase) {
        console.warn('⚠️ [checkTestCases] WARNING: Full code missing recursive case!');
        console.warn('⚠️ [checkTestCases] Full solve function (first 1000):', fullSolveFunction.substring(0, 1000));
        console.warn('⚠️ [checkTestCases] Full solve function (last 1000):', fullSolveFunction.substring(Math.max(0, fullSolveFunction.length - 1000)));
      }
    }
  }
  
  if (!testCases || testCases.length === 0) {
    console.log('⚠️ No test cases provided');
    return {
      passed: true,
      passedTests: [],
      failedTests: [],
      message: 'ไม่มี test cases สำหรับตรวจสอบ'
    };
  }

  // Filter test cases for this function
  const relevantTestCases = testCases.filter(tc => 
    tc.function_name && tc.function_name.toUpperCase() === functionName?.toUpperCase()
  );

  console.log('🔍 Relevant test cases:', {
    total: testCases.length,
    relevant: relevantTestCases.length,
    functionName,
    testCaseFunctionNames: testCases.map(tc => tc.function_name)
  });

  if (relevantTestCases.length === 0) {
    console.log('⚠️ No relevant test cases found for function:', functionName);
    return {
      passed: true,
      passedTests: [],
      failedTests: [],
      message: `ไม่มี test cases สำหรับ function: ${functionName}`
    };
  }

  const passedTests = [];
  const failedTests = [];

  // Check each test case
  console.log('🔍 ===== Checking Test Cases =====');
  console.log('🔍 Total test cases to check:', relevantTestCases.length);
  console.log('🔍 Function return value (primary):', functionReturnValue);
  console.log('🔍 Function return value type:', typeof functionReturnValue);
  console.log('🔍 Function return value is array:', Array.isArray(functionReturnValue));
  
  // Extract function definition from code
  const functionDefMatch = code.match(/async\s+function\s+(\w+)\s*\([^)]*\)\s*\{[\s\S]*?\n\}/);
  const hasFunctionDef = !!functionDefMatch;
  console.log('🔍 Has function definition in code:', hasFunctionDef);
  
  for (const testCase of relevantTestCases) {
    console.log(`\n🔍 --- Checking ${testCase.test_case_name} (ID: ${testCase.test_case_id}) ---`);
    console.log('🔍   is_primary:', testCase.is_primary);
    console.log('🔍   function_name:', testCase.function_name);
    console.log('🔍   input_params:', testCase.input_params);
    
    let actual;
    
    // Primary test case: use return value from the code that was already executed (with visual feedback)
    if (testCase.is_primary) {
      actual = functionReturnValue;
      console.log('🔍   Using primary return value (from executed code):', actual);
    } 
    // Secondary test cases: call the function with different parameters (no visual feedback)
    else if (hasFunctionDef && gameFunctions && graphMap !== undefined) {
      console.log('🔍   Calling function with test case parameters (no visual feedback)...');
      try {
        // Extract function name from code (might be DFS, DFS2, etc.)
        // For N-Queen, prioritize finding 'solve' function over helper functions (safe, place, remove)
        let actualFuncName = functionName;
        if (functionName === 'NQUEEN') {
          // For N-Queen, look specifically for 'solve' function
          const solveFuncMatch = code.match(/(?:async\s+function\s+|function\s+)(solve\d*)\s*\(/);
          if (solveFuncMatch) {
            actualFuncName = solveFuncMatch[1];
            console.log('🔍   Found solve function for N-Queen:', actualFuncName);
          } else {
            // Fallback to general pattern
            const funcNameMatch = code.match(/(?:async\s+function\s+|function\s+)(\w+)\s*\(/);
            actualFuncName = funcNameMatch ? funcNameMatch[1] : functionName;
            console.log('🔍   Using fallback function name:', actualFuncName);
          }
        } else {
          // For other functions, use the first match
        const funcNameMatch = code.match(/(?:async\s+function\s+|function\s+)(\w+)\s*\(/);
          actualFuncName = funcNameMatch ? funcNameMatch[1] : functionName;
        }
        console.log('🔍   Actual function name in code:', actualFuncName);
        
        // Build function call with test case parameters
        const inputParams = testCase.input_params || {};
        
        // Handle different function parameter patterns
        // For graph algorithms (DFS, BFS, etc.): (graph, start, goal)
        const startParam = inputParams.start !== undefined ? inputParams.start : 0;
        const goalParam = inputParams.goal !== undefined ? inputParams.goal : 3;
        const graphParam = inputParams.graph || 'map';
        
        // For knapsack: (w, v, i, j)
        const wParam = inputParams.w !== undefined ? JSON.stringify(inputParams.w) : '[]';
        const vParam = inputParams.v !== undefined ? JSON.stringify(inputParams.v) : '[]';
        const iParam = inputParams.i !== undefined ? inputParams.i : 0;
        const jParam = inputParams.j !== undefined ? inputParams.j : 0;
        
        // For subsetSum: (arr, index, sum, target_sum)
        const arrParam = inputParams.arr !== undefined ? JSON.stringify(inputParams.arr) : '[]';
        const indexParam = inputParams.index !== undefined ? inputParams.index : 0;
        const sumParam = inputParams.sum !== undefined ? inputParams.sum : 0;
        const targetSumParam = inputParams.target_sum !== undefined ? inputParams.target_sum : 0;
        
        // For coinChange: (amount, coins, index)
        const amountParam = inputParams.amount !== undefined ? inputParams.amount : 0;
        const coinsParam = inputParams.coins !== undefined ? JSON.stringify(inputParams.coins) : '[1, 5, 10, 25]';
        const coinIndexParam = inputParams.index !== undefined ? inputParams.index : 0;
        
        // For NQUEEN (solve): (row) or (n, row)
        const nParam = inputParams.n !== undefined ? inputParams.n : 4;
        const rowParam = inputParams.row !== undefined ? inputParams.row : 0;
        
        console.log('🔍   Test case parameters:', { 
          start: startParam, 
          goal: goalParam, 
          graph: graphParam,
          w: wParam,
          v: vParam,
          i: iParam,
          j: jParam,
          arr: arrParam,
          index: indexParam,
          sum: sumParam,
          target_sum: targetSumParam
        });
        
        // Create a code snippet that calls the function with test parameters
        // We'll execute just the function call without visual feedback
        // Extract only the function definition (match the entire function including closing brace)
        // CRITICAL: Need to match the complete function body by counting braces
        let functionDefinition = '';
        
        // Find the start of the function - try multiple patterns
        // Pattern 1: async function NAME(params) {
        let funcStartPattern = new RegExp(`async\\s+function\\s+${actualFuncName}\\s*\\([^)]*\\)\\s*\\{`, 'm');
        let funcStartMatch = code.match(funcStartPattern);
        
        // Pattern 2: async function NAME() { (no parameters)
        if (!funcStartMatch) {
          funcStartPattern = new RegExp(`async\\s+function\\s+${actualFuncName}\\s*\\(\\)\\s*\\{`, 'm');
          funcStartMatch = code.match(funcStartPattern);
        }
        
        // Pattern 3: function NAME(params) { (no async)
        if (!funcStartMatch) {
          funcStartPattern = new RegExp(`function\\s+${actualFuncName}\\s*\\([^)]*\\)\\s*\\{`, 'm');
          funcStartMatch = code.match(funcStartPattern);
        }
        
        if (funcStartMatch) {
          const startIndex = funcStartMatch.index;
          const startBraceIndex = code.indexOf('{', startIndex);
          
          // Extract parameter list from the match
          const fullMatch = funcStartMatch[0];
          const paramMatch = fullMatch.match(/\(([^)]*)\)/);
          const extractedParams = paramMatch ? paramMatch[1] : '';
          console.log('🔍   Extracted parameters from pattern:', extractedParams);
          
          // DEBUG: Check if code has recursive case BEFORE extraction
          const codeAfterStart = code.substring(startBraceIndex);
          const hasRecursiveCaseInCode = codeAfterStart.includes('for (let col');
          console.log('🔍   Code has recursive case (for col) BEFORE extraction:', hasRecursiveCaseInCode);
          
          // Count braces to find the matching closing brace
          // CRITICAL FIX: Start from 0, count opening brace first, then find closing brace
          // This ensures we stop at the function's closing brace, not a nested block's closing brace
          let braceCount = 0;
          let endIndex = startBraceIndex;
          let debugBraces = []; // Track brace positions for debugging
          
          for (let i = startBraceIndex; i < code.length; i++) {
            if (code[i] === '{') {
              braceCount++;
              debugBraces.push({ pos: i, char: '{', count: braceCount, context: code.substring(Math.max(0, i-30), Math.min(code.length, i+50)) });
            } else if (code[i] === '}') {
              braceCount--;
              const context = code.substring(Math.max(0, i-30), Math.min(code.length, i+50));
              debugBraces.push({ pos: i, char: '}', count: braceCount, context });
              
              if (braceCount === 0) {
                endIndex = i + 1;
                console.log('[testCaseUtils] 🔍 Stopped at brace #', debugBraces.length, 'at position', i);
                console.log('[testCaseUtils] 🔍 Context at stop position:', context);
                console.log('[testCaseUtils] 🔍 Last 10 braces:', debugBraces.slice(-10).map(b => ({ pos: b.pos, char: b.char, count: b.count })));
                break;
              }
            }
          }
          
          console.log('[testCaseUtils] 🔍 Total braces processed:', debugBraces.length);
          console.log('[testCaseUtils] 🔍 Brace counting result:', {
            startBraceIndex,
            endIndex,
            length: endIndex - startIndex,
            totalBraces: debugBraces.length
          });
          
          if (endIndex > startBraceIndex) {
            functionDefinition = code.substring(startIndex, endIndex);
            console.log('🔍   Extracted function definition (length:', functionDefinition.length, ')');
            
            // Verify we got recursive case (for debugging)
            if (actualFuncName === 'solve' || actualFuncName.includes('solve')) {
              const hasRecursiveCase = functionDefinition.includes('for (let col') || functionDefinition.includes('const fromValue = 0');
              console.log('🔍   Function definition has recursive case:', hasRecursiveCase);
            }
            
            // Check if function definition has parameters
            const funcParamMatch = functionDefinition.match(/async\s+function\s+\w+\s*\(([^)]*)\)/);
            const funcParams = funcParamMatch ? funcParamMatch[1] : '';
            console.log('🔍   Function definition parameters:', funcParams);
            
            // If function definition doesn't have parameters but function body uses start/goal/garph,
            // we need to add them
            if (!funcParams || funcParams.trim() === '') {
              // Check what variables the function body uses
              const usesStart = functionDefinition.includes('start') && !functionDefinition.match(/var\s+start|let\s+start|const\s+start/);
              const usesGoal = functionDefinition.includes('goal') && !functionDefinition.match(/var\s+goal|let\s+goal|const\s+goal/);
              const usesGarph = functionDefinition.includes('garph') && !functionDefinition.match(/var\s+garph|let\s+garph|const\s+garph/);
              const usesGraph = functionDefinition.includes('graph') && !functionDefinition.match(/var\s+graph|let\s+graph|const\s+graph/);
              
              console.log('🔍   Function body uses variables:', { usesStart, usesGoal, usesGarph, usesGraph });
              
              if (usesStart || usesGoal || usesGarph || usesGraph) {
                // Reconstruct function with parameters
                const params = [];
                if (usesGarph || usesGraph) params.push('garph');
                if (usesStart) params.push('start');
                if (usesGoal) params.push('goal');
                
                if (params.length > 0) {
                  const paramsString = params.join(', ');
                  // Replace function signature
                  functionDefinition = functionDefinition.replace(
                    /async\s+function\s+\w+\s*\([^)]*\)/,
                    `async function ${actualFuncName}(${paramsString})`
                  );
                  console.log('🔍   Fixed function definition with parameters:', paramsString);
                }
              }
            }
          } else {
            console.warn('🔍   Could not find matching closing brace for function');
          }
        }
        
        // Fallback: Try simpler pattern if brace counting didn't work
        if (!functionDefinition) {
          console.log('🔍   Trying fallback pattern...');
          const funcDefPattern = new RegExp(`(async\\s+function\\s+${actualFuncName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\})`, 'm');
          let funcDefMatch = code.match(funcDefPattern);
          functionDefinition = funcDefMatch ? funcDefMatch[1] : '';
          
          if (!functionDefinition) {
            // Try even more flexible - match until the end of function
            const flexiblePattern = new RegExp(`(async\\s+function\\s+${actualFuncName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?return\\s+[^;]+;?[\\s\\S]*?\\})`, 'm');
            funcDefMatch = code.match(flexiblePattern);
            functionDefinition = funcDefMatch ? funcDefMatch[1] : '';
          }
        }
        
        if (!functionDefinition) {
          console.warn('🔍   Could not extract function definition, skipping test case execution');
          console.warn('🔍   Code preview:', code.substring(0, 1000));
          actual = undefined;
        } else {
          // Extract parameter names from function definition to understand the order
          const paramMatch = functionDefinition.match(/async\s+function\s+\w+\s*\(([^)]*)\)/);
          const paramNames = paramMatch ? paramMatch[1].split(',').map(p => p.trim()) : [];
          console.log('🔍   Function parameters:', paramNames);
          console.log('🔍   Function definition preview (first 200 chars):', functionDefinition.substring(0, 200));
          console.log('🔍   Function definition preview (last 200 chars):', functionDefinition.substring(Math.max(0, functionDefinition.length - 200)));
          
          // Check if function definition is complete (has matching braces)
          const openBraces = (functionDefinition.match(/\{/g) || []).length;
          const closeBraces = (functionDefinition.match(/\}/g) || []).length;
          console.log('🔍   Function definition braces:', { open: openBraces, close: closeBraces });
          
          if (openBraces !== closeBraces) {
            console.warn('🔍   WARNING: Function definition has mismatched braces!');
            console.warn('🔍   Attempting to fix by finding the correct closing brace...');
            
            // Try to find the correct closing brace
            const funcStartPattern = new RegExp(`async\\s+function\\s+${actualFuncName}\\s*\\([^)]*\\)\\s*\\{`, 'm');
            const funcStartMatch = code.match(funcStartPattern);
            
            if (funcStartMatch) {
              const startIndex = funcStartMatch.index;
              const startBraceIndex = code.indexOf('{', startIndex);
              
              // Count braces to find the matching closing brace
              let braceCount = 0;
              let endIndex = startBraceIndex;
              
              for (let i = startBraceIndex; i < code.length; i++) {
                if (code[i] === '{') {
                  braceCount++;
                } else if (code[i] === '}') {
                  braceCount--;
                  if (braceCount === 0) {
                    endIndex = i + 1;
                    break;
                  }
                }
              }
              
              if (endIndex > startBraceIndex) {
                functionDefinition = code.substring(startIndex, endIndex);
                console.log('🔍   Fixed function definition (length:', functionDefinition.length, ')');
                
                // Re-check braces
                const newOpenBraces = (functionDefinition.match(/\{/g) || []).length;
                const newCloseBraces = (functionDefinition.match(/\}/g) || []).length;
                console.log('🔍   Fixed function definition braces:', { open: newOpenBraces, close: newCloseBraces });
              }
            }
          }
          
          // Verify function definition has parameters
          if (!functionDefinition.includes('(') || !functionDefinition.includes(')')) {
            console.warn('🔍   WARNING: Function definition missing parameter list!');
          }
          
          // Check if function uses 'start' variable
          if (functionDefinition.includes('start') && !paramNames.includes('start')) {
            console.warn('🔍   WARNING: Function uses "start" but it\'s not in parameter list!');
            console.warn('🔍   Parameters found:', paramNames);
          }
          
          // Determine which parameter is which based on common patterns
          // DFS typically has: (garph/graph, start, goal)
          // Knapsack has: (w, v, i, j)
          // SubsetSum has: (arr, index, sum, target_sum)
          // CoinChange has: (amount, coins, index)
          let graphParamName = 'map';
          let startParamName = 'start';
          let goalParamName = 'goal';
          let isKnapsack = false;
          let isSubsetSum = false;
          let isCoinChange = false;
          let isNQueen = false;
          
          // Check if this is a coinChange function (parameters are amount, coins, index)
          if (paramNames.length === 3 && paramNames.includes('amount') && paramNames.includes('coins') && paramNames.includes('index')) {
            isCoinChange = true;
            console.log('🔍   Detected coinChange function with parameters:', paramNames);
          } else if (paramNames.length === 4 && paramNames.includes('arr') && paramNames.includes('index') && paramNames.includes('sum') && paramNames.includes('target_sum')) {
            isSubsetSum = true;
            console.log('🔍   Detected subsetSum function with parameters:', paramNames);
          } else if (paramNames.length === 4 && paramNames.includes('w') && paramNames.includes('v') && paramNames.includes('i') && paramNames.includes('j')) {
            isKnapsack = true;
            console.log('🔍   Detected knapsack function with parameters:', paramNames);
          } else if (paramNames.length === 1 && paramNames.includes('row')) {
            isNQueen = true;
            console.log('🔍   Detected NQUEEN (solve) function with parameters:', paramNames);
          } else {
            // Graph algorithm pattern
          if (paramNames.length >= 1) {
            // First parameter is usually graph (might be named "garph", "graph", or "map")
            graphParamName = paramNames[0];
          }
          if (paramNames.length >= 2) {
            startParamName = paramNames[1];
          }
          if (paramNames.length >= 3) {
            goalParamName = paramNames[2];
            }
          }
          
          console.log('🔍   Using parameters:', { graphParamName, startParamName, goalParamName, isKnapsack, isSubsetSum, isCoinChange, isNQueen });
          
          // Only include the function definition, no other code (no moveAlongPath, no variable declarations)
          // CRITICAL: Pass parameters in the correct order and ensure variables are available
          // The function definition should already have the parameters defined, so we just need to call it
          let testCode = '';
          if (isCoinChange) {
            // For coinChange: call with (amount, coins, index) parameters
            testCode = `
              ${functionDefinition}
              // Call coinChange function with test case parameters (no visual feedback)
              var testResult = await ${actualFuncName}(${amountParam}, ${coinsParam}, ${coinIndexParam});
              return testResult;
            `;
          } else if (isSubsetSum) {
            // For subsetSum: call with (arr, index, sum, target_sum) parameters
            testCode = `
              ${functionDefinition}
              // Call subsetSum function with test case parameters (no visual feedback)
              var testResult = await ${actualFuncName}(${arrParam}, ${indexParam}, ${sumParam}, ${targetSumParam});
              return testResult;
            `;
          } else if (isKnapsack) {
            // For knapsack: call with (w, v, i, j) parameters
            testCode = `
              ${functionDefinition}
              // Call knapsack function with test case parameters (no visual feedback)
              var testResult = await ${actualFuncName}(${wParam}, ${vParam}, ${iParam}, ${jParam});
              return testResult;
            `;
          } else if (isNQueen || functionName?.toUpperCase() === 'NQUEEN') {
            // For NQUEEN (solve): call with (row) parameter
            // CRITICAL: Inject helper functions (safe, place, remove) and board array
            const nValue = inputParams.n !== undefined ? inputParams.n : 4;
            const nqueenHelperFunctions = `
              // Initialize N-Queen variables and helper functions
              var n = ${nValue};
              
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
                // Check column
                for (var i = 0; i < row; i++) {
                  if (board[i][col] === 1) {
                    return false;
                  }
                }
                
                // Check upper-left diagonal
                for (var i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
                  if (board[i][j] === 1) {
                    return false;
                  }
                }
                
                // Check upper-right diagonal
                for (var i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
                  if (board[i][j] === 1) {
                    return false;
                  }
                }
                
                return true;
              }
              
              // Helper function: Place queen at (row, col)
              async function place(row, col) {
                board[row][col] = 1;
              }
              
              // Helper function: Remove queen from (row, col)
              async function remove(row, col) {
                board[row][col] = 0;
              }
            `;
            
            // CRITICAL: Fix N-Queen function definition - replace solve(row, col) with safe/place/remove
            // Use simple sequential string replacement - much more reliable than complex regex
            let fixedFunctionDefinition = functionDefinition;
            
            console.log('[testCaseUtils] 🔍 Original function definition length:', fixedFunctionDefinition.length);
            
            // Step 1: Replace if ((await solve(row, col))) -> if ((await safe(row, col)))
            let count1 = 0;
            fixedFunctionDefinition = fixedFunctionDefinition.replace(/if\s*\(\s*\(\s*await\s+solve\d*\s*\(\s*row\s*,\s*col\s*\)/g, (match) => {
              count1++;
              console.log(`[testCaseUtils] 🔧 [${count1}] Replacing if condition: solve -> safe`);
              return match.replace(/solve\d*/, 'safe');
            });
            
            // Step 2: Replace if (await solve(row, col)) -> if (await safe(row, col))
            let count2 = 0;
            fixedFunctionDefinition = fixedFunctionDefinition.replace(/if\s*\(\s*await\s+solve\d*\s*\(\s*row\s*,\s*col\s*\)/g, (match) => {
              if (!match.includes('safe')) {
                count2++;
                console.log(`[testCaseUtils] 🔧 [${count2}] Replacing if condition (single paren): solve -> safe`);
                return match.replace(/solve\d*/, 'safe');
              }
              return match;
            });
            
            // Step 3: Replace else { ... await solve(row, col); ... } -> else { ... await remove(row, col); ... }
            // Process from end to start to find else blocks and replace solve calls inside them
            let count3 = 0;
            let searchIndex = fixedFunctionDefinition.length;
            while (searchIndex >= 0) {
              const lastElseIndex = fixedFunctionDefinition.lastIndexOf('else', searchIndex);
              if (lastElseIndex === -1) break;
              
              // Find the opening brace after "else"
              const openBraceIndex = fixedFunctionDefinition.indexOf('{', lastElseIndex);
              if (openBraceIndex === -1) {
                searchIndex = lastElseIndex - 1;
                continue;
              }
              
              // Find the matching closing brace
              let braceCount = 1;
              let closeBraceIndex = openBraceIndex + 1;
              while (closeBraceIndex < fixedFunctionDefinition.length && braceCount > 0) {
                if (fixedFunctionDefinition[closeBraceIndex] === '{') braceCount++;
                else if (fixedFunctionDefinition[closeBraceIndex] === '}') braceCount--;
                closeBraceIndex++;
              }
              
              if (braceCount === 0) {
                // Found a complete else block
                const elseBlock = fixedFunctionDefinition.substring(lastElseIndex, closeBraceIndex);
                if (elseBlock.includes('solve') && !elseBlock.includes('remove') && !elseBlock.includes('safe') && !elseBlock.includes('place')) {
                  const fixedElseBlock = elseBlock.replace(/solve\d*\s*\(\s*row\s*,\s*col\s*\)/g, (match) => {
                    count3++;
                    console.log(`[testCaseUtils] 🔧 [${count3}] Replacing in else block: solve -> remove`);
                    return match.replace(/solve\d*/, 'remove');
                  });
                  fixedFunctionDefinition = fixedFunctionDefinition.substring(0, lastElseIndex) + 
                                          fixedElseBlock + 
                                          fixedFunctionDefinition.substring(closeBraceIndex);
                }
              }
              
              searchIndex = lastElseIndex - 1;
            }
            
            // Step 4: Replace remaining await solve(row, col); -> await place(row, col);
            let count4 = 0;
            fixedFunctionDefinition = fixedFunctionDefinition.replace(/await\s+solve\d*\s*\(\s*row\s*,\s*col\s*\)\s*;/g, (match) => {
              if (!match.includes('safe') && !match.includes('place') && !match.includes('remove')) {
                count4++;
                console.log(`[testCaseUtils] 🔧 [${count4}] Replacing statement: solve -> place`);
                return match.replace(/solve\d*/, 'place');
              }
              return match;
            });
            
            const totalReplacements = count1 + count2 + count3 + count4;
            console.log(`[testCaseUtils] ✅ Total replacements: ${totalReplacements}`);
            
            // Verify replacements
            const remainingSolveCalls = (fixedFunctionDefinition.match(/solve\d*\s*\(\s*row\s*,\s*col\s*\)/g) || []).length;
            const safeCalls = (fixedFunctionDefinition.match(/safe\s*\(\s*row\s*,\s*col\s*\)/g) || []).length;
            const placeCalls = (fixedFunctionDefinition.match(/place\s*\(\s*row\s*,\s*col\s*\)/g) || []).length;
            const removeCalls = (fixedFunctionDefinition.match(/remove\s*\(\s*row\s*,\s*col\s*\)/g) || []).length;
            
            console.log('[testCaseUtils] 🔍 Verification:', {
              remainingSolveCalls,
              safeCalls,
              placeCalls,
              removeCalls
            });
            
            if (remainingSolveCalls > 0) {
              console.warn('[testCaseUtils] ⚠️ WARNING: Still have', remainingSolveCalls, 'solve(row, col) calls that were not replaced!');
              console.warn('[testCaseUtils] Function definition snippet:', fixedFunctionDefinition.substring(0, 2000));
            }
            
            // Add simple logging - just log the fixed function definition to see what we have
            console.log('[testCaseUtils] 🔍 Fixed function definition length:', fixedFunctionDefinition.length);
            console.log('[testCaseUtils] 🔍 Fixed function definition (first 1500 chars):', fixedFunctionDefinition.substring(0, 1500));
            console.log('[testCaseUtils] 🔍 Fixed function definition (last 1500 chars):', fixedFunctionDefinition.substring(Math.max(0, fixedFunctionDefinition.length - 1500)));
            
            // CRITICAL: Check if recursive case exists and where it is
            // Find the recursive case by looking for "for (let col" AFTER the base case
            // Base case ends with "return solution;" or closing braces
            const baseCaseEndIndex = fixedFunctionDefinition.indexOf('return solution;');
            const recursiveCaseIndex = baseCaseEndIndex !== -1 
              ? fixedFunctionDefinition.indexOf('const fromValue = 0;', baseCaseEndIndex)
              : fixedFunctionDefinition.indexOf('const fromValue = 0;');
            const forColIndex = baseCaseEndIndex !== -1
              ? fixedFunctionDefinition.indexOf('for (let col', baseCaseEndIndex)
              : fixedFunctionDefinition.indexOf('for (let col');
            
            console.log('[testCaseUtils] 🔍 Recursive case check:', {
              baseCaseEndIndex: baseCaseEndIndex,
              hasConstFromValueAfterBase: recursiveCaseIndex !== -1,
              constFromValueIndex: recursiveCaseIndex,
              hasForCol: forColIndex !== -1,
              forColIndex: forColIndex,
              functionLength: fixedFunctionDefinition.length
            });
            
            // Check if we're missing recursive case
            if (forColIndex === -1 && recursiveCaseIndex === -1) {
              console.error('[testCaseUtils] ❌ ERROR: Recursive case is MISSING from function definition!');
              console.error('[testCaseUtils] ❌ Full function definition:', fixedFunctionDefinition);
            } else if (recursiveCaseIndex !== -1) {
              // Show the code around recursive case
              const contextStart = Math.max(0, recursiveCaseIndex - 200);
              const contextEnd = Math.min(fixedFunctionDefinition.length, recursiveCaseIndex + 800);
              console.log('[testCaseUtils] 🔍 Recursive case context (1000 chars):', fixedFunctionDefinition.substring(contextStart, contextEnd));
              
              // Check for solve(row, col) patterns in recursive case
              const recursiveCaseCode = fixedFunctionDefinition.substring(recursiveCaseIndex);
              const solveRowColPattern = recursiveCaseCode.match(/solve\d*\s*\(\s*row\s*,\s*col\s*\)/g);
              console.log('[testCaseUtils] 🔍 solve(row, col) patterns in recursive case:', solveRowColPattern);
            }
            
            // Check if base case exists
            if (!fixedFunctionDefinition.includes('solution = []') && !fixedFunctionDefinition.includes('solution=')) {
              console.warn('[testCaseUtils] ⚠️ WARNING: Base case may not set solution array!');
            }
            
            // Check for return solution - but skip if already in base case from generator
            // The generator should have added it, so we only add if it's completely missing
            const hasReturnSolutionBefore = fixedFunctionDefinition.includes('return solution');
            
            // First, remove any duplicate "return solution" statements, but keep one in base case
            if (hasReturnSolutionBefore) {
              // Count occurrences
              const returnSolutionMatches = fixedFunctionDefinition.match(/return\s+solution\s*;/g);
              if (returnSolutionMatches && returnSolutionMatches.length > 1) {
                console.warn('[testCaseUtils] ⚠️ Found', returnSolutionMatches.length, 'duplicate "return solution" statements, removing duplicates');
                
                // Find all return solution positions
                const matches = [];
                const regex = /return\s+solution\s*;/g;
                let match;
                while ((match = regex.exec(fixedFunctionDefinition)) !== null) {
                  matches.push({ index: match.index, text: match[0] });
                }
                
                // Find where recursive case starts
                const recursiveCaseIndex = fixedFunctionDefinition.indexOf('const fromValue = 0;');
                
                // Find the index of the return solution to keep (first one in base case context)
                let keepIndex = -1;
                for (let i = 0; i < matches.length; i++) {
                  // If recursive case exists, return solution should be before it
                  if (recursiveCaseIndex !== -1) {
                    if (matches[i].index < recursiveCaseIndex) {
                      keepIndex = i;
                      break;
                    }
                  } else {
                    // Otherwise, use the first one
                    keepIndex = 0;
                    break;
                  }
                }
                
                // If no suitable match found in base case, keep the first one
                if (keepIndex === -1) {
                  keepIndex = 0;
                }
                
                // Remove all return solution statements except the one to keep
                let result = fixedFunctionDefinition;
                // Remove from end to start to preserve indices
                for (let i = matches.length - 1; i >= 0; i--) {
                  if (i !== keepIndex) {
                    console.log('[testCaseUtils] 🔧 Removing duplicate return solution at index', matches[i].index);
                    result = result.substring(0, matches[i].index) + result.substring(matches[i].index + matches[i].text.length);
                  } else {
                    console.log('[testCaseUtils] ✅ Keeping return solution at index', matches[i].index);
                  }
                }
                
                fixedFunctionDefinition = result;
                
                // Verify that we still have return solution
                const hasReturnAfterRemoval = fixedFunctionDefinition.includes('return solution');
                console.log('[testCaseUtils] ✅ After removal, has return solution:', hasReturnAfterRemoval);
                if (!hasReturnAfterRemoval) {
                  console.error('[testCaseUtils] ❌ ERROR: return solution was removed completely!');
                }
              }
            }
            
            // Re-check after removing duplicates
            const hasReturnSolutionAfter = fixedFunctionDefinition.includes('return solution');
            const hasReturnSolutionInBaseCase = /if\s*\([^)]*row[^)]*n[^)]*\)\s*\{[\s\S]*?return solution/.test(fixedFunctionDefinition);
            
            if (!hasReturnSolutionAfter || !hasReturnSolutionInBaseCase) {
              console.warn('[testCaseUtils] ⚠️ WARNING: No return solution statement found in base case!');
              
              // CRITICAL FIX: If base case builds solution but doesn't return it, add return statement
              // Strategy: Find where base case ends (solution.push followed by closing braces)
              // and insert "return solution;" before the closing brace of the if block
              
              // Find solution.push location
              const pushIndex = fixedFunctionDefinition.indexOf('solution.push([i, j]);');
              console.log('[testCaseUtils] 🔍 pushIndex:', pushIndex);
              
              if (pushIndex !== -1) {
                // Show context after solution.push for debugging
                const contextAfter = fixedFunctionDefinition.substring(pushIndex, Math.min(fixedFunctionDefinition.length, pushIndex + 200));
                console.log('[testCaseUtils] 🔍 Context after solution.push (200 chars):', contextAfter);
                
                // Find where recursive case starts (const fromValue = 0;)
                const recursiveCaseIndex = fixedFunctionDefinition.indexOf('const fromValue = 0;', pushIndex);
                console.log('[testCaseUtils] 🔍 recursiveCaseIndex:', recursiveCaseIndex);
                
                if (recursiveCaseIndex !== -1) {
                  // The closing brace of base case if block should be right before recursive case
                  // Look backwards from recursiveCaseIndex to find the last closing brace
                  const beforeRecursive = fixedFunctionDefinition.substring(pushIndex, recursiveCaseIndex);
                  console.log('[testCaseUtils] 🔍 beforeRecursive (last 100 chars):', beforeRecursive.substring(Math.max(0, beforeRecursive.length - 100)));
                  
                  // Find the last closing brace before recursive case
                  // We want to insert return solution BEFORE the closing brace of the if block
                  // The pattern is: solution.push ... } } } } (these close: j loop, i loop, if block)
                  // We want to insert BEFORE the last closing brace (if block closing)
                  
                  // Count closing braces from the end
                  let closingBraces = [];
                  for (let i = beforeRecursive.length - 1; i >= 0; i--) {
                    if (beforeRecursive[i] === '}') {
                      closingBraces.push(pushIndex + i);
                    } else if (beforeRecursive[i] !== ' ' && beforeRecursive[i] !== '\n' && beforeRecursive[i] !== '\t' && beforeRecursive[i] !== '\r') {
                      // If we hit a non-whitespace, non-closing-brace character, stop
                      break;
                    }
                  }
                  
                  console.log('[testCaseUtils] 🔍 Found', closingBraces.length, 'closing braces before recursive case');
                  
                  if (closingBraces.length >= 3) {
                    // The last closing brace (index 0) is the if block's closing brace
                    // We want to insert return solution BEFORE it
                    const ifBlockClosingBrace = closingBraces[0];
                    console.log('[testCaseUtils] 🔧 Found base case if block closing brace at index:', ifBlockClosingBrace);
                    console.log('[testCaseUtils] 🔧 Inserting return solution before closing brace');
                    
                    // Check if return solution is already there
                    const beforeBrace = fixedFunctionDefinition.substring(Math.max(0, ifBlockClosingBrace - 50), ifBlockClosingBrace);
                    if (!beforeBrace.includes('return solution')) {
                      fixedFunctionDefinition = fixedFunctionDefinition.substring(0, ifBlockClosingBrace) + 
                                              'return solution;\n' + 
                                              fixedFunctionDefinition.substring(ifBlockClosingBrace);
                      console.log('[testCaseUtils] ✅ Added return solution to base case');
                    } else {
                      console.log('[testCaseUtils] ℹ️ return solution already exists before closing brace');
                    }
                  } else {
                    console.warn('[testCaseUtils] ⚠️ Expected at least 3 closing braces, found:', closingBraces.length);
                  }
                } else {
                  console.warn('[testCaseUtils] ⚠️ Could not find recursive case start (const fromValue = 0;)');
                }
              } else {
                    console.warn('[testCaseUtils] ⚠️ Could not find solution.push([i, j]);');
              }
              
              // Verify that return solution was added
              const hasReturnSolutionAfter = fixedFunctionDefinition.includes('return solution');
              if (hasReturnSolutionAfter) {
                console.log('[testCaseUtils] ✅ Verified: return solution is now in the code');
                
                // Show the section where return solution should be
                const solutionPushIndex2 = fixedFunctionDefinition.indexOf('solution.push([i, j]);');
                if (solutionPushIndex2 !== -1) {
                  const returnSolutionIndex = fixedFunctionDefinition.indexOf('return solution');
                  if (returnSolutionIndex !== -1 && returnSolutionIndex > solutionPushIndex2) {
                    const context = fixedFunctionDefinition.substring(
                      Math.max(0, returnSolutionIndex - 100),
                      Math.min(fixedFunctionDefinition.length, returnSolutionIndex + 100)
                    );
                    console.log('[testCaseUtils] 🔍 Context around return solution:', context);
                  }
                }
              } else {
                console.error('[testCaseUtils] ❌ ERROR: return solution was NOT added despite attempting to add it!');
              }
            } else {
              console.log('[testCaseUtils] ℹ️ return solution already exists in code (no fix needed)');
            }
            
            // Check for return null
            if (fixedFunctionDefinition.includes('return null')) {
              console.warn('[testCaseUtils] ⚠️ WARNING: Function has return null - this may execute before base case!');
            }
            
            testCode = `
              ${nqueenHelperFunctions}
              
              // Initialize solution variable (will be set in base case of solve function)
              var solution = null;
              
              // Override console.log to capture all logs
              const originalLog = console.log;
              const logs = [];
              console.log = function(...args) {
                logs.push(args.join(' '));
                originalLog.apply(console, arguments);
              };
              
              ${fixedFunctionDefinition}
              
              // Call solve function with test case parameters (no visual feedback)
              console.log('[N-Queen Test] ==========================================');
              console.log('[N-Queen Test] Calling solve function');
              console.log('[N-Queen Test] Input: row = ${rowParam}, n = ${nValue}');
              console.log('[N-Queen Test] Before call - n =', n, 'typeof n =', typeof n);
              console.log('[N-Queen Test] Before call - board =', JSON.stringify(board));
              
              try {
                var testResult = await ${actualFuncName}(${rowParam});
                console.log('[N-Queen Test] Function returned:', testResult);
                console.log('[N-Queen Test] Return type:', typeof testResult);
                console.log('[N-Queen Test] Is array:', Array.isArray(testResult));
                if (testResult) {
                  console.log('[N-Queen Test] Return length:', testResult.length);
                  console.log('[N-Queen Test] Return value:', JSON.stringify(testResult));
                } else {
                  console.warn('[N-Queen Test] ⚠️ Function returned null or undefined!');
                  console.warn('[N-Queen Test] ⚠️ This usually means base case was not reached or solveResult was null');
                  console.warn('[N-Queen Test] ⚠️ Final board state:', JSON.stringify(board));
                  console.warn('[N-Queen Test] ⚠️ Final solution variable:', solution);
                }
                console.log('[N-Queen Test] ==========================================');
                return testResult;
              } catch (error) {
                console.error('[N-Queen Test] ❌ Error during execution:', error);
                console.error('[N-Queen Test] Stack:', error.stack);
                throw error;
              }
            `;
          } else {
            // For graph algorithms: call with (map, start, goal) parameters
            testCode = `
            ${functionDefinition}
            // Call function with test case parameters (no visual feedback)
            // Use map as the graph parameter (function might expect "garph" but we pass "map")
            var testResult = await ${actualFuncName}(map, ${startParam}, ${goalParam});
            return testResult;
          `;
          }
          
          console.log('🔍   Code for test (first 500 chars):', testCode.substring(0, 500));
          console.log('🔍   Code for test (last 200 chars):', testCode.substring(Math.max(0, testCode.length - 200)));
          
          // CRITICAL: The function definition should have parameters like (garph, start, goal)
          // But when we call it, we pass (map, startParam, goalParam)
          // The function body uses the parameter names from the definition (garph, start, goal)
          // So we need to make sure the function can access these parameters
          // The issue is that the function definition uses parameter names like "garph", "start", "goal"
          // But we're calling it with values, not variable names
          // So inside the function, "start" should be available as a parameter
          
          const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
          const testExecFunction = new AsyncFunction(
            "map", "all_nodes",
            ...Object.keys(gameFunctions),
            testCode
          );
          
          // Execute with test parameters (no visual feedback)
          // Use a shorter timeout for test cases
          const testTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Test case execution timeout")), 10000); // 10 seconds for test cases
          });
          
          try {
            actual = await Promise.race([
              testExecFunction(
                graphMap,
                allNodes || [],
                ...Object.values(gameFunctions)
              ),
              testTimeoutPromise
            ]);
          } catch (execError) {
            console.error('🔍   Error executing test case:', execError);
            console.error('🔍   Function definition:', functionDefinition);
            console.error('🔍   Test code:', testCode);
            throw execError;
          }
          
          console.log('🔍   Test case result:', actual);
        }
      } catch (testError) {
        console.warn('🔍   Could not execute test case:', testError);
        // If secondary test case fails, mark as failed
        actual = undefined;
      }
    } else {
      // If no function definition or missing dependencies, use primary result
      actual = functionReturnValue;
      console.log('🔍   Using primary return value (fallback):', actual);
    }
    
    const expected = testCase.expected_output;
    const comparisonType = testCase.comparison_type || 'exact';

    console.log('🔍   Expected output:', expected);
    console.log('🔍   Expected output type:', typeof expected);
    console.log('🔍   Expected output is array:', Array.isArray(expected));
    console.log('🔍   Actual output:', actual);
    console.log('🔍   Comparison type:', comparisonType);

    const passed = compareOutput(actual, expected, comparisonType);
    console.log(`🔍   Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);

    if (passed) {
      passedTests.push({
        test_case_id: testCase.test_case_id,
        test_case_name: testCase.test_case_name,
        is_primary: testCase.is_primary
      });
      console.log(`✅ ${testCase.test_case_name} PASSED`);
    } else {
      failedTests.push({
        test_case_id: testCase.test_case_id,
        test_case_name: testCase.test_case_name,
        is_primary: testCase.is_primary,
        expected: expected,
        actual: actual
      });
      console.log(`❌ ${testCase.test_case_name} FAILED`);
      console.log('   Expected:', JSON.stringify(expected));
      console.log('   Actual:', JSON.stringify(actual));
    }
  }
  
  console.log('\n🔍 ===== Test Cases Summary =====');
  console.log('✅ Passed:', passedTests.length, passedTests.map(t => t.test_case_name));
  console.log('❌ Failed:', failedTests.length, failedTests.map(t => t.test_case_name));

  // Primary test case must pass (for victory condition)
  // Secondary test cases are for bonus points (will be implemented later)
  const primaryTest = relevantTestCases.find(tc => tc.is_primary);
  const primaryPassed = !primaryTest || passedTests.some(pt => pt.test_case_id === primaryTest.test_case_id);
  
  const totalTests = relevantTestCases.length;
  const secondaryTests = relevantTestCases.filter(tc => !tc.is_primary);
  const secondaryPassed = passedTests.filter(t => {
    const tc = relevantTestCases.find(testCase => testCase.test_case_id === t.test_case_id);
    return tc && !tc.is_primary;
  }).length;
  const secondaryTotal = secondaryTests.length;

  let message = '';
  if (primaryPassed) {
    if (secondaryPassed === secondaryTotal && secondaryTotal > 0) {
      message = `✅ ผ่าน test cases ทั้งหมด (${passedTests.length}/${totalTests})`;
    } else if (secondaryTotal > 0) {
      message = `✅ ผ่าน test case หลัก (${secondaryPassed}/${secondaryTotal} test case เพิ่มเติม)`;
    } else {
      message = `✅ ผ่าน test case หลัก`;
    }
  } else {
    message = `❌ ไม่ผ่าน test case หลัก`;
  }

  // Pass if primary test case passed (for victory condition)
  const result = {
    passed: primaryPassed,
    passedTests,
    failedTests,
    message,
    totalTests,
    primaryPassed
  };
  
  console.log('🔍 checkTestCases result:', result);
  
  return result;
}

