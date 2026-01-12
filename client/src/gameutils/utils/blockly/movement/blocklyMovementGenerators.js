// Blockly Movement Generators
import { javascriptGenerator } from "blockly/javascript";

export function defineMovementGenerators() {
    javascriptGenerator.forBlock["move_forward"] = function (block) {
        return "await moveForward();\n";
    };

    javascriptGenerator.forBlock["turn_left"] = function (block) {
        return "await turnLeft();\n";
    };

    javascriptGenerator.forBlock["turn_right"] = function (block) {
        return "await turnRight();\n";
    };

    javascriptGenerator.forBlock["hit"] = function (block) {
        return "await hit();\n";
    };

    javascriptGenerator.forBlock["move_to_node"] = function (block) {
        const nodeId = javascriptGenerator.valueToCode(block, 'NODE_ID', javascriptGenerator.ORDER_ATOMIC) || '0';
        return `await moveToNode(${nodeId});\n`;
    };

    javascriptGenerator.forBlock["move_along_path"] = function (block) {
        const path = javascriptGenerator.valueToCode(block, 'PATH', javascriptGenerator.ORDER_NONE) || '[]';
        return `await moveAlongPath(${path});\n`;
    };
}
