import { javascriptGenerator } from "blockly/javascript";

export function defineSubsetSumGenerators() {
    javascriptGenerator.forBlock["subset_sum_consider"] = function (block) {
        const index = javascriptGenerator.valueToCode(block, 'WARRIOR_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        if (javascriptGenerator.isCleanMode) {
            return `trace.push({ action: 'consider', index: ${index} });\n`;
        }
        return `if (typeof trace !== 'undefined') trace.push({ action: 'consider', index: ${index} });\n`;
    };

    javascriptGenerator.forBlock["subset_sum_include"] = function (block) {
        const index = javascriptGenerator.valueToCode(block, 'WARRIOR_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        if (javascriptGenerator.isCleanMode) {
            return `trace.push({ action: 'include', index: ${index} });\n`;
        }
        return `if (typeof trace !== 'undefined') trace.push({ action: 'include', index: ${index} });\n`;
    };

    javascriptGenerator.forBlock["subset_sum_exclude"] = function (block) {
        const index = javascriptGenerator.valueToCode(block, 'WARRIOR_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        if (javascriptGenerator.isCleanMode) {
            return `trace.push({ action: 'exclude', index: ${index} });\n`;
        }
        return `if (typeof trace !== 'undefined') trace.push({ action: 'exclude', index: ${index} });\n`;
    };

    javascriptGenerator.forBlock["subset_sum_reset"] = function (block) {
        const index = javascriptGenerator.valueToCode(block, 'WARRIOR_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        if (javascriptGenerator.isCleanMode) {
            return `trace.push({ action: 'reset', index: ${index} });\n`;
        }
        return `if (typeof trace !== 'undefined') trace.push({ action: 'reset', index: ${index} });\n`;
    };

    javascriptGenerator.forBlock["subset_sum_dp_update"] = function (block) {
        const index = javascriptGenerator.valueToCode(block, 'INDEX', javascriptGenerator.ORDER_NONE) || '0';
        const sum = javascriptGenerator.valueToCode(block, 'SUM', javascriptGenerator.ORDER_NONE) || '0';
        const valueCode = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE) || 'false';
        if (javascriptGenerator.isCleanMode) {
            return `trace.push({ action: 'dp_update', index: ${index}, sum: ${sum}, value: ${valueCode} });\n`;
        }
        return `if (typeof trace !== 'undefined') trace.push({ action: 'dp_update', index: ${index}, sum: ${sum}, value: ${valueCode} });\n`;
    };
}
