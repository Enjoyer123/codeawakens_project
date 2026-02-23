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

  // Remove warrior from selection (Backtrack visual)
  Blockly.Blocks["coin_change_remove_warrior"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Remove last warrior from selection");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(0);
      this.setTooltip("ดึงนักรบตัวสุดท้ายออกจากกรอบเลือก (Backtrack)");
    },
  };

  // Consider a coin visually (flash highlight)
  Blockly.Blocks["coin_change_consider"] = {
    init: function () {
      this.appendValueInput("COIN_INDEX")
        .setCheck("Number")
        .appendField("Consider coin");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(45);
      this.setTooltip("แสดงว่ากำลังพิจารณาเหรียญตัวนี้");
    },
  };

  // Memoization hit visual
  Blockly.Blocks["coin_change_memo_hit"] = {
    init: function () {
      this.appendValueInput("AMOUNT")
        .setCheck("Number")
        .appendField("Memo Cache Hit for Amount");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("ดึงค่าจาก Cache (Memoization Hit)");
    }
  };
}

