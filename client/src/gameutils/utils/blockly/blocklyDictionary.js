// Blockly Dictionary/Object Block Definitions (for Prim's algorithm)
import * as Blockly from "blockly/core";

export function defineDictionaryBlocks() {
  // Create empty dictionary
  Blockly.Blocks["dict_create"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📚 สร้าง dictionary ว่าง");
      this.setOutput(true, null);
      this.setColour(230);
      this.setTooltip("สร้าง dictionary/object ใหม่ที่ว่างเปล่า");
    },
  };

  // Set value in dictionary
  Blockly.Blocks["dict_set"] = {
    init: function () {
      this.appendValueInput("DICT")
        .setCheck(null)
        .appendField("📝 ตั้งค่า");
      this.appendValueInput("KEY")
        .setCheck(["String", "Number"])
        .appendField("key");
      this.appendValueInput("VALUE")
        .setCheck(null)
        .appendField("=");
      this.appendDummyInput()
        .appendField("ใน dictionary");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
      this.setTooltip("ตั้งค่า value ใน dictionary ด้วย key ที่ระบุ");
    },
  };

  // Get value from dictionary
  Blockly.Blocks["dict_get"] = {
    init: function () {
      this.appendValueInput("DICT")
        .setCheck(null)
        .appendField("📖 ดึงค่า");
      this.appendValueInput("KEY")
        .setCheck(["String", "Number"])
        .appendField("key");
      this.appendDummyInput()
        .appendField("จาก dictionary");
      this.setOutput(true, null);
      this.setColour(230);
      this.setTooltip("ดึง value จาก dictionary ด้วย key ที่ระบุ");
    },
  };

  // Check if dictionary has key
  Blockly.Blocks["dict_has_key"] = {
    init: function () {
      this.appendValueInput("DICT")
        .setCheck(null)
        .appendField("🔍 dictionary มี key");
      this.appendValueInput("KEY")
        .setCheck(["String", "Number"])
        .appendField("หรือไม่");
      this.setOutput(true, "Boolean");
      this.setColour(230);
      this.setTooltip("เช็คว่า dictionary มี key ที่ระบุหรือไม่");
    },
  };

  // DSU (Disjoint Set Union) operations for Kruskal's algorithm
  Blockly.Blocks["dsu_find"] = {
    init: function () {
      this.appendValueInput("PARENT")
        .setCheck("Object")
        .appendField("🔍 DSU Find");
      this.appendValueInput("NODE")
        .setCheck("Number")
        .appendField("node");
      this.setOutput(true, "Number");
      this.setInputsInline(true);
      this.setColour(230);
      this.setTooltip("หา root ของ node ใน DSU (Disjoint Set Union)");
      this.setHelpUrl("");
    },
  };

  Blockly.Blocks["dsu_union"] = {
    init: function () {
      this.appendValueInput("PARENT")
        .setCheck("Object")
        .appendField("🔗 DSU Union");
      this.appendValueInput("RANK")
        .setCheck("Object")
        .appendField("rank");
      this.appendValueInput("ROOT_U")
        .setCheck("Number")
        .appendField("root_u");
      this.appendValueInput("ROOT_V")
        .setCheck("Number")
        .appendField("root_v");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
      this.setTooltip("รวมสอง sets ใน DSU เข้าด้วยกัน (union by rank)");
      this.setHelpUrl("");
    },
  };
}

