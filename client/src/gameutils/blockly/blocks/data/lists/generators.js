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

    // Clean Mode: simple push
    if (javascriptGenerator.isCleanMode) {
      return `${list}.push(${item});\n`;
    }

    // Runtime: delegate to context-injected listPush (handles visuals)
    const listName = list.trim();
    return `await listPush(${list}, ${item}, '${listName}');\n`;
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
    return [`${list}[${list}.length - 1]`, javascriptGenerator.ORDER_MEMBER];
  };

  javascriptGenerator.forBlock["lists_remove_first_return"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`${list}.shift()`, javascriptGenerator.ORDER_MEMBER];
  };

  javascriptGenerator.forBlock["lists_get_first"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`${list}[0]`, javascriptGenerator.ORDER_MEMBER];
  };

  javascriptGenerator.forBlock["lists_getIndex"] = function (block) {
    const mode = block.getFieldValue('MODE');
    const where = block.getFieldValue('WHERE');
    const list = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]';
    const at = javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '0';

    let indexCode = '';
    if (where === 'FIRST') indexCode = '0';
    else if (where === 'LAST') indexCode = `${list}.length - 1`;
    else if (where === 'FROM_START') indexCode = at;
    else if (where === 'FROM_END') indexCode = `${list}.length - 1 - ${at}`;
    else if (where === 'RANDOM') indexCode = `Math.floor(Math.random() * ${list}.length)`;

    if (mode === 'GET') {
      return [`${list}[${indexCode}]`, javascriptGenerator.ORDER_MEMBER];
    } else if (mode === 'GET_REMOVE') {
      return [`${list}.splice(${indexCode}, 1)[0]`, javascriptGenerator.ORDER_FUNCTION_CALL];
    } else {
      return `${list}.splice(${indexCode}, 1);\n`;
    }
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
    return [`${list}.length`, javascriptGenerator.ORDER_ATOMIC];
  };

  javascriptGenerator.forBlock["lists_find_min_index"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const exclude = javascriptGenerator.valueToCode(block, 'EXCLUDE', javascriptGenerator.ORDER_MEMBER) || 'null';
    if (javascriptGenerator.isCleanMode) {
      return [`findMinIndex(${list})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    }
    return [`await findMinIndex(${list}, ${exclude})`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["lists_find_max_index"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    // Clean Mode
    if (javascriptGenerator.isCleanMode) {
      return [`lists_find_max_index(${list})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    }
    const exclude = javascriptGenerator.valueToCode(block, 'EXCLUDE', javascriptGenerator.ORDER_MEMBER) || 'null';
    return [`await findMaxIndex(${list}, ${exclude})`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["lists_get_at_index"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const index = javascriptGenerator.valueToCode(block, 'INDEX', javascriptGenerator.ORDER_NONE) ||
      javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '0';
    return [`${list}[${index}]`, javascriptGenerator.ORDER_MEMBER];
  };

  javascriptGenerator.forBlock["lists_remove_at_index"] = function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const index = javascriptGenerator.valueToCode(block, 'INDEX', javascriptGenerator.ORDER_ATOMIC) || '0';
    return `${list}.splice(${index}, 1);\n`;
  };

  // Text generator
  javascriptGenerator.forBlock["text"] = function (block) {
    const text = block.getFieldValue('TEXT');
    return [`"${text}"`, javascriptGenerator.ORDER_ATOMIC];
  };

  // Variable math operations
  javascriptGenerator.forBlock["var_math"] = function (block) {
    const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
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
    const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
    return [variable, javascriptGenerator.ORDER_ATOMIC];
  };

  // Override variables_set to detect MST_weight updates
  // variables_set generator removed (handled in blocklyDataGenerators.js)
}
