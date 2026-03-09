/**
 * XML Loading Logic for Blockly
 * โหลด Starter XML ตรงๆ ลง Workspace — ไม่ต้อง fix XML เพราะ admin สร้างถูกตั้งแต่แรก
 */
import * as Blockly from "blockly/core";
import { setXmlLoading } from '@/gameutils/blockly/core/state';
import { javascriptGenerator } from "blockly/javascript";

/**
 * ฟังก์ชัน: loadStarterXml
 * โหลดโค้ดเริ่มต้น (Starter Blocks) ลงใน Workspace และล็อคบล็อกไม่ให้ลบ
 */
export const loadStarterXml = (workspace, starter_xml, isTextCodeEnabled, onCodeGenerated) => {
    if (!workspace) {
        console.warn('Workspace disappeared before loading XML');
        return;
    }

    try {
        // 1. ตรวจสอบว่ามี blocks อยู่ไหม
        if (!starter_xml || !starter_xml.match(/<block[^>]*type="/)) {
            console.warn('Starter XML contains no blocks; skipping load');
            return;
        }

        // 2. โหลดลง Workspace
        const xmlDom = Blockly.utils.xml.textToDom(starter_xml);
        workspace.clear();

        setXmlLoading(true);
        Blockly.Xml.domToWorkspace(xmlDom, workspace);
        setXmlLoading(false);

        // 3. ล็อคบล็อก — ผู้เล่นเติมคำในช่องว่าง ไม่ลบบล็อกโจทย์
        const allBlocks = workspace.getAllBlocks(false);
        allBlocks.forEach(block => {
            block.setMovable(false);
            block.setDeletable(false);

            // Function Definition ห้ามแก้ชื่อ/Parameter
            if (block.type === 'procedures_defreturn' || block.type === 'procedures_defnoreturn') {
                block.setEditable(false);
            }
        });

        // 4. สร้าง Text Code (ถ้าเป็นโหมดพิมพ์โค้ด)
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
                console.error('❌ Failed to generate starter text code:', genErr);
            }
        }

    } catch (xmlError) {
        console.error('Error loading starter XML:', xmlError);
    }
};
