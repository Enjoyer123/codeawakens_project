/**
 * executionResultProcessing.js
 * 
 * Handles post-execution visual sequences (N-Queen final placement).
 */

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
        // Non-critical
    }
};
