// ─── Pseudocode Line Matcher ─────────────────────────────────────
//
// ใช้สำหรับ Hybrid Pseudocode Hint System
// เมื่อ User คลิก block ใน Workspace → หาบรรทัด pseudocode ที่ตรงกัน
// scope จำกัดแค่ "active step" เพื่อแก้ปัญหา blockType ซ้ำ
/**
 * หา pseudocode line ที่ blockType ตรงกัน โดยใช้ข้อมูลลำดับ occurrence ป้องกันการ highlight ผิด (เช่น for ซ้อน for)
 *
 * @param {Object | string} selectedData - ข้อมูลบล็อกที่เลือก { type, occurrence } หรือ 'string' เปล่าๆ
 * @param {Array} allLines - flat array ของทุกบรรทัด pseudocode ที่เจนจาก buildPseudocodeLines
 * @returns {Object | null} - data ของบรรทัดนั้น เช่น { stepIndex, lineIndex, text, ... }
 */
export function findPseudocodeLine(selectedData, allLines) {
    if (!selectedData || !allLines?.length) return null;

    const isString = typeof selectedData === 'string';
    const type       = isString ? selectedData : selectedData.type;
    const typeOcc    = isString ? undefined : (selectedData.typeOcc ?? selectedData.occurrence);
    const varName    = isString ? undefined : selectedData.varName;
    const varOcc     = isString ? undefined : selectedData.varOcc;
    const ancestorStr = isString ? undefined : selectedData.ancestorStr;

    // PRIMARY: Structural Suffix Matching — ใช้ tree path เพื่อหา line ที่ใกล้เคียงโครงสร้างมากที่สุด
    if (ancestorStr) {
        const userParts = ancestorStr.split('|').reverse();
        let bestMatch = null;
        let maxSuffixLength = -1;

        for (const line of allLines) {
            if (!line.patternBlocks?.length) continue;
            for (const b of line.patternBlocks.filter(b => b.type === type && (!varName || b.varName === varName))) {
                if (!b.ancestorStr) continue;
                const targetParts = b.ancestorStr.split('|').reverse();
                let matchLen = 0;
                for (let i = 0; i < Math.min(targetParts.length, userParts.length); i++) {
                    if (targetParts[i] !== userParts[i]) break;
                    matchLen++;
                }
                if (matchLen > maxSuffixLength) {
                    maxSuffixLength = matchLen;
                    bestMatch = line;
                } else if (matchLen === maxSuffixLength && maxSuffixLength > 0) {
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

    return result;
}
