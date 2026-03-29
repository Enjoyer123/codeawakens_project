// Blockly Knapsack Trace Feedback Block Definitions
import * as Blockly from "blockly/core";

export function defineKnapsackVisualBlocks() {
  // Pick an item (put into bag)
  Blockly.Blocks["knapsack_pick_item"] = {
    init: function () {
      this.appendValueInput("ITEM_INDEX")
        .setCheck("Number")
        .appendField("Pick item into bag");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip("หยิบสิ่งของใส่กระเป๋า (บันทึก Track)");
    },
  };

  // Remove an item (take out of bag)
  Blockly.Blocks["knapsack_remove_item"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Remove last item from bag");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(0);
      this.setTooltip("เอาสิ่งของล่าสุดออกจากกระเป๋าคืนที่เดิม (Backtrack)");
    },
  };

  // Consider an item (flash temporarily)
  Blockly.Blocks["knapsack_consider_item"] = {
    init: function () {
      this.appendValueInput("ITEM_INDEX")
        .setCheck("Number")
        .appendField("Consider item");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(45);
      this.setTooltip("แสดงแอนิเมชันกำลังพิจารณาสิ่งของชิ้นนี้");
    },
  };

  // Skip an item (don't pick, exclude from this branch)
  Blockly.Blocks["knapsack_skip_item"] = {
    init: function () {
      this.appendValueInput("ITEM_INDEX")
        .setCheck("Number")
        .appendField("Skip item (ไม่เลือก)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(0);
      this.setTooltip("ข้ามสิ่งของชิ้นนี้ (ไม่หยิบ - บันทึก Track)");
    },
  };

  // DP Update Block
  Blockly.Blocks["knapsack_dp_update"] = {
    init: function () {
      this.appendValueInput("ITEM_INDEX")
        .setCheck("Number")
        .appendField("DP Update Row (item idx)");
      this.appendValueInput("CAPACITY")
        .setCheck("Number")
        .appendField("Col (capacity)");
      this.appendValueInput("VALUE")
        .setCheck("Number")
        .appendField("with Max Value");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("บันทึกค่าลงตาราง DP");
    },
  };
}

