// Blockly Math Generators
import { javascriptGenerator } from "blockly/javascript";

export function defineMathGenerators() {
    javascriptGenerator.forBlock["math_number"] = function (block) {
        const num = block.getFieldValue('NUM');
        return [`${num}`, javascriptGenerator.ORDER_ATOMIC];
    };

    javascriptGenerator.forBlock["math_arithmetic"] = function (block) {
        const operator = block.getFieldValue('OP');
        const orderMap = {
            'ADD': javascriptGenerator.ORDER_ADDITION,
            'MINUS': javascriptGenerator.ORDER_SUBTRACTION,
            'MULTIPLY': javascriptGenerator.ORDER_MULTIPLICATION,
            'DIVIDE': javascriptGenerator.ORDER_DIVISION,
            'MODULO': javascriptGenerator.ORDER_MODULUS
        };
        const order = orderMap[operator] || javascriptGenerator.ORDER_ADDITION;

        const aOrder = javascriptGenerator.isCleanMode ? order : javascriptGenerator.ORDER_ATOMIC;
        const bOrder = javascriptGenerator.isCleanMode ? order : javascriptGenerator.ORDER_ATOMIC;

        const a = javascriptGenerator.valueToCode(block, 'A', aOrder);
        const b = javascriptGenerator.valueToCode(block, 'B', bOrder);

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

        if (javascriptGenerator.isCleanMode) {
            return [`${valueA} ${op} ${valueB}`, order];
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
        const inputOrder = javascriptGenerator.isCleanMode ? javascriptGenerator.ORDER_NONE : javascriptGenerator.ORDER_ATOMIC;
        const a = javascriptGenerator.valueToCode(block, 'A', inputOrder);
        const b = javascriptGenerator.valueToCode(block, 'B', inputOrder);
        const valueA = (a && a.trim()) ? a : '0';
        const valueB = (b && b.trim()) ? b : '0';
        return [`Math.min(${valueA}, ${valueB})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["math_min_max"] = function (block) {
        const operator = block.getFieldValue('OP');
        const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_ATOMIC) || '0';
        const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_ATOMIC) || '0';

        if (javascriptGenerator.isCleanMode) {
            const op = operator === 'MAX' ? 'Math.max' : 'Math.min';
            return [`${op}(${a}, ${b})`, javascriptGenerator.ORDER_FUNCTION_CALL];
        }

        const op = operator === 'MAX' ? 'Math.max' : 'Math.min';
        const code = `${op}(Number(${a}), Number(${b}))`;
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

        if (javascriptGenerator.isCleanMode) {
            return [`${a} ${op} ${b}`, javascriptGenerator.ORDER_RELATIONAL];
        }

        const code = `Number(${a}) ${op} Number(${b})`;
        return [code, javascriptGenerator.ORDER_RELATIONAL];
    };
}
