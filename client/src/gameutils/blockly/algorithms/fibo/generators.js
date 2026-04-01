import { javascriptGenerator } from "blockly/javascript";

export function defineFiboGenerators() {
    javascriptGenerator.forBlock["fibo_call"] = function (block) {
        const n = javascriptGenerator.valueToCode(block, 'N', javascriptGenerator.ORDER_NONE) || '0';
        return `trackFiboDecision('call', ${n});\n`;
    };

    javascriptGenerator.forBlock["fibo_base_case"] = function (block) {
        const val = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE) || '0';
        return `trackFiboDecision('base_case', null, ${val});\n`;
    };

    javascriptGenerator.forBlock["fibo_return"] = function (block) {
        const val = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE) || '0';
        return `trackFiboDecision('return', null, ${val});\n`;
    };
}
