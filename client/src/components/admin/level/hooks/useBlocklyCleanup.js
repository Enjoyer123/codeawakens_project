/**
 * useBlocklyCleanup Hook
 * Removes duplicate procedure definitions from workspace.
 * Keeps first valid definition of each name, disposes the rest.
 */
import { useCallback } from 'react';

function isInvalidName(name) {
    return !name || name === 'unnamed' || name === 'undefined' || !name.trim();
}

export function useBlocklyCleanup({
    workspaceRef,
    skipCleanupRef = { current: false },
    isXmlLoadingRef = { current: false }
}) {
    const cleanupDuplicateProcedures = useCallback(() => {
        if (skipCleanupRef.current || isXmlLoadingRef.current) return;
        if (!workspaceRef.current) return;

        try {
            const workspace = workspaceRef.current;
            const allDefs = workspace.getBlocksByType('procedures_defreturn', false)
                .concat(workspace.getBlocksByType('procedures_defnoreturn', false));

            if (allDefs.length === 0) return;

            // Group by name — keep first occurrence, dispose rest
            const seen = new Map();
            allDefs.forEach(def => {
                try {
                    const name = def.getFieldValue('NAME');

                    // Dispose blocks with invalid names
                    if (isInvalidName(name)) {
                        if (!def.isDisposed()) def.dispose(false);
                        return;
                    }

                    // Keep first, dispose duplicates
                    if (seen.has(name)) {
                        if (!def.isDisposed()) def.dispose(false);
                    } else {
                        seen.set(name, def);
                    }
                } catch { /* ignore */ }
            });
        } catch (e) {
            console.error('Error in cleanupDuplicateProcedures:', e);
        }
    }, [workspaceRef, skipCleanupRef, isXmlLoadingRef]);

    return { cleanupDuplicateProcedures };
}
