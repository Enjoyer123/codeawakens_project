import { javascriptGenerator } from "blockly/javascript";

export function defineCoinChangeGenerators() {
    // === New standardized BT blocks (matching knapsack/subset_sum pattern) ===
    javascriptGenerator.forBlock["coin_change_consider"] = function (block) {
        const coinIndex = javascriptGenerator.valueToCode(block, 'COIN_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        return `trackCoinDecision('consider', ${coinIndex});\n`;
    };

    javascriptGenerator.forBlock["coin_change_pick_coin"] = function (block) {
        const coinIndex = javascriptGenerator.valueToCode(block, 'COIN_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        return `trackCoinDecision('pick', ${coinIndex});\n`;
    };

    javascriptGenerator.forBlock["coin_change_skip_coin"] = function (block) {
        const coinIndex = javascriptGenerator.valueToCode(block, 'COIN_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        return `trackCoinDecision('skip', ${coinIndex});\n`;
    };

    javascriptGenerator.forBlock["coin_change_remove_coin"] = function (block) {
        const coinIndex = javascriptGenerator.valueToCode(block, 'COIN_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        return `trackCoinDecision('remove', ${coinIndex});\n`;
    };

    javascriptGenerator.forBlock["coin_change_prune_skip"] = function (block) {
        const coinIndex = javascriptGenerator.valueToCode(block, 'COIN_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        return `trackCoinDecision('prune_skip', ${coinIndex});\n`;
    };

    // === Legacy generators (keep for backward compat with old DP levels) ===
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

    javascriptGenerator.forBlock["coin_change_remove_warrior"] = function (block) {
        if (javascriptGenerator.isCleanMode) return `removeWarriorFromSelectionVisual();\n`;
        return `await removeWarriorFromSelectionVisual();\n`;
    };

    javascriptGenerator.forBlock["coin_change_memo_hit"] = function (block) {
        const amount = javascriptGenerator.valueToCode(block, 'AMOUNT', javascriptGenerator.ORDER_NONE) || '0';
        if (javascriptGenerator.isCleanMode) return `memoHitVisual(${amount});\n`;
        return `await memoHitVisual(${amount});\n`;
    };
}
