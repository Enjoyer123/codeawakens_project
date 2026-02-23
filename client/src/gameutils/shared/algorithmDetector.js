/**
 * algorithmDetector.js
 *
 * Single source of truth for determining which algorithm type is in play.
 * Combines data-driven checks (currentLevel properties) with code-regex checks.
 *
 * @param {string} code - The generated JavaScript code
 * @param {Object} currentLevel - The current level data
 * @returns {{ isCoinChange: boolean, isSubsetSum: boolean, isKnapsack: boolean, isNQueen: boolean, isEmei: boolean }}
 */
export const detectAlgorithmFlags = (code, currentLevel) => {
    // --- Data-driven checks (from currentLevel fields) ---
    const hasKnapsackData = !!currentLevel?.knapsackData;
    const hasSubsetSumData = !!currentLevel?.subsetSumData;
    const hasCoinChangeData = !!currentLevel?.coinChangeData;
    const hasNQueenData = !!currentLevel?.nqueenData;

    // --- Code-regex checks (from generated code) ---
    const codeHasCoinChange = /coinChange\d*|COINCHANGE\d*|COIN_CHANGE\d*/i.test(code);
    const codeHasSubsetSum = /subsetSum\d*|SUBSETSUM\d*|SUBSET_SUM\d*/i.test(code);
    const codeHasKnapsack = /knapsack\d*|KNAPSACK\d*/i.test(code);
    const codeHasNQueen = /nQueen\d*|NQUEEN\d*/i.test(code);
    const codeHasSolve = /solve\d*|SOLVE\d*/i.test(code);

    // --- Combined flags (either source is sufficient) ---
    const isCoinChange = hasCoinChangeData || codeHasCoinChange;
    const isSubsetSum = hasSubsetSumData || codeHasSubsetSum;
    const isKnapsack = hasKnapsackData || codeHasKnapsack;
    // 'solve' is too generic — only treat as N-Queen if nqueenData exists
    const isNQueen = codeHasNQueen || (codeHasSolve && hasNQueenData);

    // --- Type/appliedData-driven checks ---
    const isEmei = currentLevel?.isMaxCapacityLevel
        || currentLevel?.appliedData?.type === 'GRAPH_MAX_CAPACITY'
        || /maxCapacity\s*\(/.test(code)
        || (!!currentLevel?.n && !!currentLevel?.tourists);

    return { isCoinChange, isSubsetSum, isKnapsack, isNQueen, isEmei };
};
