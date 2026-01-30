// Blockly Standard Blocks Fallbacks and Error Handling
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";
import { defineAllBlocks } from '../blocklyBlocks';
import { defineAllGenerators } from '../blocklyGenerators';
import { applyUIPatches } from './blocklyUIPatches';
import { applyProcedureOverrides } from './blocklyProcedureOverrides';

// Add fallback blocks for missing standard blocks
export function ensureStandardBlocks() {
  console.log("Ensuring standard blocks and variables...");

  // Apply UI Patches (Menu, MenuItem, Dropdown, Gesture)
  applyUIPatches();

  // Apply Procedure Overrides (Fix renaming, N-Queen logic, etc.)
  applyProcedureOverrides();

  // Create fallback for variables_get if missing
  if (!Blockly.Blocks['variables_get']) {
    console.warn('variables_get block not found, creating fallback...');
    try {
      Blockly.Blocks['variables_get'] = {
        init: function () {
          this.appendDummyInput()
            .appendField(new Blockly.FieldVariable("item"), "VAR");
          this.setOutput(true, null);
          this.setColour(330);
          this.setTooltip("ค่าของตัวแปร");
        }
      };

      javascriptGenerator.forBlock['variables_get'] = function (block) {
        const varName = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE);
        return [varName, javascriptGenerator.ORDER_ATOMIC];
      };

      console.log('Created fallback variables_get block');
    } catch (e) {
      console.error('Failed to create fallback variables_get block:', e);
    }
  }

  // Override variables_set to fix message format issues
  try {
    // Always override to ensure proper format
    Blockly.Blocks['variables_set'] = {
      init: function () {
        // Use FieldVariable which handles variable selection properly
        this.appendDummyInput()
          .appendField('Set')
          .appendField(new Blockly.FieldVariable('item'), 'VAR')
          .appendField('to');
        this.appendValueInput('VALUE')
          .setCheck(null);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(330);
        this.setTooltip('ตั้งค่าตัวแปร');
        this.setHelpUrl('');
      }
    };

    // Ensure generator exists - check if already exists (likely from blocklyGenerators.js with MST_weight detection)
    if (!javascriptGenerator.forBlock['variables_set']) {
      javascriptGenerator.forBlock['variables_set'] = function (block) {
        const variable = javascriptGenerator.nameDB_.getName(
          block.getFieldValue('VAR'),
          Blockly.Names.NameType.VARIABLE
        );
        const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';

        // This simple generator does NOT include the MST_weight logic found in blocklyGenerators.js.
        // If defineAllGenerators() was called, that one should take precedence if we didn't overwrite it here.
        // We only overwrite if it is MISSING.
        return `${variable} = ${value};\n`;
      };
    }
    console.log('Overridden variables_set block to fix message format');
  } catch (e) {
    console.error('Failed to override variables_set block:', e);
  }

  // Override math_change to fix message format issues
  try {
    Blockly.Blocks['math_change'] = {
      init: function () {
        this.appendDummyInput()
          .appendField('Change')
          .appendField(new Blockly.FieldVariable('item'), 'VAR')
          .appendField('by');
        this.appendValueInput('DELTA')
          .setCheck('Number');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip('เปลี่ยนค่าตัวแปร');
        this.setHelpUrl('');
      }
    };

    // Ensure generator exists
    if (!javascriptGenerator.forBlock['math_change']) {
      javascriptGenerator.forBlock['math_change'] = function (block) {
        const variable = javascriptGenerator.nameDB_.getName(
          block.getFieldValue('VAR'),
          Blockly.Names.NameType.VARIABLE
        );
        const delta = javascriptGenerator.valueToCode(block, 'DELTA', javascriptGenerator.ORDER_ADDITION) || '0';
        return `${variable} = (${variable} || 0) + ${delta};\n`;
      };
    }
    console.log('Overridden math_change block to fix message format');
  } catch (e) {
    console.error('Failed to override math_change block:', e);
  }

  // Override lists_isEmpty to fix message format issues
  try {
    Blockly.Blocks['lists_isEmpty'] = {
      init: function () {
        this.appendDummyInput()
          .appendField('List');
        this.appendValueInput('VALUE')
          .setCheck('Array');
        this.appendDummyInput()
          .appendField('Is Empty');
        this.setOutput(true, 'Boolean');
        this.setColour(260);
        this.setTooltip('เช็คว่า list ว่างหรือไม่');
      }
    };

    // Ensure generator exists
    if (!javascriptGenerator.forBlock['lists_isEmpty']) {
      javascriptGenerator.forBlock['lists_isEmpty'] = function (block) {
        const list = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]';
        return [`${list}.length === 0`, javascriptGenerator.ORDER_EQUALITY];
      };
    }
    console.log('Overridden lists_isEmpty block to fix message format');
  } catch (e) {
    console.error('Failed to override lists_isEmpty block:', e);
  }

  // Create fallback for math_arithmetic if missing (Standard Override)
  if (!Blockly.Blocks['math_arithmetic']) {
    console.warn('math_arithmetic block not found, creating fallback...');
    try {
      Blockly.Blocks['math_arithmetic'] = {
        init: function () {
          this.appendValueInput("A")
            .setCheck("Number");
          this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
              ["+", "ADD"],
              ["-", "MINUS"],
              ["×", "MULTIPLY"],
              ["÷", "DIVIDE"],
              ["%", "MODULO"]
            ]), "OP");
          this.appendValueInput("B")
            .setCheck("Number");
          this.setOutput(true, "Number");
          this.setColour(230);
          this.setTooltip("การคำนวณพื้นฐาน");
        }
      };

      javascriptGenerator.forBlock['math_arithmetic'] = function (block) {
        const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_ATOMIC) || '0';
        const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_ATOMIC) || '0';
        const operator = block.getFieldValue('OP');

        let op;
        switch (operator) {
          case 'ADD': op = '+'; break;
          case 'MINUS': op = '-'; break;
          case 'MULTIPLY': op = '*'; break;
          case 'DIVIDE': op = '/'; break;
          case 'MODULO': op = '%'; break;
          default: op = '+';
        }

        const result = `(${a} ${op} ${b})`;
        return [result, javascriptGenerator.ORDER_ATOMIC];
      };

      console.log('Created fallback math_arithmetic block');
    } catch (e) {
      console.error('Failed to create fallback math_arithmetic block:', e);
    }
  }

  // Fix tooltip function to always return string
  if (Blockly.Block && Blockly.Block.prototype.getTooltip) {
    const originalGetTooltip = Blockly.Block.prototype.getTooltip;
    Blockly.Block.prototype.getTooltip = function () {
      try {
        const tooltip = originalGetTooltip.call(this);
        // Ensure tooltip is always a string
        if (typeof tooltip === 'function') {
          const result = tooltip.call(this);
          return typeof result === 'string' ? result : (result || '');
        }
        return typeof tooltip === 'string' ? tooltip : (tooltip || '');
      } catch (e) {
        console.warn('Error getting tooltip for block:', this.type, e);
        return '';
      }
    };
  }

  // Define all custom blocks & generators (Ensure they exist)
  defineAllBlocks();
  defineAllGenerators();
}
