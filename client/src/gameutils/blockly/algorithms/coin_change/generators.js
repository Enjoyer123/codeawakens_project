import { javascriptGenerator } from "blockly/javascript";

export function defineCoinChangeGenerators() {
    javascriptGenerator.forBlock["coin_change_add_warrior_to_selection"] = function (block) {
        const warriorIndex = javascriptGenerator.valueToCode(block, 'WARRIOR_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        return `await addWarriorToSelectionVisual(${warriorIndex});\n`;
    };

    javascriptGenerator.forBlock["coin_change_track_decision"] = function (block) {
        const amount = javascriptGenerator.valueToCode(block, 'AMOUNT', javascriptGenerator.ORDER_NONE) || '0';
        const index = javascriptGenerator.valueToCode(block, 'INDEX', javascriptGenerator.ORDER_NONE) || '0';
        const include = javascriptGenerator.valueToCode(block, 'INCLUDE', javascriptGenerator.ORDER_NONE) || '-1';
        const exclude = javascriptGenerator.valueToCode(block, 'EXCLUDE', javascriptGenerator.ORDER_NONE) || '-1';
        return `trackCoinChangeDecision(${amount}, ${index}, ${include}, ${exclude});\n`;
    };
}
