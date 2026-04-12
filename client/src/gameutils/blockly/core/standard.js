import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";
import { defineAllBlocks } from './definitions';
import { defineAllGenerators } from './generators';
import { applyProcedureOverrides } from '../blocks/procedures/overrides';

export const ensureStandardBlocks = () => {
  defineAllBlocks();
  defineAllGenerators();
  applyProcedureOverrides();

  // local_variable_set: generates `let x = value;` (function-local scope)
  // ใช้สำหรับ recursive function ที่ต้องการตัวแปร local ในแต่ละชั้น
  if (!Blockly.Blocks["local_variable_set"]) {
    Blockly.Blocks["local_variable_set"] = {
      init: function () {
        this.appendValueInput("VALUE")
          .appendField("let")
          .appendField(new Blockly.FieldTextInput("x"), "VAR")
          .appendField("=");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(330);
        this.setTooltip("ประกาศตัวแปร local (let) — ใช้ในฟังก์ชันเพื่อไม่ให้ค่าถูกทับตอน recursive");
      },
    };
  }

  if (!javascriptGenerator.forBlock["local_variable_set"]) {
    javascriptGenerator.forBlock["local_variable_set"] = function (block) {
      const varName = block.getFieldValue("VAR");
      const value = javascriptGenerator.valueToCode(block, "VALUE", javascriptGenerator.ORDER_ASSIGNMENT) || "0";
      
      if (javascriptGenerator.isCleanMode) {
        if (!javascriptGenerator.declaredVariables) {
          javascriptGenerator.declaredVariables = new Set();
        }
        javascriptGenerator.declaredVariables.add(varName);
      }
      
      return `let ${varName} = ${value};\n`;
    };
  }
};
