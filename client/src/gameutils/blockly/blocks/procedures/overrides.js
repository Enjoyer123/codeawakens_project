// Blockly Procedure Block Overrides
// Consolidated: safe rename, loadExtraState, name fixing, tooltips, N-Queen support
import * as Blockly from "blockly/core";

// Algorithm helper functions that need special procedure name resolution
const ALGO_HELPER_FUNCTIONS = ['safe', 'place', 'remove'];

// ==========================================
// Shared Helpers
// ==========================================

/**
 * Find a valid procedure name from the workspace's definition blocks.
 * If currentName matches an existing definition, returns it as-is.
 * If currentName is a numbered variant (e.g. DFS2), returns the matching base (DFS).
 * Otherwise returns the first valid name, or null.
 */
function findValidProcedureName(workspace, currentName) {
    const defs = workspace.getBlocksByType('procedures_defreturn', false)
        .concat(workspace.getBlocksByType('procedures_defnoreturn', false));

    const validNames = new Set();
    defs.forEach(block => {
        try {
            const name = block.getFieldValue('NAME');
            if (name && name !== 'unnamed' && name !== 'undefined' && name.trim()) {
                validNames.add(name);
            }
        } catch (e) { /* ignore */ }
    });

    if (validNames.size === 0) return null;
    if (validNames.has(currentName)) return currentName;

    // Check if currentName is a numbered variant (e.g. DFS2 → DFS)
    const currentBase = currentName?.replace(/\d+$/, '');
    const match = Array.from(validNames).find(name => name.replace(/\d+$/, '') === currentBase);
    if (match) return match;

    // Fallback to first valid name
    return Array.from(validNames)[0];
}

function isInvalidName(name) {
    return !name || name === 'unnamed' || name === 'undefined' || name.trim() === '';
}

// ==========================================
// Override Factories
// ==========================================

/** Safe renameProcedure — guards against undefined/null but allows empty oldName (flyout initial assign) */
function createSafeRenameProcedure(original) {
    return function (oldName, newName) {
        // newName must be valid — oldName can be empty (initial assignment from flyout)
        if (newName == null) return;
        try {
            const safeNew = String(newName).trim();
            if (!safeNew || safeNew === 'undefined') return;
            const safeOld = (oldName == null || String(oldName).trim() === 'undefined')
                ? ''
                : String(oldName).trim();
            if (original && typeof original === 'function') {
                return original.call(this, safeOld, safeNew);
            }
        } catch (e) {
            console.warn('[Procedure Override] renameProcedure error:', e);
        }
    };
}

/** Safe loadExtraState — sets name directly without calling renameProcedure */
function createSafeLoadExtraState() {
    return function (state) {
        try {
            if (!state || typeof state !== 'object') state = {};

            let safeName = 'function';
            const trimmed = state.name?.trim?.();
            if (trimmed && trimmed !== 'unnamed' && trimmed !== 'undefined') {
                safeName = trimmed;
            }

            const safeParams = Array.isArray(state.params) ? state.params : [];

            // Set name field directly WITHOUT calling renameProcedure
            const nameField = this.getField('NAME');
            if (nameField) {
                nameField.setValue(safeName);
            }

            // Handle parameters via mutation
            if (safeParams.length > 0 && this.mutationToDom && this.domToMutation) {
                try {
                    const mutation = this.mutationToDom();
                    if (mutation) {
                        mutation.setAttribute('name', safeName);
                        mutation.setAttribute('params', JSON.stringify(safeParams));
                        this.domToMutation(mutation);
                    }
                } catch (e) {
                    console.warn('[Procedure Override] loadExtraState mutation error:', e);
                }
            }

            return { name: safeName, params: safeParams };
        } catch (e) {
            console.error('[Procedure Override] loadExtraState error:', e);
            return { name: 'function', params: [] };
        }
    };
}

/** Safe customContextMenu */
function createSafeContextMenu(original) {
    return function (options) {
        try {
            if (original && options && Array.isArray(options)) {
                const procName = this.getFieldValue('NAME');
                if (procName && typeof procName === 'string') {
                    return original.call(this, options);
                }
            }
        } catch (e) {
            console.warn('[Procedure Override] customContextMenu error:', e);
        }
    };
}

/** Safe getProcParam for N-Queen algorithm helper functions */
function createSafeGetProcParam(original) {
    return function () {
        // Check mutation first (most reliable)
        if (this.mutationToDom) {
            try {
                const name = this.mutationToDom()?.getAttribute?.('name');
                if (ALGO_HELPER_FUNCTIONS.includes(name)) return name;
            } catch (e) { /* ignore */ }
        }

        // Check NAME field
        const nameFromField = this.getField('NAME')?.getValue();
        if (ALGO_HELPER_FUNCTIONS.includes(nameFromField)) return nameFromField;

        // Fallback to original
        return original.call(this);
    };
}

/**
 * Wraps init to:
 * 1. Add Thai tooltip
 * 2. Fix call blocks with invalid names after definition is created
 */
function createDefInitOverride(originalInit, tooltip) {
    return function () {
        if (originalInit) originalInit.call(this);
        this.setTooltip(tooltip);

        // After init, fix call blocks that have "unnamed" to use this definition's name
        setTimeout(() => {
            if (!this.workspace || this.isDisposed()) return;
            const definitionName = this.getFieldValue('NAME');
            if (isInvalidName(definitionName)) return;

            const callBlocks = this.workspace.getBlocksByType('procedures_callreturn', false)
                .concat(this.workspace.getBlocksByType('procedures_callnoreturn', false));

            callBlocks.forEach(callBlock => {
                const nameField = callBlock.getField('NAME');
                if (nameField && isInvalidName(nameField.getValue())) {
                    nameField.setValue(definitionName);
                }
            });
        }, 50);
    };
}

/**
 * Override getProcedureDef to fix invalid procedure names before returning.
 */
function createSafeGetProcedureDef(original) {
    return function () {
        try {
            const nameField = this.getField('NAME');
            if (nameField && this.workspace) {
                const currentName = nameField.getValue();
                // Only fix genuinely invalid names — don't override valid names like BFS/DFS
                if (isInvalidName(currentName)) {
                    const fixedName = findValidProcedureName(this.workspace, currentName);
                    if (fixedName) nameField.setValue(fixedName);
                }
            }
            return original.call(this);
        } catch (e) {
            console.warn('[Procedure Override] getProcedureDef error:', e);
            return null;
        }
    };
}

/**
 * Override onchange to fix procedure call names when they don't match any definition.
 */
function createSafeOnchange(original) {
    return function (changeEvent) {
        if (!this.workspace) {
            if (original) {
                try { original.call(this, changeEvent); } catch (e) { /* ignore */ }
            }
            return;
        }

        try {
            const nameField = this.getField('NAME');
            if (nameField) {
                const currentName = nameField.getValue();
                // Only fix genuinely invalid names — don't override valid names
                if (isInvalidName(currentName)) {
                    const fixedName = findValidProcedureName(this.workspace, currentName);
                    if (fixedName) nameField.setValue(fixedName);
                }
            }
        } catch (e) {
            console.warn('[Procedure Override] onchange name fix error:', e);
        }

        // Call original onchange
        if (original) {
            try {
                original.call(this, changeEvent);
            } catch (e) {
                // If error, try to recover only if name is invalid
                try {
                    const nameField = this.getField('NAME');
                    if (nameField && this.workspace && isInvalidName(nameField.getValue())) {
                        const fixedName = findValidProcedureName(this.workspace, nameField.getValue());
                        if (fixedName) nameField.setValue(fixedName);
                    }
                } catch (fixError) {
                    console.warn('[Procedure Override] onchange recovery error:', fixError);
                }
            }
        }
    };
}

// ==========================================
// Thai Tooltips
// ==========================================
const THAI_TOOLTIPS = {
    procedures_defreturn: 'สร้างฟังก์ชันที่คืนค่า',
    procedures_defnoreturn: 'สร้างฟังก์ชันที่ไม่คืนค่า',
    procedures_callreturn: 'เรียกใช้ฟังก์ชันและรับค่าคืน',
    procedures_callnoreturn: 'เรียกใช้ฟังก์ชัน',
    procedures_ifreturn: 'ถ้าเงื่อนไขเป็นจริง ให้คืนค่า'
};

// ==========================================
// Main Entry Point
// ==========================================

export function applyProcedureOverrides() {

    // --- Procedure Definition Blocks ---
    ['procedures_defreturn', 'procedures_defnoreturn'].forEach(blockType => {
        const block = Blockly.Blocks[blockType];
        if (!block || block.__procedureOverridden) return;

        // Init with tooltip + call block name fixing
        block.init = createDefInitOverride(block.init, THAI_TOOLTIPS[blockType]);

        // Safe rename
        block.renameProcedure = createSafeRenameProcedure(block.renameProcedure);

        // Safe loadExtraState (bypasses renameProcedure)
        block.loadExtraState = createSafeLoadExtraState();

        // Safe context menu
        block.customContextMenu = createSafeContextMenu(block.customContextMenu);

        block.__procedureOverridden = true;
    });

    // --- Procedure Call Blocks ---
    ['procedures_callreturn', 'procedures_callnoreturn'].forEach(blockType => {
        const block = Blockly.Blocks[blockType];
        if (!block || block.__procedureOverridden) return;

        // Init with tooltip
        const originalInit = block.init;
        block.init = function () {
            if (originalInit) originalInit.call(this);
            this.setTooltip(THAI_TOOLTIPS[blockType]);
        };

        // Safe rename
        if (block.renameProcedure) {
            block.renameProcedure = createSafeRenameProcedure(block.renameProcedure);
        }

        // Safe getProcParam for algorithm helpers (N-Queen etc.)
        if (block.getProcParam) {
            block.getProcParam = createSafeGetProcParam(block.getProcParam);
        }

        // getProcedureDef — fix invalid names before returning
        if (block.getProcedureDef) {
            block.getProcedureDef = createSafeGetProcedureDef(block.getProcedureDef);
        }

        // onchange — fix names that don't match any definition
        if (block.onchange) {
            block.onchange = createSafeOnchange(block.onchange);
        }

        block.__procedureOverridden = true;
    });

    // --- procedures_ifreturn (tooltip only) ---
    if (Blockly.Blocks['procedures_ifreturn']) {
        const block = Blockly.Blocks['procedures_ifreturn'];
        const originalInit = block.init;
        block.init = function () {
            if (originalInit) originalInit.call(this);
            this.setTooltip(THAI_TOOLTIPS.procedures_ifreturn);
        };
    }
}
