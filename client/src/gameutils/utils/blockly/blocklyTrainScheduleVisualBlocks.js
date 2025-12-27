import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

export function defineTrainScheduleBlocks() {
  // Ensure Blockly.Blocks exists
  if (!Blockly.Blocks) {
    if (window.Blockly && window.Blockly.Blocks) {
      // use window.Blockly
    } else {
      return;
    }
  }

  const blocks = Blockly.Blocks || (window.Blockly && window.Blockly.Blocks) || {};

  // Block: sort_trains
  if (!blocks['sort_trains']) {
    blocks['sort_trains'] = {
      init: function () {
        this.appendDummyInput()
          .appendField("เรียงลำดับรถไฟตาม")
          .appendField(new Blockly.FieldDropdown([
            ["เวลามาถึง (Arrive)", "arrive"],
            ["เวลาออก (Depart)", "depart"]
          ]), "KEY")
          .appendField("แบบ")
          .appendField(new Blockly.FieldDropdown([
            ["น้อยไปมาก (ASC)", "ASC"],
            ["มากไปน้อย (DESC)", "DESC"]
          ]), "ORDER");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("Sorts the 'trains' list in place.");
      }
    };

    javascriptGenerator.forBlock['sort_trains'] = function (block) {
      const key = block.getFieldValue('KEY');
      const order = block.getFieldValue('ORDER');

      return `
        (function() {
          if (typeof trains !== 'undefined' && Array.isArray(trains)) {
            trains.sort(function(a, b) {
              var valA = a['${key}'];
              var valB = b['${key}'];
              return ('${order}' === 'ASC') ? (valA - valB) : (valB - valA);
            });
          }
        })();\n`;
    };
  }

  // Block: get_train_value
  // Gets property of a train object
  if (!blocks['get_train_value']) {
    blocks['get_train_value'] = {
      init: function () {
        this.appendValueInput("TRAIN")
          .setCheck(null)
          .appendField("ข้อมูลรถไฟ");
        this.appendDummyInput()
          .appendField(new Blockly.FieldDropdown([
            ["เวลามาถึง (Arrive)", "arrive"],
            ["เวลาออก (Depart)", "depart"]
          ]), "KEY");
        this.setOutput(true, "Number");
        this.setColour(160);
        this.setTooltip("Get arrival or departure time of a train.");
      }
    };

    javascriptGenerator.forBlock['get_train_value'] = function (block) {
      const train = javascriptGenerator.valueToCode(block, 'TRAIN', javascriptGenerator.ORDER_ATOMIC) || '{}';
      const key = block.getFieldValue('KEY');
      return [`(${train}['${key}'])`, javascriptGenerator.ORDER_ATOMIC];
    };
  }

  // Block: assign_train_visual
  // Visual only, does logic updates for visualization array but DOES NOT decide platform
  if (!blocks['assign_train_visual']) {
    blocks['assign_train_visual'] = {
      init: function () {
        this.appendValueInput("TRAIN")
          .setCheck(null)
          .appendField("กำหนดให้");
        this.appendValueInput("PLATFORM")
          .setCheck("Number")
          .appendField("อยู่ชานชาลาที่");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(160);
        this.setTooltip("Records the assignment for visualization.");
      }
    };

    javascriptGenerator.forBlock['assign_train_visual'] = function (block) {
      const train = javascriptGenerator.valueToCode(block, 'TRAIN', javascriptGenerator.ORDER_ATOMIC) || 'null';
      const platform = javascriptGenerator.valueToCode(block, 'PLATFORM', javascriptGenerator.ORDER_ATOMIC) || '0';

      return `
            (function() {
                if (typeof assignments === 'undefined') window.assignments = [];
                assignments.push({
                    train: ${train},
                    platform: ${platform}
                });
            })();\n`;
    };
  }
}
