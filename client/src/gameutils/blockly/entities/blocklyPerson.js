// Blockly Person Rescue Block Definitions
import * as Blockly from "blockly/core";

export function definePersonBlocks() {
  Blockly.Blocks["rescue_person_at_node"] = {
    init: function () {
      this.appendValueInput("NODE_ID")
        .setCheck("Number")
        .appendField("Rescue Person at Node");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("ช่วยคนที่ node ที่กำหนด");
    },
  };

  // Alias for database consistency
  Blockly.Blocks["rescue_person"] = Blockly.Blocks["rescue_person_at_node"];

  Blockly.Blocks["has_person"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Has Person at Node");
      this.setOutput(true, "Boolean");
      this.setColour(210);
      this.setTooltip("ตรวจสอบว่ามีคนที่ node นี้หรือไม่");
    },
  };

  Blockly.Blocks["person_rescued"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Person Rescued");
      this.setOutput(true, "Boolean");
      this.setColour(210);
      this.setTooltip("ตรวจสอบว่าคนที่ node นี้ถูกช่วยแล้วหรือไม่");
    },
  };

  Blockly.Blocks["person_count"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Rescued Count");
      this.setOutput(true, "Number");
      this.setColour(230);
      this.setTooltip("นับจำนวนคนที่ช่วยแล้ว");
    },
  };

  Blockly.Blocks["all_people_rescued"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("All People Rescued");
      this.setOutput(true, "Boolean");
      this.setColour(210);
      this.setTooltip("ตรวจสอบว่าช่วยคนทั้งหมดแล้วหรือไม่");
    },
  };

  Blockly.Blocks["for_each_person"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("For Each Person");
      this.appendStatementInput("DO")
        .appendField("Do");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("วนลูปสำหรับแต่ละคนที่ต้องช่วย");
    },
  };
}

