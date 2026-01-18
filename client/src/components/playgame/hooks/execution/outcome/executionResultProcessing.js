/**
 * executionResultProcessing.js
 * 
 * Handles the processing of code execution results, including:
 * 1. Cleaning up global intercepts/shims.
 * 2. Normalizing the return value (applying fallbacks).
 * 3. triggering post-execution visual sequences (e.g. N-Queen replay).
 */

/**
 * Restore any global functions we overrode during execution.
 * Checks for __orig_* backups and restores them.
 */
export const cleanupGlobalOverrides = () => {
    try {
        if (typeof globalThis !== 'undefined') {
            try {
                if (typeof __orig_place === 'function') globalThis.place = __orig_place; else delete globalThis.place;
            } catch (e) { console.warn('[useCodeExecution] Could not restore place:', e); }
            try {
                if (typeof __orig_remove === 'function') globalThis.remove = __orig_remove; else delete globalThis.remove;
            } catch (e) { console.warn('[useCodeExecution] Could not restore remove:', e); }
            try {
                if (typeof __orig_safe === 'function') globalThis.safe = __orig_safe; else delete globalThis.safe;
            } catch (e) { console.warn('[useCodeExecution] Could not restore safe:', e); }
        }
    } catch (e) {
        console.warn('[executionResultProcessing] Error checking globals:', e);
    }
};

/**
 * Normalizes the execution result by checking various fallback locations
 * if the primary return value is null/undefined.
 * 
 * Priorities:
 * 1. Direct Return Value
 * 2. globalThis.result
 * 3. globalThis.solution (array)
 * 4. globalThis.__capturedSolution (shim captured)
 * 5. globalThis.__finalBoardSnapshot (reconstructed)
 * 
 * @param {any} initialReturnValue - The value returned by the AsyncFunction
 * @returns {any} The normalized return value
 */
export const normalizeExecutionResult = (initialReturnValue) => {
    let functionReturnValue = initialReturnValue;

    if (functionReturnValue !== null && typeof functionReturnValue !== 'undefined') {
        return functionReturnValue;
    }

    // If the function returned null/undefined, prefer any in-function `solution` or captured placements
    try {
        if (typeof globalThis !== 'undefined') {
            // Check for 'result' variable (generic result capture)
            if (typeof globalThis.result !== 'undefined' && globalThis.result !== null) {
                functionReturnValue = globalThis.result;
                console.log('[useCodeExecution] Using global `result` as fallback:', functionReturnValue);
            }
            // If an in-scope `solution` variable leaked to globalThis (rare), use it
            else if (Array.isArray(globalThis.solution) && globalThis.solution.length > 0) {
                functionReturnValue = globalThis.solution;
                console.log('[useCodeExecution] Using global `solution` as fallback:', functionReturnValue);
            } else if (Array.isArray(__capturedSolution) && __capturedSolution.length > 0) {
                functionReturnValue = __capturedSolution.slice();
                console.log('[useCodeExecution] Using __capturedSolution as fallback:', functionReturnValue);
            } else if (Array.isArray(globalThis.__finalBoardSnapshot) && globalThis.__finalBoardSnapshot.length > 0) {
                // Build solution array from final board snapshot (rows with value 1)
                try {
                    const built = [];
                    for (let ri = 0; ri < globalThis.__finalBoardSnapshot.length; ri++) {
                        const r = globalThis.__finalBoardSnapshot[ri];
                        if (!Array.isArray(r)) continue;
                        for (let cj = 0; cj < r.length; cj++) {
                            try { if (r[cj] === 1) built.push([ri, cj]); } catch (e) { /* ignore */ }
                        }
                    }
                    if (built.length > 0) {
                        functionReturnValue = built;
                        console.log('[useCodeExecution] Using __finalBoardSnapshot-built solution as fallback:', functionReturnValue);
                    } else {
                        console.log('[useCodeExecution] __finalBoardSnapshot exists but no queens found (all zeros)');
                    }
                } catch (e) {
                    console.warn('[useCodeExecution] Error building solution from __finalBoardSnapshot:', e);
                }
            } else {
                console.log('[useCodeExecution] No captured solution available as fallback');
            }
        }
    } catch (e) {
        console.warn('[executionResultProcessing] Error during fallback selection:', e);
    }
    return functionReturnValue;
};

/**
 * Runs post-execution enhancements or animations.
 * Primarily used for N-Queen to show the final placement if no step-by-step visuals occurred.
 * 
 * @param {any} functionReturnValue - The final normalized return value
 * @param {boolean} isNQueen - Whether the current level is N-Queen
 */
export const handlePostExecutionVisuals = async (functionReturnValue, isNQueen) => {
    // If we have a final solution (returned or from fallback), try to show it visually
    try {
        if (!isNQueen) return;

        // If we already showed real-time consider events during execution, skip the "replay final solution"
        // so it doesn't look like visuals are coming from output instead of the code steps.
        const __hadRealtimeVisuals = !!(typeof globalThis !== 'undefined' && globalThis.__nqueenVisual_seenConsider);

        if (!__hadRealtimeVisuals && Array.isArray(functionReturnValue) && functionReturnValue.length > 0 && typeof globalThis !== 'undefined' && globalThis.__nqueenVisual_api && typeof globalThis.__nqueenVisual_api.onPlace === 'function' && globalThis.__nqueenVisual_mode) {
            const __nqueenVisual_animationPromise = (async () => {
                try { if (globalThis.__nqueenVisual_api.clear) globalThis.__nqueenVisual_api.clear(); } catch (e) { }
                for (const p of functionReturnValue) {
                    try { globalThis.__nqueenVisual_api.onConsider(p[0], p[1], true); } catch (e) { }
                    await new Promise(r => setTimeout(r, (globalThis.__nqueenVisual_delay || 300)));
                    try { globalThis.__nqueenVisual_api.onPlace(p[0], p[1]); } catch (e) { }
                    await new Promise(r => setTimeout(r, 60));
                }
                // give a short pause at the end so the final board is visible before test result/victory
                await new Promise(r => setTimeout(r, 250));
            })();
            try { globalThis.__nqueenVisual_lastAnimationPromise = __nqueenVisual_animationPromise; } catch (e) { }
            try { if (globalThis.__nqueenVisual_mode) await __nqueenVisual_animationPromise; } catch (e) { }
        }
    } catch (e) {
        console.warn('[executionResultProcessing] Error showing final solution visually:', e);
    }

    // Always log capturedSolution for debugging
    try {
        if (typeof globalThis !== 'undefined') {
            const cap = globalThis.__capturedSolution;
            console.log('[executionResultProcessing] __capturedSolution length:', Array.isArray(cap) ? cap.length : 0, cap && cap.slice ? cap.slice(0, 50) : cap);
        }
    } catch (e) { /* ignore */ }
};
