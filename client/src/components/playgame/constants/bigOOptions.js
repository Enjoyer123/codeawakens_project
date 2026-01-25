/**
 * Big O Complexity Options
 * 
 * This file contains the configuration for Big O complexity selection.
 * Used in the Big O selector component.
 */

/**
 * Array of Big O complexity options
 * Each object contains:
 * - value: internal value for the option
 * - label: display label with Big O notation
 * - description: human-readable description
 */
export const BIG_O_OPTIONS = [
    {
        value: '',
        label: '-- เลือก Big O --',
        description: 'Please select'
    },
    {
        value: 'constant',
        label: 'O(1) - Constant',
        description: 'Constant time'
    },
    {
        value: 'log_n',
        label: 'O(log n) - Logarithmic',
        description: 'Logarithmic time'
    },
    {
        value: 'n',
        label: 'O(n) - Linear',
        description: 'Linear time'
    },
    {
        value: 'n_log_n',
        label: 'O(n log n) - Linearithmic',
        description: 'Linearithmic time'
    },
    {
        value: 'n2',
        label: 'O(n²) - Quadratic',
        description: 'Quadratic time'
    },
    {
        value: 'n3',
        label: 'O(n³) - Cubic',
        description: 'Cubic time'
    },
    {
        value: 'pow2_n',
        label: 'O(2ⁿ) - Exponential',
        description: 'Exponential time'
    },
    {
        value: 'factorial',
        label: 'O(n!) - Factorial',
        description: 'Factorial time'
    }
];
