// Blockly Knapsack Visual Feedback Block Definitions
import * as Blockly from "blockly/core";

export function defineKnapsackVisualBlocks() {
  // Select knapsack item (move it into the bag)
  Blockly.Blocks["knapsack_select_item"] = {
    init: function () {
      this.appendValueInput("ITEM_INDEX")
        .setCheck("Number")
        .appendField("Select Item");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip("เลือกสมบัติและขยับเข้าไปในกระเป๋า (แสดงผล)");
    },
  };

  // Unselect knapsack item (move it back to original position)
  Blockly.Blocks["knapsack_unselect_item"] = {
    init: function () {
      this.appendValueInput("ITEM_INDEX")
        .setCheck("Number")
        .appendField("Unselect Item");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip("ไม่เลือกสมบัติและขยับกลับไปตำแหน่งเดิม (แสดงผล)");
    },
  };
}

