// Blockly Procedure Block Overrides (Fixes for renaming, loading state, and N-Queen logic)
import * as Blockly from "blockly/core";

// Algorithm helper functions that need special procedure name resolution
const ALGO_HELPER_FUNCTIONS = ['safe', 'place', 'remove'];

// ==========================================
// Shared Helper Factories
// ==========================================

/**
 * Creates a safe renameProcedure override that guards against undefined/null names.
 * Used by all 4 procedure block types.
 */
function createSafeRenameProcedure(original) {
    return function (oldName, newName) {
        if (!oldName || !newName) return;
        try {
            const safeOld = String(oldName).trim();
            const safeNew = String(newName).trim();
            if (!safeOld || !safeNew || safeOld === 'undefined' || safeNew === 'undefined') return;
            if (original && typeof original === 'function') {
                return original.call(this, safeOld, safeNew);
            }
        } catch (e) {
            console.warn(`[Procedure Override] renameProcedure error:`, e);
        }
    };
}

/**
 * Creates a safe loadExtraState override that sets name directly
 * without calling renameProcedure (which is the root cause of undefined errors).
 * Used by procedures_defreturn and procedures_defnoreturn.
 */
function createSafeLoadExtraState() {
    return function (state) {
        try {
            if (!state || typeof state !== 'object') state = {};

            // Resolve safe name
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

/**
 * Creates a safe customContextMenu override.
 * Used by procedures_defreturn and procedures_defnoreturn.
 */
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

/**
 * Creates a safe getProcParam override for algorithm helper functions.
 * Checks mutation and NAME field for special function names before falling back.
 * Used by procedures_callreturn and procedures_callnoreturn.
 */
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

/**
 * Wraps an init function to add a Thai tooltip after initialization.
 */
function wrapInitWithTooltip(originalInit, tooltip) {
    return function () {
        if (originalInit) originalInit.call(this);
        this.setTooltip(tooltip);
    };
}

// ==========================================
// Main Entry Point
// ==========================================

export function applyProcedureOverrides() {

    // --- Procedure Definition Blocks (defreturn & defnoreturn) ---
    ['procedures_defreturn', 'procedures_defnoreturn'].forEach(blockType => {
        const block = Blockly.Blocks[blockType];
        if (!block) return;

        // Thai tooltip
        block.init = wrapInitWithTooltip(block.init, THAI_TOOLTIPS[blockType]);

        // Safe rename
        block.renameProcedure = createSafeRenameProcedure(block.renameProcedure);

        // Safe loadExtraState (bypasses renameProcedure — the root cause fix)
        block.loadExtraState = createSafeLoadExtraState();

        // Safe context menu
        block.customContextMenu = createSafeContextMenu(block.customContextMenu);
    });

    // --- Procedure Call Blocks (callreturn & callnoreturn) ---
    ['procedures_callreturn', 'procedures_callnoreturn'].forEach(blockType => {
        const block = Blockly.Blocks[blockType];
        if (!block) return;

        // Thai tooltip
        block.init = wrapInitWithTooltip(block.init, THAI_TOOLTIPS[blockType]);

        // Safe rename
        if (block.renameProcedure) {
            block.renameProcedure = createSafeRenameProcedure(block.renameProcedure);
        }

        // Safe getProcParam for algorithm helpers (N-Queen etc.)
        if (block.getProcParam) {
            block.getProcParam = createSafeGetProcParam(block.getProcParam);
        }
    });

    // --- procedures_ifreturn (tooltip only) ---
    if (Blockly.Blocks['procedures_ifreturn']) {
        const block = Blockly.Blocks['procedures_ifreturn'];
        block.init = wrapInitWithTooltip(block.init, THAI_TOOLTIPS.procedures_ifreturn);
    }
}
