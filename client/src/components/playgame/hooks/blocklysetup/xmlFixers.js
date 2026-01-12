/**
 * XML and Block Fixer Utilities for Blockly Setup
 */

/**
 * Helper: ensure variables/args have IDs (for malformed starter XML without ids/varids)
 */
export const ensureVariableIds = (xmlString) => {
    if (!xmlString || typeof xmlString !== 'string') return xmlString;
    let counter = 0;
    // Add id to <variable> if missing
    let result = xmlString.replace(/<variable(?![^>]*\sid=")([^>]*)>([^<]+)<\/variable>/g, (_m, attrs, name) => {
        const newId = `auto_var_${counter++}`;
        return `<variable id="${newId}"${attrs}>${name}</variable>`;
    });
    // Add varid to <arg> in mutation if missing
    result = result.replace(/<arg\s+name="([^"]+)"(?![^>]*\svarid=")([^>]*)>/g, (_m, name, attrs) => {
        const newId = `auto_arg_${counter++}_${name}`;
        const extra = attrs && attrs.trim() ? ` ${attrs.trim()}` : '';
        return `<arg name="${name}" varid="${newId}"${extra}>`;
    });
    // Handle self-closing arg without varid
    result = result.replace(/<arg\s+name="([^"]+)"(?![^>]*\svarid=")[^>]*\/>/g, (_m, name) => {
        const newId = `auto_arg_${counter++}_${name}`;
        return `<arg name="${name}" varid="${newId}"></arg>`;
    });
    return result;
};

/**
 * Helper function: Add mutation to procedure definition blocks that don't have it
 * This fixes the issue where starter XML has call blocks with parameters but definition blocks don't
 * Use string manipulation instead of DOM to avoid serialization issues
 */
export const addMutationToProcedureDefinitions = (xmlString) => {
    if (!xmlString) return xmlString;

    try {
        // First, extract parameters from call blocks using regex
        const callBlockRegex = /<block[^>]*type="procedures_call(return|noreturn)"[^>]*>[\s\S]*?<\/block>/g;
        const callBlocks = xmlString.match(callBlockRegex) || [];
        const procedureParams = new Map();

        callBlocks.forEach(callBlockXml => {
            try {
                const nameMatch = callBlockXml.match(/<field name="NAME">([^<]+)<\/field>/);
                const name = nameMatch ? nameMatch[1] : null;

                if (name) {
                    const mutationMatch = callBlockXml.match(/<mutation[^>]*>([\s\S]*?)<\/mutation>/);
                    if (mutationMatch) {
                        const mutationContent = mutationMatch[1];
                        const argsMatch = mutationContent.match(/<arg[^>]*name="([^"]+)"/g);
                        if (argsMatch && argsMatch.length > 0) {
                            const paramNames = argsMatch.map(m => {
                                const nameMatch = m.match(/name="([^"]+)"/);
                                return nameMatch ? nameMatch[1] : null;
                            }).filter(Boolean);
                            if (paramNames.length > 0) {
                                procedureParams.set(name, paramNames);
                                console.log(`🔍 Found parameters for ${name} from call block in XML:`, paramNames);
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn('Error extracting parameters from call block:', e);
            }
        });

        console.log(`🔍 Total procedures with parameters found: ${procedureParams.size}`);

        if (procedureParams.size === 0) {
            return xmlString; // No parameters to add
        }

        // Now find definition blocks and add mutations using string replacement
        let result = xmlString;

        procedureParams.forEach((params, name) => {
            // Find definition block for this procedure
            const defBlockRegex = new RegExp(
                `(<block[^>]*type="procedures_def(return|noreturn)"[^>]*>\\s*<field name="NAME">${name}<\\/field>)`,
                'g'
            );

            result = result.replace(defBlockRegex, (match, fieldPart) => {
                // Check if mutation already exists
                if (match.includes('<mutation')) {
                    console.log(`⚠️ Function ${name} already has mutation, skipping`);
                    return match;
                }

                // Build mutation XML string
                const argXml = params.map(paramName => `    <arg name="${paramName}"></arg>`).join('\n');
                const mutationXml = `\n    <mutation name="${name}">\n${argXml}\n    </mutation>`;

                // Insert mutation after NAME field
                const newBlock = fieldPart + mutationXml;
                console.log(`✅ Added mutation to function definition ${name} with ${params.length} params:`, params);

                return newBlock;
            });
        });

        // Verify mutations were added
        console.log('🔍 Checking processed XML for mutations...');
        const defBlocksAfter = result.match(/<block[^>]*type="procedures_def(return|noreturn)"[^>]*>[\s\S]*?<\/block>/g);
        if (defBlocksAfter) {
            defBlocksAfter.forEach(blockXml => {
                const hasMutation = blockXml.includes('<mutation');
                const nameMatch = blockXml.match(/<field name="NAME">([^<]+)<\/field>/);
                const name = nameMatch ? nameMatch[1] : 'unknown';
                if (hasMutation) {
                    const mutationMatch = blockXml.match(/<mutation[^>]*>([\s\S]*?)<\/mutation>/);
                    if (mutationMatch) {
                        const mutationContent = mutationMatch[1];
                        const argsMatch = mutationContent.match(/<arg[^>]*name="([^"]+)"/g);
                        const paramNames = argsMatch ? argsMatch.map(m => {
                            const nameMatch = m.match(/name="([^"]+)"/);
                            return nameMatch ? nameMatch[1] : null;
                        }).filter(Boolean) : [];
                        console.log(`✅ Function ${name} in processed XML has mutation with ${paramNames.length} params:`, paramNames);
                    }
                } else {
                    console.log(`❌ Function ${name} in processed XML has NO mutation`);
                }
            });
        }

        return result;
    } catch (e) {
        console.error('Error processing XML to add mutations:', e);
        return xmlString; // Return original if error
    }
};

/**
 * CRITICAL: Fix procedure call blocks immediately after loading starter XML
 * This prevents Blockly from auto-creating new procedure definitions with wrong names
 * Use multiple attempts with increasing delays to catch all cases
 */
export const fixCallBlocks = (workspace, setCurrentHint, attempt = 1, maxAttempts = 3) => {
    setTimeout(() => {
        try {
            const definitionBlocks = workspace.getBlocksByType('procedures_defreturn', false)
                .concat(workspace.getBlocksByType('procedures_defnoreturn', false));

            const callBlocks = workspace.getBlocksByType('procedures_callreturn', false)
                .concat(workspace.getBlocksByType('procedures_callnoreturn', false));

            // CRITICAL: Extract parameters from call blocks to add to definition blocks
            // This fixes the issue where starter XML has call blocks with parameters but definition blocks don't
            const procedureParams = new Map(); // procedureName -> array of parameter names
            callBlocks.forEach(callBlock => {
                try {
                    const callName = callBlock.getFieldValue('NAME');
                    if (callName && callName !== 'unnamed' && callName !== 'undefined') {
                        // Get parameters from call block's mutation
                        const mutation = callBlock.mutationToDom ? callBlock.mutationToDom() : null;
                        if (mutation) {
                            const args = mutation.querySelectorAll('arg');
                            const paramNames = Array.from(args).map(arg => arg.getAttribute('name')).filter(Boolean);
                            if (paramNames.length > 0) {
                                procedureParams.set(callName, paramNames);
                                console.log(`🔍 Found parameters for ${callName} from call block:`, paramNames);
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Error extracting parameters from call block:', e);
                }
            });

            // Get valid procedure names from definitions
            const validProcedureNames = new Set();
            definitionBlocks.forEach(defBlock => {
                try {
                    const name = defBlock.getFieldValue('NAME');
                    if (name && name !== 'unnamed' && name !== 'undefined' && name.trim() !== '') {
                        validProcedureNames.add(name);

                        // CRITICAL: Check if function definition has parameters
                        // Priority: Use parameters from call blocks if available, otherwise check function body
                        const vars = defBlock.getVars();
                        console.log(`🔍 Function ${name} has ${vars.length} parameters:`, vars);

                        let paramsToAdd = [];

                        // First, try to get parameters from call blocks
                        if (procedureParams.has(name)) {
                            paramsToAdd = procedureParams.get(name);
                            console.log(`🔍 Found parameters for ${name} from call blocks:`, paramsToAdd);
                        } else if (vars.length === 0) {
                            // If no parameters from call blocks, check function body
                            const allBlocks = defBlock.getDescendants(false);
                            const usedVars = new Set();

                            allBlocks.forEach(block => {
                                try {
                                    // Check for variables_get blocks
                                    if (block.type === 'variables_get') {
                                        const varName = block.getFieldValue('VAR');
                                        if (varName && ['start', 'goal', 'garph', 'graph'].includes(varName)) {
                                            usedVars.add(varName);
                                        }
                                    }
                                } catch (e) {
                                    // Ignore errors
                                }
                            });

                            if (usedVars.size > 0) {
                                // Add parameters to function definition
                                // Order: garph/graph, start, goal
                                if (usedVars.has('garph') || usedVars.has('graph')) {
                                    paramsToAdd.push('garph');
                                }
                                if (usedVars.has('start')) {
                                    paramsToAdd.push('start');
                                }
                                if (usedVars.has('goal')) {
                                    paramsToAdd.push('goal');
                                }
                                console.log(`🔍 Function ${name} uses variables but has no parameters:`, Array.from(usedVars));
                            }
                        }

                        // Add parameters if needed
                        if (paramsToAdd.length > 0 && vars.length === 0) {
                            console.log(`🔧 Adding parameters to function ${name}:`, paramsToAdd);

                            // Add parameters using Blockly's mutation API
                            try {
                                // Get current mutation or create new one
                                let mutation = null;
                                if (defBlock.mutationToDom) {
                                    mutation = defBlock.mutationToDom();
                                }

                                // Create new mutation if needed
                                if (!mutation) {
                                    const parser = new DOMParser();
                                    mutation = parser.parseFromString(`<mutation name="${name}"></mutation>`, 'text/xml').documentElement;
                                } else {
                                    // Update name in existing mutation
                                    mutation.setAttribute('name', name);
                                }

                                // Remove existing arg elements
                                const existingArgs = mutation.querySelectorAll('arg');
                                existingArgs.forEach(arg => arg.remove());

                                // Add new arg elements for each parameter
                                paramsToAdd.forEach(paramName => {
                                    const arg = mutation.ownerDocument.createElement('arg');
                                    arg.setAttribute('name', paramName);
                                    mutation.appendChild(arg);
                                });

                                // Apply mutation to block
                                if (defBlock.domToMutation) {
                                    defBlock.domToMutation(mutation);
                                }

                                // Update function shape
                                if (defBlock.updateShape_) {
                                    defBlock.updateShape_();
                                }

                                console.log(`✅ Added parameters to function ${name}:`, paramsToAdd);
                                console.log(`✅ Function ${name} now has ${defBlock.getVars().length} parameters:`, defBlock.getVars());
                            } catch (e) {
                                console.error(`Error adding parameters to function ${name}:`, e);
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Error processing definition block:', e);
                }
            });

            console.log(`🔧 Fixing call blocks after starter XML load (attempt ${attempt}):`, {
                validProcedures: Array.from(validProcedureNames),
                callBlocksCount: callBlocks.length,
                definitionNames: definitionBlocks.map(b => {
                    try {
                        return b.getFieldValue('NAME');
                    } catch (e) {
                        return 'error';
                    }
                }),
                callBlockNames: callBlocks.map(b => {
                    try {
                        return b.getFieldValue('NAME');
                    } catch (e) {
                        return 'error';
                    }
                })
            });

            let fixedCount = 0;

            // Fix each call block to use a valid procedure name
            callBlocks.forEach(callBlock => {
                try {
                    const nameField = callBlock.getField('NAME');
                    if (nameField) {
                        const currentName = nameField.getValue();

                        // If call block name doesn't match any definition, fix it
                        if (!validProcedureNames.has(currentName)) {
                            if (validProcedureNames.size > 0) {
                                // Check if it's a numbered variant (e.g., DFS2, DFS3) of a valid procedure
                                const isNumberedVariant = Array.from(validProcedureNames).some(validName => {
                                    const baseName = validName.replace(/\d+$/, '');
                                    const currentBaseName = currentName.replace(/\d+$/, '');
                                    return baseName === currentBaseName && currentName !== validName;
                                });

                                if (isNumberedVariant) {
                                    // Find the matching base procedure
                                    const matchingProcedure = Array.from(validProcedureNames).find(validName => {
                                        const baseName = validName.replace(/\d+$/, '');
                                        const currentBaseName = currentName.replace(/\d+$/, '');
                                        return baseName === currentBaseName;
                                    });

                                    if (matchingProcedure) {
                                        nameField.setValue(matchingProcedure);
                                        console.log(`✅ Fixed call block (numbered variant): "${currentName}" -> "${matchingProcedure}"`);
                                        fixedCount++;
                                    }
                                } else {
                                    // Use the first valid procedure name (should be "DFS" from starter XML)
                                    const firstValidName = Array.from(validProcedureNames)[0];
                                    nameField.setValue(firstValidName);
                                    console.log(`✅ Fixed call block: "${currentName}" -> "${firstValidName}"`);
                                    fixedCount++;
                                }
                            }
                        } else {
                            console.log(`✅ Call block already uses correct name: "${currentName}"`);
                        }
                    }
                } catch (e) {
                    console.warn('Error fixing call block:', e);
                }
            });

            // Remove any auto-created procedure definitions that don't match valid names
            definitionBlocks.forEach(defBlock => {
                try {
                    const defName = defBlock.getFieldValue('NAME');
                    if (defName && !validProcedureNames.has(defName)) {
                        // This definition doesn't match any call block - it was likely auto-created
                        // Check if it's a numbered variant (e.g., DFS2, DFS3) of a valid procedure
                        const isNumberedVariant = Array.from(validProcedureNames).some(validName => {
                            const baseName = validName.replace(/\d+$/, '');
                            const defBaseName = defName.replace(/\d+$/, '');
                            return baseName === defBaseName && defName !== validName;
                        });

                        if (isNumberedVariant) {
                            console.log(`🗑️ Removing auto-created numbered variant: "${defName}"`);
                            if (!defBlock.isDisposed()) {
                                defBlock.dispose(false);
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Error checking definition block:', e);
                }
            });

            // If we fixed blocks or this is the first attempt, try again with longer delay
            if (fixedCount > 0 && attempt < maxAttempts) {
                console.log(`🔄 Fixed ${fixedCount} call blocks, retrying in case more need fixing...`);
                fixCallBlocks(workspace, setCurrentHint, attempt + 1, maxAttempts);
            }
        } catch (e) {
            console.warn('Error fixing call blocks after starter XML:', e);
        }
    }, attempt === 1 ? 100 : attempt * 200); // Increasing delays: 100ms, 400ms, 600ms
};
