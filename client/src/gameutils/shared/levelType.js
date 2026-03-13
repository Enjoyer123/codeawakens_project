/**
 * Shared utility for determining the type of a level
 */

// ==========================================================================
// Helper: ดึงข้อมูล Algo Data จาก level (ใช้ algo_data เท่านั้น)
// ==========================================================================

/**
 * ดึง payload ข้อมูลอัลกอริทึมออกมาจาก level
 * อ่านจาก algo_data.payload โดยตรง
 * 
 * @param {Object} level - Level data object
 * @param {string} algoType - ประเภทที่ต้องการ เช่น 'NQUEEN', 'KNAPSACK', 'COINCHANGE', 'SUBSETSUM'
 * @returns {Object|null} payload ข้อมูลอัลกอริทึม หรือ null ถ้าไม่มี
 */
export function getAlgoPayload(level, algoType) {
    if (!level) return null;

    if (level.algo_data?.type === algoType) {
        return level.algo_data.payload || {};
    }

    return null;
}

// ==========================================================================
// Level Type Detection
// ==========================================================================

/**
 * Check if the level is an algorithm level.
 * @param {Object} level - The level data object
 * @returns {boolean} True if the level is an algorithm level
 */
export function isAlgoLevel(level) {
    if (!level) return false;
    
    return !!level.algo_data || (level.test_cases && level.test_cases.length > 0);
}

/**
 * Detect the specific type of algorithm level.
 * @param {Object} level - The level data object
 * @returns {string} The algorithm type (e.g., 'DIJKSTRA', 'EMEI', 'NQUEEN')
 */
export function detectAlgoType(level) {
    if (!level) return 'UNKNOWN';

    // ดึงจาก algo_data
    if (level.algo_data?.type) return level.algo_data.type;

    const funcName = level.test_cases?.[0]?.function_name?.toUpperCase();
    if (funcName) {
        if (funcName === 'DIJ' || funcName === 'DIJKSTRA') return 'DIJKSTRA';
        if (funcName === 'KRUS' || funcName === 'KRUSKAL') return 'KRUSKAL';
        if (funcName === 'MAXCAPACITY' || funcName === 'EMEI') return 'EMEI';
        return funcName; // e.g., 'DFS', 'BFS', 'PRIM'
    }
    
    return 'UNKNOWN';
}

/**
 * Specific check for Emei Mountain level.
 * @param {Object} level - The level data object
 * @returns {boolean} True if it is the Emei Mountain level
 */
export function isEmeiLevel(level) {
    return detectAlgoType(level) === 'EMEI';
}
