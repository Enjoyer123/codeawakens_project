// Blockly Movement Block Definitions
import * as Blockly from "blockly/core";

export function defineMovementBlocks() {
  Blockly.Blocks["move_forward"] = {
    init: function () {
      this.appendDummyInput().appendField("Move Forward");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('loop_blocks'); // Green (Stamina)
      this.setTooltip("เดินไปข้างหน้า 1 ช่อง (ตามทิศทางที่หัน)");
    },
  };

  Blockly.Blocks["turn_left"] = {
    init: function () {
      this.appendDummyInput().appendField("Turn Left");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('loop_blocks'); // Green (Stamina)
      this.setTooltip("หันไปทางซ้าย");
    },
  };

  Blockly.Blocks["turn_right"] = {
    init: function () {
      this.appendDummyInput().appendField("Turn Right");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('loop_blocks'); // Green (Stamina)
      this.setTooltip("หันไปทางขวา");
    },
  };

  Blockly.Blocks["hit"] = {
    init: function () {
      this.appendDummyInput().appendField("Attack");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('hat_blocks'); // Red (Attack/HP)
      this.setTooltip("โจมตี Monster ในระยะ");
    },
  };

  Blockly.Blocks["move_to_node"] = {
    init: function () {
      this.appendValueInput("NODE_ID")
        .setCheck("Number")
        .appendField("Go to Node");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('loop_blocks');
      this.setTooltip("เดินไปที่ node ที่กำหนด");
    },
  };

  // Move along path (for DFS)
  Blockly.Blocks["move_along_path"] = {
    init: function () {
      this.appendValueInput("PATH")
        .setCheck("Array")
        .appendField("Follow Path");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('loop_blocks');
      this.setTooltip("เดินตาม path ที่กำหนด (list of nodes)");
    },
  };
  // blocklyMovement.js — เพิ่ม input กลับ
  Blockly.Blocks["moveforward_with_explor"] = {
    init: function () {
      this.appendValueInput("STEPS")        // ← เพิ่ม input ชื่อ "STEPS"
        .setCheck("Number")
        .appendField("Move Forward + Explore");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('loop_blocks');
    },
  };
}
