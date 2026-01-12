// Blockly Subset Sum Visual Feedback Block Definitions
import * as Blockly from "blockly/core";

export function defineSubsetSumVisualBlocks() {
  // Add warrior to side1
  Blockly.Blocks["subset_sum_add_warrior_to_side1"] = {
    init: function () {
      this.appendValueInput("WARRIOR_INDEX")
        .setCheck("Number")
        .appendField("➕ เพิ่มนักรบเข้าฝั่ง 1");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip("เพิ่มนักรบเข้าฝั่งที่ 1 (แสดงผล)");
    },
  };

  // Add warrior to side2
  Blockly.Blocks["subset_sum_add_warrior_to_side2"] = {
    init: function () {
      this.appendValueInput("WARRIOR_INDEX")
        .setCheck("Number")
        .appendField("➕ เพิ่มนักรบเข้าฝั่ง 2");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip("เพิ่มนักรบเข้าฝั่งที่ 2 (แสดงผล)");
    },
  };
}

