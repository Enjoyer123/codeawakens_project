// Blockly Coin Change Visual Feedback Block Definitions
import * as Blockly from "blockly/core";

export function defineCoinChangeVisualBlocks() {
  // Add warrior to selection box (copy and move it into the box)
  Blockly.Blocks["coin_change_add_warrior_to_selection"] = {
    init: function () {
      this.appendValueInput("WARRIOR_INDEX")
        .setCheck("Number")
        .appendField("Add Warrior to Selection");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip("เพิ่มนักรบเข้าไปในกรอบเลือก (copy และขยับเข้าไป)");
    },
  };

  // Track decision for coin change algorithm
  Blockly.Blocks["coin_change_track_decision"] = {
    init: function () {
      this.appendValueInput("AMOUNT")
        .setCheck("Number")
        .appendField("Track decision");
      this.appendValueInput("INDEX")
        .setCheck("Number")
        .appendField("amount");
      this.appendValueInput("INCLUDE")
        .setCheck("Number")
        .appendField("index");
      this.appendValueInput("EXCLUDE")
        .setCheck("Number")
        .appendField("include");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip("ติดตามการตัดสินใจสำหรับอัลกอริทึมแลกเหรียญ");
    },
  };
}

