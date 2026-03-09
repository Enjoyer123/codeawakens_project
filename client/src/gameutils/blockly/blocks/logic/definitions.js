// Blockly Logic Block Definitions
import * as Blockly from "blockly/core";

export function defineLogicBlocks() {
  Blockly.Blocks["found_monster"] = {
    init: function () {
      this.appendDummyInput().appendField("Found Monster");
      this.setOutput(true, "Boolean");
      this.setColour(330);
      this.setTooltip("ตรวจสอบว่าเจอ Monster หรือไม่");
    },
  };

  Blockly.Blocks["can_move_forward"] = {
    init: function () {
      this.appendDummyInput().appendField("Can Move Forward");
      this.setOutput(true, "Boolean");
      this.setColour(330);
      this.setTooltip("ตรวจสอบว่าเดินไปข้างหน้าได้หรือไม่");
    },
  };

  Blockly.Blocks["near_pit"] = {
    init: function () {
      this.appendDummyInput().appendField("Near Pit");
      this.setOutput(true, "Boolean");
      this.setColour(330);
      this.setTooltip("ตรวจสอบว่าใกล้หลุมหรือไม่");
    },
  };

  Blockly.Blocks["at_goal"] = {
    init: function () {
      this.appendDummyInput().appendField("At Goal");
      this.setOutput(true, "Boolean");
      this.setColour(330);
      this.setTooltip("ตรวจสอบว่าถึงเป้าหมายแล้วหรือไม่");
    },
  };

}

