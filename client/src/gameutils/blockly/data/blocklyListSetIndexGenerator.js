// Blockly List setIndex Generator with DP Table Hooks
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

export function defineListSetIndexGenerator() {
    // Override lists_setIndex to use 0-based indexing and add DP table hooks
    javascriptGenerator.forBlock["lists_setIndex"] = function (block) {
        const mode = block.getFieldValue('MODE');
        const where = block.getFieldValue('WHERE');
        const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
        const at = javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_ATOMIC) || '0';

        console.log(`🔧 lists_setIndex generator called: mode=${mode}, where=${where}, list=${list}, at=${at}`);

        if (mode === 'REMOVE') {
            if (where === 'FROM_START') {
                const code = `(function() {
  try {
    const listVar = ${list};
    const idx = (typeof ${at} === 'number') ? ${at} : Number(${at});
    if (!listVar || !Array.isArray(listVar) || !Number.isFinite(idx) || idx < 0 || idx >= listVar.length) {
      console.warn('lists_setIndex: Invalid REMOVE', { listVar, idx, listLength: listVar?.length });
      return;
    }
    listVar.splice(idx, 1);
  } catch (e) {
    console.error('lists_setIndex REMOVE error:', e);
  }
})();\n`;
                console.log(`🔧 Generated REMOVE code (safe): ${code}`);
                return code;
            } else if (where === 'FROM_END') {
                const code = `(function() {
  try {
    const listVar = ${list};
    const atIdx = (typeof ${at} === 'number') ? ${at} : Number(${at});
    if (!listVar || !Array.isArray(listVar) || !Number.isFinite(atIdx)) {
      console.warn('lists_setIndex: Invalid REMOVE', { listVar, idx: atIdx, listLength: listVar?.length });
      return;
    }
    const idx = (listVar.length - 1 - atIdx);
    if (!Number.isFinite(idx) || idx < 0 || idx >= listVar.length) {
      console.warn('lists_setIndex: Invalid REMOVE', { listVar, idx, listLength: listVar?.length });
      return;
    }
    listVar.splice(idx, 1);
  } catch (e) {
    console.error('lists_setIndex REMOVE error:', e);
  }
})();\n`;
                console.log(`🔧 Generated REMOVE code (safe): ${code}`);
                return code;
            } else {
                if (where === 'FIRST') {
                    const code = `(function() {
  try {
    const listVar = ${list};
    if (!listVar || !Array.isArray(listVar) || listVar.length <= 0) {
      console.warn('lists_setIndex: Invalid REMOVE', { listVar, idx: 0, listLength: listVar?.length });
      return;
    }
    listVar.splice(0, 1);
  } catch (e) {
    console.error('lists_setIndex REMOVE error:', e);
  }
})();\n`;
                    console.log(`🔧 Generated REMOVE code (safe): ${code}`);
                    return code;
                } else {
                    const code = `(function() {
  try {
    const listVar = ${list};
    if (!listVar || !Array.isArray(listVar) || listVar.length <= 0) {
      console.warn('lists_setIndex: Invalid REMOVE', { listVar, idx: -1, listLength: listVar?.length });
      return;
    }
    listVar.splice(listVar.length - 1, 1);
  } catch (e) {
    console.error('lists_setIndex REMOVE error:', e);
  }
})();\n`;
                    console.log(`🔧 Generated REMOVE code (safe): ${code}`);
                    return code;
                }
            }
        } else if (mode === 'GET') {
            if (where === 'FROM_START') {
                return [`(function() {
  try {
    const listVar = ${list};
    let idx = (typeof ${at} === 'number') ? ${at} : Number(${at});
    if (!Number.isFinite(idx)) { try { idx = parseInt(${at}, 10); } catch (e) { } }
    if (!listVar || !Array.isArray(listVar) || !Number.isFinite(idx) || idx < 0 || idx >= listVar.length) {
      console.warn('lists_setIndex: Invalid GET', { listVar, idx, listLength: listVar?.length });
      return undefined;
    }
    return listVar[idx];
  } catch (e) {
    console.error('lists_setIndex GET error:', e);
    return undefined;
  }
})()`, javascriptGenerator.ORDER_MEMBER];
            } else if (where === 'FROM_END') {
                return [`(function() {
  try {
    const listVar = ${list};
    let atIdx = (typeof ${at} === 'number') ? ${at} : Number(${at});
    if (!Number.isFinite(atIdx)) { try { atIdx = parseInt(${at}, 10); } catch (e) { } }
    if (!listVar || !Array.isArray(listVar) || !Number.isFinite(atIdx)) {
      console.warn('lists_setIndex: Invalid GET', { listVar, idx: atIdx, listLength: listVar?.length });
      return undefined;
    }
    const idx = listVar.length - 1 - atIdx;
    if (!Number.isFinite(idx) || idx < 0 || idx >= listVar.length) {
      console.warn('lists_setIndex: Invalid GET', { listVar, idx, listLength: listVar?.length });
      return undefined;
    }
    return listVar[idx];
  } catch (e) {
    console.error('lists_setIndex GET error:', e);
    return undefined;
  }
})()`, javascriptGenerator.ORDER_MEMBER];
            } else {
                if (where === 'FIRST') {
                    return [`(function() {
  try {
    const listVar = ${list};
    if (!listVar || !Array.isArray(listVar) || listVar.length <= 0) {
      console.warn('lists_setIndex: Invalid GET', { listVar, idx: 0, listLength: listVar?.length });
      return undefined;
    }
    return listVar[0];
  } catch (e) {
    console.error('lists_setIndex GET error:', e);
    return undefined;
  }
})()`, javascriptGenerator.ORDER_MEMBER];
                } else {
                    return [`(function() {
  try {
    const listVar = ${list};
    if (!listVar || !Array.isArray(listVar) || listVar.length <= 0) {
      console.warn('lists_setIndex: Invalid GET', { listVar, idx: -1, listLength: listVar?.length });
      return undefined;
    }
    return listVar[listVar.length - 1];
  } catch (e) {
    console.error('lists_setIndex GET error:', e);
    return undefined;
  }
})()`, javascriptGenerator.ORDER_MEMBER];
                }
            }
        } else {
            // SET mode - use standard Blockly generator if available
            const value = javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';
            if (where === 'FROM_START') {
                // DP table hooks for Subset Sum, Coin Change, and Ant DP
                let subsetSumHook = '';
                let coinChangeHook = '';
                let antDpHook = '';
                try {
                    const listTrim = String(list || '').trim();
                    const atTrim = String(at || '').trim();

                    // Coin Change: dp[amount] updates
                    try {
                        const isDp = /\bdp\b/.test(listTrim);
                        let coinIndexVarName = null;
                        try {
                            let p = block.getParent();
                            while (p) {
                                if (p.type === 'for_loop_dynamic' || p.type === 'for_index' || p.type === 'controls_for') {
                                    const varField = p.getFieldValue && p.getFieldValue('VAR');
                                    if (varField) {
                                        const resolved = javascriptGenerator.nameDB_.getName(varField, Blockly.Names.NameType.VARIABLE);
                                        if (resolved === 'coinIndex') coinIndexVarName = resolved;
                                    }
                                }
                                p = p.getParent();
                            }
                        } catch (e) { }

                        if (isDp) {
                            const rowExpr = coinIndexVarName || '0';
                            coinChangeHook = `try { if (typeof updateCoinChangeCellVisual === 'function') updateCoinChangeCellVisual(${rowExpr}, ${atTrim}, ${value}, { kind: 'set' }); } catch (e) {}\n`;
                        }
                    } catch (e) { }

                    const isCurr = /\bcurr\b/.test(listTrim);
                    const isCap = /\bcap\b/.test(atTrim);
                    let itemVarName = null;
                    try {
                        let p = block.getParent();
                        while (p) {
                            if (p.type === 'for_loop_dynamic' || p.type === 'for_index' || p.type === 'controls_for') {
                                const varField = p.getFieldValue && p.getFieldValue('VAR');
                                if (varField) {
                                    const resolved = javascriptGenerator.nameDB_.getName(varField, Blockly.Names.NameType.VARIABLE);
                                    if (resolved === 'itemIndex') itemVarName = resolved;
                                }
                            }
                            p = p.getParent();
                        }
                    } catch (e) { }

                    if (isCurr && isCap && itemVarName) {
                        subsetSumHook = `try { if (typeof updateSubsetSumCellVisual === 'function') updateSubsetSumCellVisual(${itemVarName}, ${atTrim}, ${value}); } catch (e) {}\n`;
                    }

                    // Ant DP: dpRow[c] updates inside loops (r, c)
                    try {
                        const listTrim = String(list || '').trim();
                        const isDpRow = /\bdpRow\b/i.test(listTrim) || /\bdp\b/i.test(listTrim);
                        let rVarName = 'typeof r !== "undefined" ? r : 0';
                        let cVarName = 'typeof c !== "undefined" ? c : 0';
                        try {
                            let p = block.getParent();
                            while (p) {
                                if (p.type === 'for_loop_dynamic' || p.type === 'for_index' || p.type === 'controls_for') {
                                    const varField = p.getFieldValue && p.getFieldValue('VAR');
                                    if (varField) {
                                        const resolved = javascriptGenerator.nameDB_.getName(varField, Blockly.Names.NameType.VARIABLE);
                                        if (resolved === 'r') rVarName = 'r';
                                        if (resolved === 'c') cVarName = 'c';
                                    }
                                }
                                p = p.getParent();
                            }
                        } catch (e) { }

                        if (isDpRow) {
                            antDpHook = `try { if (typeof updateAntDpCellVisual === 'function') updateAntDpCellVisual(${rVarName}, ${cVarName}, (Number(${value}) || 0)); } catch (e) {}\n`;
                        }
                    } catch (e) { }
                } catch (e) { }

                return `(function() {
  try {
    const _b_list = ${list};
    const _b_at = ${at};
    const _b_val = ${value};
    let _b_idx = (typeof _b_at === 'number') ? _b_at : Number(_b_at);
    if (!Number.isFinite(_b_idx)) {
      try { _b_idx = parseInt(_b_at, 10); } catch (e) { /* ignore */ }
    }
    const isIndexOk = (typeof _b_idx === 'number') && (_b_idx === _b_idx) && _b_idx >= 0;
    const isArrayLike = !!_b_list && (Array.isArray(_b_list) || typeof _b_list.length === 'number');
    if (!isArrayLike || !isIndexOk) {
      console.warn('[DIAGNOSTIC] lists_setIndex: Invalid SET', { _b_list, _b_idx, listLength: _b_list?.length });
      return;
    }
    try {
      if (typeof _b_list.length === 'number' && _b_idx >= _b_list.length) _b_list.length = _b_idx + 1;
    } catch (e) { /* ignore */ }
    
    if ('${mode}' === 'INSERT') {
      _b_list.splice(_b_idx, 0, _b_val);
      console.log('[DEBUG-INSERT] ' + ${JSON.stringify(list)} + '[' + _b_idx + '] = ' + _b_val);
    } else {
      _b_list[_b_idx] = _b_val;
      console.log('[DEBUG-SET] ' + ${JSON.stringify(list)} + '[' + _b_idx + '] = ' + _b_val);
    }
${subsetSumHook}${coinChangeHook}${antDpHook}
  } catch (e) {
    console.error('lists_setIndex error:', e);
  }
})();\n`;
            } else if (where === 'FROM_END') {
                return `(function() {
  try {
    const listVar = ${list};
    const atIdx = (typeof ${at} === 'number') ? ${at} : Number(${at});
    if (!listVar || !Array.isArray(listVar) || !Number.isFinite(atIdx)) {
      return;
    }
    const idx = (listVar.length - 1 - atIdx);
    if (!Number.isFinite(idx) || idx < 0 || idx >= listVar.length) {
      console.warn('lists_setIndex: Invalid SET', { listVar, idx, listLength: listVar?.length });
      return;
    }
    listVar[idx] = ${value};
  } catch (e) {
    console.error('lists_setIndex SET error:', e);
  }
})();\n`;
            } else {
                if (where === 'FIRST') {
                    return `(function() {
  try {
    const listVar = ${list};
    if (!listVar || !Array.isArray(listVar) || listVar.length <= 0) {
      console.warn('lists_setIndex: Invalid SET', { listVar, idx: 0, listLength: listVar?.length });
      return;
    }
    listVar[0] = ${value};
  } catch (e) {
    console.error('lists_setIndex SET error:', e);
  }
})();\n`;
                } else {
                    return `(function() {
  try {
    const listVar = ${list};
    if (!listVar || !Array.isArray(listVar) || listVar.length <= 0) {
      console.warn('lists_setIndex: Invalid SET', { listVar, idx: -1, listLength: listVar?.length });
      return;
    }
    listVar[listVar.length - 1] = ${value};
  } catch (e) {
    console.error('lists_setIndex SET error:', e);
  }
})();\n`;
                }
            }
        }
    };
}
