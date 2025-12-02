// Blockly Standard Blocks Fallbacks and Error Handling
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";
import { defineAllBlocks } from './blocklyBlocks';
import { defineAllGenerators } from './blocklyGenerators';

// Add error handling for MenuItem to prevent appendChild errors
if (Blockly.MenuItem && Blockly.MenuItem.prototype.createDom) {
  Blockly.MenuItem.prototype.createDom = function() {
    try {
      // Check if we have valid DOM context
      if (!document.body || !document.createElement) {
        console.warn("DOM not ready for MenuItem createDom");
        return this.createFallbackElement();
      }
      
      // Create a simple fallback element instead of using original method
      return this.createFallbackElement();
    } catch (error) {
      console.warn("Error in MenuItem createDom:", error);
      return this.createFallbackElement();
    }
  };
  
  // Add fallback element creation method
  Blockly.MenuItem.prototype.createFallbackElement = function() {
    const element = document.createElement('div');
    element.textContent = this.text_ || 'Menu Item';
    element.className = 'blocklyMenuItem';
    element.style.padding = '8px';
    element.style.cursor = 'pointer';
    element.style.backgroundColor = '#fff';
    element.style.border = '1px solid #ccc';
    element.style.borderRadius = '4px';
    element.style.margin = '2px';
    element.style.fontSize = '12px';
    
    // Add click handler
    element.addEventListener('click', () => {
      if (this.callback_) {
        this.callback_(this);
      }
    });
    
    return element;
  };
}

// Add error handling for Menu to prevent appendChild errors
if (Blockly.Menu && Blockly.Menu.prototype.render) {
  Blockly.Menu.prototype.render = function() {
    try {
      // Check if we have valid DOM context
      if (!document.body || !document.createElement) {
        console.warn("DOM not ready for Menu render");
        return this.createFallbackMenu();
      }
      
      // Create a simple fallback menu instead of using original method
      return this.createFallbackMenu();
    } catch (error) {
      console.warn("Error in Menu render:", error);
      return this.createFallbackMenu();
    }
  };
  
  // Add fallback menu creation method
  Blockly.Menu.prototype.createFallbackMenu = function() {
    const element = document.createElement('div');
    element.className = 'blocklyMenu';
    element.style.position = 'absolute';
    element.style.backgroundColor = 'white';
    element.style.border = '1px solid #ccc';
    element.style.borderRadius = '4px';
    element.style.padding = '5px';
    element.style.zIndex = '1000';
    element.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    element.style.minWidth = '120px';
    
    // Add menu items
    if (this.menuItems_ && this.menuItems_.length > 0) {
      this.menuItems_.forEach(item => {
        const itemElement = item.createDom();
        element.appendChild(itemElement);
      });
    } else {
      element.textContent = 'Menu';
    }
    
    return element;
  };
}

// Fix FieldDropdown to work properly for non-variable fields
if (Blockly.FieldDropdown && Blockly.FieldDropdown.prototype.showEditor_) {
  const originalShowEditor = Blockly.FieldDropdown.prototype.showEditor_;
  Blockly.FieldDropdown.prototype.showEditor_ = function() {
    // Skip dropdown for variable fields - let FieldVariable handle it
    if (this.sourceBlock_ && this.sourceBlock_.type && 
        (this.sourceBlock_.type.includes('variable') || this.sourceBlock_.type.includes('VAR'))) {
      console.log('Skipping dropdown for variable field');
      return;
    }
    
    try {
      // Check if DOM is ready
      if (!this.sourceBlock_ || !this.sourceBlock_.workspace || !document.body) {
        console.warn('FieldDropdown: DOM not ready, using fallback');
        this.showFallbackDropdown();
        return;
      }
      
      return originalShowEditor.call(this);
    } catch (error) {
      console.warn('Error in FieldDropdown.showEditor_:', error);
      this.showFallbackDropdown();
    }
  };
  
  // Add fallback dropdown editor
  Blockly.FieldDropdown.prototype.showFallbackDropdown = function() {
    const options = this.getOptions();
    if (!options || options.length === 0) {
      console.warn('No options available for dropdown');
      return;
    }
    
    const currentValue = this.getValue();
    const currentIndex = options.findIndex(option => option[1] === currentValue);
    const nextIndex = (currentIndex + 1) % options.length;
    const nextValue = options[nextIndex][1];
    const nextLabel = options[nextIndex][0];
    
    console.log(`Changing dropdown from ${currentValue} to ${nextValue} (${nextLabel})`);
    
    try {
      this.setValue(nextValue);
      if (this.sourceBlock_ && this.sourceBlock_.workspace && this.sourceBlock_.workspace.render) {
        this.sourceBlock_.workspace.render();
      }
    } catch (error) {
      console.error('Error setting dropdown value:', error);
    }
  };
}

// Add error handling for Gesture to prevent gesture errors
if (Blockly.Gesture && Blockly.Gesture.prototype.setStartField) {
  const originalSetStartField = Blockly.Gesture.prototype.setStartField;
  Blockly.Gesture.prototype.setStartField = function(field) {
    try {
      // Check if gesture is already started
      if (this.started_) {
        console.warn('Gesture already started, skipping setStartField');
        return;
      }
      return originalSetStartField.call(this, field);
    } catch (error) {
      console.warn('Error in Gesture.setStartField:', error);
      return;
    }
  };
}

// Add fallback blocks for missing standard blocks
export function ensureStandardBlocks() {
  // Ensure common variables exist
  if (typeof window !== 'undefined' && window.Blockly) {
    // This will be called when workspace is created
    console.log("Ensuring standard blocks and variables...");
  }
  
  // Define all custom blocks first
  defineAllBlocks();
  
  // Define all JavaScript generators
  defineAllGenerators();
  
  // Create fallback for variables_get if missing
  if (!Blockly.Blocks['variables_get']) {
    console.warn('variables_get block not found, creating fallback...');
    try {
      Blockly.Blocks['variables_get'] = {
        init: function() {
          this.appendDummyInput()
            .appendField(new Blockly.FieldVariable("item"), "VAR");
          this.setOutput(true, null);
          this.setColour(330);
          this.setTooltip("Get variable value");
        }
      };
      
      javascriptGenerator.forBlock['variables_get'] = function(block) {
        const varName = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE);
        return [varName, javascriptGenerator.ORDER_ATOMIC];
      };
      
      console.log('Created fallback variables_get block');
    } catch (e) {
      console.error('Failed to create fallback variables_get block:', e);
    }
  }
  
  // Note: variables_set is provided by Blockly's standard blocks
  // We don't need to create a fallback, but we can ensure it exists
  if (!Blockly.Blocks['variables_set']) {
    console.warn('variables_set block not found - Blockly should provide this by default');
    // Don't create a custom one - let Blockly handle it
  }
  
  // Create fallback for math_arithmetic if missing
  if (!Blockly.Blocks['math_arithmetic']) {
    console.warn('math_arithmetic block not found, creating fallback...');
    try {
      Blockly.Blocks['math_arithmetic'] = {
        init: function() {
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
          this.setTooltip("Basic arithmetic operations");
        }
      };
      
      javascriptGenerator.forBlock['math_arithmetic'] = function(block) {
        const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_ATOMIC) || '0';
        const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_ATOMIC) || '0';
        const operator = block.getFieldValue('OP');
        
        // Debug logging
        console.log('math_arithmetic - a:', a, 'b:', b, 'operator:', operator);
        
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
        console.log('math_arithmetic result:', result);
        return [result, javascriptGenerator.ORDER_ATOMIC];
      };
      
      console.log('Created fallback math_arithmetic block');
    } catch (e) {
      console.error('Failed to create fallback math_arithmetic block:', e);
    }
  }
  
  // math_number block is defined in the main blocks section
  
  // Create fallback for controls_repeat_ext if missing
  if (!Blockly.Blocks['controls_repeat_ext']) {
    console.warn('controls_repeat_ext block not found, creating fallback...');
    try {
      Blockly.Blocks['controls_repeat_ext'] = {
        init: function() {
          this.appendValueInput("TIMES")
            .setCheck("Number")
            .appendField("ทำซ้ำ");
          this.appendStatementInput("DO")
            .appendField("ครั้ง");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(120);
          this.setTooltip("Repeat block");
        }
      };
      
      javascriptGenerator.forBlock['controls_repeat_ext'] = function(block) {
        const times = javascriptGenerator.valueToCode(block, 'TIMES', javascriptGenerator.ORDER_ATOMIC) || '0';
        const branch = javascriptGenerator.statementToCode(block, 'DO');
        const code = `for (let i = 0; i < ${times}; i++) {\n${branch}}`;
        return code;
      };
      
      console.log('Created fallback controls_repeat_ext block');
    } catch (e) {
      console.error('Failed to create fallback controls_repeat_ext block:', e);
    }
  }
  
  // Create fallback for controls_whileUntil if missing
  if (!Blockly.Blocks['controls_whileUntil']) {
    console.warn('controls_whileUntil block not found, creating fallback...');
    try {
      Blockly.Blocks['controls_whileUntil'] = {
        init: function() {
          this.appendValueInput("BOOL")
            .setCheck("Boolean")
            .appendField("ทำซ้ำจนกว่า");
          this.appendStatementInput("DO")
            .appendField("ทำ");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(120);
          this.setTooltip("While loop");
        }
      };
      
      javascriptGenerator.forBlock['controls_whileUntil'] = function(block) {
        const bool = javascriptGenerator.valueToCode(block, 'BOOL', javascriptGenerator.ORDER_NONE) || 'false';
        const branch = javascriptGenerator.statementToCode(block, 'DO');
        const code = `while (${bool}) {\n${branch}}`;
        return code;
      };
      
      console.log('Created fallback controls_whileUntil block');
    } catch (e) {
      console.error('Failed to create fallback controls_whileUntil block:', e);
    }
  }
}

