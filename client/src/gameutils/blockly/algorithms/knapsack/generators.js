import { javascriptGenerator } from "blockly/javascript";

export function defineKnapsackGenerators() {
    javascriptGenerator.forBlock["knapsack_select_item"] = function (block) {
        const itemIndex = javascriptGenerator.valueToCode(block, 'ITEM_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        return `await selectKnapsackItemVisual(${itemIndex});\n`;
    };

    javascriptGenerator.forBlock["knapsack_unselect_item"] = function (block) {
        const itemIndex = javascriptGenerator.valueToCode(block, 'ITEM_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        return `await unselectKnapsackItemVisual(${itemIndex});\n`;
    };
}
