// Special Math Generators for Algorithm Visual Feedback (Knapsack, Ant DP)
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

export function defineSpecialMathGenerators() {
    javascriptGenerator.forBlock["math_max"] = function (block) {
        const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_ATOMIC) || '0';
        const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_ATOMIC) || '0';
        return [`Math.max(${a}, ${b})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };
}

