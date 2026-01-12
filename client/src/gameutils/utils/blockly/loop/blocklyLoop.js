// Blockly Loop Block Definitions
import * as Blockly from "blockly/core";
import { ensureVariableExists } from '../data/blocklyVariable';

export function defineLoopBlocks() {
  Blockly.Blocks["repeat"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🔄 ทำซ้ำ")
        .appendField(new Blockly.FieldNumber(3, 1, 10), "TIMES")
        .appendField("ครั้ง");
      this.appendStatementInput("DO").appendField("ทำ");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("ทำซ้ำตามจำนวนครั้งที่กำหนด");
    },
  };

  Blockly.Blocks["while_loop"] = {
    init: function () {
      this.appendValueInput("CONDITION")
        .setCheck("Boolean")
        .appendField("🔁 ทำซ้ำจนกว่า");
      this.appendStatementInput("DO")
        .appendField("จะเป็นเท็จ ทำ");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("ทำซ้ำจนกว่าเงื่อนไขจะเป็นเท็จ");
    },
  };

  Blockly.Blocks["for_index"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🔢 สำหรับ")
        .appendField(new Blockly.FieldVariable("i"), "VAR")
        .appendField("จาก")
        .appendField(new Blockly.FieldNumber(1, 0), "FROM")
        .appendField("ถึง")
        .appendField(new Blockly.FieldNumber(5, 0), "TO");
      this.appendStatementInput("DO")
        .setCheck(null)
        .appendField("ทำ");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("วนลูปด้วย index");

      this.setOnChange(this.onVariableChange.bind(this));
    },

    onVariableChange: function (event) {
      if (!event || !this.workspace) return;

      // Don't create variables when block is in flyout (toolbox)
      if (this.isInFlyout) {
        return;
      }

      if (event.type === Blockly.Events.BLOCK_CREATE && event.blockId === this.id) {
        setTimeout(() => {
          ensureVariableExists(this, 'VAR', 'i');
        }, 10);
      } else if (event.type === Blockly.Events.BLOCK_CHANGE && event.blockId === this.id) {
        if (event.element === 'field' && event.name === 'VAR') {
          const newValue = event.newValue || 'i';
          ensureVariableExists(this, 'VAR', newValue);
        }
      }
    }
  };

  Blockly.Blocks["for_loop_dynamic"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🔢 สำหรับ")
        .appendField(new Blockly.FieldVariable("i"), "VAR")
        .appendField("จาก");
      this.appendValueInput("FROM")
        .setCheck("Number");
      this.appendDummyInput()
        .appendField("ถึง");
      this.appendValueInput("TO")
        .setCheck("Number");
      this.appendStatementInput("DO")
        .setCheck(null)
        .appendField("ทำ");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("วนลูปด้วยค่าเริ่มต้นและค่าสิ้นสุดที่คำนวณได้");

      this.setOnChange(this.onVariableChange.bind(this));
    },

    onVariableChange: function (event) {
      if (!event || !this.workspace) return;

      // Don't create variables when block is in flyout (toolbox)
      if (this.isInFlyout) {
        return;
      }

      if (event.type === Blockly.Events.BLOCK_CREATE && event.blockId === this.id) {
        setTimeout(() => {
          ensureVariableExists(this, 'VAR', 'i');
        }, 10);
      } else if (event.type === Blockly.Events.BLOCK_CHANGE && event.blockId === this.id) {
        if (event.element === 'field' && event.name === 'VAR') {
          const newValue = event.newValue || 'i';
          ensureVariableExists(this, 'VAR', newValue);
        }
      }
    }
  };
}

