/**
 * instrumentCoinChange.js
 * 
 * Instrumentation and init code for Coin Change (Backtrack) algorithm.
 */

import { wrapFunctionWithHook } from './instrumentationUtils';

/**
 * Instruments Coin Change backtrack code with visual table step tracking.
 * Wraps the user's coinChange function to call updateCoinChangeCellVisual on each recursive call.
 */
export const instrumentCoinChange = (code, currentLevel) => {
    try {
        const isCoinChangeLevel = !!currentLevel?.coinChangeData;
        const looksLikeDPCoinChange = /\bdp\b|\bcoinIndex\b|\bcand\b/.test(code);
        const hasCoinChangeFn = new RegExp(`(async\\s+)?function\\s+coinChange\\d*\\s*\\(`).test(code);

        if (!isCoinChangeLevel || !hasCoinChangeFn || looksLikeDPCoinChange) return code;

        code = wrapFunctionWithHook(code, {
            fnNamePattern: /coinChange\d*/,
            minParams: 3,
            localVarDeclarations: 'var coin, include, exclude;',
            createWrapper: (implName, originalName, paramsStr, params) => {
                const [amountP, coinsP, indexP] = params;
                return `
async function ${originalName}(${paramsStr}) {
  let __amt = null;
  try { __amt = (${amountP}); } catch (e) {}
  try { if (__amt !== null && __amt >= 0 && typeof updateCoinChangeCellVisual === 'function') updateCoinChangeCellVisual(${indexP}, __amt, null, { kind: 'visit' }); } catch (e) {}
  const __res = await ${implName}(${amountP}, ${coinsP}, ${indexP});
  try { if (__amt !== null && __amt >= 0 && typeof updateCoinChangeCellVisual === 'function') updateCoinChangeCellVisual(${indexP}, __amt, __res, { kind: 'return' }); } catch (e) {}
  return __res;
}
`;
            }
        });
    } catch (e) {
        console.warn('[instrumentCoinChange] Error:', e);
    }
    return code;
};

/**
 * Generates initialization code for Coin Change variables from level data.
 */
export const getCoinChangeInitCode = (currentLevel) => {
    if (!currentLevel?.coinChangeData) return '';
    const { monster_power: monsterPower = 32, warriors = [1, 5, 10, 25] } = currentLevel.coinChangeData;

    return `
      // Initialize coin change variables from level data
      var monster_power = Math.round(Number(${monsterPower}));
      var warriors = ${JSON.stringify(warriors)}.map(w => Math.round(Number(w)));
    `;
};
