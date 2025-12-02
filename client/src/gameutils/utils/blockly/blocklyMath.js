// Blockly Math Block Definitions
import * as Blockly from "blockly/core";

export function defineMathBlocks() {
  Blockly.Blocks["math_number"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldNumber("0"), "NUM");
      this.setOutput(true, "Number");
      this.setColour(230);
      this.setTooltip("ตัวเลข");
    },
  };

  Blockly.Blocks["math_arithmetic"] = {
    init: function () {
      this.appendValueInput("A")
        .setCheck("Number");
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["+", "ADD"],
          ["-", "MINUS"],
          ["×", "MULTIPLY"],
          ["÷", "DIVIDE"],
          ["%", "MODULO"]
        ]), "OP");
      this.appendValueInput("B")
        .setCheck("Number");
      this.setOutput(true, "Number");
      this.setColour(230);
      this.setTooltip("การคำนวณทางคณิตศาสตร์");
    },
  };

  Blockly.Blocks["text"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldTextInput(""), "TEXT");
      this.setOutput(true, "String");
      this.setColour(160);
      this.setTooltip("ข้อความ");
    },
  };
}

