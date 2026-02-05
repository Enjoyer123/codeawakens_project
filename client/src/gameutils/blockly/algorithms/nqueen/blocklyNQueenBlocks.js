// Blockly N-Queen Custom Block Definitions
import * as Blockly from "blockly/core";

export function defineNQueenBlocks() {
    // 1. isSafe(row, col) - Value block (returns Boolean)
    Blockly.Blocks["nqueen_is_safe"] = {
        init: function () {
            this.appendValueInput("ROW")
                .setCheck("Number")
                .appendField("🔍 Is Safe? Row");
            this.appendValueInput("COL")
                .setCheck("Number")
                .appendField("Col");
            this.setOutput(true, "Boolean");
            this.setInputsInline(true);
            this.setColour(210); // Logic Blue/Cyan
            this.setTooltip("ตรวจสอบว่าตำแหน่ง (row, col) ปลอดภัยจากการจู่โจมของควีนตัวอื่นหรือไม่");
        },
    };

    // 2. place(row, col) - Statement block
    Blockly.Blocks["nqueen_place"] = {
        init: function () {
            this.appendValueInput("ROW")
                .setCheck("Number")
                .appendField("👑 Place Queen: Row");
            this.appendValueInput("COL")
                .setCheck("Number")
                .appendField("Col");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setInputsInline(true);
            this.setColour(290); // Procedure Purple/Pink
            this.setTooltip("วางควีนลงบนกระดานที่ตำแหน่ง (row, col)");
        },
    };

    // 3. remove(row, col) - Statement block
    Blockly.Blocks["nqueen_remove"] = {
        init: function () {
            this.appendValueInput("ROW")
                .setCheck("Number")
                .appendField("❌ Remove Queen: Row");
            this.appendValueInput("COL")
                .setCheck("Number")
                .appendField("Col");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setInputsInline(true);
            this.setColour(290); // Procedure Purple/Pink
            this.setTooltip("ยกควีนออกจากกระดานที่ตำแหน่ง (row, col) (Backtracking)");
        },
    };
}
