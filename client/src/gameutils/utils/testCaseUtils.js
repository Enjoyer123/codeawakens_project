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
  
  // Look for function calls: DFS(...), BFS(...), DIJ(...), PRIM(...), KRUSKAL(...)
  // Try multiple patterns to match different code generation styles
  const functionPatterns = [
    // Blockly generator format: (await DFS(...)) or var path = (await DFS(...))
    /(?:var\s+\w+\s*=\s*)?\(?\s*await\s+(DFS|BFS|DIJ|PRIM|KRUSKAL)\s*\(/i,
    // Standard: var path = DFS(...) or path = DFS(...)
    /(?:var\s+\w+\s*=\s*)?(?:await\s+)?(DFS|BFS|DIJ|PRIM|KRUSKAL)\s*\(/i,
    // Assignment: result = DFS(...) or path = DFS(...)
    /\w+\s*=\s*(?:await\s+)?(?:\(?\s*await\s+)?(DFS|BFS|DIJ|PRIM|KRUSKAL)\s*\(/i,
    // Direct call: DFS(...) or await DFS(...)
    /(?:await\s+)?(DFS|BFS|DIJ|PRIM|KRUSKAL)\s*\(/i,
    // Function definition: function DFS(...) or async function DFS(...)
    /(?:async\s+)?function\s+(DFS|BFS|DIJ|PRIM|KRUSKAL)\s*\(/i,
    // Arrow function: const DFS = (...) => or const DFS = async (...) =>
    /(?:const|let|var)\s+(DFS|BFS|DIJ|PRIM|KRUSKAL)\s*=\s*(?:async\s+)?\(/i
  ];
  
  for (let i = 0; i < functionPatterns.length; i++) {
    const pattern = functionPatterns[i];
    const match = code.match(pattern);
    if (match && match[1]) {
      const functionName = match[1].toUpperCase();
      console.log('🔍 [extractFunctionName] Found function:', functionName, 'using pattern', i);
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
    const name = match[1].toUpperCase();
    // Check if it starts with known algorithm names (DFS2, DFS3, BFS2, etc.)
    const algorithmNames = ['DFS', 'BFS', 'DIJ', 'PRIM', 'KRUSKAL'];
    for (const algoName of algorithmNames) {
      if (name.startsWith(algoName)) {
        console.log('🔍 [extractFunctionName] Found function from all matches:', name, '->', algoName);
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
      result = JSON.stringify(actual) === JSON.stringify(expected);
      console.log('🔍     [compareOutput] Exact comparison:', result);
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
        const funcNameMatch = code.match(/(?:async\s+function\s+|function\s+)(\w+)\s*\(/);
        const actualFuncName = funcNameMatch ? funcNameMatch[1] : functionName;
        console.log('🔍   Actual function name in code:', actualFuncName);
        
        // Build function call with test case parameters
        const inputParams = testCase.input_params || {};
        const startParam = inputParams.start !== undefined ? inputParams.start : 0;
        const goalParam = inputParams.goal !== undefined ? inputParams.goal : 3;
        const graphParam = inputParams.graph || 'map';
        
        console.log('🔍   Test case parameters:', { start: startParam, goal: goalParam, graph: graphParam });
        
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
            console.log('🔍   Extracted function definition (length:', functionDefinition.length, ')');
            
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
          let graphParamName = 'map';
          let startParamName = 'start';
          let goalParamName = 'goal';
          
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
          
          console.log('🔍   Using parameters:', { graphParamName, startParamName, goalParamName });
          
          // Only include the function definition, no other code (no moveAlongPath, no variable declarations)
          // CRITICAL: Pass parameters in the correct order and ensure variables are available
          // The function definition should already have the parameters defined, so we just need to call it
          const testCode = `
            ${functionDefinition}
            // Call function with test case parameters (no visual feedback)
            // Use map as the graph parameter (function might expect "garph" but we pass "map")
            var testResult = await ${actualFuncName}(map, ${startParam}, ${goalParam});
            return testResult;
          `;
          
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
        is_primary: testCase.is_primary,
        expected: expected,
        actual: actual
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

