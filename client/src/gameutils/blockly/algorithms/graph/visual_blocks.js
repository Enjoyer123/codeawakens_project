// Blockly DFS Visual Feedback Block Definitions
import * as Blockly from "blockly/core";

export function defineDfsVisualBlocks() {
  // Get neighbors with visual feedback
  Blockly.Blocks["graph_get_neighbors_visual"] = {
    init: function () {
      this.appendValueInput("GRAPH")
        .setCheck(null)
        .appendField("Get Neighbors of Node (Visual)");
      this.appendValueInput("NODE")
        .setCheck("Number")
        .appendField("from Graph");
      this.setOutput(true, "Array");
      this.setColour(200);
      this.setTooltip("ดึง neighbors ของ node จาก graph พร้อมแสดง visual feedback");
    },
  };

  // Mark node as visited with visual feedback
  Blockly.Blocks["mark_visited_visual"] = {
    init: function () {
      this.appendValueInput("NODE")
        .setCheck("Number")
        .appendField("Mark Node");
      this.appendDummyInput()
        .appendField("as Visited (Visual)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(200);
      this.setTooltip("ทำเครื่องหมาย node ว่า visited พร้อมแสดง visual feedback");
    },
  };

  // Show path update with visual feedback
  Blockly.Blocks["show_path_visual"] = {
    init: function () {
      this.appendValueInput("PATH")
        .setCheck("Array")
        .appendField("Show Path (Visual)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(200);
      this.setTooltip("แสดง path ที่กำลังสร้างพร้อม visual feedback");
    },
  };
}

