import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

export function registerRopePartitionBlocks() {
    // Block: Add Cut
    Blockly.Blocks['rope_add_cut'] = {
        init: function () {
            this.jsonInit({
                "message0": "ตัดเชือก ความยาว %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "LENGTH",
                        "check": "Number"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 160,
                "tooltip": "ตัดเชือกตามความยาวที่กำหนด",
                "helpUrl": ""
            });
        }
    };

    // Generator: Add Cut
    javascriptGenerator.forBlock['rope_add_cut'] = function (block) {
        const length = javascriptGenerator.valueToCode(block, 'LENGTH', javascriptGenerator.ORDER_ATOMIC) || '0';
        return `await addCut(${length});\n`;
    };

    // Block: Remove Cut (Backtrack)
    Blockly.Blocks['rope_remove_cut'] = {
        init: function () {
            this.jsonInit({
                "message0": "ยกเลิกการตัด (Backtrack)",
                "previousStatement": null,
                "nextStatement": null,
                "colour": 160,
                "tooltip": "ยกเลิกการตัดครั้งล่าสุด (สำหรับการย้อนกลับ)",
                "helpUrl": ""
            });
        }
    };

    // Generator: Remove Cut
    javascriptGenerator.forBlock['rope_remove_cut'] = function (block) {
        return `await removeCut();\n`;
    };
}
