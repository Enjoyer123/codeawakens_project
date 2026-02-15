/**
 * instrumentOther.js
 * 
 * Instrumentation and init code for:
 * - Rope Partition
 * - Knapsack
 * - Simplified text code helpers
 */

/**
 * Instruments Rope Partition code:
 * Ensures 'result' variable exists and captures the solve() call return value.
 */
export const instrumentRopePartition = (code, isRopePartition) => {
    if (!isRopePartition) return code;

    const hasResultAssign = code.includes('result =') || code.includes('result=');
    if (hasResultAssign) return code;

    // Auto-inject result variable and assignment
    if (!code.includes('var result') && !code.includes('let result')) {
        code = 'var result;\n' + code;
    }

    const regex = /^[\s;]*(await\s+)?(solve\s*\()/gm;
    code = code.replace(regex, (match) => {
        const keyIdx = match.search(/(await|solve)/);
        return keyIdx !== -1
            ? match.substring(0, keyIdx) + 'result = ' + match.substring(keyIdx)
            : 'result = ' + match;
    });

    return code;
};

/**
 * Generates initialization code for Knapsack variables from level data.
 */
export const getKnapsackInitCode = (currentLevel) => {
    if (!currentLevel?.knapsackData) return '';
    const { items = [], capacity = 0 } = currentLevel.knapsackData;
    const weights = items.map(item => item.weight);
    const values = items.map(item => item.price);
    const n = weights.length;

    return `
      // Initialize knapsack variables from level data
      var weights = ${JSON.stringify(weights)};
      var values = ${JSON.stringify(values)};
      var n = ${n};
      var capacity = ${capacity};
    `;
};

/**
 * Generates initialization code for Rope Partition.
 */
export const getRopePartitionInitCode = (isRopePartition) => {
    if (!isRopePartition) return '';
    return `
      // Initialize cuts array
      if (typeof cuts === 'undefined') var cuts = [];
      else cuts = [];
      
      // Helper to update visualization
      async function updateRopeVisuals() {
         try {
            if (typeof globalThis !== 'undefined' && globalThis.__ropePartition_api && typeof globalThis.__ropePartition_api.updateCuts === 'function') {
               globalThis.__ropePartition_api.updateCuts(cuts);
               await new Promise(r => setTimeout(r, globalThis.__ropePartition_delay || 300));
            }
         } catch(e) {}
      }

      // Define addCut
      async function addCut(len) {
         cuts.push(len);
         await updateRopeVisuals();
      }
      
      // Define removeCut
      async function removeCut() {
         cuts.pop();
         await updateRopeVisuals();
      }
      
      // Expose to globalThis for safety
      globalThis.addCut = addCut;
      globalThis.removeCut = removeCut;
      globalThis.cuts = cuts;
    `;
};

/**
 * Generates simplified helper aliases for text code users.
 */
export const getSimplifiedHelpersInitCode = () => {
    return `
        /* Simplified Visual Helpers for Text Code */
        
        // Knapsack
        var selectItem = (typeof selectKnapsackItemVisual === 'function') ? selectKnapsackItemVisual : (x) => {};
        var unselectItem = (typeof unselectKnapsackItemVisual === 'function') ? unselectKnapsackItemVisual : (x) => {};
        
        // Subset Sum
        var addToSide1 = (typeof addWarriorToSide1Visual === 'function') ? addWarriorToSide1Visual : (x) => {};
        var addToSide2 = (typeof addWarriorToSide2Visual === 'function') ? addWarriorToSide2Visual : (x) => {};
        
        // Coin Change
        var trackDecision = (typeof trackCoinChangeDecision === 'function') ? trackCoinChangeDecision : (amt, idx, inc, exc) => {};
        var addWarrior = (typeof addWarriorToSelectionVisual === 'function') ? addWarriorToSelectionVisual : (x) => {};
        
        
        // Rope Partition
        var pushNode = (typeof pushRopeNode === 'function') ? pushRopeNode : (cut, sum) => {};
        var popNode = (typeof popRopeNode === 'function') ? popRopeNode : () => {};
        var updateStatus = (typeof updateRopeNodeStatus === 'function') ? 
            (status) => { 
                if (typeof ropeStack !== 'undefined' && ropeStack.length > 0) {
                    updateRopeNodeStatus(ropeStack[ropeStack.length - 1], status);
                }
            } : (status) => {};
        var getCuts = (typeof getRopeCuts === 'function') ? getRopeCuts : () => [2, 3, 5];
    `;
};
