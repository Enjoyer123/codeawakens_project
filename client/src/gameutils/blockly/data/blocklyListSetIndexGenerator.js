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

    if (javascriptGenerator.isCleanMode) {
      const value = javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';
      let indexCode = '';
      if (where === 'FROM_START') indexCode = at;
      else if (where === 'FROM_END') indexCode = `${list}.length - 1 - ${at}`;
      else if (where === 'FIRST') indexCode = '0';
      else if (where === 'LAST') indexCode = `${list}.length - 1`;

      if (mode === 'SET' || mode === 'INSERT') {
        return `${list}[${indexCode}] = ${value};\n`;
      } else if (mode === 'REMOVE') {
        return `${list}.splice(${indexCode}, 1);\n`;
      }
    }

    if (mode === 'REMOVE') {
      if (where === 'FROM_START') {
        return `(function() {
  try {
    const listVar = ${list};
    const idx = (typeof ${at} === 'number') ? ${at} : Number(${at});
    if (!listVar || !Array.isArray(listVar) || !Number.isFinite(idx) || idx < 0 || idx >= listVar.length) {
      return;
    }
    listVar.splice(idx, 1);
  } catch (e) {
    console.error('lists_setIndex REMOVE error:', e);
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
      return;
    }
    listVar.splice(idx, 1);
  } catch (e) {
    console.error('lists_setIndex REMOVE error:', e);
  }
})();\n`;
      } else {
        if (where === 'FIRST') {
          return `(function() {
  try {
    const listVar = ${list};
    if (!listVar || !Array.isArray(listVar) || listVar.length <= 0) {
      return;
    }
    listVar.splice(0, 1);
  } catch (e) {
    console.error('lists_setIndex REMOVE error:', e);
  }
})();\n`;
        } else {
          return `(function() {
  try {
    const listVar = ${list};
    if (!listVar || !Array.isArray(listVar) || listVar.length <= 0) {
      return;
    }
    listVar.splice(listVar.length - 1, 1);
  } catch (e) {
    console.error('lists_setIndex REMOVE error:', e);
  }
})();\n`;
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
      return undefined;
    }
    const idx = listVar.length - 1 - atIdx;
    if (!Number.isFinite(idx) || idx < 0 || idx >= listVar.length) {
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
      // SET mode
      const value = javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';
      if (where === 'FROM_START') {
        // DP table hooks
        let subsetSumHook = '';
        let coinChangeHook = '';
        let antDpHook = '';
        try {
          const listTrim = String(list || '').trim();
          const atTrim = String(at || '').trim();

          // Coin Change
          if (/\bdp\b/.test(listTrim)) {
            let coinIndexVarName = null;
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
            const rowExpr = coinIndexVarName || '0';
            coinChangeHook = `try { if (typeof updateCoinChangeCellVisual === 'function') updateCoinChangeCellVisual(${rowExpr}, ${atTrim}, ${value}, { kind: 'set' }); } catch (e) {}\n`;
          }

          // Subset Sum
          if (/\bcurr\b/.test(listTrim) && /\bcap\b/.test(atTrim)) {
            let itemVarName = null;
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
            if (itemVarName) {
              subsetSumHook = `try { if (typeof updateSubsetSumCellVisual === 'function') updateSubsetSumCellVisual(${itemVarName}, ${atTrim}, ${value}); } catch (e) {}\n`;
            }
          }

          // Ant DP
          if (/\bdpRow\b/i.test(listTrim) || /\bdp\b/i.test(listTrim)) {
            let rVarName = 'typeof r !== "undefined" ? r : 0';
            let cVarName = 'typeof c !== "undefined" ? c : 0';
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
            antDpHook = `try { if (typeof updateAntDpCellVisual === 'function') updateAntDpCellVisual(${rVarName}, ${cVarName}, (Number(${value}) || 0)); } catch (e) {}\n`;
          }
        } catch (e) { }

        return `(function() {
  try {
    const _b_list = ${list};
    const _b_at = ${at};
    const _b_val = ${value};
    let _b_idx = (typeof _b_at === 'number') ? _b_at : Number(_b_at);
    if (!Number.isFinite(_b_idx)) {
      try { _b_idx = parseInt(_b_at, 10); } catch (e) { }
    }
    if (!_b_list || !Array.isArray(_b_list) || !Number.isFinite(_b_idx) || _b_idx < 0) return;
    if (_b_idx >= _b_list.length) _b_list.length = _b_idx + 1;
    
    if ('${mode}' === 'INSERT') {
      _b_list.splice(_b_idx, 0, _b_val);
    } else {
      _b_list[_b_idx] = _b_val;
    }
${subsetSumHook}${coinChangeHook}${antDpHook}
  } catch (e) { }
})();\n`;
      } else if (where === 'FROM_END') {
        return `(function() {
  try {
    const listVar = ${list};
    const atIdx = (typeof ${at} === 'number') ? ${at} : Number(${at});
    if (!listVar || !Array.isArray(listVar)) return;
    const idx = (listVar.length - 1 - atIdx);
    if (idx >= 0 && idx < listVar.length) listVar[idx] = ${value};
  } catch (e) { }
})();\n`;
      } else {
        const idx = where === 'FIRST' ? '0' : 'listVar.length - 1';
        return `(function() {
  try {
    const listVar = ${list};
    if (listVar && Array.isArray(listVar) && listVar.length > 0) {
      listVar[${idx}] = ${value};
    }
  } catch (e) { }
})();\n`;
      }
    }
  };
}
