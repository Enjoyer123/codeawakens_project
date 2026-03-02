import { javascriptGenerator } from "blockly/javascript";

export function defineCoinChangeGenerators() {
    javascriptGenerator.forBlock["coin_change_add_warrior_to_selection"] = function (block) {
        const warriorIndex = javascriptGenerator.valueToCode(block, 'WARRIOR_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        if (javascriptGenerator.isCleanMode) return `addWarriorToSelectionVisual(${warriorIndex});\n`;
        return `await addWarriorToSelectionVisual(${warriorIndex});\n`;
    };

    javascriptGenerator.forBlock["coin_change_track_decision"] = function (block) {
        const amount = javascriptGenerator.valueToCode(block, 'AMOUNT', javascriptGenerator.ORDER_NONE) || '0';
        const index = javascriptGenerator.valueToCode(block, 'INDEX', javascriptGenerator.ORDER_NONE) || '0';
        const include = javascriptGenerator.valueToCode(block, 'INCLUDE', javascriptGenerator.ORDER_NONE) || '-1';
        const exclude = javascriptGenerator.valueToCode(block, 'EXCLUDE', javascriptGenerator.ORDER_NONE) || '-1';
        return `trackCoinChangeDecision(${amount}, ${index}, ${include}, ${exclude});\n`;
    };

    // Remove warrior from selection (Backtrack visual)
    javascriptGenerator.forBlock["coin_change_remove_warrior"] = function (block) {
        if (javascriptGenerator.isCleanMode) return `removeWarriorFromSelectionVisual();\n`;
        return `await removeWarriorFromSelectionVisual();\n`;
    };

    // Consider a coin visually (flash highlight)
    javascriptGenerator.forBlock["coin_change_consider"] = function (block) {
        const coinIndex = javascriptGenerator.valueToCode(block, 'COIN_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        if (javascriptGenerator.isCleanMode) return `considerCoinVisual(${coinIndex});\n`;
        return `await considerCoinVisual(${coinIndex});\n`;
    };

    // Memo hit visual
    javascriptGenerator.forBlock["coin_change_memo_hit"] = function (block) {
        const amount = javascriptGenerator.valueToCode(block, 'AMOUNT', javascriptGenerator.ORDER_NONE) || '0';
        if (javascriptGenerator.isCleanMode) return `memoHitVisual(${amount});\n`;
        return `await memoHitVisual(${amount});\n`;
    };
}
