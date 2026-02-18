/**
 * Algorithm Hooks Registry
 * Centralizes algorithm-specific configurations to decouple them from core logic.
 */

// 1. N-Queen: Helper functions that need special procedure name handling
export const SPECIAL_PROCEDURE_NAMES = new Set([
    'safe', 'place', 'remove',  // N-Queen
    'nqueen_is_safe', 'nqueen_place', 'nqueen_remove' // Aliases
]);

// 2. Procedure Definition Hooks (Validation & Local Vars)
export const PROCEDURE_DEFINITION_HOOKS = {
    knapsack: {
        argsCount: 4,
        // Returns validation code string or null
        getValidationCode: (args) => `
      // Validate knapsack parameters
      if (!Array.isArray(${args[0]}) || !Array.isArray(${args[1]}) || 
          typeof ${args[2]} !== 'number' || isNaN(${args[2]}) ||
          typeof ${args[3]} !== 'number' || isNaN(${args[3]})) {
        console.error('knapsack: Invalid parameters', { w: ${args[0]}, v: ${args[1]}, i: ${args[2]}, j: ${args[3]} });
        return 0;
      }
    `
    },
    coinchange: {
        localVars: ['include', 'exclude', 'includeResult']
    }
};

// 3. Clean Mode Return Value Fallbacks
export const CLEAN_MODE_RETURNS = {
    PRIM: 'MST_weight',
    subsetSum: 'false',
    knapsack: '0',
    coinChange: 'Infinity'
};

// 4. Variable Set Hooks (e.g. MST weight update)
// Returns code string to inject after variable set
export const getVariableSetHook = (varName) => {
    const cleanName = varName ? varName.trim() : '';

    // MST Weight Tracking
    if (cleanName.toLowerCase() === 'mst_weight') {
        return `if (typeof updateMSTWeight === 'function') { updateMSTWeight(${cleanName}); }\n`;
    }

    return '';
};

// 5. DP Table Meta Expression — runtime safe-read of algorithm loop variables
// Used by lists_setIndex generator to pass context to listSet for DP visuals
export const DP_META_EXPR = `{ coinIndex: typeof coinIndex !== 'undefined' ? coinIndex : 0, itemIndex: typeof itemIndex !== 'undefined' ? itemIndex : 0, r: typeof r !== 'undefined' ? r : 0, c: typeof c !== 'undefined' ? c : 0 }`;
