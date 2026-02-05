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
export const fixCallBlocks = (workspace, setCurrentHint, attempt = 1, maxAttempts = 5) => {
    // ใช้ Delay เพื่อรอให้ XML Load เข้า Workspace จนเสร็จสมบูรณ์จริงๆ
    setTimeout(() => {
        try {
            // 1. รวบรวม Definition Blocks ทั้งหมด
            const defBlocks = workspace.getBlocksByType('procedures_defreturn', false)
                .concat(workspace.getBlocksByType('procedures_defnoreturn', false));

            // 2. จัดกลุ่มตาม "ชื่อฐาน" (Base Name) เช่น solve, solve1, solve2 -> กลุ่ม "solve"
            const groups = {};
            defBlocks.forEach(block => {
                const name = block.getFieldValue('NAME');
                const baseName = name.replace(/\d+$/, ''); // ตัดเลขท้ายออก
                if (!groups[baseName]) groups[baseName] = [];
                groups[baseName].push({ name, block });
            });

            let fixedCount = 0;

            // 3. จัดการแต่ละกลุ่ม
            Object.keys(groups).forEach(baseName => {
                const variants = groups[baseName];
                if (variants.length <= 1) return; // ถ้ามีตัวเดียวก็ไม่ต้องทำอะไร

                // --- หาตัวจริง (Winner) vs ตัวปลอม (Losers) ---
                // ตัวจริงคือตัวที่มีบล็อกลูกหลาน (Descendants) เยอะที่สุด คือมี Logic ข้างใน
                variants.sort((a, b) => {
                    const countA = a.block.getDescendants(false).length;
                    const countB = b.block.getDescendants(false).length;
                    return countB - countA; // มากไปน้อย
                });

                const winner = variants[0];
                const losers = variants.slice(1);

                console.log(`🔍 Checking group "${baseName}": Winner=${winner.name} (${winner.block.getDescendants().length} blocks), Losers=${losers.map(l => l.name)}`);

                // 4. ขั้นตอนการสลับชื่อ (Rename Logic)
                // เราต้องการให้ Winner ได้ชื่อที่เป็น Base Name (เช่น "solve")

                // ขั้นแรก: เปลี่ยนชื่อพวก Losers หนีไปก่อน เพื่อไม่ให้ชื่อชนกันตอนเราแก้ Winner
                losers.forEach((loser, index) => {
                    const tempName = `__trash_${baseName}_${index}`;
                    loser.block.setFieldValue(tempName, 'NAME');
                });

                // ขั้นสอง: เปลี่ยนชื่อ Winner เป็นชื่อที่ถูกต้อง (Base Name)
                if (winner.name !== baseName) {
                    winner.block.setFieldValue(baseName, 'NAME');
                    console.log(`✅ Renamed main logic block from "${winner.name}" to "${baseName}"`);
                    fixedCount++;
                }

                // ขั้นสาม: ตามแก้ Call Blocks ทั้งหมดให้ชี้มาที่ Base Name
                const callBlocks = workspace.getBlocksByType('procedures_callreturn', false)
                    .concat(workspace.getBlocksByType('procedures_callnoreturn', false));

                callBlocks.forEach(callBlock => {
                    const callName = callBlock.getFieldValue('NAME');
                    // ถ้า Call Block เรียกชื่อเก่าของ Winner หรือเรียกชื่อของ Losers
                    // ให้เปลี่ยนมาเรียก Base Name
                    const isCallingVariant = variants.some(v => v.name === callName);

                    if (isCallingVariant && callName !== baseName) {
                        callBlock.setFieldValue(baseName, 'NAME');
                        // สำคัญ: อัปเดต mutation name เพื่อกันมันเด้งกลับ
                        if (callBlock.mutationToDom) {
                            const mutation = callBlock.mutationToDom();
                            mutation.setAttribute('name', baseName);
                            callBlock.domToMutation(mutation);
                        }
                    }
                });

                // ขั้นสี่: ลบ Losers ทิ้ง
                losers.forEach(loser => {
                    if (!loser.block.isDisposed()) {
                        loser.block.dispose(false); // false = ไม่ต้องฮีลแผล (ลบเลย)
                    }
                });
            });

            // Retry ถ้ายังมีความผิดปกติเหลืออยู่
            if (fixedCount > 0 && attempt < maxAttempts) {
                fixCallBlocks(workspace, setCurrentHint, attempt + 1, maxAttempts);
            }

        } catch (e) {
            console.warn('Error fixing call blocks:', e);
        }
    }, attempt === 1 ? 200 : attempt * 300); // เพิ่ม Delay รอบแรกนิดหน่อยเพื่อให้มั่นใจว่าโหลดบล็อกครบแล้ว
};
