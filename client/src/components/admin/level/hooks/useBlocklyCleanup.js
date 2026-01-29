/**
 * useBlocklyCleanup Hook
 * Manages cleanup of duplicate procedure definitions in Blockly workspace
 */

import { useCallback } from 'react';
import * as Blockly from 'blockly/core';

export function useBlocklyCleanup({
    workspaceRef,
    skipCleanupRef = { current: false },  // ← เพิ่ม default
    isXmlLoadingRef = { current: false }  // ← เพิ่ม default
}) {
    const cleanupDuplicateProcedures = useCallback(() => {
        if (skipCleanupRef.current || isXmlLoadingRef.current) {
            return;
        }

        if (!workspaceRef.current) {
            return;
        }

        try {
            const workspace = workspaceRef.current;
            const definitionBlocks = workspace.getBlocksByType('procedures_defreturn', false)
                .concat(workspace.getBlocksByType('procedures_defnoreturn', false));

            if (definitionBlocks.length === 0) {
                return;
            }

            const callBlocks = workspace.getBlocksByType('procedures_callreturn', false)
                .concat(workspace.getBlocksByType('procedures_callnoreturn', false));

            // CRITICAL: Check if there are unnamed call blocks - skip cleanup if found
            // This gives time for names to be set before cleanup runs
            const hasUnnamedCall = callBlocks.some(cb => {
                try {
                    const n = cb.getFieldValue('NAME');
                    return !n || n === 'unnamed' || n === 'undefined' || !n.trim();
                } catch (e) {
                    return false;
                }
            });

            if (hasUnnamedCall) {
                // Wait a bit more for names to be set
                return;
            }

            // Helper to check if procedure has callers using Blockly API
            const hasCallers = (name) => {
                try {
                    const callers = Blockly.Procedures.getCallers(name || '', workspace) || [];
                    return callers.length > 0;
                } catch (e) {
                    return false;
                }
            };

            // Get names of procedures that are actually being called
            const calledProcedureNames = new Set();
            callBlocks.forEach(callBlock => {
                try {
                    const name = callBlock.getFieldValue('NAME');
                    if (name && name !== 'unnamed' && name !== 'undefined' && name.trim() !== '') {
                        calledProcedureNames.add(name);
                    }
                } catch (e) { }
            });

            // Group by procedure name - keep first occurrence of each name
            const validProcedures = new Map();

            definitionBlocks.forEach(defBlock => {
                try {
                    const name = defBlock.getFieldValue('NAME');

                    // Remove blocks with invalid names (if not being used)
                    if (!name || name === 'unnamed' || name === 'undefined' || name.trim() === '') {
                        const isBeingUsed = calledProcedureNames.has(name) || hasCallers(name);
                        if (!isBeingUsed && !defBlock.isDisposed()) {
                            defBlock.dispose(false);
                        }
                        return;
                    }

                    // Keep track of valid procedures (first occurrence of each name)
                    if (!validProcedures.has(name)) {
                        validProcedures.set(name, defBlock);
                    } else {
                        // Duplicate with same name - check if we should remove it
                        const primaryDef = validProcedures.get(name);
                        const isBeingUsedByCallName = calledProcedureNames.has(name);
                        const isBeingUsedByCallers = hasCallers(name);

                        // If the primary one was disposed already, replace it
                        if (!primaryDef || primaryDef.isDisposed()) {
                            validProcedures.set(name, defBlock);
                            return;
                        }

                        // If this duplicate is not being used, dispose it
                        if (!isBeingUsedByCallName && !isBeingUsedByCallers && !defBlock.isDisposed()) {
                            defBlock.dispose(false);
                        }
                    }
                } catch (e) { }
            });
        } catch (e) {
            console.error('Error in cleanupDuplicateProcedures:', e);
        }
    }, [workspaceRef, skipCleanupRef, isXmlLoadingRef]);

    return { cleanupDuplicateProcedures };
}
