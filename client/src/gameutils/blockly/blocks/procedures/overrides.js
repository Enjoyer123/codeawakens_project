// Blockly Procedure Block Overrides
// Minimal: Thai tooltips only. XML fixers handle everything else.
import * as Blockly from "blockly/core";

const THAI_TOOLTIPS = {
    procedures_defreturn: 'สร้างฟังก์ชันที่คืนค่า',
    procedures_defnoreturn: 'สร้างฟังก์ชันที่ไม่คืนค่า',
    procedures_callreturn: 'เรียกใช้ฟังก์ชันและรับค่าคืน',
    procedures_callnoreturn: 'เรียกใช้ฟังก์ชัน',
    procedures_ifreturn: 'ถ้าเงื่อนไขเป็นจริง ให้คืนค่า'
};

export function applyProcedureOverrides() {
    // Apply Thai tooltips to all procedure block types
    Object.entries(THAI_TOOLTIPS).forEach(([blockType, tooltip]) => {
        const block = Blockly.Blocks[blockType];
        if (!block || block.__tooltipApplied) return;

        const originalInit = block.init;
        block.init = function () {
            if (originalInit) originalInit.call(this);
            this.setTooltip(tooltip);
        };

        block.__tooltipApplied = true;
    });
}
