// Blockly Function Block Definitions
import * as Blockly from "blockly/core";

export function defineFunctionBlocks() {
  Blockly.Blocks["function_definition"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🔧 ฟังก์ชัน")
        .appendField(new Blockly.FieldTextInput("myFunction"), "FUNCTION_NAME");
      
      this.appendValueInput("ARGUMENT")
        .setCheck("Number")
        .appendField("รับค่า");
      
      this.appendStatementInput("FUNCTION_BODY")
        .appendField("ทำ");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setTooltip("สร้างฟังก์ชันใหม่ที่รับค่าเป็น argument");
    },
  };

  Blockly.Blocks["function_call"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📞 เรียกฟังก์ชัน")
        .appendField(new Blockly.FieldTextInput("myFunction"), "FUNCTION_NAME");
      
      this.appendValueInput("ARGUMENT")
        .setCheck("Number")
        .appendField("ส่งค่า");
      
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setTooltip("เรียกใช้ฟังก์ชันพร้อมส่งค่า argument");
    },
  };
}

