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
  
  // Override variables_set to fix message format issues
  // Blockly's standard variables_set may have message format problems with JSON format
  // We'll override it to use proper init function instead of JSON
  try {
    // Always override to ensure proper format
    Blockly.Blocks['variables_set'] = {
      init: function() {
        // Use FieldVariable which handles variable selection properly
        this.appendDummyInput()
          .appendField('ตั้งค่า')
          .appendField(new Blockly.FieldVariable('item'), 'VAR')
          .appendField('เป็น');
        this.appendValueInput('VALUE')
          .setCheck(null);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(330);
        this.setTooltip('ตั้งค่าตัวแปร');
        this.setHelpUrl('');
      }
    };
    
    // Ensure generator exists
    if (!javascriptGenerator.forBlock['variables_set']) {
      javascriptGenerator.forBlock['variables_set'] = function(block) {
        const variable = javascriptGenerator.nameDB_.getName(
          block.getFieldValue('VAR'),
          Blockly.Names.NameType.VARIABLE
        );
        const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';
        return `${variable} = ${value};\n`;
      };
    }
    console.log('Overridden variables_set block to fix message format');
  } catch (e) {
    console.error('Failed to override variables_set block:', e);
  }

  // Override math_change to fix message format issues
  // Blockly's standard math_change may have JSON format problems
  try {
    Blockly.Blocks['math_change'] = {
      init: function() {
        this.appendDummyInput()
          .appendField('เปลี่ยน')
          .appendField(new Blockly.FieldVariable('item'), 'VAR')
          .appendField('โดย');
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
      javascriptGenerator.forBlock['math_change'] = function(block) {
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
  // Blockly's standard lists_isEmpty may have JSON format problems
  try {
    Blockly.Blocks['lists_isEmpty'] = {
      init: function() {
        this.appendDummyInput()
          .appendField('ลิสต์');
        this.appendValueInput('VALUE')
          .setCheck('Array');
        this.appendDummyInput()
          .appendField('ว่างหรือไม่');
        this.setOutput(true, 'Boolean');
        this.setColour(260);
        this.setTooltip('เช็คว่า list ว่างหรือไม่');
      }
    };
    
    // Ensure generator exists
    if (!javascriptGenerator.forBlock['lists_isEmpty']) {
      javascriptGenerator.forBlock['lists_isEmpty'] = function(block) {
        const list = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]';
        return [`${list}.length === 0`, javascriptGenerator.ORDER_EQUALITY];
      };
    }
    console.log('Overridden lists_isEmpty block to fix message format');
  } catch (e) {
    console.error('Failed to override lists_isEmpty block:', e);
  }

  // Override procedures_defreturn to fix undefined replace error
  // Blockly's standard procedures_defreturn may have issues with procedure name handling
  try {
    if (Blockly.Blocks['procedures_defreturn']) {
      // Store original functions before overriding
      const originalLoadExtraState = Blockly.Blocks['procedures_defreturn'].loadExtraState;
      const originalRenameProcedure = Blockly.Blocks['procedures_defreturn'].renameProcedure;
      const originalCustomContextMenu = Blockly.Blocks['procedures_defreturn'].customContextMenu;
      
      // Override renameProcedure FIRST to prevent errors
      Blockly.Blocks['procedures_defreturn'].renameProcedure = function(oldName, newName) {
        try {
          // If either name is undefined/null, just return without doing anything
          if (!oldName || !newName) {
            return;
          }
          
          // Ensure both names are strings
          const safeOldName = String(oldName);
          const safeNewName = String(newName);
          
          // Only proceed if both names are valid non-empty strings
          if (!safeOldName || !safeNewName) {
            return;
          }
          
          if (originalRenameProcedure) {
            return originalRenameProcedure.call(this, safeOldName, safeNewName);
          }
        } catch (e) {
          console.warn('Error in procedures_defreturn.renameProcedure:', e);
          // Silently fail to prevent errors
        }
      };
      
      // CRITICAL: Completely override loadExtraState to NEVER call renameProcedure
      // This is the root cause - loadExtraState calls renameProcedure internally
      // Store the override function BEFORE assigning to ensure it's captured
      const loadExtraStateOverride = function(state) {
        console.log('[procedures_defreturn] loadExtraState (blocklyStandardBlocks) called:', { state, stateName: state?.name, thisBlock: this.id || 'new block' });
        try {
          // Ensure state exists and has required properties
          if (!state || typeof state !== 'object') {
            state = {};
          }
          
          // Ensure state.name is a string - this is critical for renameProcedure
          // Don't use "unnamed" as it can cause issues
          let safeName = 'function';
          if (state.name && typeof state.name === 'string' && state.name.trim()) {
            const trimmedName = state.name.trim();
            if (trimmedName && trimmedName !== 'unnamed' && trimmedName !== 'undefined') {
              safeName = trimmedName;
            }
          }
          
          // Ensure state.params is an array
          const safeParams = Array.isArray(state.params) ? state.params : [];
          
          // CRITICAL: Set name field directly WITHOUT calling renameProcedure
          // This is the key fix - we must NOT call originalLoadExtraState
          // because it internally calls renameProcedure with potentially undefined values
          try {
            const nameField = this.getField('NAME');
            if (nameField) {
              nameField.setValue(safeName);
              console.log('[procedures_defreturn] loadExtraState: set name field to:', safeName);
            } else {
              console.warn('[procedures_defreturn] loadExtraState: nameField not found');
            }
          } catch (e) {
            console.error('[procedures_defreturn] loadExtraState: error setting name field:', e);
          }
          
          // Handle parameters if needed
          if (safeParams.length > 0) {
            try {
              if (this.mutationToDom && this.domToMutation) {
                const mutation = this.mutationToDom();
                if (mutation) {
                  mutation.setAttribute('name', safeName);
                  mutation.setAttribute('params', JSON.stringify(safeParams));
                  this.domToMutation(mutation);
                }
              }
            } catch (e) {
              console.error('[procedures_defreturn] loadExtraState: error updating mutation:', e);
            }
          }
          
          return { name: safeName, params: safeParams };
        } catch (e) {
          console.error('[procedures_defreturn] loadExtraState error:', e);
          // Return safe default state on error
          return { name: 'function', params: [] };
        }
      };
      
      // CRITICAL: Assign the override function to the block definition
      // This must be done AFTER defining the function to ensure it's properly bound
      Blockly.Blocks['procedures_defreturn'].loadExtraState = loadExtraStateOverride;
      
      // Verify the override was applied
      console.log('[procedures_defreturn] loadExtraState override applied:', typeof Blockly.Blocks['procedures_defreturn'].loadExtraState);
      console.log('[procedures_defreturn] loadExtraState is our override:', Blockly.Blocks['procedures_defreturn'].loadExtraState === loadExtraStateOverride);
      
      Blockly.Blocks['procedures_defreturn'].customContextMenu = function(options) {
        try {
          // Ensure options exists and is an array
          if (originalCustomContextMenu && options && Array.isArray(options)) {
            // Get procedure name safely
            const procName = this.getFieldValue('NAME');
            if (procName && typeof procName === 'string') {
              return originalCustomContextMenu.call(this, options);
            }
          }
        } catch (e) {
          console.warn('Error in procedures_defreturn.customContextMenu:', e);
        }
      };
      
      console.log('Patched procedures_defreturn to fix undefined errors');
    }
  } catch (e) {
    console.error('Failed to patch procedures_defreturn:', e);
  }
  
  // CRITICAL: Also override procedure call blocks
  // These are created automatically when using custom: "PROCEDURE"
  try {
    // Override procedures_callreturn
    if (Blockly.Blocks['procedures_callreturn']) {
      const originalRenameProcedure = Blockly.Blocks['procedures_callreturn'].renameProcedure;
      
      if (originalRenameProcedure) {
        Blockly.Blocks['procedures_callreturn'].renameProcedure = function(oldName, newName) {
          // Early return if parameters are invalid
          if (!oldName || !newName || oldName === undefined || newName === undefined) {
            return;
          }
          
          try {
            const safeOldName = String(oldName).trim();
            const safeNewName = String(newName).trim();
            
            if (!safeOldName || !safeNewName || safeOldName === 'undefined' || safeNewName === 'undefined') {
              return;
            }
            
            // Only call original if it exists and is a function
            if (originalRenameProcedure && typeof originalRenameProcedure === 'function') {
              // Check if original function might fail - if so, don't call it
              try {
                return originalRenameProcedure.call(this, safeOldName, safeNewName);
              } catch (innerError) {
                // If original fails, just return without error
                console.debug('Original renameProcedure failed, skipping:', innerError);
                return;
              }
            }
            // If no original function, just return (no-op)
            return;
          } catch (e) {
            console.warn('Error in procedures_callreturn.renameProcedure:', e);
            // Don't rethrow - just return
            return;
          }
        };
      }
      
      console.log('Patched procedures_callreturn to fix undefined errors');
    }
    
    // Override procedures_callnoreturn
    if (Blockly.Blocks['procedures_callnoreturn']) {
      const originalRenameProcedure = Blockly.Blocks['procedures_callnoreturn'].renameProcedure;
      
      if (originalRenameProcedure) {
        Blockly.Blocks['procedures_callnoreturn'].renameProcedure = function(oldName, newName) {
          if (!oldName || !newName || oldName === undefined || newName === undefined) {
            return;
          }
          
          try {
            const safeOldName = String(oldName);
            const safeNewName = String(newName);
            
            if (!safeOldName || !safeNewName) {
              return;
            }
            
            return originalRenameProcedure.call(this, safeOldName, safeNewName);
          } catch (e) {
            console.warn('Error in procedures_callnoreturn.renameProcedure:', e);
          }
        };
      }
      
      console.log('Patched procedures_callnoreturn to fix undefined errors');
    }
  } catch (e) {
    console.error('Failed to patch procedure call blocks:', e);
  }

  // Override procedures_defnoreturn to fix undefined replace error
  try {
    if (Blockly.Blocks['procedures_defnoreturn']) {
      // Store original functions before overriding
      const originalLoadExtraState = Blockly.Blocks['procedures_defnoreturn'].loadExtraState;
      const originalRenameProcedure = Blockly.Blocks['procedures_defnoreturn'].renameProcedure;
      const originalCustomContextMenu = Blockly.Blocks['procedures_defnoreturn'].customContextMenu;
      
      // Override renameProcedure FIRST to prevent errors
      Blockly.Blocks['procedures_defnoreturn'].renameProcedure = function(oldName, newName) {
        try {
          // If either name is undefined/null, just return without doing anything
          if (!oldName || !newName) {
            return;
          }
          
          // Ensure both names are strings
          const safeOldName = String(oldName);
          const safeNewName = String(newName);
          
          // Only proceed if both names are valid non-empty strings
          if (!safeOldName || !safeNewName) {
            return;
          }
          
          if (originalRenameProcedure) {
            return originalRenameProcedure.call(this, safeOldName, safeNewName);
          }
        } catch (e) {
          console.warn('Error in procedures_defnoreturn.renameProcedure:', e);
          // Silently fail to prevent errors
        }
      };
      
      // CRITICAL: Completely override loadExtraState to NEVER call renameProcedure
      // This is the root cause - loadExtraState calls renameProcedure internally
      // Store the override function BEFORE assigning to ensure it's captured
      const loadExtraStateOverrideNoreturn = function(state) {
        console.log('[procedures_defnoreturn] loadExtraState (blocklyStandardBlocks) called:', { state, stateName: state?.name, thisBlock: this.id || 'new block' });
        try {
          // Ensure state exists and has required properties
          if (!state || typeof state !== 'object') {
            state = {};
          }
          
          // Ensure state.name is a string - this is critical for renameProcedure
          // Don't use "unnamed" as it can cause issues
          let safeName = 'function';
          if (state.name && typeof state.name === 'string' && state.name.trim()) {
            const trimmedName = state.name.trim();
            if (trimmedName && trimmedName !== 'unnamed' && trimmedName !== 'undefined') {
              safeName = trimmedName;
            }
          }
          
          // Ensure state.params is an array
          const safeParams = Array.isArray(state.params) ? state.params : [];
          
          // CRITICAL: Set name field directly WITHOUT calling renameProcedure
          // This is the key fix - we must NOT call originalLoadExtraState
          // because it internally calls renameProcedure with potentially undefined values
          try {
            const nameField = this.getField('NAME');
            if (nameField) {
              nameField.setValue(safeName);
              console.log('[procedures_defnoreturn] loadExtraState: set name field to:', safeName);
            } else {
              console.warn('[procedures_defnoreturn] loadExtraState: nameField not found');
            }
          } catch (e) {
            console.error('[procedures_defnoreturn] loadExtraState: error setting name field:', e);
          }
          
          // Handle parameters if needed
          if (safeParams.length > 0) {
            try {
              if (this.mutationToDom && this.domToMutation) {
                const mutation = this.mutationToDom();
                if (mutation) {
                  mutation.setAttribute('name', safeName);
                  mutation.setAttribute('params', JSON.stringify(safeParams));
                  this.domToMutation(mutation);
                }
              }
            } catch (e) {
              console.error('[procedures_defnoreturn] loadExtraState: error updating mutation:', e);
            }
          }
          
          return { name: safeName, params: safeParams };
        } catch (e) {
          console.error('[procedures_defnoreturn] loadExtraState error:', e);
          // Return safe default state on error
          return { name: 'function', params: [] };
        }
      };
      
      // CRITICAL: Assign the override function to the block definition
      // This must be done AFTER defining the function to ensure it's properly bound
      Blockly.Blocks['procedures_defnoreturn'].loadExtraState = loadExtraStateOverrideNoreturn;
      
      // Verify the override was applied
      console.log('[procedures_defnoreturn] loadExtraState override applied:', typeof Blockly.Blocks['procedures_defnoreturn'].loadExtraState);
      console.log('[procedures_defnoreturn] loadExtraState is our override:', Blockly.Blocks['procedures_defnoreturn'].loadExtraState === loadExtraStateOverrideNoreturn);
      
      Blockly.Blocks['procedures_defnoreturn'].customContextMenu = function(options) {
        try {
          // Ensure options exists and is an array
          if (originalCustomContextMenu && options && Array.isArray(options)) {
            // Get procedure name safely
            const procName = this.getFieldValue('NAME');
            if (procName && typeof procName === 'string') {
              return originalCustomContextMenu.call(this, options);
            }
          }
        } catch (e) {
          console.warn('Error in procedures_defnoreturn.customContextMenu:', e);
        }
      };
      
      console.log('Patched procedures_defnoreturn to fix undefined errors');
    }
  } catch (e) {
    console.error('Failed to patch procedures_defnoreturn:', e);
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

