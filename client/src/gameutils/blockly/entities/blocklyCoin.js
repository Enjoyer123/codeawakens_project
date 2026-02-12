// Blockly Coin Block Definitions
import * as Blockly from "blockly/core";
import { ensureVariableExists, createVariableChangeHandler } from '../data/blocklyVariable';

export function defineCoinBlocks() {
  Blockly.Blocks["collect_coin"] = {
    init: function () {
      this.appendDummyInput().appendField("Collect Coin");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(45);
      this.setTooltip("เก็บเหรียญที่อยู่ใน node เดียวกับตัวละคร");
    },
  };

  Blockly.Blocks["have_coin"] = {
    init: function () {
      this.appendDummyInput().appendField("Has Coin");
      this.setOutput(true, "Boolean");
      this.setColour(45);
      this.setTooltip("ตรวจสอบว่ามีเหรียญอยู่ใน node เดียวกับตัวละครหรือไม่");
    },
  };

  // Alias for database consistency
  Blockly.Blocks["has_coin"] = Blockly.Blocks["have_coin"];

  Blockly.Blocks["swap_coins"] = {
    init: function () {
      this.appendValueInput("INDEX1")
        .setCheck("Number")
        .appendField("Swap Coins at Index");
      this.appendValueInput("INDEX2")
        .setCheck("Number")
        .appendField("with Index");
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
        .appendField("Coin at Index");
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
        .appendField("Coin at Index");
      this.setOutput(true, "Boolean");
      this.setColour(210);
      this.setTooltip("เปรียบเทียบค่าเหรียญสองตำแหน่ง");
    },
  };

  Blockly.Blocks["get_coin_value"] = {
    init: function () {
      this.appendValueInput("INDEX")
        .setCheck("Number")
        .appendField("Value of Coin at Index");
      this.setOutput(true, "Number");
      this.setColour(230);
      this.setTooltip("ดูค่าเหรียญในตำแหน่งที่กำหนด");
    },
  };

  Blockly.Blocks["coin_count"] = {
    init: function () {
      this.appendDummyInput().appendField("Total Coins Count");
      this.setOutput(true, "Number");
      this.setColour(230);
      this.setTooltip("จำนวนเหรียญที่เก็บมาได้");
    },
  };

  Blockly.Blocks["is_sorted"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Is Sorted")
        .appendField(new Blockly.FieldDropdown([
          ["Ascending", "ASC"],
          ["Descending", "DESC"]
        ]), "ORDER");
      this.setOutput(true, "Boolean");
      this.setColour(210);
      this.setTooltip("ตรวจสอบว่าเหรียญเรียงลำดับถูกต้องหรือไม่");
    },
  };

  Blockly.Blocks["for_each_coin"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("For Each Coin")
        .appendField(new Blockly.FieldVariable("coin"), "VAR");
      this.appendStatementInput("DO")
        .setCheck(null)
        .appendField("Do");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("วนลูปผ่านเหรียญที่เก็บมาทั้งหมด");

      this.setOnChange(createVariableChangeHandler('coin').bind(this));
    }
  };
}

