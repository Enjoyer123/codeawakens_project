// Blockly Subset Sum Trace Recording Blocks
import * as Blockly from "blockly/core";

export function defineSubsetSumVisualBlocks() {
  Blockly.Blocks["subset_sum_consider"] = {
    init: function () {
      this.appendValueInput("WARRIOR_INDEX")
        .setCheck("Number")
        .appendField("Consider Warrior at Index");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip("ไฮไลท์นักรบที่กำลังประเมิน (Record Trace)");
    },
  };

  Blockly.Blocks["subset_sum_include"] = {
    init: function () {
      this.appendValueInput("WARRIOR_INDEX")
        .setCheck("Number")
        .appendField("Include Warrior at Index");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip("บันทึกว่าเลือกนักรบลงตาชั่ง (Record Trace)");
    },
  };

  Blockly.Blocks["subset_sum_exclude"] = {
    init: function () {
      this.appendValueInput("WARRIOR_INDEX")
        .setCheck("Number")
        .appendField("Exclude Warrior at Index");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip("บันทึกว่าหยิบถอดนักรบออก (Record Trace)");
    },
  };

  Blockly.Blocks["subset_sum_reset"] = {
    init: function () {
      this.appendValueInput("WARRIOR_INDEX")
        .setCheck("Number")
        .appendField("Reset Warrior at Index");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip("ย้ายนักรบกลับตำแหน่งเดิมเมื่อ Backtrack (Record Trace)");
    },
  };

  Blockly.Blocks["subset_sum_dp_update"] = {
    init: function () {
      this.appendValueInput("INDEX")
        .setCheck("Number")
        .appendField("DP Record [Index");
      this.appendValueInput("SUM")
        .setCheck("Number")
        .appendField("][Sum");
      this.appendValueInput("VALUE")
        .setCheck("Boolean")
        .appendField("] =");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip("บันทึกค่า DP Table (Record Trace สำหรับ DP)");
    },
  };
}

