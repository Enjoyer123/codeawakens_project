// Blockly Graph Operations Block Definitions (for DFS/BFS)
import * as Blockly from "blockly/core";

export function defineGraphOperationsBlocks() {
  // Get neighbors of node
  Blockly.Blocks["graph_get_neighbors"] = {
    init: function () {
      this.appendValueInput("GRAPH")
        .setCheck(null)
        .appendField("Get Neighbors of Node");
      this.appendValueInput("NODE")
        .setCheck("Number")
        .appendField("from Graph");
      this.setOutput(true, "Array");
      this.setColour(200);
      this.setTooltip("ดึง neighbors ของ node จาก graph");
    },
  };

  // Get node value
  Blockly.Blocks["graph_get_node_value"] = {
    init: function () {
      this.appendValueInput("NODE")
        .setCheck("Number")
        .appendField("Node Value");
      this.setOutput(true, "Number");
      this.setColour(200);
      this.setTooltip("อ่านค่า node");
    },
  };

  // Get current node (where player is currently)
  Blockly.Blocks["graph_get_current_node"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Current Node ID");
      this.setOutput(true, "Number");
      this.setColour(200);
      this.setTooltip("แสดงเลข node ที่ตัวละครอยู่ปัจจุบัน");
    },
  };

  // Get neighbors with weight (for Dijkstra)
  Blockly.Blocks["graph_get_neighbors_with_weight"] = {
    init: function () {
      this.appendValueInput("GRAPH")
        .setCheck(null)
        .appendField("Get Neighbors with Weight of Node");
      this.appendValueInput("NODE")
        .setCheck("Number")
        .appendField("from Graph");
      this.setOutput(true, "Array");
      this.setColour(200);
      this.setTooltip("ดึง neighbors ของ node พร้อม weight (return array of [neighbor, weight])");
    },
  };

  // Get all edges from graph (for Kruskal)
  Blockly.Blocks["graph_get_all_edges"] = {
    init: function () {
      this.appendValueInput("GRAPH")
        .setCheck(null)
        .appendField("Get All Edges from Graph");
      this.setOutput(true, "Array");
      this.setColour(200);
      this.setTooltip("ดึง edges ทั้งหมดจาก graph (return array of [u, v, weight])");
    },
  };
}


