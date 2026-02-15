// Blockly Procedure Call Generators (with N-Queen support)
import { javascriptGenerator } from "blockly/javascript";



// Helper to resolve procedure name from block
function resolveProcedureName(block) {
    let procedureName = null;

    // 1. Check Mutation (Highest Priority for N-Queen helpers & standard procedures)
    if (block.mutationToDom) {
        const mutation = block.mutationToDom();
        if (mutation) {
            procedureName = mutation.getAttribute('name');
        }
    }

    // 2. Fallback to NAME field
    if (!procedureName) {
        procedureName = block.getFieldValue('NAME');
    }

    // 3. Fallback to getProcParam (Legacy support)
    if (!procedureName && typeof block.getProcParam === 'function') {
        procedureName = block.getProcParam();
    }

    return procedureName;
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

        // Clean mode: direct call
        if (javascriptGenerator.isCleanMode) {
            return [`${procedureName}(${argsString})`, javascriptGenerator.ORDER_FUNCTION_CALL];
        }

        // Async mode: await call
        return [`(await ${procedureName}(${argsString}))`, javascriptGenerator.ORDER_FUNCTION_CALL];
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

        if (javascriptGenerator.isCleanMode) {
            return `${procedureName}(${argsString});\n`;
        }
        return `await ${procedureName}(${argsString});\n`;
    };
}

