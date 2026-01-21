// Blockly Procedure Block Overrides (Fixes for renaming, loading state, and N-Queen logic)
import * as Blockly from "blockly/core";

// SPECIAL HELPER: List of N-Queen/Algorithm helper functions that need special handling
const ALGO_HELPER_FUNCTIONS = ['safe', 'place', 'remove'];

export function applyProcedureOverrides() {
    console.log("Applying Blockly Procedure Overrides...");

    // Override procedures_defreturn to fix undefined replace error
    // Blockly's standard procedures_defreturn may have issues with procedure name handling
    try {
        if (Blockly.Blocks['procedures_defreturn']) {
            // Store original functions before overriding
            const originalLoadExtraState = Blockly.Blocks['procedures_defreturn'].loadExtraState;
            const originalRenameProcedure = Blockly.Blocks['procedures_defreturn'].renameProcedure;
            const originalCustomContextMenu = Blockly.Blocks['procedures_defreturn'].customContextMenu;

            // Override renameProcedure FIRST to prevent errors
            Blockly.Blocks['procedures_defreturn'].renameProcedure = function (oldName, newName) {
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
            const loadExtraStateOverride = function (state) {
                console.log('[procedures_defreturn] loadExtraState (blocklyProcedureOverrides) called:', { state, stateName: state?.name, thisBlock: this.id || 'new block' });
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

            Blockly.Blocks['procedures_defreturn'].customContextMenu = function (options) {
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
                Blockly.Blocks['procedures_callreturn'].renameProcedure = function (oldName, newName) {
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

            // SPECIAL HELPER: Helper function to check if name is special
            const isSpecialFunction = (name) => ALGO_HELPER_FUNCTIONS.includes(name);

            // CRITICAL: Override getProcParam() to prevent wrong procedure name resolution for algorithm helper functions
            const originalGetProcParamReturn = Blockly.Blocks['procedures_callreturn'].getProcParam;
            if (originalGetProcParamReturn) {
                Blockly.Blocks['procedures_callreturn'].getProcParam = function () {
                    // For N-Queen helper functions, read from NAME field or mutation directly
                    // Check mutation first (most reliable)
                    if (this.mutationToDom) {
                        try {
                            const mutation = this.mutationToDom();
                            if (mutation && mutation.getAttribute) {
                                const mutationName = mutation.getAttribute('name');
                                if (isSpecialFunction(mutationName)) {
                                    console.log(`[blocklyStandardBlocks] getProcParam override: Using mutation name for Algo helper: ${mutationName}`);
                                    return mutationName;
                                }
                            }
                        } catch (e) {
                            console.debug('Error reading mutation in getProcParam:', e);
                        }
                    }

                    // Check NAME field
                    const nameField = this.getField('NAME');
                    if (nameField) {
                        const nameFromField = nameField.getValue();
                        if (isSpecialFunction(nameFromField)) {
                            console.log(`[blocklyStandardBlocks] getProcParam override: Using NAME field for Algo helper: ${nameFromField}`);
                            return nameFromField;
                        }
                    }

                    // Fallback to original method for non-special functions
                    return originalGetProcParamReturn.call(this);
                };
            }

            console.log('Patched procedures_callreturn to fix undefined errors and override getProcParam for N-Queen');
        }

        // Override procedures_callnoreturn
        if (Blockly.Blocks['procedures_callnoreturn']) {
            const originalRenameProcedure = Blockly.Blocks['procedures_callnoreturn'].renameProcedure;

            if (originalRenameProcedure) {
                Blockly.Blocks['procedures_callnoreturn'].renameProcedure = function (oldName, newName) {
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

            // CRITICAL: Override getProcParam() to prevent wrong procedure name resolution for algorithm helper functions
            const originalGetProcParamNoReturn = Blockly.Blocks['procedures_callnoreturn'].getProcParam;
            if (originalGetProcParamNoReturn) {
                Blockly.Blocks['procedures_callnoreturn'].getProcParam = function () {
                    // Helper function to check if name is special
                    const isSpecialFunction = (name) => ALGO_HELPER_FUNCTIONS.includes(name);

                    // For N-Queen helper functions, read from NAME field or mutation directly
                    // Check mutation first (most reliable)
                    if (this.mutationToDom) {
                        try {
                            const mutation = this.mutationToDom();
                            if (mutation && mutation.getAttribute) {
                                const mutationName = mutation.getAttribute('name');
                                if (isSpecialFunction(mutationName)) {
                                    console.log(`[blocklyStandardBlocks] getProcParam override (no-return): Using mutation name for Algo helper: ${mutationName}`);
                                    return mutationName;
                                }
                            }
                        } catch (e) {
                            console.debug('Error reading mutation in getProcParam:', e);
                        }
                    }

                    // Check NAME field
                    const nameField = this.getField('NAME');
                    if (nameField) {
                        const nameFromField = nameField.getValue();
                        if (isSpecialFunction(nameFromField)) {
                            console.log(`[blocklyStandardBlocks] getProcParam override (no-return): Using NAME field for Algo helper: ${nameFromField}`);
                            return nameFromField;
                        }
                    }

                    // Fallback to original method for non-special functions
                    return originalGetProcParamNoReturn.call(this);
                };
            }

            console.log('Patched procedures_callnoreturn to fix undefined errors and override getProcParam for N-Queen');
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
            Blockly.Blocks['procedures_defnoreturn'].renameProcedure = function (oldName, newName) {
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
            const loadExtraStateOverrideNoreturn = function (state) {
                console.log('[procedures_defnoreturn] loadExtraState (blocklyProcedureOverrides) called:', { state, stateName: state?.name, thisBlock: this.id || 'new block' });
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
                    this.getField('NAME').setValue(safeName);

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
            Blockly.Blocks['procedures_defnoreturn'].loadExtraState = loadExtraStateOverrideNoreturn;

            Blockly.Blocks['procedures_defnoreturn'].customContextMenu = function (options) {
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
}
