import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

export function registerRopePartitionBlocks() {

    // --- 1. Get Cuts ---
    Blockly.Blocks['rope_get_cuts'] = {
        init: function () {
            this.jsonInit({
                "message0": "Available Cuts",
                "output": "Array", // Returns array of numbers
                "colour": 120, // Greenish
                "tooltip": "รับรายการขนาดเชือกที่สามารถตัดได้",
                "helpUrl": ""
            });
        }
    };
    javascriptGenerator.forBlock['rope_get_cuts'] = function (block) {
        if (javascriptGenerator.isCleanMode) {
            return ['getCuts()', javascriptGenerator.ORDER_FUNCTION_CALL];
        }
        // Use global API if available, else default. Add logic for safety.
        return [`(typeof getRopeCuts === 'function' && getRopeCuts()) || [2, 3, 5]`, javascriptGenerator.ORDER_ATOMIC];
    };

    // --- 2. Get Target ---
    Blockly.Blocks['rope_target_len'] = {
        init: function () {
            this.jsonInit({
                "message0": "Rope Length",
                "output": "Number",
                "colour": 230, // Blueish
                "tooltip": "รับความยาวเชือกเป้าหมาย",
                "helpUrl": ""
            });
        }
    };
    javascriptGenerator.forBlock['rope_target_len'] = function (block) {
        if (javascriptGenerator.isCleanMode) {
            // User's example uses a variable `target`, but this block returns the value. 
            // Ideally it should be `target` if the variable exists, but this block gets the value.
            // Let's return the simplified call assuming the user assigns it.
            // Actually, user's ideal code shows `let cuts = getCuts();` creating a var. 
            // But valid JS would be `getRopeTarget()`. User code: `var target = 10;` manually? 
            // No, the user code has `solve(..., (typeof ... || 10))`.
            // I will return `10` or a function call `getTarget()`? User didn't specify `getTarget` in ideal,
            // but `var target = 10` implies hardcoded or fetched. I'll stick to a clean function call or just `10`.
            // Better: `10` (if static) or `target` if it's a variable reference. 
            // Let's assume `target` variable is passed in `solve`.
            // If this block is used to GET the valid cuts, it returns an array.
            // If this block is used for target, `(typeof getRopeTarget === 'function' && getRopeTarget()) || 10`.
            // I'll return `10` to match the "var target = 10" line at end of user's ideal code.
            return ['10', javascriptGenerator.ORDER_ATOMIC];
        }
        return [`(typeof getRopeTarget === 'function' && getRopeTarget()) || 10`, javascriptGenerator.ORDER_ATOMIC];
    };

    // --- 3. Visual: Enter Node (Log Visit) ---
    // User should place this at the START of their recursive function
    Blockly.Blocks['rope_vis_enter'] = {
        init: function () {
            this.jsonInit({
                "message0": "Visualize Visit | Cut: %1 Sum: %2",
                "args0": [
                    { "type": "input_value", "name": "CUT", "check": "Number" },
                    { "type": "input_value", "name": "SUM", "check": "Number" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 290, // Purple
                "tooltip": "แสดงภาพเมื่อเข้าสู่สถานะใหม่ (ควรวางไว้ที่จุดเริ่มต้นของฟังก์ชัน)",
                "helpUrl": ""
            });
        }
    };
    javascriptGenerator.forBlock['rope_vis_enter'] = function (block) {
        const cut = javascriptGenerator.valueToCode(block, 'CUT', javascriptGenerator.ORDER_ATOMIC) || '0';
        const sum = javascriptGenerator.valueToCode(block, 'SUM', javascriptGenerator.ORDER_ATOMIC) || '0';

        if (javascriptGenerator.isCleanMode) {
            return `await pushNode(${cut}, ${sum});\n`;
        }

        // Calls the Stack-based API in GameCore
        // CRITICAL FIX: capture result. If -1 (depth limit), return immediately to stop recursion.
        // Debug logging for type verification
        // FORCE LOCAL DECLARARION for recursion variables to prevent Global Scope Pollution
        return `
        var minLines, subRes, tempRes; 
        if (typeof pushRopeNode === 'function') {
           console.log("[RopeVis] Enter: cut=", ${cut}, "sum=", ${sum}, "target=", target);
           if (Number(${sum}) > 200) {
               console.error("[RopeVis] SUM > 200! LOOP DETECTED!");
               throw new Error("Sum exceeded 200");
           }
           if (Number.isNaN(Number(${cut})) || Number.isNaN(Number(${sum})) || Number.isNaN(Number(target))) {
               console.error("[RopeVis] NaN DETECTED!");
               throw new Error("NaN Detected: cut=" + ${cut} + " sum=" + ${sum} + " target=" + target);
           }
           const __visRes = await pushRopeNode(${cut}, ${sum});
           if (__visRes === -1) return -1;
        }
        `;
    };

    // --- 4. Visual: Exit Node (Log Return) ---
    // User should place this before returning (or we rely on implicit pop if we could)
    // But explicit is safer for visualization.
    Blockly.Blocks['rope_vis_exit'] = {
        init: function () {
            this.jsonInit({
                "message0": "Visualize Return",
                "previousStatement": null,
                "nextStatement": null,
                "colour": 290,
                "tooltip": "แสดงภาพเมื่อออกจากสถานะ (ควรวางไว้ก่อนคำสั่ง return)",
                "helpUrl": ""
            });
        }
    };
    javascriptGenerator.forBlock['rope_vis_exit'] = function (block) {
        if (javascriptGenerator.isCleanMode) {
            return `await popNode();\n`;
        }
        return `if (typeof popRopeNode === 'function') await popRopeNode();\n`;
    };

    // --- 5. Visual: Mark Status ---
    Blockly.Blocks['rope_vis_status'] = {
        init: function () {
            this.jsonInit({
                "message0": "Mark Node: %1",
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "STATUS",
                        "options": [
                            ["✅ Success (Solution)", "success"],
                            ["🚫 Pruned (> Length)", "pruned"]
                        ]
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 60, // Orange
                "tooltip": "ระบุสถานะให้กับโหนดปัจจุบัน",
                "helpUrl": ""
            });
        }
    };
    javascriptGenerator.forBlock['rope_vis_status'] = function (block) {
        const status = block.getFieldValue('STATUS');

        if (javascriptGenerator.isCleanMode) {
            return `await updateStatus('${status}');\n`;
        }

        // We assume GameCore has logic to update the 'current' node (top of stack)
        // Since markCurrentRopeNode might not exist, we use updateRopeNodeStatus with helper
        const code = `
            if (typeof updateRopeNodeStatus === 'function' && typeof ropeStack !== 'undefined' && ropeStack.length > 0) {
                 const nodeId = ropeStack[ropeStack.length - 1];
                 await updateRopeNodeStatus(nodeId, '${status}');
            }
        `;
        return code;
    };

    // --- 6. Init Block (Optional Wrapper) ---
    // User might just put this in 'Main'.
    Blockly.Blocks['rope_visual_init'] = {
        init: function () {
            this.jsonInit({
                "message0": "Init Visualization",
                "previousStatement": null,
                "nextStatement": null,
                "colour": 290,
                "tooltip": "เริ่มต้นระบบแสดงภาพแบบต้นไม้",
                "helpUrl": ""
            });
        }
    };
    javascriptGenerator.forBlock['rope_visual_init'] = function (block) {
        // Clean Mode: Likely omitted or minimal
        if (javascriptGenerator.isCleanMode) {
            return ''; // Usually init is handled implicitly or not needed in clean snippet
        }
        return `if (typeof initRopeTree === 'function') await initRopeTree();\n`;
    };
}
