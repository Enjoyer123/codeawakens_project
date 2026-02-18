// Blockly Variable Block Definitions
import * as Blockly from "blockly/core";
import { createVariableChangeHandler } from './definitions';

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
      this.setOnChange(createVariableChangeHandler('i').bind(this));
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
      this.setOnChange(createVariableChangeHandler('i').bind(this));
    }
  };
}

