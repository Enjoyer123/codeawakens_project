// Text Code Validation — เทียบโค้ดที่ผู้เล่นพิมพ์กับ blocks ใน workspace
import { javascriptGenerator } from "blockly/javascript";

/**
 * ตรวจสอบว่า text code ที่ user พิมพ์ตรงกับโค้ดที่ Blockly generate จาก blocks หรือไม่
 */
export function validateTextCode(textCode, workspace) {
    try {
        if (!textCode?.trim()) {
            return { isValid: false, message: "กรุณาเขียนโค้ด" };
        }
        if (!workspace?.getAllBlocks || workspace.getAllBlocks().length === 0) {
            return { isValid: false, message: "ไม่มี blocks ใน workspace" };
        }

        // Generate expected code จาก blocks — skip floating blocks
        // floating value blocks ลอยอยู่จะถูก output เป็น node;, 0 == 0; ถ้าใช้ workspaceToCode
        javascriptGenerator.declaredVariables = new Set();
        javascriptGenerator.isCleanMode = true;
        if (javascriptGenerator.nameDB_) javascriptGenerator.nameDB_.reset();

        let expected;
        try {
            const floatingIds = workspace._floatingBlockIds || new Set();
            const nonFloatingTopBlocks = workspace.getTopBlocks(true)
                .filter(b => !floatingIds.has(b.id));

            javascriptGenerator.init(workspace);
            let raw = '';
            for (const block of nonFloatingTopBlocks) {
                raw += javascriptGenerator.blockToCode(block) || '';
            }
            expected = javascriptGenerator.finish(raw);
        } finally {
            javascriptGenerator.isCleanMode = false;
        }

        // เทียบตรงๆ (แค่ลบ var declarations ที่ Blockly ใส่เอง + รวม whitespace)
        const clean = (code) => (code || '')
            .split('\n')
            .filter(line => !line.trim().match(/^var\s+\w+(\s*,\s*\w+)*\s*;?\s*$/))
            .join('\n')
            .replace(/\s+/g, ' ')
            .trim();

        if (clean(expected) === clean(textCode)) {
            return { isValid: true, message: "โค้ดตรงกับ blocks แล้ว!" };
        }

        return { isValid: false, message: findDifference(expected, textCode) };
    } catch (error) {
        return { isValid: false, message: `เกิดข้อผิดพลาด: ${error.message}` };
    }
}

/** หาบรรทัดที่ต่างกัน แล้วบอก error message */
function findDifference(expected, userCode) {
    const isSkippable = (line) => !line.trim() || !!line.trim().match(/^var\s+\w+(\s*,\s*\w+)*\s*;?\s*$/);

    const expectedLines = (expected || '').split('\n').filter(l => !isSkippable(l));
    const userLines = (userCode || '').split('\n').filter(l => !isSkippable(l));

    for (let i = 0; i < Math.max(expectedLines.length, userLines.length); i++) {
        const exp = (expectedLines[i] || '').replace(/\s+/g, ' ').trim();
        const usr = (userLines[i] || '').replace(/\s+/g, ' ').trim();

        if (exp !== usr) {
            if (!usr && exp) return `บรรทัดที่ ${i + 1}: ขาดคำสั่ง '${exp}'`;
            if (usr && !exp) return `บรรทัดที่ ${i + 1}: มีคำสั่ง '${usr}' เกินมา`;
            return `บรรทัดที่ ${i + 1}: คาดหวัง '${exp}' แต่พบ '${usr}'`;
        }
    }

    return "โค้ดไม่ตรงกับ blocks (ตรวจสอบตัวอักษรให้ตรงกับที่ Blockly แสดง)";
}
