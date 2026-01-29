import { useRef, useEffect } from 'react';
import * as Blockly from 'blockly/core';
import {
    syncProcedureParameters,
    getParamCount,
    rebindCallers
} from '../utils/blocklyProcedureUtils';
// Path is src/components/admin/level/hooks/useBlocklyEventHandlers.js
// utils is src/components/admin/level/utils/blocklyProcedureUtils.js
// So path should be '../utils/blocklyProcedureUtils'

export const useBlocklyEventHandlers = ({
    workspaceRef,
    cleanupDuplicateProcedures,
    blocklyLoaded,
    skipCleanupRef,
    isXmlLoadingRef
}) => {
    const lastProcedureNameRef = useRef('');
    const defaultProcedureName = 'DFS';
    const cleanupTimeoutRef = useRef(null);
    const existingDefIdsRef = useRef(null);

    useEffect(() => {
        const workspace = workspaceRef.current;
        if (!workspace || !blocklyLoaded) return;

        // Helper to store existing definition IDs
        if (!existingDefIdsRef.current) {
            existingDefIdsRef.current = new Set();
        }

        const handleChange = (event) => {
            if (skipCleanupRef.current || isXmlLoadingRef.current) {
                return;
            }

            let isCreatingCallBlock = false;

            // Handle CHANGE event for call blocks - faster than BLOCK_CREATE
            if (event.type === Blockly.Events.BLOCK_CHANGE) {
                const block = workspace.getBlockById(event.blockId);
                if (block && (block.type === 'procedures_callreturn' || block.type === 'procedures_callnoreturn')) {
                    const nameField = block.getField('NAME');
                    if (nameField) {
                        const currentName = nameField.getValue();
                        // If call block has no name or unnamed, set it immediately
                        if (!currentName || currentName === 'unnamed' || currentName === 'undefined' || !currentName.trim()) {
                            const existingDefs = workspace.getBlocksByType('procedures_defreturn', false)
                                .concat(workspace.getBlocksByType('procedures_defnoreturn', false));

                            if (existingDefs.length > 0) {
                                const bestDef = existingDefs[0];
                                const targetName = bestDef.getFieldValue('NAME');
                                if (targetName && targetName !== 'unnamed' && targetName !== 'undefined') {
                                    nameField.setValue(targetName);
                                    // Sync parameters
                                    syncProcedureParameters(block, bestDef, workspace);
                                    if (block.render) block.render();
                                }
                            } else if (lastProcedureNameRef.current) {
                                nameField.setValue(lastProcedureNameRef.current);
                                if (block.render) block.render();
                            }
                        }
                    }
                    return;
                }
            }

            // Track when call blocks are being created
            if (event.type === Blockly.Events.BLOCK_CREATE) {
                const block = workspace.getBlockById(event.blockId);
                if (!block) return;

                if (block.type === 'procedures_callreturn' || block.type === 'procedures_callnoreturn') {
                    isCreatingCallBlock = true;
                    skipCleanupRef.current = true;

                    // Get existing definitions BEFORE Blockly potentially creates a new one
                    const existingDefsBefore = workspace.getBlocksByType('procedures_defreturn', false)
                        .concat(workspace.getBlocksByType('procedures_defnoreturn', false));
                    const existingDefIds = new Set(existingDefsBefore.map(d => d.id));
                    existingDefIdsRef.current = existingDefIds; // Store for use in definition block handler

                    // CRITICAL: Disable events to prevent Blockly from auto-creating definition
                    Blockly.Events.disable();

                    // CRITICAL: Fix call block name immediately (no delay) to prevent cleanup from deleting it
                    try {
                        const nameField = block.getField('NAME');
                        if (nameField) {
                            const currentName = nameField.getValue();

                            // Get valid procedure names from EXISTING definitions only
                            const existingDefs = existingDefsBefore.filter(def => existingDefIds.has(def.id));

                            const validProcedureNames = new Set();
                            let bestDef = null;
                            existingDefs.forEach(defBlock => {
                                try {
                                    const name = defBlock.getFieldValue('NAME');
                                    if (name && name !== 'unnamed' && name !== 'undefined' && name.trim() !== '') {
                                        validProcedureNames.add(name);
                                        lastProcedureNameRef.current = name;
                                        if (!bestDef) {
                                            bestDef = defBlock;
                                        }
                                    }
                                } catch (e) { }
                            });

                            // ALWAYS set the name to the first valid procedure name if available
                            if (validProcedureNames.size > 0) {
                                const firstValidName = Array.from(validProcedureNames)[0];
                                // Only set if current name is invalid or different
                                if (!currentName || currentName === 'unnamed' || currentName === 'undefined' || currentName.trim() === '' || !validProcedureNames.has(currentName)) {
                                    nameField.setValue(firstValidName);
                                }
                            } else if (lastProcedureNameRef.current) {
                                nameField.setValue(lastProcedureNameRef.current);
                            } else if (!currentName || currentName === 'unnamed' || currentName === 'undefined' || currentName.trim() === '') {
                                nameField.setValue(defaultProcedureName);
                            }

                            // Sync parameters/varids on call block with its definition if available
                            const targetDef = bestDef || existingDefs.find(def => {
                                try { return def.getFieldValue('NAME') === nameField.getValue(); } catch (e) { return false; }
                            });
                            if (targetDef) {
                                syncProcedureParameters(block, targetDef, workspace);
                            }
                        }
                    } catch (e) {
                    }

                    // Re-enable events
                    Blockly.Events.enable();

                    // Double-check after a short delay
                    setTimeout(() => {
                        try {
                            if (!block || block.isDisposed()) return;
                            const nameField = block.getField('NAME');
                            if (nameField) {
                                const currentName = nameField.getValue();
                                const allDefs = workspace.getBlocksByType('procedures_defreturn', false)
                                    .concat(workspace.getBlocksByType('procedures_defnoreturn', false));

                                const existingDef = allDefs.find(def => {
                                    try { return def.getFieldValue('NAME') === currentName; } catch (e) { return false; }
                                }) || allDefs.find(def => {
                                    try {
                                        return existingDefIdsRef.current && existingDefIdsRef.current.has(def.id);
                                    } catch (e) {
                                        return false;
                                    }
                                });

                                if (existingDef) {
                                    const existingName = existingDef.getFieldValue('NAME');
                                    if (existingName && existingName !== 'unnamed' && existingName !== 'undefined') {
                                        nameField.setValue(existingName);
                                        if (block.setProcedureParameters && existingDef) {
                                            syncProcedureParameters(block, existingDef, workspace);
                                        }
                                        if (block.render) block.render();
                                    }
                                }
                            }
                        } catch (e) { }
                    }, 50);

                    // Give more time before re-enabling cleanup
                    setTimeout(() => {
                        isCreatingCallBlock = false;
                        skipCleanupRef.current = false;
                    }, 3500);
                }

                // If a definition block is created while we're creating a call block, delete it
                if (block && (block.type === 'procedures_defreturn' || block.type === 'procedures_defnoreturn')) {
                    setTimeout(() => {
                        try {
                            const defName = block.getFieldValue('NAME');
                            const allDefs = workspace.getBlocksByType('procedures_defreturn', false)
                                .concat(workspace.getBlocksByType('procedures_defnoreturn', false));

                            // 1) If exact duplicate names exist, keep first and remove the rest
                            const sameNameDefs = allDefs.filter(def => {
                                try { return def.getFieldValue('NAME') === defName; } catch (e) { return false; }
                            });
                            if (sameNameDefs.length > 1) {
                                // Prefer the one with more parameters
                                const keepDef = sameNameDefs.reduce((best, def) => {
                                    return getParamCount(def) > getParamCount(best) ? def : best;
                                }, sameNameDefs[0]);
                                sameNameDefs.forEach(def => {
                                    if (def === keepDef) return;
                                    try {
                                        rebindCallers(def.getFieldValue('NAME'), keepDef.getFieldValue('NAME'));
                                        if (def && !def.isDisposed()) def.dispose(false);
                                    } catch (e) { }
                                });
                            } else {
                                // 2) If this is a numbered variant (DFS2, DFS3, ...) and a base def exists, rebind callers then remove this variant
                                const baseName = (defName || '').replace(/\d+$/, '');
                                const baseDef = allDefs.find(def => {
                                    try {
                                        const name = def.getFieldValue('NAME');
                                        return name && name !== defName && name.replace(/\d+$/, '') === baseName;
                                    } catch (e) { return false; }
                                });
                                if (baseDef) {
                                    rebindCallers(defName, baseDef.getFieldValue('NAME'));
                                    try { if (!block.isDisposed()) block.dispose(false); } catch (e) { }
                                } else {
                                    // 3) If this new def has no params but another with same base has params, keep the richer one
                                    const richerDef = allDefs.find(def => {
                                        try {
                                            const name = def.getFieldValue('NAME');
                                            return name !== defName && name.replace(/\d+$/, '') === baseName && getParamCount(def) > getParamCount(block);
                                        } catch (e) { return false; }
                                    });
                                    if (richerDef) {
                                        rebindCallers(defName, richerDef.getFieldValue('NAME'));
                                        try { if (!block.isDisposed()) block.dispose(false); } catch (e) { }
                                    }
                                }
                            }
                        } catch (e) { }
                    }, 100);
                }

                // Handle definition block creation
                if (block.type === 'procedures_defreturn' || block.type === 'procedures_defnoreturn') {
                    try {
                        const name = block.getFieldValue('NAME');
                        if (name && name !== 'unnamed' && name !== 'undefined' && name.trim() !== '') {
                            lastProcedureNameRef.current = name;
                        }

                        // CRITICAL: If this is a newly created definition while creating a call block, dispose it immediately
                        if (existingDefIdsRef.current && !existingDefIdsRef.current.has(block.id)) {
                            // Check if it's unnamed or if there's an existing definition with same name
                            const defName = name || block.getFieldValue('NAME');
                            const existingDefs = workspace.getBlocksByType('procedures_defreturn', false)
                                .concat(workspace.getBlocksByType('procedures_defnoreturn', false))
                                .filter(def => existingDefIdsRef.current && existingDefIdsRef.current.has(def.id));

                            const hasExistingWithSameName = existingDefs.some(def => {
                                try { return def.getFieldValue('NAME') === defName; } catch (e) { return false; }
                            });

                            if (!defName || defName === 'unnamed' || defName === 'undefined' || defName.trim() === '' || hasExistingWithSameName) {
                                setTimeout(() => {
                                    try {
                                        if (!block || block.isDisposed()) return;
                                        if (hasExistingWithSameName) {
                                            const existingDef = existingDefs.find(def => {
                                                try { return def.getFieldValue('NAME') === defName; } catch (e) { return false; }
                                            });
                                            if (existingDef) {
                                                const existingName = existingDef.getFieldValue('NAME');
                                                const callers = Blockly.Procedures.getCallers(defName || '', workspace) || [];
                                                callers.forEach(cb => {
                                                    try {
                                                        cb.getField('NAME')?.setValue(existingName);
                                                        if (cb.setProcedureParameters && existingDef) {
                                                            syncProcedureParameters(cb, existingDef, workspace);
                                                        }
                                                        if (cb.render) cb.render();
                                                    } catch (e) { }
                                                });
                                            }
                                        } else if (existingDefs.length > 0) {
                                            const existingDef = existingDefs[0];
                                            const existingName = existingDef.getFieldValue('NAME');
                                            const callers = Blockly.Procedures.getCallers(defName || '', workspace) || [];
                                            callers.forEach(cb => {
                                                try {
                                                    cb.getField('NAME')?.setValue(existingName);
                                                    if (cb.setProcedureParameters && existingDef) {
                                                        syncProcedureParameters(cb, existingDef, workspace);
                                                    }
                                                    if (cb.render) cb.render();
                                                } catch (e) { }
                                            });
                                        }

                                        if (!block.isDisposed()) {
                                            block.dispose(false);
                                        }
                                    } catch (e) {
                                        console.error('Error disposing new definition:', e);
                                    }
                                }, 0);
                            } else {
                                // Check if any call blocks are using this new definition
                                setTimeout(() => {
                                    try {
                                        if (!block || block.isDisposed()) return;
                                        const callers = Blockly.Procedures.getCallers(defName || '', workspace) || [];
                                        if (callers.length === 0) {
                                            if (!block.isDisposed()) {
                                                block.dispose(false);
                                            }
                                        }
                                    } catch (e) { }
                                }, 10);
                            }
                        }
                    } catch (e) { }
                }
            }

            if ((event.type === Blockly.Events.BLOCK_CREATE ||
                event.type === Blockly.Events.BLOCK_CHANGE ||
                event.type === Blockly.Events.BLOCK_DELETE) &&
                !skipCleanupRef.current && !isCreatingCallBlock) {

                if (cleanupTimeoutRef.current) {
                    clearTimeout(cleanupTimeoutRef.current);
                }

                cleanupTimeoutRef.current = setTimeout(() => {
                    const currentCallBlocks = workspace.getBlocksByType('procedures_callreturn', false)
                        .concat(workspace.getBlocksByType('procedures_callnoreturn', false));

                    const allNamed = currentCallBlocks.every(cb => {
                        try {
                            const name = cb.getFieldValue('NAME');
                            return name && name !== 'unnamed' && name !== 'undefined' && name.trim();
                        } catch (e) { return false; }
                    });

                    if (allNamed || currentCallBlocks.length === 0) {
                        cleanupDuplicateProcedures();
                    }

                    cleanupTimeoutRef.current = null;
                }, 300);
            }
        };

        workspace.addChangeListener(handleChange);

        return () => {
            workspace.removeChangeListener(handleChange);
            if (cleanupTimeoutRef.current) {
                clearTimeout(cleanupTimeoutRef.current);
            }
        }
    }, [blocklyLoaded]); // Only re-run if blocklyLoaded changes (or workspace is recreated)
};
