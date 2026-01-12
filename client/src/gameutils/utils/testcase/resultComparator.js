/**
 * Result Comparator Utilities
 * Compare actual output with expected output
 */

/**
 * Compare actual output with expected output based on comparison type
 * @param {*} actual - Actual return value
 * @param {*} expected - Expected return value
 * @param {string} comparisonType - Type of comparison: "exact", "array_equals", "number_equals", "contains"
 * @returns {boolean} - True if match, false otherwise
 */
export function compareOutput(actual, expected, comparisonType = 'exact') {
    console.log('🔍     [compareOutput] Comparing:', {
        actual: JSON.stringify(actual),
        expected: JSON.stringify(expected),
        comparisonType
    });

    let result = false;

    switch (comparisonType) {
        case 'boolean_equals':
            // Compare booleans (normalize string "true"/"false")
            let boolActual = actual;
            let boolExpected = expected;

            if (boolActual === 'true' || boolActual === true) boolActual = true;
            else if (boolActual === 'false' || boolActual === false) boolActual = false;

            if (boolExpected === 'true' || boolExpected === true) boolExpected = true;
            else if (boolExpected === 'false' || boolExpected === false) boolExpected = false;

            result = (typeof boolActual === 'boolean' && typeof boolExpected === 'boolean') && (boolActual === boolExpected);
            console.log('🔍     [compareOutput] Boolean comparison:', {
                actual, expected,
                boolActual, boolExpected,
                result
            });
            break;

        case 'exact':
            // Exact JSON comparison
            result = JSON.stringify(actual) === JSON.stringify(expected);
            console.log('🔍     [compareOutput] Exact comparison (JSON):', {
                actualStr: JSON.stringify(actual),
                expectedStr: JSON.stringify(expected),
                result
            });
            break;

        case 'array_equals':
            // Compare arrays element by element (deep equality for nested arrays/objects)
            if (!Array.isArray(actual) || !Array.isArray(expected)) {
                console.log('🔍     [compareOutput] Array comparison failed: one is not an array', {
                    actualIsArray: Array.isArray(actual),
                    expectedIsArray: Array.isArray(expected)
                });
                result = false;
                break;
            }
            if (actual.length !== expected.length) {
                console.log('🔍     [compareOutput] Array length mismatch:', {
                    actualLength: actual.length,
                    expectedLength: expected.length
                });
                result = false;
                break;
            }

            // Deep equality helper (supports arrays and plain objects)
            const deepEqual = (a, b) => {
                if (a === b) return true;
                if (Array.isArray(a) && Array.isArray(b)) {
                    if (a.length !== b.length) return false;
                    for (let i = 0; i < a.length; i++) {
                        if (!deepEqual(a[i], b[i])) return false;
                    }
                    return true;
                }
                if (a && typeof a === 'object' && b && typeof b === 'object') {
                    const aKeys = Object.keys(a).sort();
                    const bKeys = Object.keys(b).sort();
                    if (aKeys.length !== bKeys.length) return false;
                    for (let i = 0; i < aKeys.length; i++) {
                        const k = aKeys[i];
                        if (k !== bKeys[i]) return false;
                        if (!deepEqual(a[k], b[k])) return false;
                    }
                    return true;
                }
                return false;
            };

            // If arrays of coordinate pairs (e.g., [[r,c],...]), compare as unordered sets
            const isCoordPairArray = arr => Array.isArray(arr) && arr.every(it => Array.isArray(it) && it.length === 2 && typeof it[0] === 'number' && typeof it[1] === 'number');
            if (isCoordPairArray(actual) && isCoordPairArray(expected)) {
                const keyOf = p => `${p[0]},${p[1]}`;
                const actualSet = new Set(actual.map(keyOf));
                const expectedSet = new Set(expected.map(keyOf));
                if (actualSet.size !== expectedSet.size) {
                    console.log('🔍     [compareOutput] Coordinate set size mismatch:', { actualSize: actualSet.size, expectedSize: expectedSet.size });
                    result = false;
                } else {
                    // Check every expected pair present in actual
                    let allPresent = true;
                    for (const k of expectedSet) {
                        if (!actualSet.has(k)) { allPresent = false; console.log('🔍     [compareOutput] Missing pair in actual:', k); break; }
                    }
                    result = allPresent;
                }
            } else {
                result = actual.every((val, idx) => {
                    const exp = expected[idx];
                    const match = deepEqual(val, exp);
                    if (!match) {
                        console.log(`🔍     [compareOutput] Element mismatch at index ${idx}:`, {
                            actual: val,
                            expected: exp
                        });
                    }
                    return match;
                });
            }
            console.log('🔍     [compareOutput] Array comparison:', result);
            break;

        case 'number_equals':
            // Compare numbers (allow for floating point differences)
            const actualNum = Number(actual);
            const expectedNum = Number(expected);
            result = !isNaN(actualNum) && !isNaN(expectedNum) && actualNum === expectedNum;
            console.log('🔍     [compareOutput] Number comparison:', {
                actualNum,
                expectedNum,
                result
            });
            break;



        default:
            console.warn('⚠️ Unknown comparison type:', comparisonType);
            result = JSON.stringify(actual) === JSON.stringify(expected);
            console.log('🔍     [compareOutput] Default (exact) comparison:', result);
    }

    return result;
}

/**
 * Validate N-Queen Solution
 * @param {Array} actual - Actual solution (array of [row, col] or array of rol indices if simplified)
 * @param {number} n - Board size (N)
 * @returns {boolean} - True if valid
 */
export function isValidNQueenSolution(actual, n) {
    if (!Array.isArray(actual)) return false;

    // Check if it's a valid solution
    // A solution is valid if:
    // 1. It has N queens
    // 2. No two queens share the same row, column, or diagonal

    // Normalize format: actual can be [[r,c], [r,c]] or [c1, c2, c3, c4] (row indices implied)
    let queens = [];
    if (actual.length > 0 && Array.isArray(actual[0])) {
        queens = actual;
    } else {
        // Assuming actual is array of column indices for each row 0..N-1
        queens = actual.map((col, row) => [row, col]);
    }

    if (queens.length !== n) {
        console.log(`🔍 [isValidNQueenSolution] Invalid count: got ${queens.length}, expected ${n}`);
        return false;
    }

    // Check constraints
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const [r1, c1] = queens[i];
            const [r2, c2] = queens[j];

            // Same row
            if (r1 === r2) return false;
            // Same column
            if (c1 === c2) return false;
            // Same diagonal
            if (Math.abs(r1 - r2) === Math.abs(c1 - c2)) return false;
        }
    }

    return true;
}
