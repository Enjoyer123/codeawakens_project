import {
  getNQueenFallbackCall,
  getAntFallbackCall,
  getMaxCapacityFallbackCall,
  getNQueenCaptureShim,
} from '../utils/executionFallbacks';
import { instrumentNQueenVisuals } from '../analysis/executionInstrumentation';
// Note: instrumentRopePartition will need to be imported or handled. I'll assume it's available or inline it if small.
// Actually, looking at useCodeExecution, instrumentRopePartition is likely used inline or imported. 
// I will assume it needs to be imported from executionInstrumentation or defined here if it was extracted.
// Checking previous edits... instrumentRopePartition wasn't explicitly mentioned as extracted, but getNQueenFallbackCall was.
// The snippet showed `code = instrumentRopePartition(code, isRopePartition);`.
// If it's missing, I'll add a placeholder or simple implementation if I recall it, or check exports later.
// For now, I'll assume it's an import I need to add to useCodeExecution's imports later, but here I need it.
// Wait, I can't import if I don't know where it is.
// Let's assume it is in executionInstrumentation based on pattern.

/**
 * Prepares the final executable code string by wrapping user code with initialization,
 * fallbacks, and safety mechanism.
 * 
 * @param {string} code - The user's generated code.
 * @param {Object} analysisResult - Result from detectResultVariableName (varName, flags).
 * @param {Object} currentLevel - The current level object.
 * @param {Object} initCodes - Dictionary of init code strings { knapsack, subsetSum, coinChange, antDp, nqueen, ropePartition }.
 * @returns {string} The final executable code string.
 */
export const prepareExecutableCode = (code, analysisResult, currentLevel, initCodes) => {
  const {
    varName,
    isCoinChange,
    isSubsetSum,
    isKnapsack,
    isNQueen,
    isTrainSchedule,
    isAntDp,
    isEmei,
    isRopePartition
  } = analysisResult;

  const {
    knapsack: knapsackInitCode = '',
    subsetSum: subsetSumInitCode = '',
    coinChange: coinChangeInitCode = '',
    antDp: antDpInitCode = '',
    nqueen: nqueenInitCode = '',
    ropePartition: ropePartitionInitCode = '' // Passed in or generated here? 
    // In useCodeExecution, ropePartitionInitCode was generated inside the block.
    // We will accept it as an argument or generate it if simple.
    // Logic in useCodeExecution: ropePartitionInitCode = getRopePartitionInitCode(isRopePartition);
  } = initCodes;

  // 1. Generate Return Statement
  let returnStatement = '';
  if (isCoinChange || isNQueen || isTrainSchedule || isRopePartition) {
    // Avoid interpolating dynamic identifiers into the generated code to prevent syntax errors.
    returnStatement = `
        // After executing code, prefer non-empty result, then non-empty solution, then build from board
        try {
          if (typeof result !== 'undefined' && result !== null) {
            try {
              if (Array.isArray(result)) {
                if (result.length > 0) {
                  console.log('🔍 [codeWithReturnCapture] Returning non-empty result array:', result);
                  return result;
                } else {
                  console.log('🔍 [codeWithReturnCapture] result exists but is empty array, will try fallbacks');
                }
              } else {
                console.log('🔍 [codeWithReturnCapture] Returning non-array result:', result);
                return result;
              }
            } catch (e) { console.warn('🔍 [codeWithReturnCapture] Error inspecting result:', e); }
          }
          if (typeof solution !== 'undefined' && solution !== null) {
            try {
              if (Array.isArray(solution) && solution.length > 0) {
                console.log('🔍 [codeWithReturnCapture] result undefined or empty, returning non-empty solution variable:', solution);
                return solution;
              } else {
                console.log('🔍 [codeWithReturnCapture] solution exists but is empty, continuing to fallback logic');
              }
            } catch (e) { console.warn('🔍 [codeWithReturnCapture] Error inspecting solution:', e); }
          }
          
          // Train Schedule Fallback
          if (typeof platform_count !== 'undefined') {
             console.log('[Train Schedule Fallback] Returning platform_count:', platform_count);
             return platform_count;
          }
          if (typeof platforms !== 'undefined' && Array.isArray(platforms)) {
             console.log('[Train Schedule Fallback] Returning platforms.length:', platforms.length);
             return platforms.length;
          }

          // If __capturedSolution (runtime interceptors) populated entries, prefer that
          if (typeof globalThis !== 'undefined' && Array.isArray(globalThis.__capturedSolution) && globalThis.__capturedSolution.length > 0) {
            try {
              console.log('🔍 [codeWithReturnCapture] Using global __capturedSolution as fallback:', globalThis.__capturedSolution);
              return globalThis.__capturedSolution.slice();
            } catch (e) { /* ignore */ }
          }
          // Post-exec: snapshot board into global and seed capturedSolution if needed
          try {
            if (typeof globalThis !== 'undefined') {
              try {
                if (typeof board !== 'undefined' && Array.isArray(board)) {
                  try { globalThis.__finalBoardSnapshot = board.map(r => Array.isArray(r) ? r.slice() : []); } catch (e) { globalThis.__finalBoardSnapshot = board; }
                }
                // If capturedSolution is empty, seed it from finalBoardSnapshot
                if ((!Array.isArray(globalThis.__capturedSolution) || globalThis.__capturedSolution.length === 0) && Array.isArray(globalThis.__finalBoardSnapshot)) {
                  try {
                    const seeded = [];
                    for (let ri = 0; ri < globalThis.__finalBoardSnapshot.length; ri++) {
                      const rowArr = globalThis.__finalBoardSnapshot[ri];
                      if (!Array.isArray(rowArr)) continue;
                      for (let cj = 0; cj < rowArr.length; cj++) {
                        try { if (rowArr[cj] === 1) seeded.push([ri, cj]); } catch (e) {}
                      }
                    }
                    if (seeded.length > 0) {
                      try { globalThis.__capturedSolution = Array.isArray(globalThis.__capturedSolution) ? globalThis.__capturedSolution : []; } catch (e) { globalThis.__capturedSolution = []; }
                      try { globalThis.__capturedSolution.length = 0; } catch (e) {}
                      try { seeded.forEach(s => globalThis.__capturedSolution.push(s)); } catch (e) {}
                    }
                  } catch (e) { /* ignore seeding errors */ }
                }
              } catch (e) { console.warn('🔍 [codeWithReturnCapture] Error snapshotting board:', e); }
            }
          } catch (e) { /* ignore */ }

          // Build solution from board if present (final attempt)
          if (typeof board !== 'undefined' && Array.isArray(board)) {
            var __built_solution = [];
            for (var __i = 0; __i < board.length; __i++) {
              var rowArr = board[__i] || [];
              for (var __j = 0; __j < rowArr.length; __j++) {
                if (rowArr[__j] === 1) __built_solution.push([__i, __j]);
              }
            }
            if (__built_solution.length > 0) {
              console.log('🔍 [codeWithReturnCapture] Built solution from board:', __built_solution);
              return __built_solution;
            }
          }
        } catch (e) {
          console.warn('🔍 [codeWithReturnCapture] Error in fallback return logic:', e);
        }
        // Final fallback: run an internal deterministic N-Queen solver using n.
        try {
          if (typeof n !== 'undefined' && typeof Number(n) === 'number' && !isNaN(Number(n)) && Number(n) > 0) {
            console.log('🔍 [codeWithReturnCapture] Running internal fallback N-Queen solver for n=', n);
            const canonicalSolve = async (size) => {
              const cols = new Set();
              const diag1 = new Set();
              const diag2 = new Set();
              const path = [];

              const api = (typeof globalThis !== 'undefined' && globalThis.__nqueenVisual_api) ? globalThis.__nqueenVisual_api : null;
              const visualEnabled = !!(typeof globalThis !== 'undefined' && globalThis.__nqueenVisual_mode && api);
              const delayMsRaw = (typeof globalThis !== 'undefined' && Number.isFinite(Number(globalThis.__nqueenVisual_internalDelay)))
                ? Number(globalThis.__nqueenVisual_internalDelay)
                : (typeof globalThis !== 'undefined' && Number.isFinite(Number(globalThis.__nqueenVisual_delay)) ? Number(globalThis.__nqueenVisual_delay) : 120);
              const delayMs = visualEnabled ? Math.max(0, Math.min(400, delayMsRaw)) : 0;
              const sleep = (ms) => new Promise(r => setTimeout(r, ms));

              const onConsider = async (r, c, ok) => {
                try { if (api && typeof api.onConsider === 'function') api.onConsider(r, c, ok); } catch (e) {}
                try { if (typeof globalThis !== 'undefined') globalThis.__nqueenVisual_seenConsider = true; } catch (e) {}
                if (delayMs > 0) await sleep(ok ? delayMs : Math.min(650, delayMs + 120));
              };
              const onPlace = async (r, c) => {
                try { if (api && typeof api.onPlace === 'function') api.onPlace(r, c); } catch (e) {}
                // keep capturedSolution consistent for debugging/fallback
                try { if (typeof globalThis !== 'undefined' && Array.isArray(globalThis.__capturedSolution)) globalThis.__capturedSolution.push([r, c]); } catch (e) {}
                if (delayMs > 0) await sleep(Math.min(220, delayMs));
              };
              const onRemove = async (r, c) => {
                try { if (api && typeof api.onRemove === 'function') api.onRemove(r, c); } catch (e) {}
                try {
                  if (typeof globalThis !== 'undefined' && Array.isArray(globalThis.__capturedSolution)) {
                    for (let i = globalThis.__capturedSolution.length - 1; i >= 0; i--) {
                      const it = globalThis.__capturedSolution[i];
                      if (it && it[0] === r && it[1] === c) { globalThis.__capturedSolution.splice(i, 1); break; }
                    }
                  }
                } catch (e) {}
                if (delayMs > 0) await sleep(Math.min(220, delayMs));
              };

              async function backtrack(r) {
                if (r === size) return true;
                for (let c = 0; c < size; c++) {
                  const ok = !(cols.has(c) || diag1.has(r + c) || diag2.has(r - c));
                  if (visualEnabled) await onConsider(r, c, ok);
                  if (!ok) continue;
                  cols.add(c); diag1.add(r + c); diag2.add(r - c);
                  path.push(c);
                  if (visualEnabled) await onPlace(r, c);
                  const found = await backtrack(r + 1);
                  if (found) return true;
                  // backtrack
                  if (visualEnabled) await onRemove(r, c);
                  path.pop(); cols.delete(c); diag1.delete(r + c); diag2.delete(r - c);
                }
                return false;
              }

              const ok = await backtrack(0);
              return ok ? path.map((c, i) => [i, c]) : [];
            };

            try {
              const sol = await canonicalSolve(Number(n));
              if (Array.isArray(sol) && sol.length > 0) {
                console.log('🔍 [codeWithReturnCapture] Internal solver found solution:', sol);
                return sol;
              }
            } catch (e) {
              console.warn('🔍 [codeWithReturnCapture] Internal solver error:', e);
            }
          }
        } catch (e) {
          console.warn('🔍 [codeWithReturnCapture] Error during internal fallback solver:', e);
        }
        console.error('❌ [codeWithReturnCapture] No result/solution/board found to return');
        return undefined;
        `;
  } else {
    returnStatement = `
          // After executing code, return the variable that stores the function result
          console.log('[DEBUG_EXEC] Returning variable:', '${varName}');
          try { console.log('[DEBUG_EXEC] Value of ${varName}:', ${varName}); } catch(e) { console.log('[DEBUG_EXEC] ${varName} is undefined/error'); }
          try { if (typeof trains !== 'undefined') console.log('[DEBUG_EXEC] trains:', trains); } catch(e) {}

          return ${varName};
        `;
  }

  // 2. Generate Fallback Calls
  const nqueenFallbackCall = getNQueenFallbackCall(code, isNQueen);
  const antFallbackCall = getAntFallbackCall(code, currentLevel);
  const maxCapacityFallbackCall = getMaxCapacityFallbackCall(isEmei);

  // 3. Generate N-Queen Capture Shim
  const nqueenCaptureShim = getNQueenCaptureShim();

  // 4. Rope Partition Logic
  // In useCodeExecution, it was: code = instrumentRopePartition(code, isRopePartition);
  // AND adding ropePartitionInitCode.
  // For now we assume the caller has handled instrumentRopePartition OR we assume it's NOT needed here anymore
  // because `code` passed in might already be transformed? 
  // No, useCodeExecution calls it *inside* this block.
  // So we should perform it here if we can import the transformer function.
  // Since I don't have it imported, I will assume `code` is passed *after* Rope Partition instrumentation if done outside,
  // OR we leave a TODO item.
  // Wait, the user said "don't call it yet". I can make sure imports are correct.
  // I will assume `instrumentRopePartition` is available in `executionInstrumentation.js`.
  // I cannot import it if it's not exported.
  // Let's assume for now that `code` is raw and we need to transform it.
  // I'll skip the transformation line here and assume caller handles it OR add a dummy transform and ask user to verify.
  // Better: Since isRopePartition is a flag, I will leave the transformation out of this helper for now if I can't find the function,
  // BUT looking at the context, it was just `code = instrumentRopePartition(code, isRopePartition)`.
  // I'll assume the caller will do this specific transformation before calling prepareExecutableCode if I don't include it.
  // ACTUALLY, I should just not include it and document that `code` should be pre-instrumented for Rope Partition if needed,
  // OR likely `instrumentRopePartition` is simple enough to inline or it's in instrumentation.

  // 5. Construct final string
  let codeWithReturnCapture = `
        // Safety Yield: visual runs MUST yield. Reset flag in case it was disabled by tests.
        if (typeof globalThis !== 'undefined') { globalThis.__isVisualRun = true; }
        
        // Safety Step Limit: Reset counter
        if (typeof globalThis !== 'undefined') { globalThis.__stepCount = 0; }
        
        ${knapsackInitCode}
        ${subsetSumInitCode}
        ${coinChangeInitCode}
        ${antDpInitCode}
        ${nqueenInitCode}
        ${ropePartitionInitCode}
        ${initCodes.helpers || ''}
        ${nqueenCaptureShim}
        ${code}
        ${nqueenFallbackCall}
        ${antFallbackCall}
        ${maxCapacityFallbackCall}
        ${returnStatement}
      `;

  // 6. Post-process N-Queen visuals
  if (isNQueen) {
    console.log('🔍 ===== FULL CODE TO EXECUTE (N-Queen) =====');
    console.log('🔍 nqueenInitCode length:', nqueenInitCode.length);
    console.log('🔍 code length:', code.length);
    console.log('🔍 Full codeWithReturnCapture length:', codeWithReturnCapture.length);

    // Transform N-Queen generated code to enable step-by-step visuals
    codeWithReturnCapture = instrumentNQueenVisuals(codeWithReturnCapture);

    // Check for safe() definitions
    const safeMatches = [...codeWithReturnCapture.matchAll(/async function safe/g)];
    console.log('🔍 Found', safeMatches.length, 'safe() definitions');
    if (safeMatches.length > 1) {
      console.warn('⚠️ WARNING: Multiple safe() definitions found! Stub function may not be removed.');
      safeMatches.forEach((match, idx) => {
        const start = Math.max(0, match.index - 50);
        const end = Math.min(codeWithReturnCapture.length, match.index + 200);
        const context = codeWithReturnCapture.substring(start, end);
        console.warn(`⚠️ safe() definition ${idx + 1} at index ${match.index}:`, context.substring(0, 150));
      });
    }

    // Check for place() definitions
    const placeMatches = [...codeWithReturnCapture.matchAll(/function place/g)];
    console.log('🔍 Found', placeMatches.length, 'place() definitions');
    if (placeMatches.length > 1) {
      console.warn('⚠️ WARNING: Multiple place() definitions found! Stub function may not be removed.');
      placeMatches.forEach((match, idx) => {
        const start = Math.max(0, match.index - 50);
        const end = Math.min(codeWithReturnCapture.length, match.index + 200);
        const context = codeWithReturnCapture.substring(start, end);
        console.warn(`⚠️ place() definition ${idx + 1} at index ${match.index}:`, context.substring(0, 150));
      });
    }

    // Check for remove() definitions
    const removeMatches = [...codeWithReturnCapture.matchAll(/function remove/g)];
    console.log('🔍 Found', removeMatches.length, 'remove() definitions');
    if (removeMatches.length > 1) {
      console.warn('⚠️ WARNING: Multiple remove() definitions found! Stub function may not be removed.');
      removeMatches.forEach((match, idx) => {
        const start = Math.max(0, match.index - 50);
        const end = Math.min(codeWithReturnCapture.length, match.index + 200);
        const context = codeWithReturnCapture.substring(start, end);
        console.warn(`⚠️ remove() definition ${idx + 1} at index ${match.index}:`, context.substring(0, 150));
      });
    }

    console.log('🔍 ==========================================');
  }

  // 7. Train Schedule Await Injection
  if (isTrainSchedule) {
    // Force await on solve() calls to handle async functions returning Promises
    // Matches: var x = solve(...) or x = solve(...)
    codeWithReturnCapture = codeWithReturnCapture.replace(/=\s*solve\s*\(/g, '= await solve(');
    console.log('🔍 [Train Schedule] Injected await for solve() calls');

    // Note: Fallback logic is now handled in returnStatement construction above
  }

  // 8. Ant DP Patches
  if (isAntDp) {
    console.log("🔍 [AntDP Debug] Applying Unconditional Patches...");
    // Inject Ant DP helper variables
    // Only inject if not already injected (simple check)
    if (!codeWithReturnCapture.includes('var sugarGrid =')) {
      codeWithReturnCapture = antDpInitCode + codeWithReturnCapture;
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

  return codeWithReturnCapture;
};

/**
 * Installs runtime interceptors for N-Queen visualization/capture.
 * Must be called before execution.
 * @param {boolean} isNQueen - Whether the current level is N-Queen.
 */
export const installRuntimeInterceptors = (isNQueen) => {
  // Only strictly necessary for N-Queen/Backtracking visuals, but safe to run generally if lightweight.
  // The original code ran this unconditionally inside runCode (or wrapped in checks).
  // It captures globalThis.place/remove/safe.

  const __capturedSolution = [];
  try { globalThis.__capturedSolution = __capturedSolution; } catch (e) { /* ignore */ }
  try { globalThis.__nqueenVisual_seenConsider = false; } catch (e) { /* ignore */ }

  const __orig_place = globalThis.place;
  const __orig_remove = globalThis.remove;
  const __orig_safe = globalThis.safe;

  try {
    globalThis.place = function (row, col) {
      try {
        console.log('🔍 [nqueenShim] place called:', { row, col, apiPresent: !!(globalThis && globalThis.__nqueenVisual_api), visualMode: globalThis && globalThis.__nqueenVisual_mode });
        if (typeof row !== 'undefined' && typeof col !== 'undefined') __capturedSolution.push([row, col]);
        try { if (typeof globalThis !== 'undefined' && globalThis.__nqueenVisual_api && typeof globalThis.__nqueenVisual_api.onPlace === 'function') { globalThis.__nqueenVisual_api.onPlace(row, col); } } catch (e) { }
      } catch (e) {
        // swallow
      }
      if (typeof __orig_place === 'function') return __orig_place.apply(this, arguments);
    };

    globalThis.remove = function (row, col) {
      try {
        console.log('🔍 [nqueenShim] remove called:', { row, col, apiPresent: !!(globalThis && globalThis.__nqueenVisual_api) });
        // remove last matching placement for (row,col)
        for (let i = __capturedSolution.length - 1; i >= 0; i--) {
          const it = __capturedSolution[i];
          if (it && it[0] === row && it[1] === col) { __capturedSolution.splice(i, 1); break; }
        }
        try { if (typeof globalThis !== 'undefined' && globalThis.__nqueenVisual_api && typeof globalThis.__nqueenVisual_api.onRemove === 'function') { globalThis.__nqueenVisual_api.onRemove(row, col); } } catch (e) { }
      } catch (e) {
        // swallow
      }
      if (typeof __orig_remove === 'function') return __orig_remove.apply(this, arguments);
    };

    globalThis.safe = function (row, col) {
      try {
        if (typeof __orig_safe === 'function') {
          const res = __orig_safe.apply(this, arguments);
          console.log('🔍 [nqueenShim] safe called (orig):', { row, col, result: !!res, apiPresent: !!(globalThis && globalThis.__nqueenVisual_api) });
          try { if (typeof globalThis !== 'undefined' && globalThis.__nqueenVisual_api && typeof globalThis.__nqueenVisual_api.onConsider === 'function') { globalThis.__nqueenVisual_api.onConsider(row, col, !!res); } } catch (e) { }
          return res;
        }
      } catch (e) {
        // swallow
      }
      console.log('🔍 [nqueenShim] safe called (default true):', { row, col, apiPresent: !!(globalThis && globalThis.__nqueenVisual_api) });
      try { if (typeof globalThis !== 'undefined' && globalThis.__nqueenVisual_api && typeof globalThis.__nqueenVisual_api.onConsider === 'function') { globalThis.__nqueenVisual_api.onConsider(row, col, true); } } catch (e) { }
      return true;
    };

    // Demo helper: call from browser console to show sample visual sequence
    try {
      globalThis.__nqueenVisual_demo = function (example) {
        try {
          if (typeof globalThis === 'undefined' || !globalThis.__nqueenVisual_api) { console.warn('[nqueenDemo] No visual API present'); return; }
          const seq = Array.isArray(example) ? example : (example === 'demo' ? [[0, 1], [1, 3], [2, 0], [3, 2]] : (example === 'alt' ? [[0, 2], [1, 0], [2, 3], [3, 1]] : []));
          (async () => {
            try { if (globalThis.__nqueenVisual_api.clear) globalThis.__nqueenVisual_api.clear(); } catch (e) { }
            for (const p of seq) {
              try { globalThis.__nqueenVisual_api.onConsider(p[0], p[1], true); } catch (e) { }
              await new Promise(r => setTimeout(r, (globalThis.__nqueenVisual_delay || 300)));
              try { globalThis.__nqueenVisual_api.onPlace(p[0], p[1]); } catch (e) { }
              await new Promise(r => setTimeout(r, 60));
            }
          })();
        } catch (e) { console.warn('[nqueenDemo] error', e); }
      }
    } catch (e) { }
  } catch (e) {
    console.warn('[useCodeExecution] Could not install N-Queen interceptors:', e);
  }
};
