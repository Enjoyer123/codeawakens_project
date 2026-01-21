// Blockly Coin Block Definitions
import * as Blockly from "blockly/core";
import { ensureVariableExists } from '../data/blocklyVariable';

export function defineCoinBlocks() {
  Blockly.Blocks["collect_coin"] = {
    init: function () {
      this.appendDummyInput().appendField("🪙 เก็บเหรียญ");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(45);
      this.setTooltip("เก็บเหรียญที่อยู่ใน node เดียวกับตัวละคร");
    },
  };

  Blockly.Blocks["have_coin"] = {
    init: function () {
      this.appendDummyInput().appendField("🪙 มีเหรียญ");
      this.setOutput(true, "Boolean");
      this.setColour(45);
      this.setTooltip("ตรวจสอบว่ามีเหรียญอยู่ใน node เดียวกับตัวละครหรือไม่");
    },
  };

  Blockly.Blocks["swap_coins"] = {
    init: function () {
      this.appendValueInput("INDEX1")
        .setCheck("Number")
        .appendField("🔄 สลับเหรียญที่ตำแหน่ง");
      this.appendValueInput("INDEX2")
        .setCheck("Number")
        .appendField("กับตำแหน่ง");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("สลับตำแหน่งเหรียญสองตำแหน่ง");
    },
  };

  Blockly.Blocks["compare_coins"] = {
    init: function () {
      this.appendValueInput("INDEX1")
        .setCheck("Number")
        .appendField("⚖️ เหรียญที่ตำแหน่ง");
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          [">", "GT"],
          ["<", "LT"],
          [">=", "GTE"],
          ["<=", "LTE"],
          ["=", "EQ"],
          ["≠", "NEQ"]
        ]), "OP");
      this.appendValueInput("INDEX2")
        .setCheck("Number")
        .appendField("เหรียญที่ตำแหน่ง");
      this.setOutput(true, "Boolean");
      this.setColour(210);
      this.setTooltip("เปรียบเทียบค่าเหรียญสองตำแหน่ง");
    },
  };

  Blockly.Blocks["get_coin_value"] = {
    init: function () {
      this.appendValueInput("INDEX")
        .setCheck("Number")
        .appendField("💰 ค่าเหรียญที่ตำแหน่ง");
      this.setOutput(true, "Number");
      this.setColour(230);
      this.setTooltip("ดูค่าเหรียญในตำแหน่งที่กำหนด");
    },
  };

  Blockly.Blocks["coin_count"] = {
    init: function () {
      this.appendDummyInput().appendField("🔢 จำนวนเหรียญทั้งหมด");
      this.setOutput(true, "Number");
      this.setColour(230);
      this.setTooltip("จำนวนเหรียญที่เก็บมาได้");
    },
  };

  Blockly.Blocks["is_sorted"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✅ เหรียญเรียงลำดับ")
        .appendField(new Blockly.FieldDropdown([
          ["น้อยไปมาก", "ASC"],
          ["มากไปน้อย", "DESC"]
        ]), "ORDER");
      this.setOutput(true, "Boolean");
      this.setColour(210);
      this.setTooltip("ตรวจสอบว่าเหรียญเรียงลำดับถูกต้องหรือไม่");
    },
  };

  Blockly.Blocks["for_each_coin"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🔄 สำหรับแต่ละเหรียญ")
        .appendField(new Blockly.FieldVariable("coin"), "VAR");
      this.appendStatementInput("DO")
        .setCheck(null)
        .appendField("ทำ");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("วนลูปผ่านเหรียญที่เก็บมาทั้งหมด");

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
          ensureVariableExists(this, 'VAR', 'coin');
        }, 10);
      } else if (event.type === Blockly.Events.BLOCK_CHANGE && event.blockId === this.id) {
        if (event.element === 'field' && event.name === 'VAR') {
          const newValue = event.newValue || 'coin';
          ensureVariableExists(this, 'VAR', newValue);
        }
      }
    }
  };
}

