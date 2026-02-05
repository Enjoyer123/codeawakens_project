
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

    console.log("🛠️ [patternBlocklyUtils] Processing XML length:", xmlString.length);

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
                    // If no mutation tag end found, append to start of content (risky but rare)
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

        // --- STEP 3: Fix Definition Blocks (Add missing params) ---
        if (procedureParams.size > 0) {
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
                        return match;
                    }

                    // Build mutation XML string
                    const argXml = params.map(paramName => `    <arg name="${paramName}"></arg>`).join('\n');
                    const mutationXml = `\n    <mutation name="${name}">\n${argXml}\n    </mutation>`;

                    return openTag + mutationXml + content + closeTag;
                });
            });
        }

        // --- STEP 3.5: Unify Numbered Variants ---
        // Identify procedures like "solve2", "solve3" and rename them to "solve" if "solve" is the intended base.
        // 1. Gather all procedure names (Definitions AND Calls)
        const allKeys = new Set();

        // Scan definitions
        const defBlockRegexGather = /<block[^>]*type="procedures_def(return|noreturn)"[^>]*>[\s\S]*?<field name="NAME">([^<]+)<\/field>/g;
        let match;
        while ((match = defBlockRegexGather.exec(result)) !== null) {
            if (match[2]) allKeys.add(match[2].trim());
        }

        // Scan calls (Field NAME)
        const callBlockRegexGather = /<block[^>]*type="procedures_call(return|noreturn)"[^>]*>[\s\S]*?<field name="NAME">([^<]+)<\/field>/g;
        while ((match = callBlockRegexGather.exec(result)) !== null) {
            if (match[2]) allKeys.add(match[2].trim());
        }

        // Scan calls (Mutation name - mostly reliable source of truth)
        const callMutationRegexGather = /<mutation[^>]*name="([^"]+)"/g;
        while ((match = callMutationRegexGather.exec(result)) !== null) {
            if (match[1]) allKeys.add(match[1].trim());
        }

        const allKeysArray = Array.from(allKeys);

        // 2. Identify variants
        const baseNames = new Set();
        allKeysArray.forEach(name => {
            if (!name.match(/\d+$/)) {
                baseNames.add(name);
            }
        });

        const replacements = new Map();

        allKeysArray.forEach(name => {
            const variantMatch = name.match(/^(.+?)(\d+)$/);
            if (variantMatch) {
                const baseName = variantMatch[1].trim();
                // Only rename if baseName exists in our set OR if baseName is 'solve' (hardcoded heuristic for N-Queen/Common levels)
                if (baseNames.has(baseName) || baseName === 'solve') {
                    replacements.set(name, baseName);
                }
            }
        });

        // 3. Apply replacements Globally (Mutations and NAME fields)
        if (replacements.size > 0) {
            console.log("🔄 Unifying numbered variants:", Object.fromEntries(replacements));
            replacements.forEach((newName, oldName) => {
                // Replace field NAME (handle potential whitespace in XML)
                const fieldRegex = new RegExp(`<field name="NAME">\\s*${oldName}\\s*<\\/field>`, 'g');
                result = result.replace(fieldRegex, `<field name="NAME">${newName}</field>`);

                // Replace mutation name
                const mutationRegex = new RegExp(`name="\\s*${oldName}\\s*"`, 'g');
                result = result.replace(mutationRegex, `name="${newName}"`);
            });
        }

        // --- STEP 4: Deduplicate Definitions ---
        // If the XML contains multiple definitions for the same name, keep only the first one
        const defBlockRegex2 = /<block[^>]*type="procedures_def(return|noreturn)"[^>]*>[\s\S]*?<\/block>/g;
        const seenDefs = new Set();
        result = result.replace(defBlockRegex2, (fullBlock) => {
            const nameMatch = fullBlock.match(/<field name="NAME">([^<]+)<\/field>/);
            const name = nameMatch ? nameMatch[1] : null;

            if (name) {
                if (seenDefs.has(name)) {
                    console.log(`🗑️ Removing duplicate definition for: ${name}`);
                    return ''; // Remove duplicate
                }
                seenDefs.add(name);
            }
            return fullBlock;
        });

        return result;
    } catch (e) {
        console.error("Error in addMutationToProcedureDefinitions (PatternUtils):", e);
        return xmlString; // Return original if error
    }
};

export const fixWorkspaceProcedures = (workspace) => {
    if (!workspace) return;

    setTimeout(() => {
        try {
            console.log("🛠️ Running Smart Merge Procedure Fixer...");

            // 1. หาและจัดกลุ่ม Definition Blocks
            const defBlocks = workspace.getBlocksByType('procedures_defreturn', false)
                .concat(workspace.getBlocksByType('procedures_defnoreturn', false));

            const groups = {};
            defBlocks.forEach(block => {
                const name = block.getFieldValue('NAME');
                const baseName = name.replace(/\d+$/, ''); // solve1 -> solve
                if (!groups[baseName]) groups[baseName] = [];
                groups[baseName].push({ name, block });
            });

            // 2. จัดการทีละกลุ่ม
            Object.keys(groups).forEach(baseName => {
                const variants = groups[baseName];
                if (variants.length <= 1) return;

                // 2.1 หา Winner (ตัวที่มี Code เยอะสุด เก็บไว้เป็นตัวหลัก)
                variants.sort((a, b) => {
                    return b.block.getDescendants(false).length - a.block.getDescendants(false).length;
                });
                const winner = variants[0];
                const losers = variants.slice(1);
                const winnerCurrentName = winner.name;

                // 2.2 [NEW] หาตัวที่มี Argument ครบที่สุด (Best Signature)
                // เพื่อแก้ปัญหาตัวหลักมี Arg ไม่ครบ (เช่น มีแค่ row แต่ตัวที่กำลังจะลบมี row, col)
                let bestSigBlock = winner.block;
                let maxArgs = (winner.block.arguments_ || []).length;

                variants.forEach(v => {
                    const args = v.block.arguments_ || [];
                    if (args.length > maxArgs) {
                        maxArgs = args.length;
                        bestSigBlock = v.block;
                    }
                });

                // ถ้าพบว่ามีตัวอื่นที่มี Argument เยอะกว่าตัว Winner -> ให้ก๊อปปี้ Argument มาใส่ Winner
                if (bestSigBlock !== winner.block) {
                    console.log(`✨ Syncing arguments from "${bestSigBlock.getFieldValue('NAME')}" to "${winnerCurrentName}"`);
                    if (bestSigBlock.mutationToDom && winner.block.domToMutation) {
                        const bestMutation = bestSigBlock.mutationToDom();
                        // สำคัญ: ต้องคงชื่อเดิมของ Winner ไว้ก่อน (เดี๋ยวค่อยเปลี่ยนชื่อทีหลัง)
                        bestMutation.setAttribute('name', winnerCurrentName);
                        winner.block.domToMutation(bestMutation);
                    }
                }

                console.log(`🔍 Merging "${baseName}": Keep "${winnerCurrentName}" (${maxArgs} args)`);

                // 3. ย้าย Call Blocks ไปหา Winner (พร้อม Sync Argument ล่าสุด)
                const allCallBlocks = workspace.getBlocksByType('procedures_callreturn', false)
                    .concat(workspace.getBlocksByType('procedures_callnoreturn', false));

                allCallBlocks.forEach(callBlock => {
                    const currentCallName = callBlock.getFieldValue('NAME');
                    // เช็คว่ากำลังเรียกตัวที่กำลังจะโดนลบหรือไม่
                    const isCallingLoser = losers.some(l => l.name === currentCallName);

                    if (isCallingLoser) {
                        // เปลี่ยนชื่อให้ไปเรียก Winner
                        callBlock.setFieldValue(winnerCurrentName, 'NAME');

                        // Sync Mutation จาก Winner (ซึ่งตอนนี้มี Arg ครบแล้ว) มาใส่บล็อกเรียก
                        if (callBlock.mutationToDom && winner.block.mutationToDom) {
                            const defMutation = winner.block.mutationToDom();
                            const callMutation = document.createElement('mutation');
                            callMutation.setAttribute('name', winnerCurrentName);

                            // Copy <arg> tags
                            Array.from(defMutation.children).forEach(child => {
                                if (child.tagName.toLowerCase() === 'arg') {
                                    callMutation.appendChild(child.cloneNode(true));
                                }
                            });

                            callBlock.domToMutation(callMutation);
                        }
                    }
                });

                // 4. ลบ Losers ทิ้ง
                losers.forEach(loser => {
                    if (!loser.block.isDisposed()) {
                        loser.block.dispose(false);
                    }
                });

                // 5. เปลี่ยนชื่อ Winner กลับเป็นชื่อฐาน (เช่น solve1 -> solve)
                // ขั้นตอนนี้ Blockly จะอัปเดตชื่อใน Call Blocks ที่เชื่อมอยู่ให้อัตโนมัติ
                if (winnerCurrentName !== baseName) {
                    winner.block.setFieldValue(baseName, 'NAME');
                }
            });

        } catch (e) {
            console.warn('Error in fixWorkspaceProcedures:', e);
        }
    }, 150);
};