// Text Code Validation - Blockly Built-in Approach
// แทนที่ custom parser ด้วย isCleanMode ของ Blockly
// ไฟล์เดิมเก็บไว้ที่ hintTextCodeValidation.backup.js และ hintTextCodeParser.backup.js

import { javascriptGenerator } from "blockly/javascript";

/**
 * ตรวจสอบว่า text code ที่ user เขียนตรงกับ blocks ที่วางใน workspace หรือไม่
 * ใช้ Blockly isCleanMode generate expected code แล้วเทียบ normalized string
 */
export function validateTextCode(textCode, workspace) {
    try {
        if (!textCode.trim()) {
            return { isValid: false, message: "กรุณาเขียนโค้ด" };
        }

        if (!workspace || !workspace.getAllBlocks || workspace.getAllBlocks().length === 0) {
            return { isValid: false, message: "ไม่มี blocks ใน workspace" };
        }

        // Debug: แสดง blocks ทั้งหมดใน workspace
        const allBlocks = workspace.getAllBlocks();
        const blockTypes = allBlocks.map(b => b.type);
        console.log(`%c🧩 [TextCode Debug] Blocks (${allBlocks.length}): ${JSON.stringify(blockTypes)}`, 'color: #fbbf24; font-weight: bold');

        // Generate expected clean code from blocks
        // Reset state ก่อน generate เพื่อไม่ให้ declaredVariables รั่วข้าม calls
        javascriptGenerator.declaredVariables = new Set();
        javascriptGenerator.isCleanMode = true;
        let expected;
        try {
            expected = javascriptGenerator.workspaceToCode(workspace);
        } finally {
            javascriptGenerator.isCleanMode = false;
        }

        // Debug: แสดง expected แบบ raw
        console.log(`%c📋 [TextCode Debug] Expected (raw): ${JSON.stringify(expected)}`, 'color: #a78bfa; font-weight: bold');

        // Debug: ถ้า cleanMode ว่าง ลอง normal mode
        if (!expected || !expected.trim()) {
            const normalCode = javascriptGenerator.workspaceToCode(workspace);
            console.log(`%c⚠️ [TextCode Debug] CleanMode=EMPTY! NormalMode: ${JSON.stringify(normalCode)}`, 'color: #f87171; font-weight: bold');

            // ลอง generate ทีละ block 
            allBlocks.forEach((b, i) => {
                try {
                    const gen = javascriptGenerator.forBlock[b.type];
                    console.log(`  Block[${i}] "${b.type}": hasGenerator=${!!gen}, outputConn=${!!b.outputConnection}`);
                } catch (e) {
                    console.log(`  Block[${i}] "${b.type}": error=${e.message}`);
                }
            });
        }
        // Normalize and compare
        const normalizedExpected = normalize(expected);
        const normalizedUser = normalize(textCode);

        // Debug: แสดง normalized version เทียบกัน
        if (normalizedExpected !== normalizedUser) {
            console.log(`%c❌ [TextCode Debug] Normalized comparison:`, 'color: #f87171; font-weight: bold');
            console.log('Expected:', normalizedExpected);
            console.log('User:    ', normalizedUser);
        }

        if (normalizedExpected === normalizedUser) {
            return { isValid: true, message: "โค้ดตรงกับ blocks แล้ว!" };
        }

        // Find first difference for error message
        const diffMessage = findDifference(expected, textCode);
        return { isValid: false, message: diffMessage };

    } catch (error) {
        console.error("Error validating text code:", error);
        return {
            isValid: false,
            message: `เกิดข้อผิดพลาดในการตรวจสอบโค้ด: ${error.message}`
        };
    }
}

/**
 * Normalize code สำหรับเปรียบเทียบ
 * ลบ Blockly boilerplate, comments, semicolons, whitespace ส่วนเกิน
 * และ normalize ชื่อฟังก์ชันให้ตรงกัน
 */
function normalize(code) {
    let lines = code.split('\n');

    lines = lines
        // ลบ Blockly auto-generated variable declarations (เช่น "var garph, start, goal;")
        .filter(line => !line.trim().match(/^var\s+\w+(\s*,\s*\w+)*\s*;?\s*$/))
        // ลบ comments
        .filter(line => !line.trim().startsWith('//'));

    let result = lines.join('\n')
        .replace(/\/\*[\s\S]*?\*\//g, '')  // ลบ multi-line comments
        .replace(/;/g, '')                  // ลบ semicolons
        .replace(/\blet\s+/g, '')           // ลบ let (user จะเขียนหรือไม่เขียนก็ได้)
        .replace(/\bconst\s+/g, '')         // ลบ const
        .replace(/\s+/g, ' ')              // รวม whitespace เป็นช่องเดียว
        .trim();

    // Normalize function names:
    // หา function declarations แล้วแทนที่ชื่อ + การเรียกใช้ทั้งหมดด้วย placeholder
    // เพื่อให้ user ตั้งชื่อ function ต่างจาก block ได้
    const funcNames = [];
    const funcRegex = /function\s+(\w+)\s*\(/g;
    let match;
    while ((match = funcRegex.exec(result)) !== null) {
        funcNames.push(match[1]);
    }
    funcNames.forEach((name, i) => {
        // แทนที่ชื่อ function ทั้ง declaration และ call sites
        result = result.replace(new RegExp(`\\b${name}\\b`, 'g'), `__FUNC_${i}__`);
    });

    return result;
}

/**
 * หาจุดที่ต่างกันระหว่าง expected กับ user code
 * แสดง error message ที่บอกบรรทัดและสิ่งที่คาดหวัง
 */
function findDifference(expected, userCode) {
    const normalizeLine = (line) => line.replace(/;/g, '').replace(/\s+/g, ' ').trim();
    const displayLine = (line) => line.replace(/\s+/g, ' ').trim(); // เก็บ ; ไว้แสดงผล
    const isSkippable = (line) => {
        const trimmed = line.trim();
        return !trimmed || trimmed.startsWith('//') || !!trimmed.match(/^var\s+\w+(\s*,\s*\w+)*\s*;?\s*$/);
    };

    const expectedLines = expected.split('\n').filter(l => !isSkippable(l));
    const userLines = userCode.split('\n').filter(l => !isSkippable(l));

    for (let i = 0; i < Math.max(expectedLines.length, userLines.length); i++) {
        const exp = normalizeLine(expectedLines[i] || '');
        const usr = normalizeLine(userLines[i] || '');

        if (exp !== usr) {
            // ใช้ displayLine (มี ;) สำหรับแสดง, normalizeLine (ไม่มี ;) สำหรับ compare
            const expDisplay = displayLine(expectedLines[i] || '');
            const usrDisplay = displayLine(userLines[i] || '');
            if (!usr && exp) {
                return `บรรทัดที่ ${i + 1}: ขาดคำสั่ง '${expDisplay}'`;
            }
            if (usr && !exp) {
                return `บรรทัดที่ ${i + 1}: มีคำสั่ง '${usrDisplay}' เกินมา`;
            }
            return `บรรทัดที่ ${i + 1}: คาดหวัง '${expDisplay}' แต่พบ '${usrDisplay}'`;
        }
    }

    return "โค้ดไม่ตรงกับ blocks";
}
