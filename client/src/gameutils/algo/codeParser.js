/**
 * Code Parser — Extract function name from Blockly-generated code
 */

// Known algorithm names (normalized to uppercase)
const ALGO_NAMES = [
    'DFS', 'BFS', 'DIJ', 'PRIM', 'KRUSKAL',
    'KNAPSACK', 'SUBSETSUM', 'COINCHANGE',
    'NQUEEN', 'SOLVE', 'MAXCAPACITY'
];

// Normalize aliases to canonical names
const ALIASES = {
    'SUBSET_SUM': 'SUBSETSUM',
    'COIN_CHANGE': 'COINCHANGE',
    'N_QUEEN': 'NQUEEN',
    'MAX_CAPACITY': 'MAXCAPACITY',
};

/**
 * Extract the algorithm function name from Blockly code.
 * @param {string} code - Blockly generated JavaScript code
 * @returns {string|null} - เช่น "DFS", "BFS", "KNAPSACK" หรือ null
 */
export function extractFunctionName(code) {
    if (!code || typeof code !== 'string') return null;

    // Find all identifiers that look like function calls or definitions
    const matches = code.match(/(?:function\s+|await\s+|=\s*(?:async\s+)?)?(\w+)\s*\(/g) || [];

    for (const m of matches) {
        const name = (m.match(/(\w+)\s*\(/) || [])[1];
        if (!name) continue;

        const upper = name.toUpperCase();
        const normalized = ALIASES[upper] || upper;

        // Check exact match or starts-with (e.g. DFS2, BFS3)
        for (const algo of ALGO_NAMES) {
            if (normalized === algo || normalized.startsWith(algo)) {
                return algo;
            }
        }
    }

    return null;
}
