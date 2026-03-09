// Blockly Loop Block Definitions
import * as Blockly from "blockly/core";

export function defineLoopBlocks() {
  Blockly.Blocks["for_loop_dynamic"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("For")
        .appendField(new Blockly.FieldVariable("i"), "VAR")
        .appendField("from");
      this.appendValueInput("FROM")
        .setCheck("Number");
      this.appendDummyInput()
        .appendField("to");
      this.appendValueInput("TO")
        .setCheck("Number");
      this.appendStatementInput("DO")
        .setCheck(null)
        .appendField("Do");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("วนลูปด้วยค่าเริ่มต้นและค่าสิ้นสุดที่คำนวณได้");
    },
  };
}


