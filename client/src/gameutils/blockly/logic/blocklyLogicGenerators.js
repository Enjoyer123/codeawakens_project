// Blockly Logic Generators
import { javascriptGenerator } from "blockly/javascript";

export function defineLogicGenerators() {
    javascriptGenerator.forBlock["if_else"] = function (block) {
        const condition = javascriptGenerator.valueToCode(block, 'CONDITION', javascriptGenerator.ORDER_NONE) || 'false';
        const ifCode = javascriptGenerator.statementToCode(block, 'IF_DO');
        const elseCode = javascriptGenerator.statementToCode(block, 'ELSE_DO');
        return `if (${condition}) {\n${ifCode}} else {\n${elseCode}}\n`;
    };

    javascriptGenerator.forBlock["if_only"] = function (block) {
        const condition = javascriptGenerator.valueToCode(block, 'CONDITION', javascriptGenerator.ORDER_NONE) || 'false';
        const doCode = javascriptGenerator.statementToCode(block, 'DO');
        return `if (${condition}) {\n${doCode}}\n`;
    };

    javascriptGenerator.forBlock["if_return"] = function (block) {
        const condition = javascriptGenerator.valueToCode(block, 'CONDITION', javascriptGenerator.ORDER_NONE) || 'false';
        return `if (${condition}) {\n  return;\n}\n`;
    };

    javascriptGenerator.forBlock["logic_compare"] = function (block) {
        const aOrder = javascriptGenerator.isCleanMode ? javascriptGenerator.ORDER_NONE : javascriptGenerator.ORDER_ATOMIC;
        const bOrder = javascriptGenerator.isCleanMode ? javascriptGenerator.ORDER_NONE : javascriptGenerator.ORDER_ATOMIC;
        const a = javascriptGenerator.valueToCode(block, 'A', aOrder);
        const b = javascriptGenerator.valueToCode(block, 'B', bOrder);
        const operator = block.getFieldValue('OP');

        const valueA = (a && a.trim()) ? a : '0';
        const valueB = (b && b.trim()) ? b : '0';

        const opMap = {
            'EQ': '==',
            'NEQ': '!=',
            'LT': '<',
            'LTE': '<=',
            'GT': '>',
            'GTE': '>='
        };
        const op = opMap[operator] || '==';

        // Clean Mode for Text Code Generation
        if (javascriptGenerator.isCleanMode) {
            return [`${valueA} ${op} ${valueB}`, javascriptGenerator.ORDER_RELATIONAL];
        }

        const code = `(function() {
      const _vA = ${valueA};
      const _vB = ${valueB};
      const _nA = Number(_vA);
      const _nB = Number(_vB);
      const _res = _nA ${op} _nB;
      if (!isNaN(_nA) && !isNaN(_nB)) {
        console.log('[DEBUG-COMPARE] ' + _nA + ' ${op} ' + _nB + ' result:', _res);
      }
      return _res;
    })()`;
        return [code, javascriptGenerator.ORDER_RELATIONAL];
    };

    javascriptGenerator.forBlock["logic_boolean"] = function (block) {
        const bool = block.getFieldValue('BOOL');
        return [`${bool === 'TRUE'}`, javascriptGenerator.ORDER_ATOMIC];
    };

    javascriptGenerator.forBlock["logic_null"] = function (block) {
        return ["null", javascriptGenerator.ORDER_ATOMIC];
    };

    javascriptGenerator.forBlock["logic_negate"] = function (block) {
        const bool = javascriptGenerator.valueToCode(block, 'BOOL', javascriptGenerator.ORDER_LOGICAL_NOT) || 'false';
        if (javascriptGenerator.isCleanMode) {
            return [`!${bool}`, javascriptGenerator.ORDER_LOGICAL_NOT];
        }
        return [`(!${bool})`, javascriptGenerator.ORDER_LOGICAL_NOT];
    };

    javascriptGenerator.forBlock["logic_operation"] = function (block) {
        const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_LOGICAL_AND) || 'false';
        const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_LOGICAL_AND) || 'false';
        const operator = block.getFieldValue('OP');

        const op = operator === 'AND' ? '&&' : '||';
        const order = operator === 'AND' ? javascriptGenerator.ORDER_LOGICAL_AND : javascriptGenerator.ORDER_LOGICAL_OR;

        if (javascriptGenerator.isCleanMode) {
            return [`${a} ${op} ${b}`, order];
        }

        return [`(${a} ${op} ${b})`, order];
    };

    javascriptGenerator.forBlock["found_monster"] = function (block) {
        return ['foundMonster()', javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["can_move_forward"] = function (block) {
        return ['canMoveForward()', javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["near_pit"] = function (block) {
        return ['nearPit()', javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["at_goal"] = function (block) {
        return ['atGoal()', javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["logic_not_in"] = function (block) {
        const item = javascriptGenerator.valueToCode(block, 'ITEM', javascriptGenerator.ORDER_EQUALITY) || 'null';
        const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
        return [`!${list}.includes(${item})`, javascriptGenerator.ORDER_LOGICAL_NOT];
    };
}
