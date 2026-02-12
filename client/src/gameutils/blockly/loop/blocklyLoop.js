// Blockly Loop Block Definitions
import * as Blockly from "blockly/core";
import { ensureVariableExists, createVariableChangeHandler } from '../data/blocklyVariable';

export function defineLoopBlocks() {
  Blockly.Blocks["repeat"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Repeat")
        .appendField(new Blockly.FieldNumber(3, 1, 10), "TIMES")
        .appendField("times");
      this.appendStatementInput("DO").appendField("Do");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("ทำซ้ำตามจำนวนครั้งที่กำหนด");
    },
  };

  Blockly.Blocks["while_loop"] = {
    init: function () {
      this.appendValueInput("CONDITION")
        .setCheck("Boolean")
        .appendField("Repeat While");
      this.appendStatementInput("DO")
        .appendField("Do");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("ทำซ้ำจนกว่าเงื่อนไขจะเป็นเท็จ");
    },
  };

  Blockly.Blocks["for_index"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("For")
        .appendField(new Blockly.FieldVariable("i"), "VAR")
        .appendField("from")
        .appendField(new Blockly.FieldNumber(1, 0), "FROM")
        .appendField("to")
        .appendField(new Blockly.FieldNumber(5, 0), "TO");
      this.appendStatementInput("DO")
        .setCheck(null)
        .appendField("Do");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("วนลูปด้วย index");

      this.setOnChange(createVariableChangeHandler('i').bind(this));
    },
  };

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

      this.setOnChange(createVariableChangeHandler('i').bind(this));
    },
  };
}


