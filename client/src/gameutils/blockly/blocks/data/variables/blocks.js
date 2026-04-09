// Blockly Variable Block Definitions
import * as Blockly from "blockly/core";

export function defineVariableBlocks() {
  Blockly.Blocks["var_math"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Calculate")
        .appendField(new Blockly.FieldVariable("i"), "VAR")
        .appendField(new Blockly.FieldDropdown([
          ["+", "ADD"],
          ["-", "MINUS"],
          ["×", "MULTIPLY"],
          ["÷", "DIVIDE"]
        ]), "OP");
      this.appendValueInput("VALUE")
        .setCheck("Number")
        .appendField("with");
      this.setOutput(true, "Number");
      this.setColour(230);
      this.setTooltip("การคำนวณทางคณิตศาสตร์");

    }
  };

  Blockly.Blocks["get_var_value"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Value of")
        .appendField(new Blockly.FieldVariable("i"), "VAR");
      this.setOutput(true, "Number");
      this.setColour(330);
      this.setTooltip("ได้ค่าของตัวแปร");

    }
  };

  Blockly.Blocks["variables_game_input"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("รับข้อมูลจากด่านใส่ตัวแปร")
        .appendField(new Blockly.FieldVariable("board"), "VAR");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(330);
      this.setTooltip("ดึงข้อมูลเริ่มต้นที่ระบบกำหนดให้ (เช่น n, board, weights) แล้วนำมาใส่ไว้ในตัวแปรนี้");
    }
  };
}

