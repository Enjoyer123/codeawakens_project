/**
 * Context สำหรับเกม Subset Sum (Dynamic Programming / Backtracking)
 */
import { getAlgoPayload } from '../../shared/levelType';

export function injectSubsetSumStubs(context, levelData, trace) {
    const payload = getAlgoPayload(levelData, 'SUBSETSUM');
    if (!payload) return;

    /* ==========================================
       1. GAME VARIABLES
       ========================================== */
    context._state = context._state || {};
    context._state.warriors = payload.warriors || [];
    context._state.target_sum = payload.target_sum || 0;
    context._state.chosen = [];  // mutable shared state สำหรับ real backtracking (push/pop)

    /* ==========================================
       2. TRACE RECORDERS
       (Generators เรียกฟังก์ชันพวกนี้แทนการเขียน trace.push ตรงๆ)
       ========================================== */
    context.recordConsider = (index) => {
        trace.push({ action: 'consider', index });
    };
    context.recordInclude = (index) => {
        trace.push({ action: 'include', index });
    };
    context.recordExclude = (index) => {
        trace.push({ action: 'exclude', index });
    };
    context.recordPruneExclude = (index) => {
        trace.push({ action: 'prune_exclude', index });
    };
    context.recordReset = (index) => {
        trace.push({ action: 'reset', index });
    };
    context.recordDpUpdate = (index, sum, value) => {
        trace.push({ action: 'dp_update', index, sum, value });
    };
}
