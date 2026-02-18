/**
 * Event Handlers for Blockly Workspace
 * Extracted from useBlocklySetup.js to improve readability and maintainability.
 */
import * as Blockly from "blockly/core";
import { isXmlLoading } from '@/gameutils/blockly';

/**
 * Register procedure-related event handlers
 * Handles automatic naming of call blocks and cleanup of auto-created definitions
 * @param {Blockly.WorkspaceSvg} workspace
 */
export const registerProcedureEventHandlers = (workspace) => {
    let isCreatingCallBlock = false;

    workspace.addChangeListener((event) => {
        // ⚡ Performance: Skip all processing during XML load
        if (isXmlLoading()) {
            return;
        }

        // ⚡ Performance: Skip UI-only events that don't need processing
        if (event.type === Blockly.Events.UI ||
            event.type === Blockly.Events.SELECTED ||
            event.type === Blockly.Events.CLICK) {
            return;
        }

        // Track when call blocks are being created
        if (event.type === Blockly.Events.BLOCK_CREATE) {
            const block = workspace.getBlockById(event.blockId);

            if (block && (block.type === 'procedures_callreturn' || block.type === 'procedures_callnoreturn')) {
                isCreatingCallBlock = true;

                // Fix procedure name immediately to prevent getDefinition error
                setTimeout(() => {
                    try {
                        const nameField = block.getField('NAME');
                        if (nameField) {
                            const currentValue = nameField.getValue();

                            // If value is invalid, fix it
                            if (!currentValue || currentValue === 'unnamed' || currentValue === 'undefined' ||
                                currentValue === 'temp_procedure' || (typeof currentValue === 'string' && currentValue.trim() === '')) {
                                const procedureMap = workspace.getProcedureMap();
                                if (procedureMap) {
                                    const procedures = procedureMap.getProcedures();
                                    if (procedures.length > 0) {
                                        nameField.setValue(procedures[0].getName());
                                    } else {
                                        // Check definition blocks directly
                                        const definitionBlocks = workspace.getBlocksByType('procedures_defreturn', false)
                                            .concat(workspace.getBlocksByType('procedures_defnoreturn', false));
                                        if (definitionBlocks.length > 0) {
                                            const firstDefName = definitionBlocks[0].getFieldValue('NAME');
                                            if (firstDefName && firstDefName !== 'unnamed' && firstDefName !== 'undefined') {
                                                nameField.setValue(firstDefName);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('Error fixing call block name:', e);
                    }
                    isCreatingCallBlock = false;
                }, 50);
            }

            // If a definition block is created while we're creating a call block, delete it
            if (block && (block.type === 'procedures_defreturn' || block.type === 'procedures_defnoreturn')) {
                if (isCreatingCallBlock) {
                    setTimeout(() => {
                        try {
                            if (block && !block.isDisposed()) {
                                block.dispose(false);
                            }
                        } catch (e) {
                            console.warn('Error removing auto-created procedure:', e);
                        }
                    }, 10);
                }
            }
        }

        // Error handler
        if (event.type === Blockly.Events.ERROR) {
            console.warn("Blockly error event:", event);
        }
    });
};

/**
 * Register variable-related event handlers
 * Prevents auto-creation of variables when blocks are dragged from toolbox,
 * only creating them when user explicitly interacts with variable field.
 * @param {Blockly.WorkspaceSvg} workspace
 */
export const registerVariableEventHandlers = (workspace) => {
    // Variable management - only create variables when user explicitly interacts with variable field
    // Don't auto-create variables when blocks are dragged from toolbox
    workspace.addChangeListener((event) => {
        // Only handle variable creation on BLOCK_CHANGE when user changes variable field explicitly
        // Skip BLOCK_CREATE events to prevent auto-creation when blocks are dragged from toolbox
        if (event.type === Blockly.Events.BLOCK_CHANGE) {
            const block = workspace.getBlockById(event.blockId);
            // Skip if block is in flyout (toolbox)
            if (block && block.isInFlyout) {
                return;
            }
            // Only create variable if the change is to the VAR field (user explicitly changed it)
            if (event.name === 'VAR' && block && block.getField) {
                const varField = block.getField('VAR');
                if (varField && varField.getValue) {
                    const varName = varField.getValue();
                    // Skip if varName is empty or invalid
                    if (!varName || varName.trim() === '') {
                        return;
                    }
                    // Get variable ID from field value (could be ID or name)
                    let variable;
                    try {
                        // Try to get by ID first
                        variable = workspace.getVariableById(varName);
                        // If not found, try by name
                        if (!variable) {
                            variable = workspace.getVariable(varName);
                        }
                        // If still not found, create it (user explicitly set this variable name)
                        if (!variable) {
                            try {
                                workspace.createVariable(varName);
                            } catch (error) {
                                console.error(`Failed to create variable ${varName}:`, error);
                            }
                        }
                    } catch (e) {
                        // Ignore errors
                    }
                }
            }
        }
        // Completely skip BLOCK_CREATE events for variable creation
    });
};
