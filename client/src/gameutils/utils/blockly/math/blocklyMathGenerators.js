// Blockly Math Generators
import { javascriptGenerator } from "blockly/javascript";

export function defineMathGenerators() {
    javascriptGenerator.forBlock["math_number"] = function (block) {
        const num = block.getFieldValue('NUM');
        return [`${num}`, javascriptGenerator.ORDER_ATOMIC];
    };

    javascriptGenerator.forBlock["math_arithmetic"] = function (block) {
        const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_ATOMIC);
        const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_ATOMIC);
        const operator = block.getFieldValue('OP');

        const valueA = (a && a.trim()) ? a : '0';
        const valueB = (b && b.trim()) ? b : '0';

        let op;
        switch (operator) {
            case 'ADD': op = '+'; break;
            case 'MINUS': op = '-'; break;
            case 'MULTIPLY': op = '*'; break;
            case 'DIVIDE': op = '/'; break;
            case 'MODULO': op = '%'; break;
            default: op = '+';
        }

        return [`(${valueA} ${op} ${valueB})`, javascriptGenerator.ORDER_ATOMIC];
    };

    javascriptGenerator.forBlock["math_single"] = function (block) {
        const operator = block.getFieldValue('OP');
        const num = javascriptGenerator.valueToCode(block, 'NUM', javascriptGenerator.ORDER_NONE) || '0';
        let code;
        switch (operator) {
            case 'CEIL': code = `Math.ceil(${num})`; break;
            case 'FLOOR': code = `Math.floor(${num})`; break;
            case 'ROUND': code = `Math.round(${num})`; break;
            case 'ROOT': code = `Math.sqrt(${num})`; break;
            default: code = `${num}`;
        }
        return [code, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["math_min"] = function (block) {
        const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_ATOMIC);
        const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_ATOMIC);
        const valueA = (a && a.trim()) ? a : '0';
        const valueB = (b && b.trim()) ? b : '0';
        return [`Math.min(${valueA}, ${valueB})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["math_min_max"] = function (block) {
        const operator = block.getFieldValue('OP');
        const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_ATOMIC) || '0';
        const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_ATOMIC) || '0';

        const code = `(function() {
      const _vA = ${a};
      const _vB = ${b};
      const _nA = Number(_vA);
      const _nB = Number(_vB);
      const _res = ${operator === 'MAX' ? 'Math.max(_nA, _nB)' : 'Math.min(_nA, _nB)'};
      if (isNaN(_res)) console.warn('[DEBUG-MATH] math_min_max resulted in NaN:', { a: _nA, b: _nB, op: '${operator}' });
      else if (_nA !== 1000000 || _nB !== 1000000) {
         console.log('[DEBUG-MATH] ' + ${JSON.stringify(operator)} + '(' + _nA + ', ' + _nB + ') result:', _res);
      }
      return _res;
    })()`;
        return [code, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["math_compare"] = function (block) {
        const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_ATOMIC) || '0';
        const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_ATOMIC) || '0';
        const operator = block.getFieldValue('OP');

        let op;
        switch (operator) {
            case 'EQ': op = '==='; break;
            case 'NEQ': op = '!=='; break;
            case 'LT': op = '<'; break;
            case 'LTE': op = '<='; break;
            case 'GT': op = '>'; break;
            case 'GTE': op = '>='; break;
            default: op = '===';
        }

        const code = `(function() {
      const valA = (typeof ${a} === 'number') ? ${a} : Number(${a});
      const valB = (typeof ${b} === 'number') ? ${b} : Number(${b});
      const res = valA ${op} valB;
      if (!isNaN(valA) && !isNaN(valB)) {
        console.log('[DEBUG-COMPARE]', { a: valA, b: valB, op: '${op}', result: res });
      }
      return res;
    })()`;
        return [code, javascriptGenerator.ORDER_RELATIONAL];
    };
}
