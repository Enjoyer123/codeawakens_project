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

  Blockly.Blocks["math_max"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📈 Max");
      this.appendValueInput("A")
        .setCheck("Number")
        .appendField("between");
      this.appendValueInput("B")
        .setCheck("Number")
        .appendField("and");
      this.setOutput(true, "Number");
      this.setColour(230);
      this.setTooltip("หาค่าสูงสุดระหว่าง 2 จำนวน");
    },
  };

  Blockly.Blocks["math_min"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📉 Min");
      this.appendValueInput("A")
        .setCheck("Number")
        .appendField("between");
      this.appendValueInput("B")
        .setCheck("Number")
        .appendField("and");
      this.setOutput(true, "Number");
      this.setColour(230);
      this.setTooltip("หาค่าต่ำสุดระหว่าง 2 จำนวน");
    },
  };

  // math_single (for CEIL, ROUND, etc.)
  Blockly.Blocks["math_single"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["Ceil", "CEIL"],
          ["Floor", "FLOOR"],
          ["Round", "ROUND"],
          ["Square Root", "ROOT"]
        ]), "OP");
      this.appendValueInput("NUM")
        .setCheck("Number");
      this.setOutput(true, "Number");
      this.setColour(230);
      this.setTooltip("การคำนวณทางคณิตศาสตร์แบบเดี่ยว");
    },
  };

  // math_min_max (fallback for non-existent blocks in XML)
  Blockly.Blocks["math_min_max"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["📈 Max", "MAX"],
          ["📉 Min", "MIN"]
        ]), "OP");
      this.appendValueInput("A")
        .setCheck("Number")
        .appendField("between");
      this.appendValueInput("B")
        .setCheck("Number")
        .appendField("and");
      this.setOutput(true, "Number");
      this.setColour(230);
      this.setTooltip("หาค่าสูงสุดหรือต่ำสุดระหว่าง 2 จำนวน");
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

