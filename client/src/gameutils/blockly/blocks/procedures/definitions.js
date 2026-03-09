// Custom Block: procedures_return (unconditional return)
// Blockly doesn't have a built-in unconditional return block.
// procedures_ifreturn requires a condition, which is confusing when you just want "return value".
import * as Blockly from "blockly/core";

export function defineFunctionBlocks() {
  Blockly.Blocks["procedures_return"] = {
    init: function () {
      this.appendValueInput("VALUE")
        .setCheck(null)
        .appendField("return");
      this.setPreviousStatement(true, null);
      this.setColour(290);
      this.setTooltip("คืนค่าจากฟังก์ชัน");
    },
  };
}
