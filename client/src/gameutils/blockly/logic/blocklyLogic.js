// Blockly Logic Block Definitions
import * as Blockly from "blockly/core";

export function defineLogicBlocks() {
  Blockly.Blocks["if_else"] = {
    init: function () {
      this.appendValueInput("CONDITION")
        .setCheck("Boolean")
        .appendField("If");
      this.appendStatementInput("IF_DO")
        .appendField("Do");
      this.appendStatementInput("ELSE_DO")
        .appendField("Else");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(210);
      this.setTooltip("เงื่อนไขแบบ if-else");
    },
  };

  Blockly.Blocks["if_only"] = {
    init: function () {
      this.appendValueInput("CONDITION")
        .setCheck("Boolean")
        .appendField("If");
      this.appendStatementInput("DO")
        .appendField("Do");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(210);
      this.setTooltip("เงื่อนไขแบบ if อย่างเดียว");
    },
  };

  Blockly.Blocks["if_return"] = {
    init: function () {
      this.appendValueInput("CONDITION")
        .setCheck("Boolean")
        .appendField("If");
      this.appendDummyInput()
        .appendField("Return");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(210);
      this.setTooltip("ถ้าเงื่อนไขเป็นจริง ให้ออกจากฟังก์ชัน");
    },
  };

  Blockly.Blocks["logic_compare"] = {
    init: function () {
      this.appendValueInput("A")
        .setCheck(null);
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["=", "EQ"],
          ["≠", "NEQ"],
          ["<", "LT"],
          ["≤", "LTE"],
          [">", "GT"],
          ["≥", "GTE"]
        ]), "OP");
      this.appendValueInput("B")
        .setCheck(null);
      this.setOutput(true, "Boolean");
      this.setColour(210);
      this.setTooltip("เปรียบเทียบค่าสองค่า");
    },
  };

  Blockly.Blocks["logic_boolean"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["True", "TRUE"],
          ["False", "FALSE"]
        ]), "BOOL");
      this.setOutput(true, "Boolean");
      this.setColour(210);
      this.setTooltip("ค่าจริงหรือเท็จ");
    },
  };

  Blockly.Blocks["logic_null"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("null");
      this.setOutput(true, null);
      this.setColour(210);
      this.setTooltip("ค่า null (ไม่มีค่า)");
    },
  };

  Blockly.Blocks["logic_negate"] = {
    init: function () {
      this.appendValueInput("BOOL")
        .setCheck("Boolean")
        .appendField("Not");
      this.setOutput(true, "Boolean");
      this.setColour(210);
      this.setTooltip("กลับค่าจริง/เท็จ");
    },
  };

  Blockly.Blocks["logic_operation"] = {
    init: function () {
      this.appendValueInput("A")
        .setCheck("Boolean");
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["And", "AND"],
          ["Or", "OR"]
        ]), "OP");
      this.appendValueInput("B")
        .setCheck("Boolean");
      this.setOutput(true, "Boolean");
      this.setColour(210);
      this.setTooltip("การดำเนินการตรรกะ");
    },
  };

  Blockly.Blocks["found_monster"] = {
    init: function () {
      this.appendDummyInput().appendField("Found Monster");
      this.setOutput(true, "Boolean");
      this.setColour(330);
      this.setTooltip("ตรวจสอบว่าเจอ Monster หรือไม่");
    },
  };

  Blockly.Blocks["can_move_forward"] = {
    init: function () {
      this.appendDummyInput().appendField("Can Move Forward");
      this.setOutput(true, "Boolean");
      this.setColour(330);
      this.setTooltip("ตรวจสอบว่าเดินไปข้างหน้าได้หรือไม่");
    },
  };

  Blockly.Blocks["near_pit"] = {
    init: function () {
      this.appendDummyInput().appendField("Near Pit");
      this.setOutput(true, "Boolean");
      this.setColour(330);
      this.setTooltip("ตรวจสอบว่าใกล้หลุมหรือไม่");
    },
  };

  Blockly.Blocks["at_goal"] = {
    init: function () {
      this.appendDummyInput().appendField("At Goal");
      this.setOutput(true, "Boolean");
      this.setColour(330);
      this.setTooltip("ตรวจสอบว่าถึงเป้าหมายแล้วหรือไม่");
    },
  };

  Blockly.Blocks["math_compare"] = {
    init: function () {
      this.appendValueInput("A")
        .setCheck("Number")
        .appendField("Compare");
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["=", "EQ"],
          ["≠", "NEQ"],
          ["<", "LT"],
          ["≤", "LTE"],
          [">", "GT"],
          ["≥", "GTE"]
        ]), "OP");
      this.appendValueInput("B")
        .setCheck("Number");
      this.setOutput(true, "Boolean");
      this.setColour(210);
      this.setTooltip("เปรียบเทียบค่าตัวเลขสองค่า");
    },
  };
}

