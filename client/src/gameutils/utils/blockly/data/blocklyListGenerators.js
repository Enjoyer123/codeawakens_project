// Blockly List Operation Generators
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

export function defineListGenerators() {
  // Create empty list
  javascriptGenerator.forBlock["lists_create_empty"] = function (block) {
    return ["[]", javascriptGenerator.ORDER_ATOMIC];
  };

  // Add item to list
  javascriptGenerator.forBlock["lists_add_item"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const item = javascriptGenerator.valueToCode(block, 'ITEM', javascriptGenerator.ORDER_NONE) || 'null';
    const listCode = list.trim();
    const isVisited = listCode.includes('visited') || listCode.includes('visit');
    const isContainer = listCode.includes('container') || listCode.includes('stack');
    const isPQ = listCode.includes('PQ') || listCode.includes('pq');
    const isMSTEdges = listCode.includes('MST_edges') || listCode.includes('mst_edges');

    if (isVisited) {
      return `${list}.push(${item});\nconsole.log('[DEBUG-PQ-PUSH] Added to visited:', ${item});\nawait markVisitedWithVisual(${item});\n`;
    } else if (isContainer) {
      return `${list}.push(${item});\nconsole.log('[DEBUG-PQ-PUSH] Added to container:', ${item});\nawait showPathUpdateWithVisual(${item});\n`;
    } else if (isPQ) {
      return `${list}.push(${item});\nconsole.log('[DEBUG-PQ-PUSH] Added to PQ:', JSON.stringify(${item}));\nupdateDijkstraPQ(${list});\n`;
    } else if (isMSTEdges) {
      return `${list}.push(${item});\nconsole.log('[DEBUG-MST-PUSH] Added to MST:', JSON.stringify(${item}));\nshowMSTEdgesFromList(${list});\n`;
    }
    return `${list}.push(${item});\nconsole.log('[DEBUG-LIST-PUSH] Added to list:', ${item});\n`;
  };

  javascriptGenerator.forBlock["lists_remove_last"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return `${list}.pop();\n`;
  };

  javascriptGenerator.forBlock["lists_remove_last_return"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`${list}.pop()`, javascriptGenerator.ORDER_MEMBER];
  };

  javascriptGenerator.forBlock["lists_get_last"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`(function() {
      try {
        const listVar = (${list});
        if (!listVar || !Array.isArray(listVar) || listVar.length === 0) return undefined;
        return listVar[listVar.length - 1];
      } catch (e) {
        console.warn('lists_get_last error:', e);
        return undefined;
      }
    })()`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["lists_remove_first_return"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`${list}.shift()`, javascriptGenerator.ORDER_MEMBER];
  };

  javascriptGenerator.forBlock["lists_get_first"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`(function() {
      try {
        const listVar = (${list});
        if (!listVar || !Array.isArray(listVar) || listVar.length === 0) return undefined;
        return listVar[0];
      } catch (e) {
        console.warn('lists_get_first error:', e);
        return undefined;
      }
    })()`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["lists_getIndex"] = function (block) {
    const mode = block.getFieldValue('MODE');
    const where = block.getFieldValue('WHERE');
    const list = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]';
    const at = javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_ATOMIC) || '0';

    const body = `(function() {
      try {
        const listVar = (${list});
        if (!listVar || !Array.isArray(listVar)) return undefined;
        let idx;
        if ('${where}' === 'FIRST') idx = 0;
        else if ('${where}' === 'LAST') idx = listVar.length - 1;
        else if ('${where}' === 'RANDOM') idx = Math.floor(Math.random() * listVar.length);
        else {
          const rawIdx = (${at});
          const n = (typeof rawIdx === 'number') ? rawIdx : Number(rawIdx);
          if (!Number.isFinite(n)) return undefined;
          idx = ('${where}' === 'FROM_END') ? (listVar.length - 1 - n) : n;
        }

        if (!Number.isFinite(idx) || idx < 0 || idx >= listVar.length) return undefined;

        if ('${mode}' === 'GET') return listVar[idx];
        if ('${mode}' === 'GET_REMOVE') return listVar.splice(idx, 1)[0];
        if ('${mode}' === 'REMOVE') { listVar.splice(idx, 1); return undefined; }
        return undefined;
      } catch (e) {
        console.warn('lists_getIndex error:', e);
        return undefined;
      }
    })()`;

    if (mode === 'REMOVE') {
      return `${body};\n`;
    }
    return [body, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["lists_contains"] = function (block) {
    const item = javascriptGenerator.valueToCode(block, 'ITEM', javascriptGenerator.ORDER_EQUALITY) || 'null';
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`${list}.includes(${item})`, javascriptGenerator.ORDER_EQUALITY];
  };

  javascriptGenerator.forBlock["lists_concat"] = function (block) {
    const list1 = javascriptGenerator.valueToCode(block, 'LIST1', javascriptGenerator.ORDER_ADDITION) || '[]';
    const list2 = javascriptGenerator.valueToCode(block, 'LIST2', javascriptGenerator.ORDER_ADDITION) || '[]';
    return [`${list1}.concat(${list2})`, javascriptGenerator.ORDER_ADDITION];
  };

  javascriptGenerator.forBlock["lists_isEmpty"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`${list}.length === 0`, javascriptGenerator.ORDER_EQUALITY];
  };

  javascriptGenerator.forBlock["lists_length"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`(function() { const listVar = ${list}; return listVar && Array.isArray(listVar) ? listVar.length : 0; })()`, javascriptGenerator.ORDER_MEMBER];
  };

  javascriptGenerator.forBlock["lists_find_min_index"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const exclude = javascriptGenerator.valueToCode(block, 'EXCLUDE', javascriptGenerator.ORDER_MEMBER) || 'null';
    return [`await findMinIndex(${list}, ${exclude})`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["lists_find_max_index"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const exclude = javascriptGenerator.valueToCode(block, 'EXCLUDE', javascriptGenerator.ORDER_MEMBER) || 'null';
    return [`await findMaxIndex(${list}, ${exclude})`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["lists_get_at_index"] = function (block) {
    const listRaw = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER);
    let list = (typeof listRaw === 'string' ? listRaw : '[]') || '[]';
    if (list.includes('[object Object]')) {
      console.warn('lists_get_at_index detected [object Object] in list input. Falling back to []. Raw:', listRaw);
      list = '[]';
    }
    let indexCode = '';
    if (block.getInput('INDEX')) {
      const val = javascriptGenerator.valueToCode(block, 'INDEX', javascriptGenerator.ORDER_SUBTRACTION);
      if (typeof val === 'string') indexCode = val;
    }
    if (!indexCode && block.getInput('AT')) {
      const val = javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_SUBTRACTION);
      if (typeof val === 'string') indexCode = val;
    }
    const index = indexCode || '0';

    return [`(function() { 
      try {
        const _safe_list_ = (${list});
        const _safe_idx_raw_ = (${index});
        let _safe_result_ = undefined;
        
        _safe_result_ = (_safe_list_ && _safe_list_[Number(_safe_idx_raw_)]);
        
        if (typeof _safe_list_ !== 'undefined' && _safe_list_ && Array.isArray(_safe_list_)) {
          if (_safe_list_.length < 20) {
            console.warn('[DEBUG-GET]', { index: _safe_idx_raw_, value: _safe_result_, list: _safe_list_ });
          }
        }

        return _safe_result_ !== undefined ? _safe_result_ : null;
      } catch (e) {
        console.error('lists_get_at_index [Safe] Unexpected error:', e);
        return null;
      }
    })()`, javascriptGenerator.ORDER_MEMBER];
  };

  javascriptGenerator.forBlock["lists_remove_at_index"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const index = javascriptGenerator.valueToCode(block, 'INDEX', javascriptGenerator.ORDER_ATOMIC) || '0';
    return `(function() {
      const _b_list = ${list};
      const _b_idx = ${index};
      console.log('[DEBUG-REMOVE]', { list: '${list}', idx: _b_idx });
      if (_b_list && Array.isArray(_b_list)) _b_list.splice(_b_idx, 1);
    })();\n`;
  };

  // Text generator
  javascriptGenerator.forBlock["text"] = function (block) {
    const text = block.getFieldValue('TEXT');
    return [`"${text}"`, javascriptGenerator.ORDER_ATOMIC];
  };

  // Variable math operations
  javascriptGenerator.forBlock["var_math"] = function (block) {
    const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE);
    const operator = block.getFieldValue('OP');
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ATOMIC) || '0';

    let code;
    switch (operator) {
      case 'ADD': code = `${variable} + ${value}`; break;
      case 'MINUS': code = `${variable} - ${value}`; break;
      case 'MULTIPLY': code = `${variable} * ${value}`; break;
      case 'DIVIDE': code = `${variable} / ${value}`; break;
      default: code = `${variable}`;
    }

    return [code, javascriptGenerator.ORDER_ADDITIVE];
  };

  javascriptGenerator.forBlock["get_var_value"] = function (block) {
    const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE);
    return [variable, javascriptGenerator.ORDER_ATOMIC];
  };

  // Override variables_set to detect MST_weight updates
  javascriptGenerator.forBlock["variables_set"] = function (block) {
    const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE);
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';

    const varFieldValue = block.getFieldValue('VAR');
    const varName = variable || varFieldValue;
    const varNameLower = String(varName).toLowerCase();

    const isMSTWeight = varNameLower === 'mst_weight' ||
      varNameLower === 'mstweight' ||
      varNameLower.includes('mst_weight') ||
      varNameLower.includes('mstweight');

    if (isMSTWeight) {
      console.log('✅ Detected MST_weight update:', { varName, variable, value });
      return `${variable} = ${value};\nupdateMSTWeight(${variable});\n`;
    }

    return `${variable} = ${value};\n`;
  };
}
