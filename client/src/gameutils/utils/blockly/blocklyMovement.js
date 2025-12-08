// Blockly Movement Block Definitions
import * as Blockly from "blockly/core";

export function defineMovementBlocks() {
  Blockly.Blocks["move_forward"] = {
    init: function () {
      this.appendDummyInput().appendField("🔽 เดินไปข้างหน้า");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("เดินไปข้างหน้า 1 ช่อง (ตามทิศทางที่หัน)");
    },
  };

  Blockly.Blocks["turn_left"] = {
    init: function () {
      this.appendDummyInput().appendField("↪️ หันซ้าย");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("หันไปทางซ้าย");
    },
  };

  Blockly.Blocks["turn_right"] = {
    init: function () {
      this.appendDummyInput().appendField("↩️ หันขวา");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(280);
      this.setTooltip("หันไปทางขวา");
    },
  };

  Blockly.Blocks["hit"] = {
    init: function () {
      this.appendDummyInput().appendField("⚔️ โจมตี");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(0);
      this.setTooltip("โจมตี Monster ในระยะ");
    },
  };

  Blockly.Blocks["move_to_node"] = {
    init: function () {
      this.appendValueInput("NODE_ID")
        .setCheck("Number")
        .appendField("🎯 ไปที่ node");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("เดินไปที่ node ที่กำหนด");
    },
  };

  // Move along path (for DFS)
  Blockly.Blocks["move_along_path"] = {
    init: function () {
      this.appendValueInput("PATH")
        .setCheck("Array")
        .appendField("🚶 เดินตาม path");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("เดินตาม path ที่กำหนด (list of nodes)");
    },
  };
}

