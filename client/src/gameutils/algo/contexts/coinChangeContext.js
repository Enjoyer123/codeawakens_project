/**
 * Context สำหรับเกม Coin Change (ทอนเหรียญปราบมอนสเตอร์)
 */
import { getAlgoPayload } from '../../shared/levelType';

/** Sentinel value จาก Blockly generator: ถ้า exclude === DP_MODE_SENTINEL → บันทึกเป็น dp_update */
const DP_MODE_SENTINEL = -2;

export function injectCoinChangeStubs(context, levelData, trace) {
    const payload = getAlgoPayload(levelData, 'COINCHANGE');
    if (!payload) return;

    /* ==========================================
       1. GAME VARIABLES
       ========================================== */
    context.monster_power = Math.round(Number(payload.monster_power ?? payload.amount ?? 0));
    context.warriors = (payload.warriors || payload.coins || []).map(w => Math.round(Number(w)));

    /* ==========================================
       2. VISUAL STUBS (Trace Recorders)
       ========================================== */
    context.addWarriorToSelectionVisual = async (warrior) => {
        trace.push({ action: 'select_coin', coin: warrior });
    };
    
    context.removeWarriorFromSelectionVisual = async () => {
        trace.push({ action: 'remove_coin' });
    };
    
    context.considerCoinVisual = async (coinIndex) => {
        trace.push({ action: 'consider_coin', coin: coinIndex });
    };
    
    /**
     * บันทึกการตัดสินใจว่าใช้เหรียญหรือไม่
     * - ถ้า exclude === DP_MODE_SENTINEL (-2) → บันทึกเป็น dp_update (โหมด DP)
     * - ถ้าไม่ใช่ → บันทึกเป็น coin_decision (โหมด Backtrack)
     */
    context.trackCoinChangeDecision = (amount, index, include, exclude) => {
        if (exclude === DP_MODE_SENTINEL) {
            trace.push({
                action: 'dp_update',
                amount: amount,
                minCoins: index,
                coinUsed: include
            });
        } else {
            trace.push({ action: 'coin_decision', amount, index, include, exclude });
        }
    };
    
    context.memoHitVisual = async (amount) => {
        trace.push({ action: 'memo_hit', amount });
    };
}
