// Blockly Variable Handling
import * as Blockly from "blockly/core";

// ==========================================
// 🔧 CONSTANTS & CONFIGURATION
// ==========================================
const COMMON_VARIABLES = ['i', 'j', 'k', 'coin', 'item', 'index', 'count', 'value'];
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

  const varName = field.getValue() || defaultName;
  const workspace = block.workspace;

  // Check if variable exists, create if not
  const variableMap = workspace.getVariableMap();
  let variable = variableMap.getVariable(varName);

  if (!variable) {
    // console.log(`[Variable Safety] Creating missing variable: "${varName}"`);
    try {
      variable = variableMap.createVariable(varName);
    } catch (error) {
      console.error('[Variable Safety] Error creating variable:', error);
      return null;
    }
  }

  // Update field value to ensure consistency (sync ID/Name)
  if (field.getValue() !== varName) {
    try {
      field.setValue(varName);
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
      // console.log(`[Init] Pre-creating common variable: "${varName}"`);
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
  console.log("[Blockly] Improved Variable Handling Initialized");
}

export { ensureVariableExists };

