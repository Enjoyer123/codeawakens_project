// Blockly Variable Handling
import * as Blockly from "blockly/core";

// ==========================================
// 🔧 CONSTANTS & CONFIGURATION
// ==========================================
const COMMON_VARIABLES = ['i', 'j', 'k', 'coin', 'element', 'index', 'count', 'value'];
const DEFAULT_VAR_NAME = 'variable';

// ==========================================
// 🛠️ CORE UTILITIES
// ==========================================

/**
 * Safely ensures a variable exists in the workspace.
 * Critical: Prevents "variable not found" errors when using custom blocks.
 * @param {Blockly.Block} block - The source block asking for the variable.
 * @param {string} fieldName - The name of the field containing the variable name.
 * @param {string} defaultName - Fallback name if field is empty.
 * @returns {Blockly.VariableModel|null} The created or existing variable.
 */
function ensureVariableExists(block, fieldName, defaultName) {
  if (!block || !block.workspace) return null;

  // 🛡️ SAFETY CHECK: Flyout Protection
  // Blocks in the toolbox (flyout) are just templates.
  // We MUST NOT create real variables for them, otherwise the workspace
  // will be flooded with ghost variables every time the toolbox opens.
  if (block.isInFlyout) {
    return null;
  }

  const field = block.getField(fieldName);
  if (!field) return null;

  const workspace = block.workspace;
  const variableMap = workspace.getVariableMap();

  // 🔧 CRITICAL FIX: field.getValue() returns variable ID, not name!
  // We need to resolve ID to name first
  const fieldValue = field.getValue();
  let varName = defaultName;

  if (fieldValue) {
    // Try to get variable by ID first
    const existingVar = variableMap.getVariableById(fieldValue);
    if (existingVar) {
      // Use the name from existing variable
      varName = existingVar.name;
    } else {
      // If no variable found by ID, check if fieldValue looks like an ID or a name
      // IDs usually contain special characters like /, :, etc.
      if (/[^a-zA-Z0-9_]/.test(fieldValue)) {
        // Looks like an ID but variable not found - use default name
        console.warn(`[Variable Safety] Field value "${fieldValue}" looks like ID but variable not found, using default "${defaultName}"`);
        varName = defaultName;
      } else {
        // Looks like a name, use it
        varName = fieldValue;
      }
    }
  }

  // Check if variable with this name exists, create if not
  let variable = variableMap.getVariable(varName);

  if (!variable) {
    // console.log removed for production
    try {
      variable = variableMap.createVariable(varName);
    } catch (error) {
      console.error('[Variable Safety] Error creating variable:', error);
      return null;
    }
  }

  // Update field to use the correct variable ID
  if (variable && field.getValue() !== variable.getId()) {
    try {
      field.setValue(variable.getId());
    } catch (error) {
      console.warn('[Variable Safety] Error syncing field value:', error);
    }
  }

  return variable;
}

/**
 * Helper to force checking and creation of common variables.
 * Used at game start to reduce friction for students.
 * @param {Blockly.Workspace} workspace 
 */
export function ensureCommonVariables(workspace) {
  if (!workspace) return;

  const variableMap = workspace.getVariableMap();
  COMMON_VARIABLES.forEach(varName => {
    const variable = variableMap.getVariable(varName);
    if (!variable) {

      variableMap.createVariable(varName);
    }
  });
}

// ==========================================
// 🎨 UI IMPROVEMENTS (MONKEY PATCHES)
// ==========================================

/**
 * Applied patches to Blockly.FieldVariable to improve UX.
 * 1. Force use of "Prompt" instead of complex variable modal.
 * 2. Prevent auto-creation logic when in Flyout.
 */
function improveFieldVariableHandling() {
  if (!Blockly.FieldVariable) return;

  // 1. Override validation to respect Flyout context
  const originalDoClassValidation = Blockly.FieldVariable.prototype.doClassValidation_;
  if (originalDoClassValidation) {
    Blockly.FieldVariable.prototype.doClassValidation_ = function (newValue) {
      // If in flyout, skip validation to prevent side effects
      if (this.sourceBlock_ && this.sourceBlock_.isInFlyout) {
        return newValue;
      }
      return originalDoClassValidation.call(this, newValue);
    };
  }

  // 2. Override Editor to use simple Prompt
  // This simplifies the UI for younger students (no "Rename", "Delete" complexity)
  Blockly.FieldVariable.prototype.showEditor_ = function () {
    const currentValue = this.getValue() || DEFAULT_VAR_NAME;
    const newName = prompt("ตั้งชื่อตัวแปรใหม่:", currentValue); // Localized prompt

    if (newName !== null && newName.trim() !== '' && newName !== currentValue) {
      const cleanValue = newName.trim();

      try {
        if (this.sourceBlock_ && this.sourceBlock_.workspace) {
          const workspace = this.sourceBlock_.workspace;
          let variable = workspace.getVariable(cleanValue);

          if (!variable) {
            variable = workspace.createVariable(cleanValue);
          }
          this.setValue(variable.getId());
        } else {
          this.setValue(cleanValue);
        }
      } catch (error) {
        console.error('[Variable Prompt] Error setting variable:', error);
        // Fallback
        try { this.setValue(cleanValue); } catch (e) { /* Ignore */ }
      }
    }
  };
}

// ==========================================
// 🚀 INITIALIZATION
// ==========================================
export function initializeImprovedVariableHandling() {
  improveFieldVariableHandling();

}

export { ensureVariableExists };

/**
 * Creates a standard onChange handler for blocks that need to auto-create variables.
 * @param {string} defaultVarName - The default name for the variable (e.g. 'i', 'coin')
 * @returns {Function} The onChange handler function
 */
export function createVariableChangeHandler(defaultVarName) {
  return function (event) {
    if (!event || !this.workspace) return;

    // Don't create variables when block is in flyout (toolbox)
    if (this.isInFlyout) {
      return;
    }

    if (event.type === Blockly.Events.BLOCK_CREATE && event.blockId === this.id) {
      setTimeout(() => {
        ensureVariableExists(this, 'VAR', defaultVarName);
      }, 10);
    } else if (event.type === Blockly.Events.BLOCK_CHANGE && event.blockId === this.id) {
      if (event.element === 'field' && event.name === 'VAR') {
        const newValue = event.newValue || defaultVarName;
        ensureVariableExists(this, 'VAR', newValue);
      }
    }
  };
}


