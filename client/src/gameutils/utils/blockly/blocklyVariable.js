// Blockly Variable Handling
import * as Blockly from "blockly/core";

// Function to safely create/update variable field
function ensureVariableExists(block, fieldName, defaultName) {
  if (!block || !block.workspace) return;
  
  const field = block.getField(fieldName);
  if (!field) return;
  
  const varName = field.getValue() || defaultName;
  const workspace = block.workspace;
  
  // Check if variable exists, create if not
  const variableMap = workspace.getVariableMap();
  let variable = variableMap.getVariable(varName);
  if (!variable) {
    console.log(`Creating variable: ${varName}`);
    try {
      variable = variableMap.createVariable(varName);
      console.log('Variable created successfully:', variable);
    } catch (error) {
      console.error('Error creating variable:', error);
      return null;
    }
  }
  
  // Update field value to ensure consistency
  if (field.getValue() !== varName) {
    try {
    field.setValue(varName);
    } catch (error) {
      console.error('Error setting field value:', error);
    }
  }
  
  return variable;
}

// Simple FieldVariable handling - always use prompt
function improveFieldVariableHandling() {
  if (!Blockly.FieldVariable) return;
  
  // Override showEditor to always use prompt
  Blockly.FieldVariable.prototype.showEditor_ = function() {
    console.log('FieldVariable showEditor_ called');
    
    const currentValue = this.getValue() || 'variable';
    console.log('Current value:', currentValue);
    
    const newName = prompt("ใส่ชื่อตัวแปร:", currentValue);
    console.log('User entered:', newName);
    
    if (newName !== null && newName !== currentValue && newName.trim() !== '') {
      const cleanValue = newName.trim();
      console.log('Setting variable to:', cleanValue);
      
      try {
        // Ensure variable exists in workspace
        if (this.sourceBlock_ && this.sourceBlock_.workspace) {
          const workspace = this.sourceBlock_.workspace;
          let variable = workspace.getVariable(cleanValue);
          
          if (!variable) {
            console.log('Creating new variable:', cleanValue);
            variable = workspace.createVariable(cleanValue);
          }
          
          // Set the value using the variable ID
          this.setValue(variable.getId());
          console.log('Variable set successfully');
        } else {
          // Fallback: set value directly
          this.setValue(cleanValue);
        }
      } catch (error) {
        console.error('Error setting variable:', error);
        // Try direct setValue as fallback
        try {
          this.setValue(cleanValue);
        } catch (fallbackError) {
          console.error('Fallback setValue also failed:', fallbackError);
        }
      }
    }
  };
}

// Function to ensure common variables exist in workspace
export function ensureCommonVariables(workspace) {
  if (!workspace) return;
  
  const commonVariables = ['i', 'j', 'k', 'coin', 'item', 'index', 'count', 'value'];
  
  const variableMap = workspace.getVariableMap();
  commonVariables.forEach(varName => {
    const variable = variableMap.getVariable(varName);
    if (!variable) {
      console.log(`Creating common variable: ${varName}`);
      variableMap.createVariable(varName);
    }
  });
}

// ===== INITIALIZATION FUNCTION =====
export function initializeImprovedVariableHandling() {
  // Apply improved FieldVariable handling
  improveFieldVariableHandling();
  
  // Ensure common variables exist
  console.log("Improved variable handling initialized");
}

// Export for use in block definitions
export { ensureVariableExists };

