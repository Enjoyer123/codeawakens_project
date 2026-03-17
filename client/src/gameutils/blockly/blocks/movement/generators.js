// Blockly Movement Generators
import { javascriptGenerator } from "blockly/javascript";

export function defineMovementGenerators() {
    javascriptGenerator.forBlock["move_forward"] = function (block) {
        if (javascriptGenerator.isCleanMode) return "moveForward();\n";
        return "await moveForward();\n";
    };

    javascriptGenerator.forBlock["turn_left"] = function (block) {
        if (javascriptGenerator.isCleanMode) return "turnLeft();\n";
        return "await turnLeft();\n";
    };

    javascriptGenerator.forBlock["turn_right"] = function (block) {
        if (javascriptGenerator.isCleanMode) return "turnRight();\n";
        return "await turnRight();\n";
    };

    javascriptGenerator.forBlock["hit"] = function (block) {
        if (javascriptGenerator.isCleanMode) return "hit();\n";
        return "await hit();\n";
    };

    javascriptGenerator.forBlock["move_to_node"] = function (block) {
        const nodeId = javascriptGenerator.valueToCode(block, 'NODE_ID', javascriptGenerator.ORDER_ATOMIC) || '0';
        if (javascriptGenerator.isCleanMode) return `moveToNode(${nodeId});\n`;
        return `await moveToNode(${nodeId});\n`;
    };

    javascriptGenerator.forBlock["move_along_path"] = function (block) {
        const path = javascriptGenerator.valueToCode(block, 'PATH', javascriptGenerator.ORDER_NONE) || '[]';
        if (javascriptGenerator.isCleanMode) return `moveAlongPath(${path});\n`;
        return `await moveAlongPath(${path});\n`;
    };

}
