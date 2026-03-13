import { javascriptGenerator } from "blockly/javascript";

export function defineSubsetSumGenerators() {
    javascriptGenerator.forBlock["subset_sum_consider"] = function (block) {
        const index = javascriptGenerator.valueToCode(block, 'WARRIOR_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        return `recordConsider(${index});\n`;
    };

    javascriptGenerator.forBlock["subset_sum_include"] = function (block) {
        const index = javascriptGenerator.valueToCode(block, 'WARRIOR_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        return `recordInclude(${index});\n`;
    };

    javascriptGenerator.forBlock["subset_sum_exclude"] = function (block) {
        const index = javascriptGenerator.valueToCode(block, 'WARRIOR_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        return `recordExclude(${index});\n`;
    };

    javascriptGenerator.forBlock["subset_sum_reset"] = function (block) {
        const index = javascriptGenerator.valueToCode(block, 'WARRIOR_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        return `recordReset(${index});\n`;
    };

    javascriptGenerator.forBlock["subset_sum_dp_update"] = function (block) {
        const index = javascriptGenerator.valueToCode(block, 'INDEX', javascriptGenerator.ORDER_NONE) || '0';
        const sum = javascriptGenerator.valueToCode(block, 'SUM', javascriptGenerator.ORDER_NONE) || '0';
        const valueCode = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE) || 'false';
        return `recordDpUpdate(${index}, ${sum}, ${valueCode});\n`;
    };
}
