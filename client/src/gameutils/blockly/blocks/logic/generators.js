// Blockly Logic Generators
import { javascriptGenerator } from "blockly/javascript";

export function defineLogicGenerators() {
    javascriptGenerator.forBlock["found_monster"] = function (block) {
        return ['foundMonster()', javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["can_move_forward"] = function (block) {
        return ['canMoveForward()', javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["near_pit"] = function (block) {
        return ['nearPit()', javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["at_goal"] = function (block) {
        return ['atGoal()', javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["logic_not_in"] = function (block) {
        const item = javascriptGenerator.valueToCode(block, 'ITEM', javascriptGenerator.ORDER_EQUALITY) || 'null';
        const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
        return [`!${list}.includes(${item})`, javascriptGenerator.ORDER_LOGICAL_NOT];
    };
}
