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

  // Dijkstra trace: Visit node with current known distance
  Blockly.Blocks["dijkstra_visit"] = {
    init: function () {
      this.appendValueInput("NODE").setCheck("Number").appendField("Dijkstra Visit Node");
      this.appendValueInput("DIST").setCheck("Number").appendField("dist =");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(200);
      this.setTooltip("บันทึกการเยือนโหนด + ระยะทางปัจจุบัน (Record Trace)");
    },
  };

  // Dijkstra trace: Edge relaxation
  Blockly.Blocks["dijkstra_relax"] = {
    init: function () {
      this.appendValueInput("FROM").setCheck("Number").appendField("Dijkstra Relax");
      this.appendValueInput("TO").setCheck("Number").appendField("→");
      this.appendValueInput("NEW_DIST").setCheck("Number").appendField("newDist =");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(200);
      this.setTooltip("บันทึกการ Relax เส้น (Record Trace)");
    },
  };

  // Prim trace: Adding node to MST with edge connecting to parent
  Blockly.Blocks["prim_visit"] = {
    init: function () {
      this.appendValueInput("NODE").setCheck("Number").appendField("Prim Visit Node");
      this.appendValueInput("PARENT").setCheck("Number").appendField("from parent =");
      this.appendValueInput("DIST").setCheck("Number").appendField("weight =");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(180);
      this.setTooltip("บันทึกการดึงโหนดเข้า MST + โหนดก่อนหน้า (Record Trace)");
    },
  };

  // Prim trace: Edge relaxation
  Blockly.Blocks["prim_relax"] = {
    init: function () {
      this.appendValueInput("FROM").setCheck("Number").appendField("Prim Relax");
      this.appendValueInput("TO").setCheck("Number").appendField("→");
      this.appendValueInput("NEW_DIST").setCheck("Number").appendField("newWeight =");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(180);
      this.setTooltip("บันทึกการ Relax เส้นใน Prim (Record Trace)");
    },
  };

  // Kruskal trace: Checking an edge
  Blockly.Blocks["kruskal_visit"] = {
    init: function () {
      this.appendValueInput("FROM").setCheck("Number").appendField("Kruskal Check Edge");
      this.appendValueInput("TO").setCheck("Number").appendField("→");
      this.appendValueInput("WEIGHT").setCheck("Number").appendField("weight =");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(180);
      this.setTooltip("บันทึกว่ากำลังพิจารณาเส้นเชื่อมนี้ (Record Trace)");
    },
  };

  // Kruskal trace: Adding edge to MST
  Blockly.Blocks["kruskal_add_edge"] = {
    init: function () {
      this.appendValueInput("FROM").setCheck("Number").appendField("Kruskal Add MST Edge");
      this.appendValueInput("TO").setCheck("Number").appendField("→");
      this.appendValueInput("WEIGHT").setCheck("Number").appendField("weight =");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(180);
      this.setTooltip("บันทึกว่าเลือกเส้นเชื่อมนี้เข้าสู่ MST (Record Trace)");
    },
  };
}


