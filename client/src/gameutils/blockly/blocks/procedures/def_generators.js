// Blockly Procedure Definition Generators
import { javascriptGenerator } from "blockly/javascript";

export function defineProcedureDefGenerators() {
    // procedures_return: unconditional return
    javascriptGenerator.forBlock["procedures_return"] = function (block) {
        const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE) || 'null';
        return `return ${value};\n`;
    };
}
