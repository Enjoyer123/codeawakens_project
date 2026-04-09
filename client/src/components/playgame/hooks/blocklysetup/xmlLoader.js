/**
 * XML Loading Logic for Blockly
 * โหลด Starter XML + Floating XML ลง Workspace
 */
import * as Blockly from "blockly/core";
import { setXmlLoading } from '@/gameutils/blockly/core/state';
import { javascriptGenerator } from "blockly/javascript";

/**
 * ลบ starter change listener ออกจาก workspace
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
 * โหลดโค้ดเริ่มต้น (Main Blocks + Floating Blocks) ลงใน Workspace
 * floating blocks จะถูก mark ด้วย workspace._floatingBlockIds สำหรับตรวจจับ
 */
export const loadStarterXml = (workspace, starter_xml, floating_xml, isTextCodeEnabled, onCodeGenerated) => {
    if (!workspace) {
        console.warn('Workspace disappeared before loading XML');
        return;
    }

    try {
        // 1. ตรวจสอบว่ามี XML ที่ใช้ได้จริงไหม
        if (!starter_xml || !starter_xml.trim()) {
            console.warn('Starter XML is empty; skipping load');
            return;
        }

        const xmlDom = Blockly.utils.xml.textToDom(starter_xml);
        if (!xmlDom.querySelector('block')) {
            console.warn('Starter XML contains no block elements; skipping load');
            return;
        }

        // 2. ลบ listener เก่าออกก่อน
        removeStarterListener(workspace);

        // 3. ล้าง Workspace + divider เก่า
        Blockly.Events.disable();
        workspace.clear();
        if (workspace._floatingDivider) {
            workspace._floatingDivider.remove();
            workspace._floatingDivider = null;
        }
        workspace._floatingBlockIds = new Set();
        Blockly.Events.enable();

        // 4. โหลด Main Blocks
        setXmlLoading(true);
        Blockly.Xml.domToWorkspace(xmlDom, workspace);
        setXmlLoading(false);

        // 5. ล็อคบล็อกตั้งต้น — ผู้เล่นลบไม่ได้ และถ้ามีการต่อกันอยู่แล้วจะห้ามแกะออก!
        const starterBlockIds = new Set();
        const allBlocks = workspace.getAllBlocks(false);
        allBlocks.forEach(block => {
            starterBlockIds.add(block.id);
            block.setDeletable(false);
            
            // 🔒 ล็อคเฉพาะ Value Block เท่านั้น
            // บล็อกที่มี outputConnection (ตัวแปร/ค่า) และต่ออยู่แล้วแต่แรก ห้ามดึงออก!
            // แต่ให้ Statement Block (พวกเงื่อนไข/คำสั่ง) ขยับแทรกกันบนกระดานได้
            if (block.getParent() && block.outputConnection) {
                block.setMovable(false);
            } else {
                block.setMovable(true);
            }

            if (block.type === 'procedures_defreturn' || block.type === 'procedures_defnoreturn') {
                block.setEditable(false);
                // Allow the main procedure block to be movable so users can retrieve blocks stuck behind it
                block.setMovable(true);
            }
        });

        // 6. โหลด Floating Blocks (ถ้ามี)
        if (floating_xml && floating_xml.trim() && floating_xml.includes('<block')) {
            loadFloatingBlocks(workspace, floating_xml, starterBlockIds);
        }

        // 7. ป้องกันการลบแบบลากโซ่ (Cascade Deletion Protection)
        const allStarterIds = new Set([...starterBlockIds, ...workspace._floatingBlockIds]);
        const starterListener = (event) => {
            if (event.type === Blockly.Events.BLOCK_DELETE) {
                const deletedIds = event.ids || [event.blockId];
                if (deletedIds.some(id => allStarterIds.has(id))) {
                    workspace.undo(false);
                }
            }

            // ─── Floating Block Connection Tracking ───────────────────────
            // เมื่อบล็อกลอยถูก "เสียบ" เข้าช่อง (มี newParentId) → ลบออกจาก _floatingBlockIds
            // ทำให้ findMissingSlots รู้ว่าช่องนั้นเต็มแล้ว และอัพเดตไฮไลต์ถูกต้อง
            if (event.type === Blockly.Events.BLOCK_MOVE) {
                const movedBlock = workspace.getBlockById(event.blockId);
                if (!movedBlock) return;

                const wasFloating = workspace._floatingBlockIds?.has(event.blockId);
                const nowHasParent = !!movedBlock.getParent();

                if (wasFloating && nowHasParent) {
                    // บล็อกลอยนี้ถูกเสียบแล้ว → ลบออก (ทั้งตัวเองและลูกๆ)
                    const removeFromFloating = (block) => {
                        workspace._floatingBlockIds.delete(block.id);
                        for (const child of block.getChildren(false)) {
                            removeFromFloating(child);
                        }
                    };
                    removeFromFloating(movedBlock);

                    // 🚫 ป้องกัน Floating-to-Floating: ถ้า root ของ tree ที่ได้ยังเป็น floating block
                    // → แสดงว่าเสียบกับบล็อกลอยอื่น ไม่ได้เสียบกับโครงสร้างหลัก → ดึงออกคืน
                    let rootBlock = movedBlock;
                    while (rootBlock.getParent()) rootBlock = rootBlock.getParent();

                    if (workspace._floatingBlockIds.has(rootBlock.id)) {
                        // Revert: ดึง block ออกและวางคืนตำแหน่งเดิม
                        setTimeout(() => {
                            try {
                                Blockly.Events.disable();
                                movedBlock.unplug(false);
                                // คืน _floatingBlockIds สำหรับตัวเองและลูก
                                const restoreFloating = (block) => {
                                    if (allStarterIds.has(block.id)) {
                                        workspace._floatingBlockIds.add(block.id);
                                    }
                                    for (const child of block.getChildren(false)) {
                                        restoreFloating(child);
                                    }
                                };
                                restoreFloating(movedBlock);
                                // วาง block กลับไปที่พิกัดเดิม (ถ้ามี)
                                if (event.oldCoordinate) {
                                    movedBlock.moveTo(event.oldCoordinate);
                                }
                            } finally {
                                Blockly.Events.enable();
                            }
                        }, 0);
                    }
                }

                // ถ้าบล็อกถูกแยกออกจาก parent (ดึงกลับมาลอย) → ใส่กลับเข้า _floatingBlockIds
                // เฉพาะกรณีที่ ID นั้นเคยอยู่ใน allStarterIds เท่านั้น (ป้องกัน block ใหม่ที่ผู้เล่นดึงมา)
                const wasConnected = event.oldParentId != null;
                const nowTopLevel = !movedBlock.getParent();
                if (wasConnected && nowTopLevel && allStarterIds.has(event.blockId)) {
                    const addBackToFloating = (block) => {
                        if (allStarterIds.has(block.id)) {
                            workspace._floatingBlockIds.add(block.id);
                        }
                        for (const child of block.getChildren(false)) {
                            addBackToFloating(child);
                        }
                    };
                    addBackToFloating(movedBlock);
                }
            }
        };

        workspace.addChangeListener(starterListener);
        workspace._starterListener = starterListener;

        // 8. สร้าง Text Code (ถ้าเป็นโหมดพิมพ์โค้ด)
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

// ─── Floating Blocks Loading ────────────────────────────────────

/**
 * โหลด floating blocks จาก floating_xml → วางใต้ main blocks + วาดเส้นแบ่ง
 */
function loadFloatingBlocks(workspace, floating_xml, starterBlockIds) {
    try {
        // หาขอบซ้ายสุดของ main blocks (top-level) ก่อนโหลด floating
        const mainBlocks = workspace.getTopBlocks(false);
        let minX = Infinity;
        let minY = Infinity;

        for (const block of mainBlocks) {
            const xy = block.getRelativeToSurfaceXY();
            minX = Math.min(minX, xy.x);
            minY = Math.min(minY, xy.y);
        }

        if (minX === Infinity) minX = 400;
        if (minY === Infinity) minY = 50;

        // ตรวจสอบว่าฝั่งซ้ายมีพื้นที่พอไหม (สำหรับ floating blocks) สัก 300px
        const requiredLeftSpace = 350;
        let shiftX = 0;
        if (minX < requiredLeftSpace) {
            shiftX = requiredLeftSpace - minX;
            for (const block of mainBlocks) {
                block.moveBy(shiftX, 0);
            }
            minX += shiftX;
        }

        // วาง floating blocks ให้อยู่ฝั่งซ้าย
        // เส้นแบ่งอยู่ระหว่าง floating กับ main: ใช้ minX - 50 (เว้นระยะจากฝั่ง main blocks)
        const dividerX = minX - 50;

        // Parse floating XML
        const floatingDom = Blockly.utils.xml.textToDom(floating_xml);
        const floatingBlockElements = floatingDom.querySelectorAll(':scope > block');

        if (floatingBlockElements.length === 0) return;

        // วาดเส้นแบ่งเป็นแนวตั้ง
        addFloatingDivider(workspace, dividerX, minY);

        // โหลด floating blocks ทีละชิ้น แล้ววางตำแหน่งซ้ายมือของเส้น เรียงลงมา
        setXmlLoading(true);
        let currentY = minY;
        const floatingBlockIds = workspace._floatingBlockIds;

        for (const blockEl of floatingBlockElements) {
            // สร้าง wrapper <xml> สำหรับ block เดี่ยว
            const wrapperXml = document.createElement('xml');
            wrapperXml.setAttribute('xmlns', 'https://developers.google.com/blockly/xml');
            wrapperXml.appendChild(blockEl.cloneNode(true));

            // โหลดเข้า workspace
            const newBlockIds = Blockly.Xml.domToWorkspace(wrapperXml, workspace);

            // Mark + ล็อค + วางตำแหน่ง
            for (const id of newBlockIds) {
                floatingBlockIds.add(id);
                starterBlockIds.add(id);
                const block = workspace.getBlockById(id);
                if (block) {
                    block.setDeletable(false);
                    block.setMovable(true);

                    // วางตำแหน่งเฉพาะ top-level block
                    if (!block.getParent()) {
                        block.moveBy(50 - block.getRelativeToSurfaceXY().x,
                            currentY - block.getRelativeToSurfaceXY().y);
                        currentY += block.getHeightWidth().height + 30;
                    }

                    // Mark descendants ด้วย
                    const descendants = block.getDescendants();
                    for (const desc of descendants) {
                        if (desc.id !== id) {
                            floatingBlockIds.add(desc.id);
                            starterBlockIds.add(desc.id);
                            desc.setDeletable(false);
                            
                            // 🔒 ล็อคเฉพาะ Value Block เท่านั้น (เหมือนโครงสร้างหลักด้านบน)
                            if (desc.getParent() && desc.outputConnection) {
                                desc.setMovable(false);
                            } else {
                                desc.setMovable(true);
                            }
                        }
                    }
                }
            }
        }
        setXmlLoading(false);

    } catch (e) {
        setXmlLoading(false);
        console.warn('Failed to load floating blocks:', e.message);
    }
}

// ─── Floating Divider Line ──────────────────────────────────────

function addFloatingDivider(workspace, lineX, labelY) {
    try {
        const ns = 'http://www.w3.org/2000/svg';
        const group = document.createElementNS(ns, 'g');
        group.setAttribute('class', 'blockly-floating-divider');

        // เส้นประยาวมากๆ ซูมก็ไม่ขาด (แนวตั้ง)
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', String(lineX));
        line.setAttribute('x2', String(lineX));
        line.setAttribute('y1', '-9999');
        line.setAttribute('y2', '9999');
        line.setAttribute('stroke', '#740191ff');
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-dasharray', '8 5');
        line.setAttribute('opacity', '0.5');
        group.appendChild(line);

        // Label
        const text = document.createElementNS(ns, 'text');
        text.setAttribute('x', String(lineX - 260));
        text.setAttribute('y', String(labelY - 60)); // ไว้ข้างบนสุด
        text.setAttribute('fill', '#740191ff');
        text.setAttribute('font-size', '18');
        text.setAttribute('font-family', 'sans-serif');
        text.setAttribute('opacity', '0.6');
        text.textContent = 'ลากบล็อกด้านซ้ายไปต่อด้านขวา';
        group.appendChild(text);

        const blockCanvas = workspace.svgBlockCanvas_;
        if (blockCanvas) {
            blockCanvas.insertBefore(group, blockCanvas.firstChild);
            workspace._floatingDivider = group;
        }
    } catch (e) {
        console.warn('Failed to add floating divider:', e.message);
    }
}
