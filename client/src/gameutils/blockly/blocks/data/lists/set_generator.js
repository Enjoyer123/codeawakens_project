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
      let indexCode;
      if (where === 'FROM_START') indexCode = at;
      else if (where === 'FROM_END') indexCode = `${list}.length - 1 - ${at}`;
      else if (where === 'FIRST') indexCode = '0';
      else indexCode = `${list}.length - 1`;
      return `if (Array.isArray(${list})) ${list}.splice(${indexCode}, 1);\n`;
    } else if (mode === 'GET') {
      let indexCode;
      if (where === 'FROM_START') indexCode = at;
      else if (where === 'FROM_END') indexCode = `${list}.length - 1 - ${at}`;
      else if (where === 'FIRST') indexCode = '0';
      else indexCode = `${list}.length - 1`;
      return [`${list}[${indexCode}]`, javascriptGenerator.ORDER_MEMBER];
    } else {
      // SET mode
      const value = javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';
      if (where === 'FROM_START') {
        // Runtime: delegate to context-injected listSet (handles DP visuals)
        const listTrim = String(list || '').trim();
        const metaExpr = `{ coinIndex: typeof coinIndex !== 'undefined' ? coinIndex : 0, itemIndex: typeof itemIndex !== 'undefined' ? itemIndex : 0, r: typeof r !== 'undefined' ? r : 0, c: typeof c !== 'undefined' ? c : 0 }`;
        if (mode === 'INSERT') {
          return `${list}.splice(${at}, 0, ${value});\n`;
        }
        return `await listSet(${list}, ${at}, ${value}, '${listTrim}', ${metaExpr});\n`;
      } else if (where === 'FROM_END') {
        return `${list}[${list}.length - 1 - ${at}] = ${value};\n`;
      } else {
        const idx = where === 'FIRST' ? '0' : `${list}.length - 1`;
        return `${list}[${idx}] = ${value};\n`;
      }
    }
  };
}
