/**
 * Detects the variable name that stores the result of the main algorithm function call.
 * This is used to capture the return value of the user's code.
 *
 * @param {string} code - The generated JavaScript code
 * @param {Object} currentLevel - The current level data
 * @returns {Object} Object containing { varName, isCoinChange, isSubsetSum, ... }
 */
export const detectResultVariableName = (code, currentLevel) => {
    // Default fallback
    let varName = 'path';

    // 1. Determine Function Type
    const isCoinChange = /coinChange\d*|COINCHANGE\d*|COIN_CHANGE\d*/i.test(code);
    const isSubsetSum = /subsetSum\d*|SUBSETSUM\d*|SUBSET_SUM\d*/i.test(code);
    const isKnapsack = /knapsack\d*|KNAPSACK\d*/i.test(code);
    // Fix: Only treat as N-Queen if nqueenData exists OR if specific N-Queen keywords are found. 'solve' is too generic.
    const isNQueen = (/nQueen\d*|NQUEEN\d*/i.test(code)) || ((/solve\d*|SOLVE\d*/i.test(code)) && !!currentLevel?.nqueenData);
    const isTrainSchedule = /train_schedule/i.test(currentLevel?.gameType) || currentLevel?.appliedData?.type === 'GREEDY_TRAIN_SCHEDULE' || code.includes('platform_count');
    const isAntDp = /antDp\d*|ANTDP\d*|ANT_DP\d*/i.test(code) || !!(currentLevel?.appliedData?.type && String(currentLevel.appliedData.type).toUpperCase().includes('ANT'));
    // Broadened check for Emei/Dijkstra
    const isEmei = currentLevel?.isMaxCapacityLevel ||
        currentLevel?.appliedData?.type === 'GRAPH_MAX_CAPACITY' ||
        /maxCapacity\s*\(/.test(code);

    const isRopePartition = currentLevel?.gameType === 'rope_partition' || currentLevel?.appliedData?.type === 'BACKTRACKING_ROPE_PARTITION';

    console.log('🔍 [VariableDetection] Function type detection:', { isCoinChange, isSubsetSum, isKnapsack, isNQueen, isAntDp, isTrainSchedule, isEmei, isRopePartition });

    // 2. Variable Name Detection Logic
    if (isCoinChange) {
        // For Coin Change, default to 'result' (used in example XML)
        varName = 'result';
        console.log("🔍 Using default 'result' for Coin Change");

        // Try to find actual variable name from code
        const coinChangeMatch = code.match(/(?:var\s+)?(\w+)\s*=\s*(?:\(?\s*await\s+)?coinChange\d*\s*\(/i);
        if (coinChangeMatch) {
            varName = coinChangeMatch[1];
            console.log("🔍 Found Coin Change variable name from code:", varName);
        } else {
            // Also check for result variable assignment
            if (code.match(/var\s+result\s*=/i) || code.match(/result\s*=/i)) {
                varName = 'result';
                console.log("🔍 Confirmed 'result' variable exists in code");
            }
        }
    } else if (isSubsetSum) {
        const subsetSumMatch = code.match(/(?:var\s+)?(\w+)\s*=\s*(?:\(?\s*await\s+)?subsetSum\d*\s*\(/i);
        if (subsetSumMatch) {
            varName = subsetSumMatch[1];
            console.log("🔍 Found Subset Sum variable name:", varName);
        }
    } else if (isKnapsack) {
        const knapsackMatch = code.match(/(?:var\s+)?(\w+)\s*=\s*(?:\(?\s*await\s+)?knapsack\d*\s*\(/i);
        if (knapsackMatch) {
            varName = knapsackMatch[1];
            console.log("🔍 Found Knapsack variable name:", varName);
        }
    } else if (isNQueen) {
        // For N-Queen, default to 'result' (used in example XML)
        varName = 'result';
        console.log("🔍 Using default 'result' for N-Queen");

        // Try to find actual variable name from code
        const resultMatch = code.match(/(?:var\s+)?(\w+)\s*=\s*(?:\(?\s*await\s+)?solve\d*\s*\(/i);
        if (resultMatch) {
            varName = resultMatch[1];
            console.log("🔍 Found N-Queen variable name from code:", varName);
        } else {
            // Also check for result variable assignment
            if (code.match(/var\s+result\s*=/i) || code.match(/result\s*=/i)) {
                varName = 'result';
                console.log("🔍 Confirmed 'result' variable exists in code for N-Queen");
            }
        }
    } else if (isTrainSchedule) {
        // For Train Schedule, default to 'platform_count' (used in example XML)
        varName = 'platform_count';
        console.log("🔍 Using default 'platform_count' for Train Schedule");

        // Try to find actual variable name from code
        const trainMatch = code.match(/(?:var\s+)?(\w+)\s*=\s*(?:\(?\s*await\s+)?solve\d*\s*\(/i);
        if (trainMatch) {
            varName = trainMatch[1];
            console.log("🔍 Found Train Schedule variable name from code:", varName);
        }
    } else if (isEmei) {
        varName = 'rounds';
        console.log("🔍 Using 'rounds' for Emei Mountain");
    } else {
        if (isAntDp) {
            // For Ant DP, default to 'result' (used in example XML)
            varName = 'result';
            console.log("🔍 Using default 'result' for Ant DP");
            const antMatch = code.match(/(?:var\s+)?(\w+)\s*=\s*\(?\s*await\s+antDp\d*\s*\(/i);
            if (antMatch) {
                varName = antMatch[1];
                console.log("🔍 Found Ant DP variable name from code:", varName);
            } else if (code.match(/var\s+result\s*=/i) || code.match(/result\s*=/i)) {
                varName = 'result';
            }
        }
        // Generic pattern for graph algorithms
        const pathMatch = code.match(/(?:var\s+)?(\w+)\s*=\s*\(?\s*await\s+\w+\s*\(/i);
        if (pathMatch) {
            varName = pathMatch[1];
            console.log("🔍 Found variable name using generic pattern:", varName);
        }

        // EXTRA ROBUSTNESS: Explicitly check for Graph Algorithm function calls
        const graphAlgoMatch = code.match(/(?:var\s+)?(\w+)\s*=\s*\(?\s*await\s+(?:DFS|BFS|DIJ|PRIM|KRUSKAL)\w*\s*\(/i);
        if (graphAlgoMatch) {
            const detectedName = graphAlgoMatch[1];
            if (detectedName !== varName) {
                console.log("🔍 [GraphAlgo Override] Found specific graph algo variable:", detectedName);
                varName = detectedName;
            }
        }
    }

    // Final fallback log
    if (varName === 'path' && !isCoinChange && !isSubsetSum && !isKnapsack && !isNQueen && !isEmei && !isTrainSchedule) {
        console.log("🔍 [VariableDetection] Defaulting to 'path'");
    }

    return {
        varName,
        isCoinChange,
        isSubsetSum,
        isKnapsack,
        isNQueen,
        isTrainSchedule,
        isAntDp,
        isEmei,
        isRopePartition
    };
};
