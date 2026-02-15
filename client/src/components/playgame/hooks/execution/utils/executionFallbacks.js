
export const getNQueenFallbackCall = (code, isNQueen) => {
  if (!isNQueen) return '';

  // Try to detect actual solve function names from generated code (solve, solve2, solve3...)
  const solveNames = [];
  try {
    // async function solve / async function solve2
    const asyncRe = /async\s+function\s+(solve\d*)\s*\(/g;
    let m;
    while ((m = asyncRe.exec(code))) {
      if (m[1]) solveNames.push(m[1]);
    }
    // fallback: non-async function declarations
    if (solveNames.length === 0) {
      const funcRe = /function\s+(solve\d*)\s*\(/g;
      while ((m = funcRe.exec(code))) {
        if (m[1]) solveNames.push(m[1]);
      }
    }
    // final fallback: plain 'solve' name
    if (solveNames.length === 0) solveNames.push('solve');
  } catch (e) {
    solveNames.push('solve');
  }

  // Build try/catch calls for each candidate solve name (try with row=0, then without args)
  const calls = solveNames.map(name => {
    return `try{ if (typeof ${name} === 'function' && (typeof result === 'undefined' || result === null)) { try { result = await ${name}(0); } catch(e) { try { result = await ${name}(); } catch(e) { } } } } catch(e) { }`;
  }).join('\n');

  return `
          // Fallback: invoke detected solve functions to capture result if not assigned by generated code
          ${calls}
        `;
};




export const getMaxCapacityFallbackCall = (isEmei) => {
  if (!isEmei) return '';
  return `
          if (typeof maxCapacity === 'function') {
            if (typeof rounds === 'undefined' || rounds === null) {
              try { 
                rounds = await maxCapacity(n, edges, start, end, tourists); 
                console.log('[MaxCapacityFallback] Auto-called maxCapacity. Result:', rounds);
              } catch (e) { console.warn('[MaxCapacityFallback] call failed:', e); }
            }
          }
        `;
};

export const getNQueenCaptureShim = () => {
  return `
        (function(){
          console.log('🔍 [nqueenShim] Shim disabled (visualization moved to initCode)');
          // Ensure capturedSolution exists
          if (!globalThis.__capturedSolution) globalThis.__capturedSolution = [];
          
          // Ensure visual defaults
          try { if (typeof globalThis !== 'undefined' && typeof globalThis.__nqueenVisual_mode === 'undefined') globalThis.__nqueenVisual_mode = true; } catch(e){}
          try { if (typeof globalThis !== 'undefined' && typeof globalThis.__nqueenVisual_delay === 'undefined') globalThis.__nqueenVisual_delay = 300; } catch(e){}
        })();
      `;
};
