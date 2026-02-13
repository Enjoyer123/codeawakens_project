/**
 * useBlocklyEventHandlers Hook
 * Handles procedure block events in the admin starter editor:
 * 1. Fix unnamed call blocks → set name to first valid definition
 * 2. Delete auto-created duplicate definitions (but NOT user-dragged ones)
 * 3. Debounced cleanup via cleanupDuplicateProcedures
 */
import { useRef, useEffect } from 'react';
import * as Blockly from 'blockly/core';
import { syncProcedureParameters } from '../utils/blocklyProcedureUtils';

// ==========================================
// Helpers
// ==========================================

function isCallBlock(block) {
    return block.type === 'procedures_callreturn' || block.type === 'procedures_callnoreturn';
}

function isDefBlock(block) {
    return block.type === 'procedures_defreturn' || block.type === 'procedures_defnoreturn';
}

function isInvalidName(name) {
    return !name || name === 'unnamed' || name === 'undefined' || !name.trim();
}

/** Get all valid procedure definitions from workspace */
function getValidDefs(workspace) {
    return workspace.getBlocksByType('procedures_defreturn', false)
        .concat(workspace.getBlocksByType('procedures_defnoreturn', false))
        .filter(def => {
            try { return !isInvalidName(def.getFieldValue('NAME')); }
            catch { return false; }
        });
}

/** Fix a call block's name if it's invalid — set to first valid definition */
function fixCallBlockName(callBlock, workspace) {
    const nameField = callBlock.getField('NAME');
    if (!nameField) return;

    const currentName = nameField.getValue();
    if (!isInvalidName(currentName)) return; // Name already valid → skip

    const defs = getValidDefs(workspace);
    if (defs.length === 0) return;

    const targetDef = defs[0];
    const targetName = targetDef.getFieldValue('NAME');
    nameField.setValue(targetName);
    syncProcedureParameters(callBlock, targetDef, workspace);
    if (callBlock.render) callBlock.render();
}

/** Delete a definition block if it's a duplicate (same name as existing) */
function deleteIfDuplicate(newDef, workspace) {
    const newName = newDef.getFieldValue('NAME');

    // Get all other definitions (excluding this one)
    const otherDefs = getValidDefs(workspace).filter(d => d.id !== newDef.id);

    // Check for exact duplicate name
    const existing = otherDefs.find(d => d.getFieldValue('NAME') === newName);
    if (existing && !newDef.isDisposed()) {
        // Duplicate name → delete the new one (keep the original)
        setTimeout(() => {
            try { if (!newDef.isDisposed()) newDef.dispose(false); } catch { /* ignore */ }
        }, 100);
        return;
    }

    // Check for numbered variant (e.g. DFS2 when DFS exists)
    const baseName = (newName || '').replace(/\d+$/, '');
    const baseDef = otherDefs.find(d => {
        const name = d.getFieldValue('NAME');
        return name && name !== newName && name.replace(/\d+$/, '') === baseName;
    });
    if (baseDef && !newDef.isDisposed()) {
        setTimeout(() => {
            try { if (!newDef.isDisposed()) newDef.dispose(false); } catch { /* ignore */ }
        }, 100);
    }
}

// ==========================================
// Hook
// ==========================================

export const useBlocklyEventHandlers = ({
    workspaceRef,
    cleanupDuplicateProcedures,
    blocklyLoaded,
    skipCleanupRef,
    isXmlLoadingRef
}) => {
    const cleanupTimeoutRef = useRef(null);

    useEffect(() => {
        const workspace = workspaceRef.current;
        if (!workspace || !blocklyLoaded) return;

        const handleChange = (event) => {
            if (skipCleanupRef.current || isXmlLoadingRef.current) return;

            if (event.type === Blockly.Events.BLOCK_CREATE) {
                const block = workspace.getBlockById(event.blockId);
                if (!block) return;

                // 1. Call block created → fix invalid name
                if (isCallBlock(block)) {
                    fixCallBlockName(block, workspace);
                }

                // 2. Definition block created → delete if duplicate
                if (isDefBlock(block)) {
                    deleteIfDuplicate(block, workspace);
                }
            }

            // 3. Debounced cleanup on any block event
            if (event.type === Blockly.Events.BLOCK_CREATE ||
                event.type === Blockly.Events.BLOCK_CHANGE ||
                event.type === Blockly.Events.BLOCK_DELETE) {

                if (cleanupTimeoutRef.current) clearTimeout(cleanupTimeoutRef.current);
                cleanupTimeoutRef.current = setTimeout(() => {
                    cleanupDuplicateProcedures();
                    cleanupTimeoutRef.current = null;
                }, 300);
            }
        };

        workspace.addChangeListener(handleChange);

        return () => {
            workspace.removeChangeListener(handleChange);
            if (cleanupTimeoutRef.current) clearTimeout(cleanupTimeoutRef.current);
        };
    }, [blocklyLoaded]);
};
