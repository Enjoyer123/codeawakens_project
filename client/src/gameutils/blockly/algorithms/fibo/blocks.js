// Blockly Fibonacci Trace Feedback Block Definitions
import * as Blockly from "blockly/core";

export function defineFiboVisualBlocks() {
  // Call Fibonacci (Open Node)
  Blockly.Blocks["fibo_call"] = {
    init: function () {
      this.appendValueInput("N")
        .setCheck("Number")
        .appendField("หาค่า Fibo ของลำดับที่");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(210);
      this.setTooltip("แจ้งระบบว่ากำลังเข้าคิวหาค่า Fibo ลำดับนี้ (วาดกิ่งต้นไม้เพิ่ม)");
    },
  };

  // Base case hit
  Blockly.Blocks["fibo_base_case"] = {
    init: function () {
      this.appendValueInput("VALUE")
        .setCheck("Number")
        .appendField("ชนฐาน (Base Case) คืนค่า");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(210);
      this.setTooltip("แจ้งระบบว่ารันถึงเงื่อนไขหยุดแล้ว (ขอบต้นไม้สุดทาง)");
    },
  };

  // Return generated value (Backtrack)
  Blockly.Blocks["fibo_return"] = {
    init: function () {
      this.appendValueInput("VALUE")
        .setCheck("Number")
        .appendField("โหนดนี้คำนวณเสร็จแล้ว คืนค่า");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(210);
      this.setTooltip("แจ้งระบบว่าโหนดปัจจุบันบวกค่าเสร็จแล้ว ถอยกลับขึ้นไปหาข้อข้างบน (Backtrack)");
    },
  };
}
