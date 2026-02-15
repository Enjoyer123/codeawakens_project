import { javascriptGenerator } from "blockly/javascript";

export function defineSubsetSumGenerators() {
    javascriptGenerator.forBlock["subset_sum_add_warrior_to_side1"] = function (block) {
        const warriorIndex = javascriptGenerator.valueToCode(block, 'WARRIOR_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        if (javascriptGenerator.isCleanMode) {
            return `subset_sum_add_warrior_to_side1(${warriorIndex});\n`;
        }
        return `await addWarriorToSide1Visual(${warriorIndex});\n`;
    };

    javascriptGenerator.forBlock["subset_sum_add_warrior_to_side2"] = function (block) {
        const warriorIndex = javascriptGenerator.valueToCode(block, 'WARRIOR_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        if (javascriptGenerator.isCleanMode) {
            return `subset_sum_add_warrior_to_side2(${warriorIndex});\n`;
        }
        return `await addWarriorToSide2Visual(${warriorIndex});\n`;
    };
}
