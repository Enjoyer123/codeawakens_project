// Blockly Logic Operators Block Definitions (for DFS/BFS)
import * as Blockly from "blockly/core";

export function defineLogicOperatorsBlocks() {
  // Not in operator
  Blockly.Blocks["logic_not_in"] = {
    init: function () {
      this.appendValueInput("ITEM")
        .setCheck(null)
        .appendField("❌ Not");
      this.appendValueInput("LIST")
        .setCheck("Array")
        .appendField("in");
      this.setOutput(true, "Boolean");
      this.setColour(210);
      this.setTooltip("เช็คว่า item ไม่อยู่ใน list");
    },
  };
}