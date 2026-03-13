/**
 * Context สำหรับเกม Coin Change (ทอนเหรียญปราบมอนสเตอร์)
 */
import { getAlgoPayload } from '../../shared/levelType';

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
     * ป้องกันโค้ดงงด้วยการแยก dp_update กับ coin_decision ชัดเจน
     */
    context.trackCoinChangeDecision = (amount, index, include, exclude) => {
        if (exclude === -2) {
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
