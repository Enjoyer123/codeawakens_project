// Blockly Procedure Call Generators (with N-Queen support)
import { javascriptGenerator } from "blockly/javascript";
import * as Blockly from "blockly/core";



// Helper to resolve procedure name from block
// Returns a sanitized name safe for JavaScript (e.g. "do something" → "do_something")
function resolveProcedureName(block) {
    let rawName = null;

    // 1. Check Mutation (Highest Priority for N-Queen helpers & standard procedures)
    if (block.mutationToDom) {
        const mutation = block.mutationToDom();
        if (mutation) {
            rawName = mutation.getAttribute('name');
        }
    }

    // 2. Fallback to NAME field
    if (!rawName) {
        rawName = block.getFieldValue('NAME');
    }

    // 3. Fallback to getProcParam (Legacy support)
    if (!rawName && typeof block.getProcParam === 'function') {
        rawName = block.getProcParam();
    }

    if (!rawName) return null;

    // Sanitize via nameDB_ to match the definition generator
    if (javascriptGenerator.nameDB_) {
        return javascriptGenerator.nameDB_.getName(
            rawName,
            Blockly.Names.NameType.PROCEDURE
        );
    }

    // Fallback: manual sanitize if nameDB_ not ready
    return rawName.replace(/\s+/g, '_');
}

export function defineProcedureCallGenerators() {
    // Override procedures_callreturn
    javascriptGenerator.forBlock["procedures_callreturn"] = function (block) {
        const procedureName = resolveProcedureName(block);

        if (!procedureName || procedureName === 'unnamed' || procedureName.trim() === '') {
            return ['null', javascriptGenerator.ORDER_ATOMIC];
        }

        const args = [];
        // Handle arguments
        if (block.arguments_) {
            for (let i = 0; i < block.arguments_.length; i++) {
                const argCode = javascriptGenerator.valueToCode(block, 'ARG' + i, javascriptGenerator.ORDER_NONE) || 'null';
                args.push(argCode);
            }
        }

        const argsString = args.join(', ');

        // ต้องมี await เสมอ เพราะทุก function ในระบบเกมเราถูกเปลี่ยนเป็น async หมดแล้ว
        // การมี return ค่าก็ต้อง await เพื่อเอาค่าจริงๆ ออกมาจาก Promise
        // Clean Mode: no await for display
        if (javascriptGenerator.isCleanMode) {
            return [`${procedureName}(${argsString})`, javascriptGenerator.ORDER_NONE];
        }
        return [`await ${procedureName}(${argsString})`, javascriptGenerator.ORDER_NONE];
    };

    // Override procedures_callnoreturn
    javascriptGenerator.forBlock["procedures_callnoreturn"] = function (block) {
        const procedureName = resolveProcedureName(block);

        if (!procedureName || procedureName === 'unnamed' || procedureName.trim() === '') {
            return '// Invalid procedure call\n';
        }

        const args = [];
        if (block.arguments_) {
            for (let i = 0; i < block.arguments_.length; i++) {
                const argCode = javascriptGenerator.valueToCode(block, 'ARG' + i, javascriptGenerator.ORDER_NONE) || 'null';
                args.push(argCode);
            }
        }

        const argsString = args.join(', ');

        // Clean Mode: no await for display
        if (javascriptGenerator.isCleanMode) {
            return `${procedureName}(${argsString});
`;
        }
        // Must await since all procedure definitions are async
        return `await ${procedureName}(${argsString});
`;
    };
}
