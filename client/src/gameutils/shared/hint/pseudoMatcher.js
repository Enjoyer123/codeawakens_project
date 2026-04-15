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
                targetMatched[ti] = j;
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
        if (targetMatched[ti] >= 0) continue;
        const target = targetAnalysis[ti];
        for (let j = mi; j < mainTreeBlocks.length; j++) {
            if (!mainUsed[j] &&
                mainTreeBlocks[j].type === target.type &&
                (target.varName === undefined || mainTreeBlocks[j].varName === target.varName)) {
                targetMatched[ti] = j;
                mainUsed[j] = true;
                mi = j + 1;
                break;
            }
        }
    }

    const missing = targetAnalysis
        .filter((_, i) => targetMatched[i] < 0)
        .map(t => ({ targetIndex: t.index, type: t.type, varName: t.varName }));

    return { missing, matched: targetMatched };
}

/**
 * หา blockId ของ parent block บน workspace ที่ floating block ควรไปต่อ
 * ใช้เพื่อ highlight ให้ user เห็นว่า "ต้องเอาไปเสียบตรงนี้"
 *
 * @returns {string|null} workspace block ID ของ parent ที่ต้อง highlight
 */
export function findFloatingHintBlockId(targetAnalysis, mainTreeBlocks, floatingType, floatingVarName, floatingOcc) {
    if (!targetAnalysis?.length || !mainTreeBlocks?.length) return null;

    const { matched: targetMatched } = findMissingSlots(targetAnalysis, mainTreeBlocks);

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

                // 🔥 TEMP LOG: เก็บข้อมูลเตรียมทำตารางสรุป
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
