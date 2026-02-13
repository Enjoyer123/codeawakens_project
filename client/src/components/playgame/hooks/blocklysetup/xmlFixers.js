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

                            }
                        }
                    }
                }
            } catch (e) {
                console.warn('Error extracting parameters from call block:', e);
            }
        });



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

                }

                // Build mutation XML string
                const argXml = params.map(paramName => `    <arg name="${paramName}"></arg>`).join('\n');
                const mutationXml = `\n    <mutation name="${name}">\n${argXml}\n    </mutation>`;

                // Insert mutation after NAME field
                const newBlock = fieldPart + mutationXml;


                return newBlock;
            });
        });



        return result;
    } catch (e) {
        console.error('Error processing XML to add mutations:', e);
        return xmlString; // Return original if error
    }
};


