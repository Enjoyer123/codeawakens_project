// Blockly Procedure Overrides
// Extracted from blocklyUtils.js to separate concerns

import * as Blockly from "blockly/core";

export function setupBlocklyOverrides() {
    console.log('[blocklyOverrides] Setting up procedure blocks override...');

    // Try to override immediately
    overrideProcedureBlocks();

    // Also try after a short delay in case blocks load asynchronously
    setTimeout(() => {
        console.log('[blocklyOverrides] Retrying procedure blocks override after delay...');
        overrideProcedureBlocks();
    }, 100);
}

function overrideProcedureBlocks() {
    console.log('[blocklyOverrides] Overriding procedure blocks...');
    // Override procedure definition blocks
    ['procedures_defreturn', 'procedures_defnoreturn'].forEach(blockType => {
        if (Blockly.Blocks[blockType]) {
            console.log(`[blocklyOverrides] Found ${blockType}, overriding...`);
            const originalRename = Blockly.Blocks[blockType].renameProcedure;
            const originalLoadExtraState = Blockly.Blocks[blockType].loadExtraState;

            // Override renameProcedure
            // CRITICAL: This must completely replace the original to prevent calling .replace() on undefined
            // Note: originalRename may be undefined if blocklyStandardBlocks.js already overrode it
            Blockly.Blocks[blockType].renameProcedure = function (oldName, newName) {
                // CRITICAL: Early return to prevent calling original with undefined
                if (oldName === undefined || oldName === null || newName === undefined || newName === null) {
                    return;
                }

                // Convert to string safely
                const safeOldName = String(oldName).trim();
                const safeNewName = String(newName).trim();

                if (!safeOldName || !safeNewName) {
                    return;
                }

                // Only call original if it exists and is a function
                // originalRename may be undefined if blocklyStandardBlocks.js already overrode it
                if (originalRename && typeof originalRename === 'function') {
                    try {
                        return originalRename.call(this, safeOldName, safeNewName);
                    } catch (e) {
                        console.error(`[${blockType}] renameProcedure error in original:`, e);
                    }
                }
                // If originalRename is undefined, it means blocklyStandardBlocks.js already handled it
                // So we can just return without doing anything
            };

            // CRITICAL: Override loadExtraState to NEVER call renameProcedure
            // Store original to check if it exists
            console.log(`[blocklyOverrides] Original loadExtraState for ${blockType}:`, typeof originalLoadExtraState);
            Blockly.Blocks[blockType].loadExtraState = function (state) {
                console.log(`[${blockType}] loadExtraState (blocklyOverrides) called:`, {
                    state,
                    stateName: state?.name,
                    stateParams: state?.params,
                    thisBlock: this.id || 'new block',
                    hasOriginal: !!originalLoadExtraState
                });
                try {
                    if (!state || typeof state !== 'object') {
                        state = {};
                    }

                    let safeName = 'function';
                    if (state.name && typeof state.name === 'string' && state.name.trim()) {
                        const trimmedName = state.name.trim();
                        if (trimmedName && trimmedName !== 'unnamed' && trimmedName !== 'undefined') {
                            safeName = trimmedName;
                        }
                    }

                    const safeParams = Array.isArray(state.params) ? state.params : [];

                    // Set name field directly WITHOUT calling renameProcedure
                    try {
                        const nameField = this.getField('NAME');
                        if (nameField) {
                            nameField.setValue(safeName);
                            console.log(`[${blockType}] loadExtraState: set name field to:`, safeName);
                        } else {
                            console.warn(`[${blockType}] loadExtraState: nameField not found`);
                        }
                    } catch (e) {
                        console.error(`[${blockType}] loadExtraState error setting name:`, e);
                    }

                    // Handle params
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
                            console.error(`[${blockType}] loadExtraState error updating mutation:`, e);
                        }
                    }

                    return { name: safeName, params: safeParams };
                } catch (e) {
                    console.error(`[${blockType}] loadExtraState error:`, e);
                    return { name: 'function', params: [] };
                }
            };

            console.log(`[blocklyOverrides] Overridden ${blockType}`);
            console.log(`[blocklyOverrides] ${blockType} loadExtraState type:`, typeof Blockly.Blocks[blockType].loadExtraState);
            console.log(`[blocklyOverrides] ${blockType} renameProcedure type:`, typeof Blockly.Blocks[blockType].renameProcedure);
        } else {
            console.warn(`[blocklyOverrides] ${blockType} not found yet`);
        }
    });
    console.log('[blocklyOverrides] Procedure blocks override completed');

    // Override procedure call blocks (created automatically by custom: "PROCEDURE")
    ['procedures_callreturn', 'procedures_callnoreturn'].forEach(blockType => {
        if (Blockly.Blocks[blockType]) {
            console.log(`[blocklyOverrides] Found ${blockType}, overriding...`);
            const originalRename = Blockly.Blocks[blockType].renameProcedure;

            if (originalRename) {
                Blockly.Blocks[blockType].renameProcedure = function (oldName, newName) {
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
                        if (originalRename && typeof originalRename === 'function') {
                            try {
                                return originalRename.call(this, safeOldName, safeNewName);
                            } catch (innerError) {
                                // If original fails, just return without error
                                console.debug(`[${blockType}] Original renameProcedure failed, skipping:`, innerError);
                                return;
                            }
                        }
                        // If no original function, just return (no-op)
                        return;
                    } catch (e) {
                        console.error(`[${blockType}] renameProcedure error:`, e);
                    }
                };
            }

            console.log(`[blocklyOverrides] Overridden ${blockType}`);
        }
    });

    // Verify override worked
    ['procedures_defreturn', 'procedures_defnoreturn', 'procedures_callreturn', 'procedures_callnoreturn'].forEach(blockType => {
        if (Blockly.Blocks[blockType]) {
            const renameProcedure = Blockly.Blocks[blockType].renameProcedure;
            console.log(`[blocklyOverrides] Verification - ${blockType}:`, {
                hasRenameProcedure: typeof renameProcedure === 'function'
            });
        }
    });
}
