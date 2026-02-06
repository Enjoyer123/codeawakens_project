// Blockly Function Block Definitions
import * as Blockly from "blockly/core";

export function defineFunctionBlocks() {
  Blockly.Blocks["function_definition"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Function")
        .appendField(new Blockly.FieldTextInput("myFunction"), "FUNCTION_NAME");

      this.appendValueInput("ARGUMENT")
        .setCheck("Number")
        .appendField("Inputs");

      this.appendStatementInput("FUNCTION_BODY")
        .appendField("Do");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setTooltip("สร้างฟังก์ชันใหม่ที่รับค่าเป็น argument");
    },
  };

  Blockly.Blocks["function_call"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Call Function")
        .appendField(new Blockly.FieldTextInput("myFunction"), "FUNCTION_NAME");

      this.appendValueInput("ARGUMENT")
        .setCheck("Number")
        .appendField("Send Input");

      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setTooltip("เรียกใช้ฟังก์ชันพร้อมส่งค่า argument");
    },
  };

  // Return statement block for procedures_defreturn
  Blockly.Blocks["procedures_return"] = {
    init: function () {
      this.appendValueInput("VALUE")
        .setCheck(null)
        .appendField("Return");
      this.setPreviousStatement(true, null);
      this.setColour(290);
      this.setTooltip("คืนค่าจากฟังก์ชัน");
      this.setHelpUrl("");
    },
  };
}

