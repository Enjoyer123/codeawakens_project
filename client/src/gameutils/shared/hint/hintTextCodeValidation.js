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
        if (!textCode || !textCode.trim()) {
            return { isValid: false, message: "กรุณาเขียนโค้ด" };
        }

        if (!workspace || !workspace.getAllBlocks || workspace.getAllBlocks().length === 0) {
            return { isValid: false, message: "ไม่มี blocks ใน workspace" };
        }

        // Generate expected clean code from blocks
        // Reset state ก่อน generate เพื่อไม่ให้ declaredVariables รั่วข้าม calls
        javascriptGenerator.declaredVariables = new Set();
        javascriptGenerator.isCleanMode = true;

        // Reset nameDB to ensure consistent variable names
        if (javascriptGenerator.nameDB_) {
            javascriptGenerator.nameDB_.reset();
        }

        let expected;
        try {
            expected = javascriptGenerator.workspaceToCode(workspace);
        } finally {
            javascriptGenerator.isCleanMode = false;
        }

        // Normalize and compare
        const normalizedExpected = normalize(expected);
        const normalizedUser = normalize(textCode);

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
    if (!code) return '';
    let lines = code.split('\n');

    lines = lines
        // ลบ Blockly auto-generated variable declarations
        .filter(line => !line.trim().match(/^var\s+\w+(\s*,\s*\w+)*\s*;?\s*$/))
        // ลบ comments
        .filter(line => !line.trim().startsWith('//'));

    let result = lines.join('\n')
        .replace(/\/\*[\s\S]*?\*\//g, '')  // ลบ multi-line comments
        .replace(/;/g, '')                  // ลบ semicolons
        .replace(/\b(let|const|var)\s+/g, 'var ') // Normalize variable declaration
        .replace(/\s+/g, ' ')              // รวม whitespace เป็นช่องเดียว
        .trim();

    // Normalize function names to generic placeholders
    // Only if necessary (can be fragile, but consistent with original intent)
    const funcNames = [];
    const funcRegex = /function\s+(\w+)\s*\(/g;
    let match;
    while ((match = funcRegex.exec(result)) !== null) {
        funcNames.push(match[1]);
    }
    funcNames.forEach((name, i) => {
        result = result.replace(new RegExp(`\\b${name}\\b`, 'g'), `__FUNC_${i}__`);
    });

    return result;
}

/**
 * หาจุดที่ต่างกันระหว่าง expected กับ user code
 * แสดง error message ที่บอกบรรทัดและสิ่งที่คาดหวัง
 */
function findDifference(expected, userCode) {
    // ใช้ normalize logic เดียวกันเพื่อให้ comparison consistent
    const simpleNormalize = (line) => {
        return line
            .replace(/;/g, '')
            .replace(/\b(let|const|var)\s+/g, 'var ')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const isSkippable = (line) => {
        const trimmed = line.trim();
        return !trimmed || trimmed.startsWith('//') || !!trimmed.match(/^var\s+\w+(\s*,\s*\w+)*\s*;?\s*$/);
    };

    const expectedLines = (expected || '').split('\n').filter(l => !isSkippable(l));
    const userLines = (userCode || '').split('\n').filter(l => !isSkippable(l));

    for (let i = 0; i < Math.max(expectedLines.length, userLines.length); i++) {
        const expRaw = expectedLines[i] || '';
        const usrRaw = userLines[i] || '';

        const exp = simpleNormalize(expRaw);
        const usr = simpleNormalize(usrRaw);

        if (exp !== usr) {
            const expDisplay = expRaw.replace(/\s+/g, ' ').trim();
            const usrDisplay = usrRaw.replace(/\s+/g, ' ').trim();

            if (!usr && exp) {
                return `บรรทัดที่ ${i + 1}: ขาดคำสั่ง '${expDisplay}'`;
            }
            if (usr && !exp) {
                return `บรรทัดที่ ${i + 1}: มีคำสั่ง '${usrDisplay}' เกินมา`;
            }
            // ถ้าชื่อ function ไม่ตรงกัน ให้เดาว่า user ตั้งชื่อผิด
            if (exp.includes('function') && usr.includes('function')) {
                return `บรรทัดที่ ${i + 1}: ชื่อฟังก์ชันหรือพารามิเตอร์ไม่ตรงกับ Block`;
            }

            return `บรรทัดที่ ${i + 1}: คาดหวัง '${expDisplay}' แต่พบ '${usrDisplay}'`;
        }
    }

    return "โค้ดไม่ตรงกับ blocks (ตรวจสอบการตั้งชื่อตัวแปรหรือฟังก์ชัน)";
}
