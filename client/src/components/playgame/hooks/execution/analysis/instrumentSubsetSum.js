/**
 * instrumentSubsetSum.js
 * 
 * Instrumentation and init code for Subset Sum (Backtrack) algorithm.
 */

import { wrapFunctionWithHook } from './instrumentationUtils';

/**
 * Instruments Subset Sum backtrack code with visual table step tracking.
 * Wraps the user's subsetSum function to call updateSubsetSumCellVisual on each recursive call.
 */
export const instrumentSubsetSum = (code, currentLevel) => {
    try {
        const isSubsetSumLevel = !!currentLevel?.subsetSumData;
        const looksLikeDPSubsetSum = /\bprev\b|\bcurr\b|\bitemIndex\b/.test(code);
        const hasSubsetSumFn = new RegExp(`(async\\s+)?function\\s+subsetSum\\d*\\s*\\(`).test(code);

        if (!isSubsetSumLevel || !hasSubsetSumFn || looksLikeDPSubsetSum) return code;

        code = wrapFunctionWithHook(code, {
            fnNamePattern: /subsetSum\d*/,
            minParams: 4,
            localVarDeclarations: 'var coin, include, exclude;',
            createWrapper: (implName, originalName, paramsStr, params) => {
                const [arrP, indexP, sumP, targetP] = params;
                return `
async function ${originalName}(${paramsStr}) {
  let __remain = null;
  try { __remain = (${targetP} - ${sumP}); } catch (e) {}
  try { if (__remain !== null && __remain >= 0 && typeof updateSubsetSumCellVisual === 'function') updateSubsetSumCellVisual(${indexP}, __remain, null, { kind: 'visit' }); } catch (e) {}
  const __res = await ${implName}(${arrP}, ${indexP}, ${sumP}, ${targetP});
  try { if (__remain !== null && __remain >= 0 && typeof updateSubsetSumCellVisual === 'function') updateSubsetSumCellVisual(${indexP}, __remain, __res, { kind: 'return' }); } catch (e) {}
  return __res;
}
`;
            }
        });
    } catch (e) {
        console.warn('[instrumentSubsetSum] Error:', e);
    }
    return code;
};

/**
 * Generates initialization code for Subset Sum variables from level data.
 */
export const getSubsetSumInitCode = (currentLevel) => {
    if (!currentLevel?.subsetSumData) return '';
    const { warriors = [], target_sum: targetSum = 0 } = currentLevel.subsetSumData;

    return `
      // Initialize subset sum variables from level data
      var warriors = ${JSON.stringify(warriors)};
      var target_sum = ${targetSum};
    `;
};
