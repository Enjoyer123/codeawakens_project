// Blockly Variable Block Definitions
import * as Blockly from "blockly/core";
import { ensureVariableExists } from './blocklyVariable';

export function defineVariableBlocks() {
  Blockly.Blocks["var_math"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🧮 Calculate")
        .appendField(new Blockly.FieldVariable("i"), "VAR")
        .appendField(new Blockly.FieldDropdown([
          ["+", "ADD"],
          ["-", "MINUS"],
          ["×", "MULTIPLY"],
          ["÷", "DIVIDE"]
        ]), "OP");
      this.appendValueInput("VALUE")
        .setCheck("Number")
        .appendField("with");
      this.setOutput(true, "Number");
      this.setColour(230);
      this.setTooltip("การคำนวณทางคณิตศาสตร์");

      this.setOnChange(this.onVariableChange.bind(this));
    },

    onVariableChange: function (event) {
      if (!event || !this.workspace) return;

      // Don't create variables when block is in flyout (toolbox)
      if (this.isInFlyout) {
        return;
      }

      if (event.type === Blockly.Events.BLOCK_CHANGE && event.blockId === this.id) {
        if (event.name === 'VAR') {
          ensureVariableExists(this, 'VAR', 'i');
        }
      }
    }
  };

  Blockly.Blocks["get_var_value"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📊 Value of")
        .appendField(new Blockly.FieldVariable("i"), "VAR");
      this.setOutput(true, "Number");
      this.setColour(330);
      this.setTooltip("ได้ค่าของตัวแปร");

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

