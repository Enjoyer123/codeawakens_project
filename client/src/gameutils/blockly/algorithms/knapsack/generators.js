import { javascriptGenerator } from "blockly/javascript";

export function defineKnapsackGenerators() {
    javascriptGenerator.forBlock["knapsack_pick_item"] = function (block) {
        const itemIndex = javascriptGenerator.valueToCode(block, 'ITEM_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        return `trackKnapsackDecision('pick', ${itemIndex});\n`;
    };

    javascriptGenerator.forBlock["knapsack_remove_item"] = function (block) {
        return `trackKnapsackDecision('remove');\n`;
    };

    javascriptGenerator.forBlock["knapsack_consider_item"] = function (block) {
        const itemIndex = javascriptGenerator.valueToCode(block, 'ITEM_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        return `trackKnapsackDecision('consider', ${itemIndex});\n`;
    };

    javascriptGenerator.forBlock["knapsack_skip_item"] = function (block) {
        const itemIndex = javascriptGenerator.valueToCode(block, 'ITEM_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        return `trackKnapsackDecision('skip', ${itemIndex});\n`;
    };

    javascriptGenerator.forBlock["knapsack_dp_update"] = function (block) {
        const itemIndex = javascriptGenerator.valueToCode(block, 'ITEM_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        const capacity = javascriptGenerator.valueToCode(block, 'CAPACITY', javascriptGenerator.ORDER_NONE) || '0';
        const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE) || '0';
        return `trackKnapsackDpUpdate(${itemIndex}, ${capacity}, ${value});\n`;
    };
}
