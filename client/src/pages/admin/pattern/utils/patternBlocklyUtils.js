
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
// Helper function: Add mutation to procedure definition blocks AND fix call blocks
// This fixes:
// 1. Definition blocks missing parameters (which call blocks have)
// 2. Call blocks missing NAME field (but having mutation name)
export const addMutationToProcedureDefinitions = (xmlString) => {
    if (!xmlString) return xmlString;

    let result = xmlString;

    try {
        // --- STEP 1: Fix Call Blocks (Sync NAME field from mutation) ---
        // Some saved XML might have <mutation name="DFS"> but missing <field name="NAME">DFS</field>
        // This causes the call block to be "unnamed" and subsequently deleted or duplicated
        const callTypeRegex = /<block[^>]*type="procedures_call(return|noreturn)"[^>]*>([\s\S]*?)<\/block>/g;

        result = result.replace(callTypeRegex, (fullBlock, typeSuffix, content) => {
            // Check for mutation name
            const mutationMatch = content.match(/<mutation[^>]*name="([^"]+)"/);
            if (!mutationMatch) return fullBlock; // No mutation name, can't fix

            const mutationName = mutationMatch[1];

            // Check if NAME field exists
            const nameFieldMatch = content.match(/<field name="NAME">([^<]+)<\/field>/);

            if (!nameFieldMatch) {
                // Missing NAME field! Insert it.
                // Insert after mutation if possible, or at start of content
                if (content.includes('</mutation>')) {
                    return fullBlock.replace('</mutation>', `</mutation><field name="NAME">${mutationName}</field>`);
                } else {
                    // Fallback injection (should typically have mutation closing tag though)
                    return fullBlock.replace(content, `<mutation name="${mutationName}"></mutation><field name="NAME">${mutationName}</field>` + content.replace(/<mutation[^>]*>[\s\S]*?<\/mutation>/, ''));
                }
            } else if (nameFieldMatch[1] !== mutationName) {
                // Name mismatch! Fix it to match mutation (Mutation is source of truth usually)
                return fullBlock.replace(nameFieldMatch[0], `<field name="NAME">${mutationName}</field>`);
            }

            return fullBlock;
        });


        // --- STEP 2: Extract params from Call Blocks to fix Definition Blocks ---
        // Re-scan the potentially fixed result
        const callBlockRegex2 = /<block[^>]*type="procedures_call(return|noreturn)"[^>]*>[\s\S]*?<\/block>/g;
        const callBlocks = result.match(callBlockRegex2) || [];
        const procedureParams = new Map();

        callBlocks.forEach(callBlockXml => {
            try {
                // Try from mutation first (more reliable)
                const mutationMatch = callBlockXml.match(/<mutation[^>]*name="([^"]+)"([\s\S]*?)<\/mutation>/);
                let name = null;
                let paramNames = [];

                if (mutationMatch) {
                    name = mutationMatch[1];
                    const mutationContent = mutationMatch[2] || '';
                    const argsMatch = mutationContent.match(/<arg[^>]*name="([^"]+)"/g);
                    if (argsMatch && argsMatch.length > 0) {
                        paramNames = argsMatch.map(m => {
                            const nm = m.match(/name="([^"]+)"/);
                            return nm ? nm[1] : null;
                        }).filter(Boolean);
                    }
                } else {
                    // Fallback to field name
                    const nameMatch = callBlockXml.match(/<field name="NAME">([^<]+)<\/field>/);
                    name = nameMatch ? nameMatch[1] : null;
                }

                if (name && paramNames.length > 0) {
                    procedureParams.set(name, paramNames);
                }
            } catch (e) { }
        });

        if (procedureParams.size === 0) {
            return result;
        }

        // --- STEP 3: Fix Definition Blocks (Add missing params) ---
        procedureParams.forEach((params, name) => {
            // Find definition block for this procedure
            const defBlockRegex = new RegExp(
                `(<block[^>]*type="procedures_def(return|noreturn)"[^>]*>)([\\s\\S]*?)(<\\/block>)`,
                'g'
            );

            result = result.replace(defBlockRegex, (match, openTag, content, closeTag) => {
                // Check if this is the right procedure
                // Need to find the name in the content
                const nameMatch = content.match(/<field name="NAME">([^<]+)<\/field>/);
                if (!nameMatch || nameMatch[1] !== name) {
                    return match;
                }

                // Check if mutation already exists
                if (content.includes('<mutation')) {
                    // Update existing mutation if needed? For now, assume if mutation exists, it's correct-ish
                    // Or we could enforce params? Let's leave it to avoid overwriting intentional edits
                    return match;
                }

                // Build mutation XML string
                const argXml = params.map(paramName => `    <arg name="${paramName}"></arg>`).join('\n');
                const mutationXml = `\n    <mutation name="${name}">\n${argXml}\n    </mutation>`;

                // Insert mutation before the fields or comments
                // Usually just after openTag is safe-ish if we reconstruct, but 'content' is the inner part
                // Let's prepend to content
                return openTag + mutationXml + content + closeTag;
            });
        });

        return result;
    } catch (e) {
        console.error("Error in addMutationToProcedureDefinitions:", e);
        return xmlString; // Return original if error
    }
};
