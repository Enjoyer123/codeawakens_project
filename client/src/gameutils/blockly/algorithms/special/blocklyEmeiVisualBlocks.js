// Blockly Emei Mountain (Cable Car) Visual Feedback Block Definitions
import * as Blockly from "blockly/core";

export function defineEmeiVisualBlocks() {
    // Highlight a peak
    Blockly.Blocks["emei_highlight_peak"] = {
        init: function () {
            this.appendValueInput("NODE")
                .setCheck("Number")
                .appendField("🌋 Highlight Peak");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(200);
            this.setTooltip("ไฮไลท์ยอดเขาที่กำลังพิจารณา");
        },
    };

    // Highlight a cable car route
    Blockly.Blocks["emei_highlight_cable_car"] = {
        init: function () {
            this.appendValueInput("U")
                .setCheck("Number")
                .appendField("🚠 Highlight Cable Car from");
            this.appendValueInput("V")
                .setCheck("Number")
                .appendField("to");
            this.appendValueInput("CAPACITY")
                .setCheck("Number")
                .appendField("Capacity");
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(200);
            this.setTooltip("แสดงแอนิเมชันกระเช้าวิ่งระหว่างยอดเขา");
        },
    };

    // Show final calculation result
    Blockly.Blocks["emei_show_final_result"] = {
        init: function () {
            this.appendValueInput("BOTTLENECK")
                .setCheck("Number")
                .appendField("🏆 Show Result: Bottleneck");
            this.appendValueInput("ROUNDS")
                .setCheck("Number")
                .appendField("Rounds");
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(200);
            this.setTooltip("แสดงผลลัพธ์ความจุคอขวดและจำนวนรอบที่คำนวณได้");
        },
    };

    // Highlight the entire path using parent array
    Blockly.Blocks["emei_highlight_path"] = {
        init: function () {
            this.appendValueInput("PARENT")
                .setCheck("Array")
                .appendField("🚩 Highlight Path from Parent");
            this.appendValueInput("END")
                .setCheck("Number")
                .appendField("to Node");
            this.appendValueInput("BOTTLENECK")
                .setCheck("Number")
                .appendField("with Capacity");
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(200);
            this.setTooltip("ไฮไลท์เส้นทางทั้งหมดจากจุดจบย้อนกลับไปยังจุดเริ่มโดยใช้ parent array");
        },
    };
}
