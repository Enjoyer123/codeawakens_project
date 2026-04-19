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

  Blockly.Blocks["cast_spell"] = {
    init: function () {
      this.appendDummyInput().appendField("Cast Spell");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('hat_blocks'); // Red (Attack/HP)
      this.setTooltip("ร่ายเวทมนตร์");
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
      this.setTooltip("เดินไปที่ node ที่กำหนดs");
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

  Blockly.Blocks["say"] = {
    init: function () {
      this.appendDummyInput().appendField("Say").appendField(new Blockly.FieldTextInput("Hello!"), "TEXT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('hat_blocks');
      this.setTooltip("พูดข้อความ");
    },
  };

  Blockly.Blocks["Defend"] = {
    init: function () {
      this.appendDummyInput().appendField("Defend");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('combat_blocks'); // แดง #E53935 — ดูสีได้ที่ GoogleDocsTheme
      this.setTooltip("ยกโล่ป้องกัน");
    },
  };

}
