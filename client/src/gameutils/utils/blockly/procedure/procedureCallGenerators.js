// Blockly Procedure Call Generators (with N-Queen support)
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

export function defineProcedureCallGenerators() {
    // Override procedures_callreturn to await the async function result
    javascriptGenerator.forBlock["procedures_callreturn"] = function (block) {
        let procedureName = null;
        let isNQueenHelper = false;

        try {
            // CRITICAL: For N-Queen helper functions, check mutation FIRST
            if (block.mutationToDom) {
                try {
                    const mutation = block.mutationToDom();
                    if (mutation) {
                        let mutationName = null;
                        if (mutation.getAttribute) {
                            mutationName = mutation.getAttribute('name');
                        } else if (mutation.getAttributeNS) {
                            mutationName = mutation.getAttributeNS(null, 'name');
                        } else if (mutation.attributes && mutation.attributes.name) {
                            mutationName = mutation.attributes.name.value;
                        } else if (mutation.querySelector) {
                            const mutationEl = mutation.querySelector ? mutation.querySelector('mutation') : mutation;
                            if (mutationEl && mutationEl.getAttribute) {
                                mutationName = mutationEl.getAttribute('name');
                            }
                        }

                        console.log(`[blocklyGenerators] 🔍 Mutation name extracted: "${mutationName}"`);

                        if (mutationName && (mutationName === 'safe' || mutationName === 'place' || mutationName === 'remove')) {
                            procedureName = mutationName;
                            isNQueenHelper = true;
                            console.log(`[blocklyGenerators] ✅ Found N-Queen helper name from mutation: ${procedureName}`);
                        }
                    }
                } catch (e) {
                    console.warn('Error reading mutation:', e);
                }
            }

            // Check NAME field if mutation didn't give us a name
            if (!procedureName) {
                const nameField = block.getField('NAME');
                if (nameField) {
                    const nameFromField = nameField.getValue();
                    if (nameFromField === 'safe' || nameFromField === 'place' || nameFromField === 'remove') {
                        procedureName = nameFromField;
                        isNQueenHelper = true;
                        console.log(`[blocklyGenerators] ✅ Found N-Queen helper name from NAME field: "${procedureName}"`);
                    } else if (nameFromField) {
                        procedureName = nameFromField;
                        console.log(`[blocklyGenerators] procedures_callreturn: Got name from NAME field: "${procedureName}"`);
                    }
                }
            }

            // Fallback to getFieldValue
            if (!procedureName) {
                const nameFromGetFieldValue = block.getFieldValue('NAME');
                if (nameFromGetFieldValue === 'safe' || nameFromGetFieldValue === 'place' || nameFromGetFieldValue === 'remove') {
                    procedureName = nameFromGetFieldValue;
                    isNQueenHelper = true;
                    console.log(`[blocklyGenerators] ✅ Found N-Queen helper name from getFieldValue: "${procedureName}"`);
                } else if (nameFromGetFieldValue) {
                    procedureName = nameFromGetFieldValue;
                    console.log(`[blocklyGenerators] procedures_callreturn: Got name from getFieldValue: "${procedureName}"`);
                }
            }

            // For non-N-Queen functions, use getProcParam() as fallback
            if (!procedureName && !isNQueenHelper && typeof block.getProcParam === 'function') {
                procedureName = block.getProcParam();
                console.log(`[blocklyGenerators] procedures_callreturn: Got name from getProcParam: "${procedureName}"`);
            }

            // Final check to prevent wrong procedure name resolution
            if (procedureName === 'solve') {
                if (block.mutationToDom) {
                    try {
                        const mutation = block.mutationToDom();
                        if (mutation) {
                            let mutationName = null;
                            if (mutation.getAttribute) {
                                mutationName = mutation.getAttribute('name');
                            } else if (mutation.getAttributeNS) {
                                mutationName = mutation.getAttributeNS(null, 'name');
                            } else if (mutation.attributes && mutation.attributes.name) {
                                mutationName = mutation.attributes.name.value;
                            } else if (mutation.querySelector) {
                                const mutationEl = mutation.querySelector ? mutation.querySelector('mutation') : mutation;
                                if (mutationEl && mutationEl.getAttribute) {
                                    mutationName = mutationEl.getAttribute('name');
                                }
                            }

                            if (mutationName === 'safe' || mutationName === 'place' || mutationName === 'remove') {
                                console.warn(`[blocklyGenerators] ⚠️ Override: procedureName was 'solve' but mutation says '${mutationName}'. Using mutation.`);
                                procedureName = mutationName;
                            }
                        }
                    } catch (e) {
                        console.warn('Error checking mutation in final check:', e);
                    }
                }

                if (procedureName === 'solve') {
                    const nameFieldFinal = block.getField('NAME');
                    if (nameFieldFinal) {
                        const nameFromFieldFinal = nameFieldFinal.getValue();
                        if (nameFromFieldFinal === 'safe' || nameFromFieldFinal === 'place' || nameFromFieldFinal === 'remove') {
                            console.warn(`[blocklyGenerators] ⚠️ Override: procedureName was 'solve' but NAME field says '${nameFromFieldFinal}'. Using NAME field.`);
                            procedureName = nameFromFieldFinal;
                        }
                    }
                }
            }

            console.log(`[blocklyGenerators] procedures_callreturn: Final procedureName = "${procedureName}"`);

            if (procedureName === 'safe' || procedureName === 'place' || procedureName === 'remove') {
                console.log(`[blocklyGenerators] ✅ Confirmed N-Queen helper function: ${procedureName}`);
            }
        } catch (e) {
            console.warn('Error getting procedure name:', e);
        }

        // Validate procedure name
        if (procedureName && (procedureName === 'safe' || procedureName === 'place' || procedureName === 'remove')) {
            isNQueenHelper = true;
        }

        if (!procedureName || procedureName === 'unnamed' || procedureName === 'undefined' ||
            (typeof procedureName === 'string' && procedureName.trim() === '')) {
            if (!isNQueenHelper) {
                console.warn('Procedure call block has invalid name, trying to fix:', procedureName);

                try {
                    const workspace = block.workspace;
                    if (workspace) {
                        const procedureMap = workspace.getProcedureMap();
                        if (procedureMap) {
                            const procedures = procedureMap.getProcedures();
                            if (procedures.length > 0) {
                                procedureName = procedures[0].getName();
                                console.log('Using first available procedure:', procedureName);
                            } else {
                                console.warn('No procedures available in workspace');
                                return ['null', javascriptGenerator.ORDER_ATOMIC];
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Error trying to fix procedure name:', e);
                    return ['null', javascriptGenerator.ORDER_ATOMIC];
                }
            } else {
                console.log(`[blocklyGenerators] ✅ Allowing N-Queen helper function (will be injected): ${procedureName}`);
            }

            const finalIsNQueenHelper = procedureName === 'safe' || procedureName === 'place' || procedureName === 'remove';
            if (!finalIsNQueenHelper && (!procedureName || procedureName === 'unnamed' || procedureName === 'undefined' ||
                (typeof procedureName === 'string' && procedureName.trim() === ''))) {
                return ['null', javascriptGenerator.ORDER_ATOMIC];
            }
        }

        // Get arguments
        const args = [];
        if (block.arguments_ && block.arguments_.length > 0) {
            for (let i = 0; i < block.arguments_.length; i++) {
                const argCode = javascriptGenerator.valueToCode(block, 'ARG' + i, javascriptGenerator.ORDER_NONE) || 'null';
                args.push(argCode);
            }
        } else {
            let i = 0;
            while (block.getInput('ARG' + i)) {
                const argCode = javascriptGenerator.valueToCode(block, 'ARG' + i, javascriptGenerator.ORDER_NONE) || 'null';
                args.push(argCode);
                i++;
            }
            if (i > 0) {
                console.log(`[blocklyGenerators] ⚠️ Fallback argument scanning found ${i} args for ${procedureName}`);
            }
        }

        const argsString = args.length > 0 ? args.join(', ') : '';
        return [`(await ${procedureName}(${argsString}))`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    // Override procedures_callnoreturn to await the async function completion
    javascriptGenerator.forBlock["procedures_callnoreturn"] = function (block) {
        let procedureName = null;
        let isNQueenHelper = false;

        try {
            if (block.mutationToDom) {
                try {
                    const mutation = block.mutationToDom();
                    if (mutation) {
                        let mutationName = null;
                        if (mutation.getAttribute) {
                            mutationName = mutation.getAttribute('name');
                        } else if (mutation.getAttributeNS) {
                            mutationName = mutation.getAttributeNS(null, 'name');
                        } else if (mutation.attributes && mutation.attributes.name) {
                            mutationName = mutation.attributes.name.value;
                        } else if (mutation.querySelector) {
                            const mutationEl = mutation.querySelector ? mutation.querySelector('mutation') : mutation;
                            if (mutationEl && mutationEl.getAttribute) {
                                mutationName = mutationEl.getAttribute('name');
                            }
                        }

                        if (mutationName && (mutationName === 'safe' || mutationName === 'place' || mutationName === 'remove')) {
                            procedureName = mutationName;
                            isNQueenHelper = true;
                            console.log(`[blocklyGenerators] ✅ Found N-Queen helper name from mutation (no-return): ${procedureName}`);
                        }
                    }
                } catch (e) {
                    console.warn('Error reading mutation (no-return):', e);
                }
            }

            if (!procedureName) {
                const nameField = block.getField('NAME');
                if (nameField) {
                    const nameFromField = nameField.getValue();
                    if (nameFromField === 'safe' || nameFromField === 'place' || nameFromField === 'remove') {
                        procedureName = nameFromField;
                        isNQueenHelper = true;
                    } else if (nameFromField) {
                        procedureName = nameFromField;
                    }
                }
            }

            if (!procedureName) {
                const nameFromGetFieldValue = block.getFieldValue('NAME');
                if (nameFromGetFieldValue === 'safe' || nameFromGetFieldValue === 'place' || nameFromGetFieldValue === 'remove') {
                    procedureName = nameFromGetFieldValue;
                    isNQueenHelper = true;
                } else if (nameFromGetFieldValue) {
                    procedureName = nameFromGetFieldValue;
                }
            }

            if (!procedureName && !isNQueenHelper && typeof block.getProcParam === 'function') {
                procedureName = block.getProcParam();
            }

            if (procedureName && (procedureName === 'safe' || procedureName === 'place' || procedureName === 'remove')) {
                isNQueenHelper = true;
            }
        } catch (e) {
            console.warn('Error getting procedure name (no-return):', e);
        }

        if (!procedureName || procedureName === 'unnamed' || procedureName === 'undefined' ||
            (typeof procedureName === 'string' && procedureName.trim() === '')) {
            if (!isNQueenHelper) {
                console.warn('Procedure call block has invalid name, trying to fix:', procedureName);

                try {
                    const workspace = block.workspace;
                    if (workspace) {
                        const procedureMap = workspace.getProcedureMap();
                        if (procedureMap) {
                            const procedures = procedureMap.getProcedures();
                            if (procedures.length > 0) {
                                procedureName = procedures[0].getName();
                                console.log('Using first available procedure:', procedureName);
                            } else {
                                console.warn('No procedures available in workspace');
                                return '// Invalid procedure call\n';
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Error trying to fix procedure name:', e);
                    return '// Invalid procedure call\n';
                }
            } else {
                console.log(`[blocklyGenerators] ✅ Allowing N-Queen helper function (no-return, will be injected): ${procedureName}`);
            }

            const finalIsNQueenHelper = procedureName === 'safe' || procedureName === 'place' || procedureName === 'remove';
            if (!finalIsNQueenHelper && (!procedureName || procedureName === 'unnamed' || procedureName === 'undefined' ||
                (typeof procedureName === 'string' && procedureName.trim() === ''))) {
                return '// Invalid procedure call\n';
            }
        }

        // Get arguments
        const args = [];
        if (block.arguments_ && block.arguments_.length > 0) {
            for (let i = 0; i < block.arguments_.length; i++) {
                const argCode = javascriptGenerator.valueToCode(block, 'ARG' + i, javascriptGenerator.ORDER_NONE) || 'null';
                args.push(argCode);
            }
        }

        const argsString = args.length > 0 ? args.join(', ') : '';

        if (procedureName === 'safe' || procedureName === 'place' || procedureName === 'remove') {
            console.log(`[blocklyGenerators] Generating code for ${procedureName}(${argsString}) (no-return)`);
        }

        return `await ${procedureName}(${argsString});\n`;
    };
}
