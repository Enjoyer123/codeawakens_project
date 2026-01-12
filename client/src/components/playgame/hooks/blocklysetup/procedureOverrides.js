/**
 * Override procedure blocks to prevent auto-creation of definitions
 */
import * as Blockly from "blockly";

export function overrideProcedureBlocks(workspace = null) {
    console.debug("🔧 Overriding procedure blocks...");

    // Override procedure definition blocks
    ['procedures_defreturn', 'procedures_defnoreturn'].forEach(blockType => {
        const blockDef = Blockly.Blocks[blockType];
        if (!blockDef) {
            console.debug(`[useBlocklySetup] ${blockType} block not found, skipping`);
            return;
        }

        // Avoid double-overriding
        if (blockDef.__overridden) {
            return;
        }

        console.debug(`[useBlocklySetup] Overriding ${blockType}...`);
        const originalRename = blockDef.renameProcedure;
        const originalLoadExtraState = blockDef.loadExtraState;
        const originalInit = blockDef.init;

        // CRITICAL: Override init to fix call block names
        if (originalInit) {
            blockDef.init = function () {
                // Call original init first
                originalInit.call(this);

                // After init, fix any call blocks that were auto-created with wrong names
                setTimeout(() => {
                    if (!this.workspace || this.isDisposed()) return;

                    const definitionName = this.getFieldValue('NAME');
                    if (!definitionName || definitionName === 'unnamed' || definitionName === 'undefined') {
                        return;
                    }

                    console.log(`✅ Procedure definition created with name: ${definitionName}`);

                    // Find all call blocks and fix those with "unnamed" to use this definition's name
                    const allCallBlocks = this.workspace.getBlocksByType('procedures_callreturn', false)
                        .concat(this.workspace.getBlocksByType('procedures_callnoreturn', false));

                    allCallBlocks.forEach(callBlock => {
                        const nameField = callBlock.getField('NAME');
                        if (nameField) {
                            const currentValue = nameField.getValue();
                            // Fix if unnamed or undefined
                            if (!currentValue || currentValue === 'unnamed' || currentValue === 'undefined' || currentValue.trim() === '') {
                                nameField.setValue(definitionName);
                                console.log(`✅ Fixed call block to use: ${definitionName}`);
                            }
                        }
                    });
                }, 50);
            };
        }

        // Override renameProcedure
        blockDef.renameProcedure = function (oldName, newName) {
            if (oldName == null || newName == null) {
                return;
            }
            if (originalRename) {
                try {
                    return originalRename.call(this, String(oldName).trim(), String(newName).trim());
                } catch (e) {
                    console.error(`[${blockType}] renameProcedure error:`, e);
                }
            }
        };

        // Override loadExtraState
        blockDef.loadExtraState = function (state) {
            try {
                if (!state || typeof state !== 'object') {
                    state = {};
                }

                let safeName = 'function';
                if (state.name && typeof state.name === 'string') {
                    const trimmedName = state.name.trim();
                    if (trimmedName && trimmedName !== 'unnamed' && trimmedName !== 'undefined') {
                        safeName = trimmedName;
                    }
                }

                const safeParams = Array.isArray(state.params) ? state.params : [];

                try {
                    if (this.getField && typeof this.getField === 'function') {
                        const nameField = this.getField('NAME');
                        if (nameField && typeof nameField.setValue === 'function') {
                            nameField.setValue(safeName);
                        }
                    }
                } catch (e) {
                    console.error(`[${blockType}] loadExtraState: error setting name field:`, e);
                }

                if (originalLoadExtraState) {
                    try {
                        return originalLoadExtraState.call(this, state);
                    } catch (e) {
                        console.error(`[${blockType}] original loadExtraState error:`, e);
                    }
                }

                return { name: safeName, params: safeParams };
            } catch (e) {
                console.error(`[${blockType}] loadExtraState error:`, e);
                return { name: 'function', params: [] };
            }
        };

        blockDef.__overridden = true;
    });

    // Override procedure call blocks - CRITICAL: Prevent auto-creation
    ['procedures_callreturn', 'procedures_callnoreturn'].forEach(blockType => {
        const blockDef = Blockly.Blocks[blockType];
        if (!blockDef) return;

        if (blockDef.__overridden) return;

        console.debug(`[useBlocklySetup] Overriding ${blockType}...`);

        // Store original methods
        const originalRename = blockDef.renameProcedure;
        const originalGetProcedureDef = blockDef.getProcedureDef;
        const originalOnchange = blockDef.onchange;

        // Override renameProcedure
        if (originalRename) {
            blockDef.renameProcedure = function (oldName, newName) {
                if (oldName == null || newName == null) return;
                try {
                    const safeOldName = String(oldName).trim();
                    const safeNewName = String(newName).trim();
                    if (!safeOldName || !safeNewName) return;
                    return originalRename.call(this, safeOldName, safeNewName);
                } catch (e) {
                    console.error(`[${blockType}] renameProcedure error:`, e);
                }
            };
        }

        // Override getProcedureDef to return procedure if exists, null if not
        // This prevents auto-creation but allows normal operation
        if (originalGetProcedureDef) {
            blockDef.getProcedureDef = function () {
                try {
                    // First, try to fix the procedure name if it's invalid
                    const nameField = this.getField('NAME');
                    if (nameField) {
                        const currentName = nameField.getValue();
                        const blockWorkspace = this.workspace;

                        if (blockWorkspace) {
                            // Get all definition blocks
                            const definitionBlocks = blockWorkspace.getBlocksByType('procedures_defreturn', false)
                                .concat(blockWorkspace.getBlocksByType('procedures_defnoreturn', false));

                            // Get valid procedure names
                            const validProcedureNames = new Set();
                            definitionBlocks.forEach(defBlock => {
                                try {
                                    const name = defBlock.getFieldValue('NAME');
                                    if (name && name !== 'unnamed' && name !== 'undefined' && name.trim() !== '') {
                                        validProcedureNames.add(name);
                                    }
                                } catch (e) {
                                    // Ignore errors
                                }
                            });

                            // If current name doesn't match any definition, fix it
                            if (currentName && !validProcedureNames.has(currentName) && validProcedureNames.size > 0) {
                                // Check if it's a numbered variant (e.g., DFS2, DFS3) of a valid procedure
                                const isNumberedVariant = Array.from(validProcedureNames).some(validName => {
                                    const baseName = validName.replace(/\d+$/, '');
                                    const currentBaseName = currentName.replace(/\d+$/, '');
                                    return baseName === currentBaseName && currentName !== validName;
                                });

                                if (isNumberedVariant) {
                                    // Find the matching base procedure
                                    const matchingProcedure = Array.from(validProcedureNames).find(validName => {
                                        const baseName = validName.replace(/\d+$/, '');
                                        const currentBaseName = currentName.replace(/\d+$/, '');
                                        return baseName === currentBaseName;
                                    });

                                    if (matchingProcedure) {
                                        console.log(`🔧 Fixing call block name in getProcedureDef: "${currentName}" -> "${matchingProcedure}"`);
                                        nameField.setValue(matchingProcedure);
                                    }
                                } else {
                                    // Use the first valid procedure name
                                    const firstValidName = Array.from(validProcedureNames)[0];
                                    console.log(`🔧 Fixing call block name in getProcedureDef: "${currentName}" -> "${firstValidName}"`);
                                    nameField.setValue(firstValidName);
                                }
                            }
                        }
                    }

                    // Call original to get procedure definition
                    const def = originalGetProcedureDef.call(this);
                    return def; // Return the definition if it exists, null if not
                } catch (e) {
                    // If error, return null to prevent crashes
                    console.warn(`[${blockType}] getProcedureDef error:`, e);
                    return null;
                }
            };
        }

        // Override onchange to prevent auto-creating definitions when block is created
        if (originalOnchange) {
            blockDef.onchange = function (changeEvent) {
                const blockWorkspace = this.workspace;
                if (!blockWorkspace) {
                    // Call original if workspace not available
                    if (originalOnchange) {
                        try {
                            originalOnchange.call(this, changeEvent);
                        } catch (e) {
                            console.warn(`[${blockType}] onchange error:`, e);
                        }
                    }
                    return;
                }

                try {
                    const nameField = this.getField('NAME');
                    if (nameField) {
                        const currentName = nameField.getValue();

                        // Get all definition blocks to find valid procedure names
                        const definitionBlocks = blockWorkspace.getBlocksByType('procedures_defreturn', false)
                            .concat(blockWorkspace.getBlocksByType('procedures_defnoreturn', false));

                        const validProcedureNames = new Set();
                        definitionBlocks.forEach(defBlock => {
                            try {
                                const name = defBlock.getFieldValue('NAME');
                                if (name && name !== 'unnamed' && name !== 'undefined' && name.trim() !== '') {
                                    validProcedureNames.add(name);
                                }
                            } catch (e) {
                                // Ignore errors
                            }
                        });

                        // Fix procedure name if needed
                        if (validProcedureNames.size > 0) {
                            if (!currentName || currentName === 'unnamed' || currentName === 'undefined' || currentName.trim() === '') {
                                // Invalid name - use first valid procedure
                                const firstValidName = Array.from(validProcedureNames)[0];
                                nameField.setValue(firstValidName);
                                console.log(`[${blockType}] Fixed invalid name to: ${firstValidName}`);
                            } else if (!validProcedureNames.has(currentName)) {
                                // Current name doesn't match any definition
                                // Check if it's a numbered variant (e.g., DFS2, DFS3) of a valid procedure
                                const isNumberedVariant = Array.from(validProcedureNames).some(validName => {
                                    const baseName = validName.replace(/\d+$/, '');
                                    const currentBaseName = currentName.replace(/\d+$/, '');
                                    return baseName === currentBaseName && currentName !== validName;
                                });

                                if (isNumberedVariant) {
                                    // Find the matching base procedure
                                    const matchingProcedure = Array.from(validProcedureNames).find(validName => {
                                        const baseName = validName.replace(/\d+$/, '');
                                        const currentBaseName = currentName.replace(/\d+$/, '');
                                        return baseName === currentBaseName;
                                    });

                                    if (matchingProcedure) {
                                        console.log(`[${blockType}] Fixed numbered variant: "${currentName}" -> "${matchingProcedure}"`);
                                        nameField.setValue(matchingProcedure);
                                    }
                                } else {
                                    // Use the first valid procedure name
                                    const firstValidName = Array.from(validProcedureNames)[0];
                                    console.log(`[${blockType}] Fixed non-matching name: "${currentName}" -> "${firstValidName}"`);
                                    nameField.setValue(firstValidName);
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.warn(`[${blockType}] Error in onchange:`, e);
                }

                // Call original onchange - it will use the name we just set
                if (originalOnchange) {
                    try {
                        originalOnchange.call(this, changeEvent);
                    } catch (e) {
                        console.warn(`[${blockType}] onchange error:`, e);
                        // If error occurs, try to fix the name again
                        try {
                            const nameField = this.getField('NAME');
                            if (nameField) {
                                const blockWorkspace = this.workspace;
                                if (blockWorkspace) {
                                    const definitionBlocks = blockWorkspace.getBlocksByType('procedures_defreturn', false)
                                        .concat(blockWorkspace.getBlocksByType('procedures_defnoreturn', false));
                                    if (definitionBlocks.length > 0) {
                                        const firstDefName = definitionBlocks[0].getFieldValue('NAME');
                                        if (firstDefName && firstDefName !== 'unnamed' && firstDefName !== 'undefined') {
                                            nameField.setValue(firstDefName);
                                        }
                                    }
                                }
                            }
                        } catch (fixError) {
                            console.warn(`[${blockType}] Error fixing name after onchange error:`, fixError);
                        }
                    }
                }
            };
        }

        blockDef.__overridden = true;
    });
}
