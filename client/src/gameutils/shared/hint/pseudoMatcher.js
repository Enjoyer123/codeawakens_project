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
    console.log(`\n======================================================`);
    console.log(`📋 [4.1] เตรียมข้อมูลก่อนเทียบหาช่องโหว่ Diff (targetAnalysis vs mainTreeBlocks)`);
    console.log(`📄 ฝั่งซ้าย: เฉลยเป้าหมายที่ถูกต้อง (Target Analysis)`);
    console.table(targetAnalysis?.map(t => ({ id: t.id, index: t.index, type: t.type, varName: t.varName || '-' })) || []);
    console.log(`📄 ฝั่งขวา: กระดานหน้าจอที่โดนคว้านบล็อกลอยออกแล้ว (Main Tree Blocks)`);
    console.table(mainTreeBlocks?.map(m => ({ id: m.id, index: m.index, type: m.type, varName: m.varName || '-' })) || []);

    if (!targetAnalysis?.length) return { missing: [], matched: [] };
    if (!mainTreeBlocks?.length) {
        return {
            missing: targetAnalysis.map(t => ({
                targetIndex: t.index, type: t.type, varName: t.varName,
            })),
            matched: new Array(targetAnalysis.length).fill(-1)
        };
    }

    const targetMatched = new Array(targetAnalysis.length).fill(-1);
    const mainUsed = new Array(mainTreeBlocks.length).fill(false);

    // ============================================
    // Helper: ตรวจสอบความเหมือนของบล็อก 2 ก้อน
    // ============================================
    const isSameBlock = (target, main, strict = false) => {
        const typeMatch = main.type === target.type;
        const varMatch = (target.varName === undefined) || (main.varName === target.varName);
        const ancestorMatch = !strict || !target.ancestorStr || (main.ancestorStr === target.ancestorStr);
        return typeMatch && varMatch && ancestorMatch;
    };

    // ============================================
    // Pass 1: Strict Match (เน้นเป๊ะ! ต้องอยู่ถูกตระกูล)
    // จำเป็นต้องใช้ searchPointer เพื่อรักษาลำดับ (Sequence) การจับคู่จากซ้ายไปขวา
    // ============================================
    let searchPointer = 0;
    for (let ti = 0; ti < targetAnalysis.length; ti++) {
        const targetBlock = targetAnalysis[ti];

        for (let j = searchPointer; j < mainTreeBlocks.length; j++) {
            const mainBlock = mainTreeBlocks[j];
            if (!mainUsed[j] && isSameBlock(targetBlock, mainBlock, true)) {
                targetMatched[ti] = j;
                mainUsed[j] = true;
                searchPointer = j + 1; // ให้รอบหน้าเดินหาต่อจากจุดนี้
                break;
            }
        }
    }

    // ============================================
    // Pass 2: Loose Match (จับคู่แบบเก็บตก)
    // สำหรับบล็อกที่ยังหลงเหลือ ขอแค่หน้าตาตรงกันก็พอ (เด็กอาจจะต่อผิดโซน)
    // ============================================
    searchPointer = 0; // เริ่มเดินกวาดจากหน้าห้องใหม่
    for (let ti = 0; ti < targetAnalysis.length; ti++) {
        if (targetMatched[ti] !== -1) continue; // ข้ามคนที่ได้คู่ไปแล้วจาก Pass 1

        const targetBlock = targetAnalysis[ti];
        for (let j = searchPointer; j < mainTreeBlocks.length; j++) {
            const mainBlock = mainTreeBlocks[j];
            if (!mainUsed[j] && isSameBlock(targetBlock, mainBlock, false)) {
                targetMatched[ti] = j;
                mainUsed[j] = true;
                searchPointer = j + 1;
                break;
            }
        }
    }

    const missing = targetAnalysis
        .filter((_, i) => targetMatched[i] === -1)
        .map(t => ({ targetIndex: t.index, type: t.type, varName: t.varName }));

    return { missing, matched: targetMatched };
}

/**
 * หา blockId ของ parent block บน workspace ที่ floating block ควรไปต่อ
 * ใช้เพื่อ highlight ให้ user เห็นว่า "ต้องเอาไปเสียบตรงนี้"
 *
 * @returns {string|null} workspace block ID ของ parent ที่ต้อง highlight
 */

/**
 * หา pseudocode line ที่ blockType ตรงกัน โดยใช้ข้อมูลลำดับ occurrence ป้องกันการ highlight ผิด (เช่น for ซ้อน for)
 *
 * @param {Object | string} selectedData - ข้อมูลบล็อกที่เลือก { type, occurrence } หรือ 'string' เปล่าๆ
 * @param {Array} allLines - flat array ของทุกบรรทัด pseudocode ที่เจนจาก buildPseudocodeLines
 * @param {Object|null} context - optional context { targetAnalysis } สำหรับ floating block matching
 * @returns {Object | null} - data ของบรรทัดนั้น เช่น { stepIndex, lineIndex, text, ... }
 */
export function findPseudocodeLine(selectedData, allLines, context = null) {
    console.log("selectedData", selectedData);
    if (!selectedData || !allLines?.length) return null;

    const difficulty = String(context?.difficulty || 'easy').toLowerCase();

    // 🔴 ถ้าระดับความยากเป็น 'hard' (ยาก) จะไม่แสดงไฮไลต์ใดๆ เลย ไม่ว่าจะดึงมาจากไหน หรือต่อแล้วหรือไม่
    if (difficulty === 'hard') {
        return null;
    }

    const isString = typeof selectedData === 'string';
    const type = isString ? selectedData : selectedData.type;
    const typeOcc = isString ? undefined : (selectedData.typeOcc ?? selectedData.occurrence);
    const varName = isString ? undefined : selectedData.varName;
    const varOcc = isString ? undefined : selectedData.varOcc;
    const ancestorStr = isString ? undefined : selectedData.ancestorStr;


    // เช็คว่า block นี้ต่อกับโครงสร้างหลัก (Main Procedure) หรือยัง
    // โดยดูว่ารากของสายบรรพบุรุษคือ procedures_defreturn หรือ procedures_defnoreturn หรือไม่
    const isMainConnected = ancestorStr && (ancestorStr.startsWith('procedures_defreturn') || ancestorStr.startsWith('procedures_defnoreturn'));

    // ─── FLOATING & DETACHED BLOCK HANDLING ──────────────────────────
    // ถ้า block เป็น floating (แถมมาจากโจทย์ หรือ ลากมาจาก Toolbox แล้วยังลอยอยู่)
    if (!isString && selectedData.isFloating && context?.targetAnalysis) {

        console.log(`\n%c╔══ STEP 5A: Path A — Floating Block → Greedy Diff ══╗`, 'color:#fbbf24;font-weight:bold');
        console.log(`%c  เรียก findMissingSlots() หาช่องว่างในโครงสร้างเฉลย`, 'color:#fcd34d');
        console.log(`%c  difficulty: [${difficulty}]  floatingOcc: [${selectedData.floatingOcc ?? 0}]`, 'color:#fde68a');
        console.log(`%c╚═══════════════════════════════════════════════════╝`, 'color:#fbbf24;font-weight:bold');

        // 🟡 ระดับ 'medium': บล็อกที่ลอยอยู่ (เชื่อมไม่ติดกับ Main) จะไม่ให้ใบ้บรรทัด
        if (difficulty === 'medium') {
            console.log("➡️ Medium Mode: ซ่อน highlight บล็อกลอย");
            return null;
        }

        console.log("➡️ Easy Mode: หาช่องว่างให้บล็อกลอย");
        // ถ้าระดับ 'easy': ใช้ diff หาตำแหน่งที่ขาด
        const { missing: missingSlots } = findMissingSlots(context.targetAnalysis, selectedData.mainTreeBlocks);
        console.log(`\n%c  === ผลลัพธ์ Greedy Diff (findMissingSlots) ===`, 'color:#fbbf24;font-weight:bold');
        console.log(`%c  ช่องว่างทั้งหมด ${missingSlots.length} ช่อง ที่กระดานยังไม่มี Block เสียบ:`, 'color:#fcd34d');
        console.table(missingSlots);

        const sameKindMissing = missingSlots.filter(s =>
            s.type === type && (varName ? s.varName === varName : !s.varName)
        );

        const slot = sameKindMissing[selectedData.floatingOcc ?? 0];

        if (slot) {
            console.log(`\n%c╔══ STEP 6A: จับคู่ floatingOcc → Missing Slot ══╗`, 'color:#4ade80;font-weight:bold');
            console.log(`%c  บล็อกลอยชนิด [${type}(${varName || '-'})] ลำดับ: ${selectedData.floatingOcc ?? 0}`, 'color:#86efac');
            console.log(`%c  เฉลยช่องว่างชนิดเดียวกันมี ${sameKindMissing.length} ช่อง`, 'color:#86efac');
            console.table(sameKindMissing);
            console.log(`%c  → เลือกช่องว่าง targetIndex: [${slot.targetIndex}]`, 'color:#bbf7d0');
            console.log(`%c╚══════════════════════════════════════════════════╝`, 'color:#4ade80;font-weight:bold');

            console.log(`\n%c  === ค้นหาบรรทัด Pseudocode ที่รับผิดชอบ targetIndex [${slot.targetIndex}] ===`, 'color:#4ade80');
            console.table(allLines.map(l => ({
                step: l.stepIndex,
                line: l.lineIndex,
                text: l.text.trim().substring(0, 35),
                'รับผิดชอบ targetIndex': (l.patternBlocks?.map(b => b.index).join(',') || '-')
            })));
            for (const line of allLines) {
                if (line.patternBlocks?.some(b => b.index === slot.targetIndex)) {
                    console.log(`%c  ✔ เจอบรรทัด! Step:${line.stepIndex} Line:${line.lineIndex} → "${line.text.trim()}"`, 'color:#4ade80;font-weight:bold');
                    console.log(`%c→ 🎉 STEP 7: ยิง highlight ไปยังบรรทัดนี้!`, 'color:#22c55e;font-weight:bold');
                    return line;
                }
            }
        }

        // ถ้าหาไม่เจอสำหรับ block ที่ลอย ให้หยุดตรงนี้ ไม่ต้องไปจับคู่ด้วย LCS เพราะมันไม่ได้อยู่ในโครงสร้าง
        return null;
    }

    // PRIMARY: Structural Sequence Matching — ใช้ LCS (Longest Common Subsequence) 
    // ทำเมื่อเชื่อมต่อกับ Main Procedure แล้วเท่านั้น
    if (isMainConnected) {

        console.log(`\n%c╔══ STEP 5B: Path B — Connected Block → LCS DNA Scoring ══╗`, 'color:#38bdf8;font-weight:bold');
        console.log(`%c  บล็อกต่ออยู่ในโครงสร้างแล้ว → ใช้ LCS เปรียบ ancestorStr หาบรรทัดที่ใกล้เคียงที่สุด`, 'color:#7dd3fc');
        console.log(`%c  difficulty: [${difficulty}]  type: [${type}]  varName: [${varName || '-'}]`, 'color:#bae6fd');
        console.log(`%c  ancestorStr ของผู้เล่น: "${ancestorStr}"`, 'color:#bae6fd');
        console.log(`%c╚═══════════════════════════════════════════════════════════╝`, 'color:#38bdf8;font-weight:bold');

        // 🟡 สำหรับ Medium: ไฮไลต์ตาม "ตำแหน่งที่มันอยู่จริง ณ ปัจจุบัน" ไม่ใช่ "ตำแหน่งที่มันควรอยู่"
        if (difficulty === 'medium') {
            const userParts = ancestorStr.split('|'); // ลำดับจาก root -> leaf (ตัวมันเองอยู่ขวาสุด)

            console.log(`\n%c╔══ STEP 6C: Medium Mode — Ancestor Walk ══╗`, 'color:#c084fc;font-weight:bold');
            console.log(`%c  DNA ผู้เล่นที่รับมา: [${userParts.join(', ')}]`, 'color:#e879f9');
            console.log(`%c  ตรวจหาแบบตรงเป๊ะ (Exact Match) ตามความเป็นจริงบนกระดานผู้เล่น`, 'color:#e879f9');

            // ถอยหลังหาบรรพบุรุษที่ตรงกับ pattern 
            // เริ่มหาตั้งแต่ตัวมันเองก่อน (ถ้าต่อถูกที่เป๊ะ จะเจอตัวมันเอง)
            // ถ้าไม่เจอ ให้ถอยขึ้นไปหา parent เรื่อยๆ จนกว่าจะเจอบล็อกที่มีจุดยืนใน Pseudocode
            for (let i = userParts.length; i > 0; i--) {
                const searchStr = userParts.slice(0, i).join('|');
                const searchType = userParts[i - 1];
                const isLookingAtLeaf = (i === userParts.length);

                console.log(`\n%c  🔍 วงจรที่ ${userParts.length - i + 1}: ถอยระดับค้นหาสายสัมพันธ์ ➔ "${searchStr}"`, 'color:#f0abfc');
                console.log(`%c     ↳ เป้าหมายค้นหา: หาบล็อกชนิด '${searchType}' ที่มี DNA ตรงเป๊ะตามบรรทัดฐานบนเป้าหมายเฉลย...`, 'color:#e879f9');
                console.log(`%c     ↳ กลไกการตรวจ: ระบบจะกางตารางเฉลย (allLines) ทั้งหมดขึ้นมาเปิดหา ว่ามีบล็อกไหนเขียน DNA ไว้ตรงกับผู้เล่นบ้างมั้ย?`, 'color:#d8b4fe');

                if (isLookingAtLeaf) {
                    const dnaTableData = [];
                    for (const l of allLines) {
                        if (l.patternBlocks) {
                            for (const pb of l.patternBlocks) {
                                dnaTableData.push({
                                    'บรรทัดที่': `Step ${l.stepIndex}, Line ${l.lineIndex}`,
                                    'ชนิดบล็อก (Type)': pb.type,
                                    'สายเลือด (DNA เฉลย)': pb.ancestorStr,
                                    'ข้อความ': l.text.trim().substring(0, 30)
                                });
                            }
                        }
                    }
                    console.log(`\n%c     📊 [ภาพประกอบสไลด์] รายการบล็อกเป้าหมายทั้งหมดและ DNA ของมันที่มีให้เลือกในตารางเฉลยทั้งหมด:`, 'color:#93c5fd;font-weight:bold');
                    console.table(dnaTableData);
                }

                // รวบรวมเป้าหมายทั้งหมดในเฉลยที่ตรงกับ context นี้
                const matchingTargets = [];
                for (const line of allLines) {
                    if (line.patternBlocks) {
                        matchingTargets.push(...line.patternBlocks.filter(b => b.type === searchType && b.ancestorStr === searchStr));
                    }
                }
                console.log(`%c     สรุป: เจอเป้าหมายเทียบเคียงในโครงสร้างเฉลยทั้งหมด: ${matchingTargets.length} จุด`, 'color:#fdf4ff;font-weight:bold');

                if (matchingTargets.length > 0) {
                    // ถ้านี่คือระดับ "ตัวมันเอง" (ระดับล่างสุดของ chain) ให้เช็ค Occurrence
                    if (isLookingAtLeaf && selectedData.ancestorOcc !== undefined) {
                        if (selectedData.ancestorOcc >= matchingTargets.length) {
                            // วางบล็อกซ้ำเกินกว่าที่เฉลยมี! (Excess block)
                            console.log(`%c     ⚠️ พบบล็อกซ้ำส่วนเกิน (Excess Block)! ลำดับที่ ${selectedData.ancestorOcc} เกินกว่าช่องที่มีในเฉลย → เด้งไปคำนวณ Parent เพื่อไฮไลต์แทนทันที`, 'color:#fcd34d');
                            continue;
                        } else {
                            console.log(`%c     ✔ ลำดับจำนวนเงื่อนไขสมบูรณ์ (occurrence: ${selectedData.ancestorOcc} < ${matchingTargets.length})`, 'color:#86efac');
                        }
                    }

                    // เหตุผลตรรกะว่าทำไมถึงเจอบรรทัดนี้
                    if (isLookingAtLeaf) {
                        console.log(`%c     💡 เหตุผลที่ตัดสินใจ: โครงสร้างปัจจุบันที่คุณต่ออยู่ "ถูกต้อง 100% (Exact Match)" สอดคล้องกับภาพโครงสร้างในเฉลยทุกประการ!`, 'color:#86efac');
                    } else {
                        console.log(`%c     💡 เหตุผลที่ตัดสินใจ: ถึงแม้บล็อกไส้ในที่คุณต่อจะยังคลาดเคลื่อน แต่เมื่อถอยหลังมาเช็คพบว่าบล็อกกรอบนอก (Parent: ${searchType}) เป็นโครงสร้างหลักที่วางถูกตำแหน่งแล้ว! จึงสะท้อนไฮไลต์กรอบนอกให้เห็นภาพรวม`, 'color:#86efac');
                    }

                    // หาเจอแล้ว ต้องหาว่าบรรทัดไหนรับผิดชอบมัน
                    // เลือก target ตาม occ (ถ้าเป็นตัวมันเอง) หรือเลือกตัวแรก (ถ้าเป็น parent)
                    const targetBlock = matchingTargets[isLookingAtLeaf ? (selectedData.ancestorOcc || 0) : 0];
                    if (targetBlock) {
                        for (const line of allLines) {
                            if (line.patternBlocks?.some(b => b.index === targetBlock.index)) {
                                console.log(`%c  → 🎉 บทสรุป! ผู้ชนะคือบรรทัด Step:${line.stepIndex} Line:${line.lineIndex} → "${line.text.trim()}"`, 'color:#a855f7;font-weight:bold');
                                console.log(`%c→ 🎉 STEP 7: ยิง highlight ไปยังบรรทัดนี้เพื่อสะท้อนความจริงบนหน้าจอ!`, 'color:#22c55e;font-weight:bold');
                                console.log(`%c╚══════════════════════════════════════════════════╝`, 'color:#c084fc;font-weight:bold');
                                return line;
                            }
                        }
                    }
                } else {
                    console.log(`%c     ❌ โครงสร้างนี้ผิดแปลก/ไม่เจอในเฉลย → ตัดหางทิ้ง! ถอยหลังขึ้นไปหาบล็อกแม่ (Parent) ในกรอบการหาต่อไป`, 'color:#fca5a5');
                }
            }
            // ถ้าย้อนจนสุดแล้วไม่เจออะไรเลย ให้ return null (ตกขอบ)
            console.log(`%c  🚫 ไม่พบโครงสร้างที่ตรงกันเลยแม้แต่ Root บรรพบุรุษ → Return null (ไม่มีไฮไลต์)`, 'color:#ef4444;font-weight:bold');
            console.log(`%c╚══════════════════════════════════════════════════╝`, 'color:#c084fc;font-weight:bold');
            return null;
        }

        // 🟢 สำหรับ Easy: ใช้ LCS แมตช์หา "ตำแหน่งที่มันควรจะอยู่" ให้ผู้เล่นรู้ว่าต้องเอาไปไว้ไหน
        const userParts = ancestorStr.split('|').reverse();
        let bestMatch = null;
        let maxScore = -1;

        console.log(`\n%c  === ขั้นตอนเปรียบเทียบ LCS Scoring ===`, 'color:#38bdf8;font-weight:bold');
        console.log(`%c  DNA ผู้เล่นกลับด้าน (เอาส่วน leaf ขึ้นก่อน root): [${userParts.join(', ')}]`, 'color:#7dd3fc');
        console.log(`%c  กำลังสแกนเปรียบเทียบกับบรรทัด Pseudocode ทั้งด่าน...`, 'color:#bae6fd');

        // ใช้เก็บ log ว่าเทียบกับบรรทัดไหนบ้าง จะได้แสดงสรุปเป็นตารางง่ายๆ
        const comparisonLogs = [];

        for (const line of allLines) {
            if (!line.patternBlocks?.length) continue;
            for (const b of line.patternBlocks.filter(b => b.type === type && (!varName || b.varName === varName))) {
                if (!b.ancestorStr) continue;

                const { lcsLen, consecutiveMatchLen, score } = computeAncestorScore(b.ancestorStr, userParts);

                comparisonLogs.push({
                    'Line': line.lineIndex + 1,
                    '🎯 DNA เฉลย': b.ancestorStr,
                    'คะแนน LCS': lcsLen,
                    'โบนัสติดกัน': consecutiveMatchLen,
                    'Total Score': score
                });

                if (score > maxScore) {
                    maxScore = score;
                    bestMatch = line;
                } else if (score === maxScore && maxScore > 0) {
                    // หากคะแนนผูกพันครอบครัวเท่ากัน ให้งัดลำดับ occurrence มาตัดสิน
                    if (varName ? b.varOcc === varOcc : b.typeOcc === typeOcc) bestMatch = line;
                }
            }
        }

        if (comparisonLogs.length > 0) {
            console.log(`\n%c  === ผล LCS Score ทุกบรรทัดที่มีบล็อกชนิด ${type} ===`, 'color:#38bdf8;font-weight:bold');
            console.table(comparisonLogs);
            if (bestMatch) {
                console.log(`\n%c╔══ STEP 6B: เลือกผู้ชนะจาก LCS Score ══╗`, 'color:#4ade80;font-weight:bold');
                console.log(`%c  บรรทัด: Line ${bestMatch.lineIndex + 1} → "${bestMatch.text.trim()}"`, 'color:#86efac');
                console.log(`%c  Score สูงสุดที่ได้: ${maxScore}`, 'color:#bbf7d0');
                console.log(`%c→ 🎉 STEP 7: ส่ง highlight ไปยัง PseudocodePanel!`, 'color:#22c55e;font-weight:bold');
                console.log(`%c╚══════════════════════════════════════════════╝`, 'color:#4ade80;font-weight:bold');
            }
        }

        console.log("bestMatch", bestMatch)
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

    const targetAnalysis = getTargetAnalysis(cachedPattern);
    const result = [];
    let analysisPointer = 0;
    let lastLineWithBlocks = null;

    for (const [stepIndex, hint] of cachedPattern.hints.entries()) {
        const lines = normalizePseudocode(hint.pseudocode);

        for (const [lineIndex, line] of lines.entries()) {
            const lineObj = buildLineObj(line, stepIndex, lineIndex, matchedSteps);

            if (line.blockType) {
                const primaryType = line.blockType.split(',')[0].trim();
                const match = findBlockByType(targetAnalysis, primaryType, analysisPointer);

                if (match) {
                    // ส่ง blocks ที่อยู่ระหว่าง primary ก่อนหน้า กับ primary ปัจจุบัน ให้ line ก่อนหน้า
                    if (lastLineWithBlocks) {
                        lastLineWithBlocks.patternBlocks = targetAnalysis.slice(
                            lastLineWithBlocks._analysisStart,
                            match.searchIndex
                        );
                    }

                    lineObj.blockIndex = match.block.index;
                    lineObj.varName = match.block.varName ?? undefined;
                    lineObj._analysisStart = match.searchIndex; // ใช้ Array Index เพื่อความชัวร์เวลา slice
                    analysisPointer = match.searchIndex + 1;
                    lastLineWithBlocks = lineObj;
                }
            }

            result.push(lineObj);
        }
    }

    // blocks ที่เหลือทั้งหมดตกเป็นของ line สุดท้ายที่มี block
    if (lastLineWithBlocks) {
        lastLineWithBlocks.patternBlocks = targetAnalysis.slice(lastLineWithBlocks._analysisStart);
    }
    console.log("result", result);
    // debugLog(result);
    return result;
}

// --- Helpers ---
function getTargetAnalysis(cachedPattern) {
    const lastHint = cachedPattern.hints.at(-1);
    return lastHint?._cachedAnalysis ?? [];
}

function normalizePseudocode(pseudocode) {
    if (Array.isArray(pseudocode)) return pseudocode;
    if (typeof pseudocode === 'string' && pseudocode.trim()) {
        // string ล้วน → wrap เป็น array-like object เพื่อให้ loop เดียวกันจัดการได้
        return [{ text: pseudocode, blockType: null, _isRawString: true }];
    }
    return [];
}

function buildLineObj(line, stepIndex, lineIndex, matchedSteps) {
    return {
        text: line.text || (line._isRawString && line.text) || '',
        blockType: line.blockType ?? null,
        blockIndex: null,
        varName: undefined,
        patternBlocks: [],
        _analysisStart: null,
        stepIndex,
        lineIndex,
        stepState: getStepState(stepIndex, matchedSteps),
    };
}

function findBlockByType(targetAnalysis, type, fromIndex) {
    if (!type) return null;
    for (let i = fromIndex; i < targetAnalysis.length; i++) {
        if (targetAnalysis[i].type === type) {
            return { block: targetAnalysis[i], searchIndex: i };
        }
    }
    return null;
}

function debugLog(result) {
    console.groupCollapsed('=== 🧠 Pseudocode Line Pattern Blocks Mapping ===');
    for (const line of result) {
        if (!line.blockType) continue;
        console.log(`Line ${line.lineIndex + 1}: [${line.blockType}] ${line.text}`);
        for (const b of line.patternBlocks ?? []) {
            console.log(`   -> [${b.index}] Type:${b.type} Var:${b.varName || 'N/A'}`);
        }
    }
    console.groupEnd();
}

/**
 * คำนวณคะแนนความเหมือนของโครงสร้าง ancestorStr (DNA) ระหว่างบล็อกเฉลยกับบล็อกผู้เล่น
 * ใช้หลัก Longest Common Subsequence (LCS) + โบนัสตระกูลติดกันเป๊ะ (Consecutive)
 *
 * @param {string} targetAncestorStr  - DNA ของบล็อกเฉลย เช่น "procedures_defreturn|controls_if|variables_get"
 * @param {string[]} userParts        - DNA ผู้เล่นที่กลับด้านมาแล้ว เช่น ['variables_get', 'controls_if', ...]
 * @returns {{ lcsLen: number, consecutiveMatchLen: number, score: number }}
 */
function computeAncestorScore(targetAncestorStr, userParts) {
    const targetParts = targetAncestorStr.split('|').reverse();

    // ─── LCS via Dynamic Programming ──────────────────────────────────
    // dp[i][j] = LCS ของ targetParts[0..i-1] กับ userParts[0..j-1]
    const dp = Array(targetParts.length + 1).fill(0).map(() => Array(userParts.length + 1).fill(0));
    for (let i = 1; i <= targetParts.length; i++) {
        for (let j = 1; j <= userParts.length; j++) {
            if (targetParts[i - 1] === userParts[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1; // เจอตัวเหมือนกัน: นับเพิ่ม
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]); // ไม่เหมือน: เอาค่าสูงสุดจากซ้ายหรือบน
            }
        }
    }
    const lcsLen = dp[targetParts.length][userParts.length]; // คำตอบอยู่มุมขวาล่างเสมอ

    // ─── Consecutive Bonus (Tie-breaker) ──────────────────────────────
    // นับจาก Leaf (&ตัวเอง) ขึ้นไปว่าเรียงติดกันเป๊ะๆ กี่ชั้น
    let consecutiveMatchLen = 0;
    for (let i = 0; i < Math.min(targetParts.length, userParts.length); i++) {
        if (targetParts[i] !== userParts[i]) break;
        consecutiveMatchLen++;
    }

    const score = (lcsLen * 10) + consecutiveMatchLen;
    return { lcsLen, consecutiveMatchLen, score };
}

