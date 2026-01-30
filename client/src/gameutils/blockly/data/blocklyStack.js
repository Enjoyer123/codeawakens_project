// Blockly Stack Block Definitions
import * as Blockly from "blockly/core";

export function defineStackBlocks() {
  Blockly.Blocks["push_node"] = {
    init: function () {
      this.appendDummyInput().appendField("📚 Push Node");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(300);
      this.setTooltip("เก็บ node ปัจจุบันลงใน stack");
    },
  };

  Blockly.Blocks["pop_node"] = {
    init: function () {
      this.appendDummyInput().appendField("📖 Pop Node");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(300);
      this.setTooltip("ดึง node ออกจาก stack และเดินกลับไป");
    },
  };

  Blockly.Blocks["keep_item"] = {
    init: function () {
      this.appendDummyInput().appendField("💎 Collect Treasure");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(300);
      this.setTooltip("เก็บสมบัติที่ node ปัจจุบัน");
    },
  };

  Blockly.Blocks["has_treasure"] = {
    init: function () {
      this.appendDummyInput().appendField("💎 Has Treasure");
      this.setOutput(true, "Boolean");
      this.setColour(300);
      this.setTooltip("ตรวจสอบว่ามีสมบัติที่ node นี้หรือไม่");
    },
  };

  Blockly.Blocks["treasure_collected"] = {
    init: function () {
      this.appendDummyInput().appendField("✅ Treasure Collected");
      this.setOutput(true, "Boolean");
      this.setColour(300);
      this.setTooltip("ตรวจสอบว่าสมบัติถูกเก็บแล้วหรือไม่");
    },
  };

  Blockly.Blocks["stack_empty"] = {
    init: function () {
      this.appendDummyInput().appendField("📚 Stack Empty");
      this.setOutput(true, "Boolean");
      this.setColour(300);
      this.setTooltip("ตรวจสอบว่า stack ว่างหรือไม่");
    },
  };

  Blockly.Blocks["stack_count"] = {
    init: function () {
      this.appendDummyInput().appendField("🔢 Count in Stack");
      this.setOutput(true, "Number");
      this.setColour(300);
      this.setTooltip("จำนวน node ที่เก็บใน stack");
    },
  };
}

