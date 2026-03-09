import { javascriptGenerator } from "blockly/javascript";

export function defineEmeiGenerators() {
    javascriptGenerator.forBlock["emei_highlight_peak"] = function (block) {
        const node = javascriptGenerator.valueToCode(block, "NODE", javascriptGenerator.ORDER_NONE) || "0";
        if (javascriptGenerator.isCleanMode) {
            const safeNode = (node === 'undefined' || node === '(undefined)') ? '0' : node;
            return `highlightPeak(${safeNode});\n`;
        }
        return `await highlightPeak(${node});\n`;
    };




    javascriptGenerator.forBlock["emei_show_final_result"] = function (block) {
        const bottleneck = javascriptGenerator.valueToCode(block, "BOTTLENECK", javascriptGenerator.ORDER_NONE) || "0";
        const rounds = javascriptGenerator.valueToCode(block, "ROUNDS", javascriptGenerator.ORDER_NONE) || "0";
        if (javascriptGenerator.isCleanMode) {
            const safeBn = (bottleneck === 'undefined' || bottleneck === '(undefined)') ? '0' : bottleneck;
            const safeRounds = (rounds === 'undefined' || rounds === '(undefined)') ? '0' : rounds;
            return `return [${safeBn}, ${safeRounds}];\n`;
        }
        return `return [${bottleneck}, ${rounds}];\n`;
    };

    javascriptGenerator.forBlock["emei_highlight_path"] = function (block) {
        const parent = javascriptGenerator.valueToCode(block, "PARENT", javascriptGenerator.ORDER_NONE) || "[]";
        const end = javascriptGenerator.valueToCode(block, "END", javascriptGenerator.ORDER_NONE) || "0";
        const bottleneck = javascriptGenerator.valueToCode(block, "BOTTLENECK", javascriptGenerator.ORDER_NONE) || "0";

        if (javascriptGenerator.isCleanMode) {
            const safeParent = (parent === 'undefined' || parent === '(undefined)') ? '[]' : parent;
            const safeEnd = (end === 'undefined' || end === '(undefined)') ? '0' : end;
            const safeBn = (bottleneck === 'undefined' || bottleneck === '(undefined)') ? '0' : bottleneck;
            return `highlightPath(${safeParent}, ${safeEnd}, ${safeBn});\n`;
        }

        return `await highlightEmeiPath(${parent}, ${end}, ${bottleneck});\n`;
    };
}
