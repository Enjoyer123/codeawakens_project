// Blockly N-Queen JavaScript Generators
import { javascriptGenerator } from "blockly/javascript";

export function defineNQueenGenerators() {
    // 1. isSafe(row, col)
    javascriptGenerator.forBlock["nqueen_is_safe"] = function (block) {
        const row = javascriptGenerator.valueToCode(block, 'ROW', javascriptGenerator.ORDER_NONE) || '0';
        const col = javascriptGenerator.valueToCode(block, 'COL', javascriptGenerator.ORDER_NONE) || '0';

        if (javascriptGenerator.isCleanMode) {
            return [`safe(${row}, ${col})`, javascriptGenerator.ORDER_FUNCTION_CALL];
        }
        return [`await safe(${row}, ${col})`, javascriptGenerator.ORDER_AWAIT];
    };
    javascriptGenerator.forBlock["is_safe"] = javascriptGenerator.forBlock["nqueen_is_safe"];

    // 2. place(row, col)
    javascriptGenerator.forBlock["nqueen_place"] = function (block) {
        const row = javascriptGenerator.valueToCode(block, 'ROW', javascriptGenerator.ORDER_NONE) || '0';
        const col = javascriptGenerator.valueToCode(block, 'COL', javascriptGenerator.ORDER_NONE) || '0';

        if (javascriptGenerator.isCleanMode) {
            return `place(${row}, ${col});\n`;
        }
        return `await place(${row}, ${col});\n`;
    };
    javascriptGenerator.forBlock["place"] = javascriptGenerator.forBlock["nqueen_place"];

    // 3. remove(row, col)
    javascriptGenerator.forBlock["nqueen_remove"] = function (block) {
        const row = javascriptGenerator.valueToCode(block, 'ROW', javascriptGenerator.ORDER_NONE) || '0';
        const col = javascriptGenerator.valueToCode(block, 'COL', javascriptGenerator.ORDER_NONE) || '0';

        if (javascriptGenerator.isCleanMode) {
            return `remove(${row}, ${col});\n`;
        }
        return `await remove(${row}, ${col});\n`;
    };
    javascriptGenerator.forBlock["delete"] = javascriptGenerator.forBlock["nqueen_remove"];
}
