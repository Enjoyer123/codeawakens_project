/**
 * Context สำหรับเกม Knapsack (Dynamic Programming / Backtracking)
 */
import { getAlgoPayload } from '../../shared/levelType';

export function injectKnapsackStubs(context, levelData, trace) {
    const payload = getAlgoPayload(levelData, 'KNAPSACK');
    if (!payload) return;

    /* ==========================================
       1. GAME VARIABLES
       ========================================== */
    const { items = [], capacity = 0 } = payload;
    
    // แยกน้ำหนักและราคาออกมาเป็น Array ให้ใช้ง่าย
    context.weights = items.map(i => i.weight);
    context.values = items.map(i => i.price);
    context.n = items.length;
    context.capacity = capacity;
    context.bag = [];  // mutable shared state สำหรับ real backtracking (push/pop)
    context.bestValue = 0;   // ค่าสูงสุดที่เจอ
    context.bestBag = [];    // snapshot ของ bag ณ จุดที่ดีที่สุด

    /* ==========================================
       2. VISUAL STUBS (Trace Recorders)
       ========================================== */
    /**
     * บันทึกการตัดสินใจเลือกหยิบ/ไม่หยิบของลงกระเป๋า
     */
    context.trackKnapsackDecision = (type, itemIndex) => {
        trace.push({ action: type, index: itemIndex });
    };
    
    /**
     * บันทึกการอัปเดตตาราง DP (Dynamic Programming)
     */
    context.trackKnapsackDpUpdate = (itemIndex, currentCapacity, value) => {
        trace.push({ action: 'dp_update', index: itemIndex, capacity: currentCapacity, value });
    };
}
