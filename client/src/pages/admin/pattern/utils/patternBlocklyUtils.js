
// Helper function: Remove variable IDs and variable elements from XML to prevent conflicts
export const removeVariableIdsFromXml = (xmlString) => {
    if (!xmlString) return xmlString;
    // Remove all variable id attributes from XML (ทั้ง varid และ id ใน variable elements)
    let cleaned = xmlString.replace(/varid="[^"]*"/g, '');
    // Also remove id attributes from <variable> elements
    cleaned = cleaned.replace(/<variable[^>]*\sid="[^"]*"[^>]*>/g, (match) => {
        return match.replace(/\sid="[^"]*"/g, '');
    });
    // Remove entire <variables> section to let Blockly reuse existing variables
    cleaned = cleaned.replace(/<variables>[\s\S]*?<\/variables>/g, '');
    return cleaned;
};

// Helper function: Add mutation to procedure definition blocks that don't have it
// This fixes the issue where starter XML has call blocks with parameters but definition blocks don't
// Use string manipulation instead of DOM to avoid serialization issues
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
                    return match;
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
        return xmlString; // Return original if error
    }
};
