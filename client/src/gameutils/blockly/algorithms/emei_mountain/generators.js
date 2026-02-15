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

    javascriptGenerator.forBlock["emei_highlight_cable_car"] = function (block) {
        const u = javascriptGenerator.valueToCode(block, "U", javascriptGenerator.ORDER_NONE) || "0";
        const v = javascriptGenerator.valueToCode(block, "V", javascriptGenerator.ORDER_NONE) || "0";
        const capacity = javascriptGenerator.valueToCode(block, "CAPACITY", javascriptGenerator.ORDER_NONE) || "0";
        if (javascriptGenerator.isCleanMode) {
            const safeU = (u === 'undefined' || u === '(undefined)') ? '0' : u;
            const safeV = (v === 'undefined' || v === '(undefined)') ? '0' : v;
            const safeCap = (capacity === 'undefined' || capacity === '(undefined)') ? '0' : capacity;
            return `highlightCableCar(${safeU}, ${safeV}, ${safeCap});\n`;
        }
        return `await highlightCableCar(${u}, ${v}, ${capacity});\n`;
    };

    javascriptGenerator.forBlock["emei_show_final_result"] = function (block) {
        const bottleneck = javascriptGenerator.valueToCode(block, "BOTTLENECK", javascriptGenerator.ORDER_NONE) || "0";
        const rounds = javascriptGenerator.valueToCode(block, "ROUNDS", javascriptGenerator.ORDER_NONE) || "0";
        if (javascriptGenerator.isCleanMode) {
            const safeBn = (bottleneck === 'undefined' || bottleneck === '(undefined)') ? '0' : bottleneck;
            const safeRounds = (rounds === 'undefined' || rounds === '(undefined)') ? '0' : rounds;
            return `showFinalResult(${safeBn}, ${safeRounds});\n`;
        }
        return `await showEmeiFinalResult(${bottleneck}, ${rounds});\n`;
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
