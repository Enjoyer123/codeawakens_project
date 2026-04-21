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

    javascriptGenerator.forBlock["cast_spell"] = function (block) {
        if (javascriptGenerator.isCleanMode) return "castSpell();\n";
        return "await castSpell();\n";
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

    javascriptGenerator.forBlock["say"] = function (block) {
        const text = block.getFieldValue("TEXT");
        if (javascriptGenerator.isCleanMode) return `say("${text}");\n`;
        return `await say("${text}");\n`;
    };

    javascriptGenerator.forBlock["Defend"] = function (block) {
        if (javascriptGenerator.isCleanMode) return `Defend();\n`;
        return `await Defend();\n`;
    };

    // ── [สำรอง] Dash ──
    // javascriptGenerator.forBlock["dash"] = function (block) {
    //     if (javascriptGenerator.isCleanMode) return "dash();\n";
    //     return "await dash();\n";
    // };

    // ──[สำรอง] Spin ──
    javascriptGenerator.forBlock["spin"] = function (block) {
        if (javascriptGenerator.isCleanMode) return "spin();\n";
        return "await spin();\n";
    };

    // ── [สำรอง] Heal ──
    javascriptGenerator.forBlock["heal"] = function (block) {
        if (javascriptGenerator.isCleanMode) return "heal();\n";
        return "await heal();\n";
    };

    // ── [สำรอง] Teleport ──
    javascriptGenerator.forBlock["teleport"] = function (block) {
        const nodeId = javascriptGenerator.valueToCode(block, 'NODE_ID', javascriptGenerator.ORDER_ATOMIC) || '0';
        if (javascriptGenerator.isCleanMode) return `teleport(${nodeId});\n`;
        return `await teleport(${nodeId});\n`;
    };

    // ── [สำรอง] Wait ──
    // javascriptGenerator.forBlock["wait"] = function (block) {
    //     const seconds = block.getFieldValue("SECONDS");
    //     if (javascriptGenerator.isCleanMode) return `wait(${seconds});\n`;
    //     return `await wait(${seconds});\n`;
    // };

    // ── [สำรอง] Dodge ──
    // javascriptGenerator.forBlock["dodge"] = function (block) {
    //     if (javascriptGenerator.isCleanMode) return "dodge();\n";
    //     return "await dodge();\n";
    // };

    // ── [สำรอง] Shield ──
    // javascriptGenerator.forBlock["shield"] = function (block) {
    //     if (javascriptGenerator.isCleanMode) return "shield();\n";
    //     return "await shield();\n";
    // };

    // ── [สำรอง] MoveBackward ──
    // javascriptGenerator.forBlock["move_backward"] = function (block) {
    //     if (javascriptGenerator.isCleanMode) return "moveBackward();\n";
    //     return "await moveBackward();\n";
    // };

    // ── [สำรอง] DoubleHit ──
    // javascriptGenerator.forBlock["double_hit"] = function (block) {
    //     if (javascriptGenerator.isCleanMode) return "doubleHit();\n";
    //     return "await doubleHit();\n";
    // };

    // ── [สำรอง] CheckHP (⚠️ Sensor — คืนค่า ไม่ใช่ statement!) ──
    // javascriptGenerator.forBlock["check_hp"] = function (block) {
    //     return ["getPlayerHp()", javascriptGenerator.ORDER_NONE];
    //     // ← ไม่มี await! เพราะเป็น sensor คืนค่าตัวเลข
    // };

}
