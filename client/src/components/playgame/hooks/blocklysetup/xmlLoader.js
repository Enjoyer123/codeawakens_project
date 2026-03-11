/**
 * XML Loading Logic for Blockly
 * โหลด Starter XML ตรงๆ ลง Workspace — ไม่ต้อง fix XML เพราะ admin สร้างถูกตั้งแต่แรก
 */
import * as Blockly from "blockly/core";
import { setXmlLoading } from '@/gameutils/blockly/core/state';
import { javascriptGenerator } from "blockly/javascript";

/**
 * ลบ starter change listener ออกจาก workspace
 * ใช้ workspace._starterListener ที่แปะไว้ตอน loadStarterXml
 * → ไม่ต้องพึ่งตัวแปร Module ข้างนอก จึงไม่มีทางชี้ผิด workspace
 * @param {Blockly.Workspace} workspace
 */
export const removeStarterListener = (workspace) => {
    if (workspace?._starterListener) {
        try {
            workspace.removeChangeListener(workspace._starterListener);
        } catch (e) {
            // workspace อาจ dispose แล้ว — ไม่เป็นไร
        }
        workspace._starterListener = null;
    }
};

/**
 * ฟังก์ชัน: loadStarterXml
 * โหลดโค้ดเริ่มต้น (Starter Blocks) ลงใน Workspace และล็อคบล็อกไม่ให้ลบ
 * แต่ยังอนุญาตให้ผู้เล่นแทรกบล็อกใหม่ระหว่างบล็อกตั้งต้นได้
 */
export const loadStarterXml = (workspace, starter_xml, isTextCodeEnabled, onCodeGenerated) => {
    if (!workspace) {
        console.warn('Workspace disappeared before loading XML');
        return;
    }

    try {
        // 1. ตรวจสอบว่ามี XML ที่ใช้ได้จริงไหม (ใช้ DOM แทน Regex เพื่อความแม่นยำ)
        if (!starter_xml || !starter_xml.trim()) {
            console.warn('Starter XML is empty; skipping load');
            return;
        }

        const xmlDom = Blockly.utils.xml.textToDom(starter_xml);
        if (!xmlDom.querySelector('block')) {
            console.warn('Starter XML contains no block elements; skipping load');
            return;
        }

        // 2. ลบ listener เก่าออกก่อน (ป้องกัน listener ซ้อนกัน)
        removeStarterListener(workspace);

        // 3. ล้าง Workspace ก่อนโหลดของใหม่
        //    ปิด Events ชั่วคราว → ป้องกัน listener ตัวอื่น (ถ้ามี) undo กลับ
        Blockly.Events.disable();
        workspace.clear();
        Blockly.Events.enable();

        setXmlLoading(true);
        Blockly.Xml.domToWorkspace(xmlDom, workspace);
        setXmlLoading(false);

        // 4. ล็อคบล็อกตั้งต้น — ผู้เล่นเติมบล็อกได้ แต่ลบบล็อกโจทย์ไม่ได้
        const starterBlockIds = new Set();
        const allBlocks = workspace.getAllBlocks(false);
        allBlocks.forEach(block => {
            starterBlockIds.add(block.id);
            block.setDeletable(false);
            block.setMovable(true);

            if (block.type === 'procedures_defreturn' || block.type === 'procedures_defnoreturn') {
                block.setEditable(false);
            }
        });

        // 5. ป้องกันการลบแบบลากโซ่ (Cascade Deletion Protection)
        const starterListener = (event) => {
            if (event.type === Blockly.Events.BLOCK_DELETE) {
                const deletedIds = event.ids || [event.blockId];
                if (deletedIds.some(id => starterBlockIds.has(id))) {
                    workspace.undo(false);
                }
            }
        };

        workspace.addChangeListener(starterListener);
        workspace._starterListener = starterListener; // แปะไว้บน workspace เลย

        // 6. สร้าง Text Code (ถ้าเป็นโหมดพิมพ์โค้ด)
        if (isTextCodeEnabled && onCodeGenerated) {
            try {
                javascriptGenerator.isCleanMode = true;
                let code = javascriptGenerator.workspaceToCode(workspace);
                javascriptGenerator.isCleanMode = false;

                if (code && code.trim()) {
                    code = code.replace(/^var\s+[\w,\s]+;\n+/, '');
                    onCodeGenerated(code);
                }
            } catch (genErr) {
                javascriptGenerator.isCleanMode = false;
                console.error('Failed to generate starter text code:', genErr);
            }
        }

    } catch (xmlError) {
        setXmlLoading(false);
        Blockly.Events.enable(); // ต้องเปิดกลับกรณี error
        console.error('Error loading starter XML:', xmlError);
    }
};

