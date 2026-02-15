// Special Math Generators for Algorithm Visual Feedback (Knapsack, Ant DP)
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

export function defineSpecialMathGenerators() {
    // Special math_max generator with visual feedback for Knapsack and Ant DP
    javascriptGenerator.forBlock["math_max"] = function (block) {
        const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_ATOMIC) || '0';
        const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_ATOMIC) || '0';

        const valueA = (a && a.trim()) ? a : '0';
        const valueB = (b && b.trim()) ? b : '0';

        // Clean Mode: standard Math.max
        if (javascriptGenerator.isCleanMode) {
            return [`Math.max(${valueA}, ${valueB})`, javascriptGenerator.ORDER_FUNCTION_CALL];
        }

        // Check if inside a knapsack function (structural check on block position)
        let parentBlock = block.getParent();
        let isKnapsack = false;
        while (parentBlock) {
            if (parentBlock.type === 'procedures_defreturn') {
                const funcName = parentBlock.getFieldValue('NAME') || '';
                if (funcName.toLowerCase().includes('knapsack')) {
                    isKnapsack = true;
                    break;
                }
            }
            parentBlock = parentBlock.getParent();
        }

        if (isKnapsack) {
            // Knapsack: use runtime typeof guards for variable resolution
            const iExpr = `typeof item !== 'undefined' ? item : (typeof i !== 'undefined' ? i : 0)`;
            const jExpr = `typeof cap !== 'undefined' ? cap : (typeof j !== 'undefined' ? j : 0)`;
            return [`await knapsackMaxWithVisual(${valueA}, ${valueB}, ${iExpr}, ${jExpr})`, javascriptGenerator.ORDER_FUNCTION_CALL];
        }

        // Default: standard Math.max
        return [`Math.max(${valueA}, ${valueB})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };
}

