/**
 * XML Loading Logic for Blockly
 * แยก Logic การโหลด Starter XML ออกมาเพื่อให้ useBlocklySetup สะอาดขึ้น
 */
import * as Blockly from "blockly/core";
import { setXmlLoading } from '@/gameutils/blockly';
import { javascriptGenerator } from "blockly/javascript";
import {
    ensureVariableIds,
    addMutationToProcedureDefinitions
} from './xmlFixers';

/**
 * ฟังก์ชัน: loadStarterXml
 * [Flow A] Initialization: 3.1 โหลด XML ลง Workspace
 * หน้าที่: โหลดโค้ดเริ่มต้น (Starter Blocks) ลงใน Workspace และจัดการล็อคบล็อกไม่ให้ลบ
 * 
 * @param {Blockly.WorkspaceSvg} workspace - ตัว Workspace เป้าหมาย
 * @param {string} starter_xml - XML string ที่จะโหลด
 * @param {boolean} isTextCodeEnabled - ถ้าเป็นด่านพิมพ์โค้ด ให้แปลงเป็น Text ด้วย
 * @param {Function|null} onCodeGenerated - Callback เมื่อแปลงเป็น Text แล้ว
 * @param {Function} setCurrentHint - ฟังก์ชันแสดง Error (ถ้ามี)
 */
export const loadStarterXml = (workspace, starter_xml, isTextCodeEnabled, onCodeGenerated, setCurrentHint) => {
    // 0. ตรวจสอบความพร้อม
    if (!workspace) {
        console.warn('Workspace disappeared before loading XML');
        return;
    }

    try {
        // ============================================================================
        // 1. เตรียม XML (Preprocessing)
        // ============================================================================

        // ตรวจสอบว่ามีบล็อก definition พื้นฐานหรือไม่ (กันเหนียว)
        if (!Blockly.Blocks['procedures_defreturn'] || !Blockly.Blocks['procedures_defnoreturn']) {
            console.warn('procedures_def* blocks not registered');
        }

        // Fix 1: เติม IDs ให้ตัวแปร (ถ้า XML มาแบบไม่สมบูรณ์)
        let processedXml = ensureVariableIds(starter_xml);

        // Fix 2: เติม Mutation ให้ Procedure Defs (ช่วยแก้บั๊ก Function หาย)
        processedXml = addMutationToProcedureDefinitions(processedXml);

        // ตรวจสอบว่ามี "type=" อยู่ไหม ถ้าไม่มีแสดงว่าเป็น XML เปล่าๆ หรือผิด format
        const hasBlocks = processedXml.match(/<block[^>]*type="/);
        if (!hasBlocks) {
            console.warn('Starter XML contains no blocks; skipping load');
            return;
        }

        // ============================================================================
        // 2. โหลดลง Workspace (Loading)
        // ============================================================================
        try {
            const xmlDom = Blockly.utils.xml.textToDom(processedXml);
            workspace.clear(); // ล้างของเก่าออกก่อน

            // Optimization: หยุด Events ชั่วคราวเพื่อให้โหลดเร็วขึ้น
            setXmlLoading(true);

            Blockly.Xml.domToWorkspace(xmlDom, workspace);

            setXmlLoading(false); // เปิด Events กลับมา
        } catch (primaryErr) {
            // กรณีโหลดตัวที่แก้แล้วพัง ลองโหลดตัว Original ดู (Fallback)
            console.warn('Failed to load processed XML, retrying raw starter_xml:', primaryErr);
            try {
                const xmlRaw = Blockly.utils.xml.textToDom(starter_xml);
                workspace.clear();
                setXmlLoading(true);
                Blockly.Xml.domToWorkspace(xmlRaw, workspace);
                setXmlLoading(false);
            } catch (rawErr) {
                setXmlLoading(false);
                console.error('Failed to load starter XML (both raw and processed):', rawErr);
                if (setCurrentHint) {
                    setCurrentHint('ไม่สามารถโหลด starter blocks ได้: ' + (rawErr.message || 'invalid XML'));
                }
                return;
            }
        }

        // ============================================================================
        // 3. ล็อคบล็อก (Locking Guide Blocks)
        // ============================================================================
        // เป้าหมาย: ให้ผู้เล่นเติมคำในช่องว่าง ไม่ใช่ลบบล็อกโจทย์ทิ้ง

        const allBlocks = workspace.getAllBlocks(false);
        allBlocks.forEach(block => {
            // 3.1 ห้ามขยับและห้ามลบ
            block.setMovable(false);
            block.setDeletable(false);

            // 3.2 ถ้าเป็น Function Definition ห้ามแก้ชื่อ/Parameter
            if (block.type === 'procedures_defreturn' || block.type === 'procedures_defnoreturn') {
                block.setEditable(false);
            }
        });

        // ============================================================================
        // 4. สร้าง Text Code (Optional)
        // ============================================================================
        // ถ้าเป็นโหมดพิมพ์โค้ด เราต้องแปลงบล็อกเริ่มต้นเป็น Text ด้วย

        if (isTextCodeEnabled && onCodeGenerated) {
            try {
                // เปิด Clean Mode (สร้างโค้ดแบบอ่านง่าย ไม่เอา bloatware)
                javascriptGenerator.isCleanMode = true;
                let code = javascriptGenerator.workspaceToCode(workspace);
                javascriptGenerator.isCleanMode = false;

                if (code && code.trim()) {
                    // ลบพวก var declaration อัตโนมัติที่ Blockly แถมมาให้
                    code = code.replace(/^var\s+[\w,\s]+;\n+/, '');
                    onCodeGenerated(code);
                }
            } catch (genErr) {
                javascriptGenerator.isCleanMode = false;
                console.error('❌ Failed to generate starter text code:', genErr);
            }
        }

    } catch (xmlError) {
        console.error('Error loading starter XML:', xmlError);
        if (setCurrentHint) {
            setCurrentHint('ไม่สามารถโหลด starter blocks ได้: ' + xmlError.message);
        }
    }
};
