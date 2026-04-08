// ─── Pseudocode Line Matcher ─────────────────────────────────────
//
// ใช้สำหรับ Hybrid Pseudocode Hint System
// เมื่อ User คลิก block ใน Workspace → หาบรรทัด pseudocode ที่ตรงกัน
// scope จำกัดแค่ "active step" เพื่อแก้ปัญหา blockType ซ้ำ
// ─── Floating Block → Missing Slot Matching ─────────────────────
/**
 * เปรียบเทียบ target analysis (เฉลย) กับ main tree blocks (workspace ปัจจุบัน)
 * เพื่อหาว่า block ไหนยังขาดอยู่ (missing slots)
 *
 * ใช้ Greedy Subsequence: scan target ตามลำดับ จับคู่กับ main blocks
 * ตัวที่จับคู่ไม่ได้ = missing → floating block ต้องต่อตรงนั้น
 */
function findMissingSlots(targetAnalysis, mainTreeBlocks) {
    if (!targetAnalysis?.length) return [];
    if (!mainTreeBlocks?.length) {
        return targetAnalysis.map(t => ({
            targetIndex: t.index, type: t.type, varName: t.varName,
        }));
    }

    const targetMatched = new Array(targetAnalysis.length).fill(false);
    const mainUsed = new Array(mainTreeBlocks.length).fill(false);

    // Pass 1: Strict Match (Type + VarName + AncestorStr)
    // การจับคู่แบบเป๊ะๆ รวมถึงสายตระกูล เพื่อป้องกันการจับคู่ผิดตำแหน่ง (Mismatch)
    let mi = 0;
    for (let ti = 0; ti < targetAnalysis.length; ti++) {
        const target = targetAnalysis[ti];
        for (let j = mi; j < mainTreeBlocks.length; j++) {
            if (!mainUsed[j] &&
                mainTreeBlocks[j].type === target.type &&
                (target.varName === undefined || mainTreeBlocks[j].varName === target.varName) &&
                (!target.ancestorStr || mainTreeBlocks[j].ancestorStr === target.ancestorStr)) {
                targetMatched[ti] = true;
                mainUsed[j] = true;
                mi = j + 1;
                break;
            }
        }
    }

    // Pass 2: Loose Match (Type + VarName)
    // กวาดเก็บตกบล็อกที่อาจจะอยู่ผิดที่ผิดทาง (ไม่มีสายตระกูลตรง) เพื่อให้ไม่เห็นว่าขาด
    mi = 0;
    for (let ti = 0; ti < targetAnalysis.length; ti++) {
        if (targetMatched[ti]) continue;
        const target = targetAnalysis[ti];
        for (let j = mi; j < mainTreeBlocks.length; j++) {
            if (!mainUsed[j] &&
                mainTreeBlocks[j].type === target.type &&
                (target.varName === undefined || mainTreeBlocks[j].varName === target.varName)) {
                targetMatched[ti] = true;
                mainUsed[j] = true;
                mi = j + 1;
                break;
            }
        }
    }

    return targetAnalysis
        .filter((_, i) => !targetMatched[i])
        .map(t => ({ targetIndex: t.index, type: t.type, varName: t.varName }));
}

/**
 * หา blockId ของ parent block บน workspace ที่ floating block ควรไปต่อ
 * ใช้เพื่อ highlight ให้ user เห็นว่า "ต้องเอาไปเสียบตรงนี้"
 *
 * @returns {string|null} workspace block ID ของ parent ที่ต้อง highlight
 */
export function findFloatingHintBlockId(targetAnalysis, mainTreeBlocks, floatingType, floatingVarName, floatingOcc) {
    if (!targetAnalysis?.length || !mainTreeBlocks?.length) return null;

    // สร้างทั้ง mapping (target→main) และหา missing ในรอบเดียว (Two-Pass เหมือน findMissingSlots)
    const targetMatched = new Array(targetAnalysis.length).fill(-1);
    const mainUsed = new Array(mainTreeBlocks.length).fill(false);

    let mi = 0;
    for (let ti = 0; ti < targetAnalysis.length; ti++) {
        const t = targetAnalysis[ti];
        for (let j = mi; j < mainTreeBlocks.length; j++) {
            if (!mainUsed[j] && mainTreeBlocks[j].type === t.type &&
                (t.varName === undefined || mainTreeBlocks[j].varName === t.varName) &&
                (!t.ancestorStr || mainTreeBlocks[j].ancestorStr === t.ancestorStr)) {
                targetMatched[ti] = j; mainUsed[j] = true; mi = j + 1; break;
            }
        }
    }
    mi = 0;
    for (let ti = 0; ti < targetAnalysis.length; ti++) {
        if (targetMatched[ti] >= 0) continue;
        const t = targetAnalysis[ti];
        for (let j = mi; j < mainTreeBlocks.length; j++) {
            if (!mainUsed[j] && mainTreeBlocks[j].type === t.type &&
                (t.varName === undefined || mainTreeBlocks[j].varName === t.varName)) {
                targetMatched[ti] = j; mainUsed[j] = true; mi = j + 1; break;
            }
        }
    }

    // หา missing slot ของ type+varName เดียวกันกับ floating block
    const missingIndices = [];
    for (let ti = 0; ti < targetAnalysis.length; ti++) {
        if (targetMatched[ti] >= 0) continue;
        const t = targetAnalysis[ti];
        if (t.type === floatingType && (floatingVarName ? t.varName === floatingVarName : !t.varName)) {
            missingIndices.push(ti);
        }
    }

    const targetArrayIdx = missingIndices[floatingOcc ?? 0];
    if (targetArrayIdx === undefined) return null;

    // เดินย้อนขึ้นไปหา ancestor ที่ใกล้ที่สุดที่ "มีอยู่บนกระดาน" (matched)
    const missingDepth = targetAnalysis[targetArrayIdx].depth;
    for (let i = targetArrayIdx - 1; i >= 0; i--) {
        if (targetAnalysis[i].depth < missingDepth && targetMatched[i] >= 0) {
            return mainTreeBlocks[targetMatched[i]].id;
        }
    }
    return null;
}

/**
 * หา pseudocode line ที่ blockType ตรงกัน โดยใช้ข้อมูลลำดับ occurrence ป้องกันการ highlight ผิด (เช่น for ซ้อน for)
 *
 * @param {Object | string} selectedData - ข้อมูลบล็อกที่เลือก { type, occurrence } หรือ 'string' เปล่าๆ
 * @param {Array} allLines - flat array ของทุกบรรทัด pseudocode ที่เจนจาก buildPseudocodeLines
 * @param {Object|null} context - optional context { targetAnalysis } สำหรับ floating block matching
 * @returns {Object | null} - data ของบรรทัดนั้น เช่น { stepIndex, lineIndex, text, ... }
 */
export function findPseudocodeLine(selectedData, allLines, context = null) {
    if (!selectedData || !allLines?.length) return null;

    const isString = typeof selectedData === 'string';
    const type = isString ? selectedData : selectedData.type;
    const typeOcc = isString ? undefined : (selectedData.typeOcc ?? selectedData.occurrence);
    const varName = isString ? undefined : selectedData.varName;
    const varOcc = isString ? undefined : selectedData.varOcc;
    const ancestorStr = isString ? undefined : selectedData.ancestorStr;

    // ─── ABSOLUTE MATCH: Exact Block ID ──────────────────────────
    // ถ้า block ใน workspace ปัจจุบัน มี ID ตรงกับ block ในเฉลย (Pattern) 
    // หรือถ้าเป็นก้อนที่ถูก Auto-Fill เราก็แอบยัด ID เดิมไว้ใน block.data แล้ว!
    // ⚠️ แต่ถ้าผู้เล่นย้าย block ไปต่อไว้ที่อื่น (ancestorStr เปลี่ยน) → ให้ข้าม Exact Match
    // เพื่อให้ Structural Match ทำงานตาม ancestor จริงๆ แทน
    const exactId = isString ? undefined : (selectedData.data || selectedData.id);
    if (exactId && context?.targetAnalysis) {
        const exactMatch = context.targetAnalysis.find(t => t.id === exactId);
        if (exactMatch) {
            // ตรวจสอบว่า ancestorStr ปัจจุบันตรงกับ target หรือไม่
            // ถ้าตรง = block ยังอยู่ที่เดิม → ใช้ Exact Match ได้
            // ถ้าไม่ตรง = block ถูกย้ายไปแล้ว → ข้ามไปให้ Structural Match จัดการ
            const currentAncestorStr = ancestorStr;
            const targetAncestorStr = exactMatch.ancestorStr;
            const ancestorMatches = !currentAncestorStr || !targetAncestorStr || currentAncestorStr === targetAncestorStr;
            if (ancestorMatches) {
                for (const line of allLines) {
                    if (line.patternBlocks?.some(b => b.index === exactMatch.index)) {
                        return line;
                    }
                }
            }
            // ancestorStr ไม่ตรง → fall through ไป Structural Match
        }
    }

    // ─── FLOATING BLOCK HANDLING ────────────────────────────────
    // ถ้า block เป็น floating (อยู่ในกระดานขวา) → ใช้ diff เพื่อหาว่าต้องไปต่อตรงไหน
    if (!isString && selectedData.isFloating && context?.targetAnalysis) {
        const missingSlots = findMissingSlots(context.targetAnalysis, selectedData.mainTreeBlocks);
        
        // 1) ลองจับคู่ด้วย Block ID แท้ๆ (Exact Target Match)
        // ถ้า Admin เอาบล็อกออกมาจากบรรทัดไหน Block ID จะอิงตามนั้นเสมอ
        let slot = missingSlots.find(s => s.id === selectedData.id);
        
        const sameKindMissing = missingSlots.filter(s =>
            s.type === type && (varName ? s.varName === varName : !s.varName)
        );

        // 2) ถ้าไม่เจอ ID ตรงกัน (เช่นถูกสร้างใหม่) ให้ใช้คิวระดับความสูง (Y-position Fallback)
        if (!slot) {
            slot = sameKindMissing[selectedData.floatingOcc ?? 0];
        }

        console.log("=== 🔍 FLOATING BLOCK DEBUG ===");
        console.log("1. กดที่บล็อก:", { type, varName, floatingOcc: selectedData.floatingOcc });
        console.log("2. Target Analysis (เรียงตามเฉลยเต็มๆ):", context.targetAnalysis.map(t => `[${t.index}] ${t.type} (var: ${t.varName || 'none'})`));
        console.log("3. Main Tree (บล็อกหลักตอนนี้):", selectedData.mainTreeBlocks.map(m => `[${m.index}] ${m.type} (var: ${m.varName || 'none'})`));
        console.log("4. หาพบว่าขาด Slots ต่อไปนี้:", missingSlots.map(s => `[targetIndex:${s.targetIndex}] ${s.type} (var: ${s.varName || 'none'})`));
        console.log("5. ขาดที่ตรงกับที่กด:", sameKindMissing.map(s => `[targetIndex:${s.targetIndex}] ${s.type} (var: ${s.varName || 'none'})`));
        console.log("6. จับคู่กับ Slot:", slot ? `targetIndex:${slot.targetIndex} (ID Match: ${slot.id === selectedData.id})` : "หาไม่เจอ");

        if (slot) {
            for (const line of allLines) {
                if (line.patternBlocks?.some(b => b.index === slot.targetIndex)) {
                    console.log("✅ ชี้ไปที่ Pseudocode บรรทัดที่:", line.lineIndex + 1, "=>", line.text);
                    return line;
                }
            }
        }
        // Floating block ต้องไม่ตกทะลุไปรันโค้ดข้างล่าง (เพราะโค้ดข้างล่างไว้ใช้กับบล็อกที่เอาไปต่อแล้ว)
        console.log("❌ ไม่เจอจับคู่ หรือว่าชี้ตกไปที่ Logic เดิม (ยกเลิก Fall-through แล้ว)");
        return null;
    }

    // PRIMARY: Structural Sequence Matching — ใช้ LCS (Longest Common Subsequence) ยืดหยุ่นกรณีผู้เล่นข้ามบล็อกตรงกลาง
    if (ancestorStr) {
        const userParts = ancestorStr.split('|').reverse();
        let bestMatch = null;
        let maxScore = -1;

        for (const line of allLines) {
            if (!line.patternBlocks?.length) continue;
            for (const b of line.patternBlocks.filter(b => b.type === type && (!varName || b.varName === varName))) {
                if (!b.ancestorStr) continue;
                const targetParts = b.ancestorStr.split('|').reverse();
                
                // คำนวณ Longest Common Subsequence (โครงสร้างครอบครัวที่ตรงกันโดยรวม)
                const dp = Array(targetParts.length + 1).fill(0).map(() => Array(userParts.length + 1).fill(0));
                for (let i = 1; i <= targetParts.length; i++) {
                    for (let j = 1; j <= userParts.length; j++) {
                        if (targetParts[i - 1] === userParts[j - 1]) {
                            dp[i][j] = dp[i - 1][j - 1] + 1;
                        } else {
                            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                        }
                    }
                }
                const lcsLen = dp[targetParts.length][userParts.length];

                // คำนวณ Consecutive Match (โบนัสถ้าแม่พิมพ์ติดกันโดยตรง)
                let consecutiveMatchLen = 0;
                for (let i = 0; i < Math.min(targetParts.length, userParts.length); i++) {
                    if (targetParts[i] !== userParts[i]) break;
                    consecutiveMatchLen++;
                }

                // ให้ค่าน้ำหนักภาพรวมโครงสร้าง (LCS) มากกว่า แต่บวกโบนัส Consecutive
                const score = (lcsLen * 10) + consecutiveMatchLen;

                if (score > maxScore) {
                    maxScore = score;
                    bestMatch = line;
                } else if (score === maxScore && maxScore > 0) {
                    // หากคะแนนผูกพันครอบครัวเท่ากัน ให้งัดลำดับ occurrence มาตัดสิน
                    if (varName ? b.varOcc === varOcc : b.typeOcc === typeOcc) bestMatch = line;
                }
            }
        }
        if (bestMatch) return bestMatch;
    }

    // SECONDARY: Semantic Matching by occurrence
    if (typeOcc !== undefined) {
        for (const line of allLines) {
            if (!line.patternBlocks?.length) continue;
            const found = line.patternBlocks.find(b =>
                varName
                    ? b.varName === varName && b.type === type && b.varOcc === varOcc
                    : b.type === type && b.typeOcc === typeOcc
            );
            if (found) return line;
        }
    }

    // TERTIARY: Occurrence-based Fallback
    let matchCount = 0;
    const targetOccurrence = typeOcc ?? 0;
    for (const line of allLines) {
        if (!line.blockType) continue;
        if (line.blockType.split(',').map(t => t.trim()).includes(type)) {
            if (matchCount === targetOccurrence) return line;
            matchCount++;
        }
    }

    return null;
}

// helper: คำนวณ state ของ step ('done' / 'active' / 'future')
const getStepState = (stepIndex, matchedSteps) =>
    stepIndex < matchedSteps ? 'done' : stepIndex === matchedSteps ? 'active' : 'future';

/**
 * รวบรวม pseudocode ทุก step ออกมาเป็น flat array เพื่อแสดงใน PseudocodePanel
 * พร้อม metadata ว่าอยู่ step ไหน และ state ของแต่ละ step (done / active / future)
 *
 * @param {Object} cachedPattern - pattern object
 * @param {number} matchedSteps - จำนวน step ที่ผ่านแล้ว
 * @returns {Array<{ text, blockType, stepIndex, lineIndex, stepState }>}
 */
export function buildPseudocodeLines(cachedPattern, matchedSteps) {
    if (!cachedPattern?.hints) return [];

    // Stream ผ่าน _cachedAnalysis เพื่อแบ่งบล็อก (chunks) ให้แต่ละบรรทัด pseudocode
    const lastHint = cachedPattern.hints[cachedPattern.hints.length - 1];
    const targetAnalysis = lastHint?._cachedAnalysis || [];
    let analysisPointer = 0;

    const result = [];
    let lastLineWithBlocks = null;

    cachedPattern.hints.forEach((hint, stepIndex) => {
        const lines = Array.isArray(hint.pseudocode) ? hint.pseudocode : [];
        if (typeof hint.pseudocode === 'string' && hint.pseudocode.trim()) {
            result.push({
                text: hint.pseudocode,
                blockType: null,
                blockIndex: null,
                varName: undefined,
                patternBlocks: [],
                stepIndex,
                lineIndex: 0,
                stepState: getStepState(stepIndex, matchedSteps)
            });
            return;
        }

        lines.forEach((line, lineIndex) => {
            let assignedBlockIndex = null;
            let assignedVarName = undefined;
            let lineAnalysisPointer = analysisPointer;

            if (line.blockType) {
                // ใช้ PRIMARY TYPE เป็นจุดแบ่ง chunk
                const primaryType = line.blockType.split(',')[0].trim();
                if (primaryType) {
                    for (let i = analysisPointer; i < targetAnalysis.length; i++) {
                        const b = targetAnalysis[i];
                        if (b.type === primaryType) {
                            assignedBlockIndex = b.index;
                            assignedVarName = b.varName ?? undefined;

                            if (lastLineWithBlocks) {
                                // บล็อกทั้งหมดตั้งแต่ primary ก่อนหน้าจนถึงก่อน primary ปัจจุบัน ถือเป็นลูกของ line ก่อนหน้า
                                lastLineWithBlocks.patternBlocks = targetAnalysis.slice(lastLineWithBlocks._analysisPointer, b.index);
                            }

                            lineAnalysisPointer = b.index;
                            analysisPointer = i + 1; // เลื่อน pointer ไปหลัง primary type สำหรับ line ถัดไป
                            break;
                        }
                    }
                }
            }

            const lineObj = {
                text: line.text || '',
                blockType: line.blockType || null,
                blockIndex: assignedBlockIndex,
                varName: assignedVarName,
                patternBlocks: [],
                _analysisPointer: assignedBlockIndex !== null ? lineAnalysisPointer : analysisPointer, // เก็บจุดเริ่มเพื่อให้คำนวณ chunk ถัดไปถูก
                stepIndex,
                lineIndex,
                stepState: getStepState(stepIndex, matchedSteps)
            };

            if (assignedBlockIndex !== null) {
                lastLineWithBlocks = lineObj;
            }

            result.push(lineObj);
        });
    });

    // ใส่ block ที่เหลือหลังบรรทัดสุดท้ายให้ last line
    if (lastLineWithBlocks && targetAnalysis.length > 0) {
        lastLineWithBlocks.patternBlocks = targetAnalysis.slice(lastLineWithBlocks._analysisPointer);
    }

    // --- DEBUG LOGGING ---
    console.groupCollapsed("=== 🧠 Pseudocode Line Pattern Blocks Mapping ===");
    result.forEach(line => {
        if (line.blockType) {
            console.log(`Line ${line.lineIndex + 1}: [${line.blockType}] ${line.text}`);
            line.patternBlocks?.forEach(b => {
                console.log(`   -> [${b.index}] Type:${b.type} Var:${b.varName || 'N/A'}`);
            });
        }
    });
    console.groupEnd();
    // ---------------------

    return result;
}
