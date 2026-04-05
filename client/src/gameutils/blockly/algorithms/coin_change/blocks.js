// Blockly Coin Change Visual Feedback Block Definitions
import * as Blockly from "blockly/core";

export function defineCoinChangeVisualBlocks() {
  // Consider a coin (flash highlight)
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

  // Pick a coin (include — use this coin)
  Blockly.Blocks["coin_change_pick_coin"] = {
    init: function () {
      this.appendValueInput("COIN_INDEX")
        .setCheck("Number")
        .appendField("Pick coin (เลือกใช้)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip("เลือกใช้เหรียญนี้ (บันทึก Track)");
    },
  };

  // Skip a coin (exclude — don't use, move to next type)
  Blockly.Blocks["coin_change_skip_coin"] = {
    init: function () {
      this.appendValueInput("COIN_INDEX")
        .setCheck("Number")
        .appendField("Skip coin (ข้ามไปใช้ชนิดถัดไป)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(0);
      this.setTooltip("ข้ามเหรียญชนิดนี้ ไปพิจารณาชนิดถัดไป (บันทึก Track)");
    },
  };

  // Remove / Backtrack (undo last pick or skip)
  Blockly.Blocks["coin_change_remove_coin"] = {
    init: function () {
      this.appendValueInput("COIN_INDEX")
        .setCheck("Number")
        .appendField("Remove last coin (ย้อนกลับ)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(0);
      this.setTooltip("ย้อนกลับจากทางเลือกล่าสุด (Backtrack)");
    },
  };

  // Prune Pick & Skip (amount < coin → can't use this coin)
  Blockly.Blocks["coin_change_prune_skip"] = {
    init: function () {
      this.appendValueInput("COIN_INDEX")
        .setCheck("Number")
        .appendField("Prune 'Pick' & Skip");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(0);
      this.setTooltip("จำนวนเงินไม่พอใช้เหรียญนี้ ตัดกิ่ง Pick ทิ้ง (Prune) ❌ และบังคับข้าม");
    },
  };

  // === Legacy blocks (keep for backward compat with old DP levels) ===
  Blockly.Blocks["coin_change_add_warrior_to_selection"] = {
    init: function () {
      this.appendValueInput("WARRIOR_INDEX")
        .setCheck("Number")
        .appendField("Add Warrior to Selection");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip("เพิ่มนักรบเข้าไปในกรอบเลือก (Legacy)");
    },
  };

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
      this.setTooltip("ติดตามการตัดสินใจสำหรับอัลกอริทึมแลกเหรียญ (Legacy)");
    },
  };

  Blockly.Blocks["coin_change_remove_warrior"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Remove last warrior from selection");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(0);
      this.setTooltip("ดึงนักรบตัวสุดท้ายออกจากกรอบเลือก (Legacy)");
    },
  };

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
