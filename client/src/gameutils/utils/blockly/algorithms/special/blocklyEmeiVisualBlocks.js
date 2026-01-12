// Blockly Emei Mountain (Cable Car) Visual Feedback Block Definitions
import * as Blockly from "blockly/core";

export function defineEmeiVisualBlocks() {
    // Highlight a peak
    Blockly.Blocks["emei_highlight_peak"] = {
        init: function () {
            this.appendValueInput("NODE")
                .setCheck("Number")
                .appendField("🌋 ไฮไลท์ยอดเขา");
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
                .appendField("🚠 ไฮไลท์กระเช้าจาก");
            this.appendValueInput("V")
                .setCheck("Number")
                .appendField("ไป");
            this.appendValueInput("CAPACITY")
                .setCheck("Number")
                .appendField("ความจุ");
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
                .appendField("🏆 แสดงผลลัพธ์: คอขวด");
            this.appendValueInput("ROUNDS")
                .setCheck("Number")
                .appendField("จำนวนรอบ");
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
                .appendField("🚩 ไฮไลท์เส้นทางคำตอบจาก parent");
            this.appendValueInput("END")
                .setCheck("Number")
                .appendField("ไปยัง node");
            this.appendValueInput("BOTTLENECK")
                .setCheck("Number")
                .appendField("ด้วยความจุ");
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(200);
            this.setTooltip("ไฮไลท์เส้นทางทั้งหมดจากจุดจบย้อนกลับไปยังจุดเริ่มโดยใช้ parent array");
        },
    };
}
