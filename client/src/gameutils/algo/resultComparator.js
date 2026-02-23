/**
 * Result Comparator Utilities
 * Compare actual output with expected output
 */

/**
 * Compare actual output with expected output based on comparison type
 * @param {*} actual - Actual return value
 * @param {*} expected - Expected return value
 * @param {string} comparisonType - "exact", "array_equals", "number_equals", "boolean_equals", "contains"
 * @returns {boolean}
 */
export function compareOutput(actual, expected, comparisonType = 'exact') {
    switch (comparisonType) {
        case 'boolean_equals': {
            const toBool = v => (v === 'true' || v === true) ? true : (v === 'false' || v === false) ? false : v;
            return toBool(actual) === toBool(expected);
        }

        case 'exact':
            return JSON.stringify(actual) === JSON.stringify(expected);

        case 'array_equals': {
            if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
            if (actual.length !== expected.length) return false;

            // Coordinate pair arrays → unordered set comparison
            const isCoordPairs = arr => arr.every(it => Array.isArray(it) && it.length === 2 && typeof it[0] === 'number');
            if (isCoordPairs(actual) && isCoordPairs(expected)) {
                const toKey = p => `${p[0]},${p[1]}`;
                const actualSet = new Set(actual.map(toKey));
                return expected.every(p => actualSet.has(toKey(p)));
            }

            return actual.every((val, idx) => deepEqual(val, expected[idx]));
        }

        case 'number_equals': {
            const a = Number(actual), b = Number(expected);
            return !isNaN(a) && !isNaN(b) && a === b;
        }

        default:
            return JSON.stringify(actual) === JSON.stringify(expected);
    }
}

/** Deep equality (arrays + plain objects) */
function deepEqual(a, b) {
    if (a === b) return true;
    if (Array.isArray(a) && Array.isArray(b)) {
        return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
    }
    if (a && typeof a === 'object' && b && typeof b === 'object') {
        const ak = Object.keys(a).sort(), bk = Object.keys(b).sort();
        return ak.length === bk.length && ak.every((k, i) => k === bk[i] && deepEqual(a[k], b[k]));
    }
    return false;
}

/**
 * Validate N-Queen Solution
 * @param {Array} actual - Solution array (single or multi)
 * @param {number} n - Board size
 * @returns {boolean}
 */
export function isValidNQueenSolution(actual, n) {
    if (!Array.isArray(actual) || actual.length === 0) return false;

    // Multi-solution: actual = [solution1, solution2, ...]
    const isMulti = Array.isArray(actual[0]) && (
        (Array.isArray(actual[0][0]) && typeof actual[0][0][0] === 'number') ||
        (!Array.isArray(actual[0][0]) && typeof actual[0][0] === 'number')
    );

    if (isMulti) return actual.every(s => validateSingle(s, n));
    return validateSingle(actual, n);
}

function validateSingle(actual, n) {
    if (!Array.isArray(actual)) return false;

    // Normalize to [[row, col], ...] format
    const queens = Array.isArray(actual[0])
        ? actual
        : actual.map((col, row) => [row, col]);

    if (queens.length !== n) return false;

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const [r1, c1] = queens[i];
            const [r2, c2] = queens[j];
            if (r1 === r2 || c1 === c2 || Math.abs(r1 - r2) === Math.abs(c1 - c2)) return false;
        }
    }
    return true;
}
