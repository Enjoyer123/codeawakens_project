import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

export function registerRopePartitionBlocks() {

    // --- 1. Get Cuts ---
    Blockly.Blocks['rope_get_cuts'] = {
        init: function () {
            this.jsonInit({
                "message0": "✂️ Available Cuts",
                "output": "Array", // Returns array of numbers
                "colour": 120, // Greenish
                "tooltip": "Get list of available cut sizes.",
                "helpUrl": ""
            });
        }
    };
    javascriptGenerator.forBlock['rope_get_cuts'] = function (block) {
        // Use global API if available, else default. Add logic for safety.
        return [`(typeof getRopeCuts === 'function' && getRopeCuts()) || [2, 3, 5]`, javascriptGenerator.ORDER_ATOMIC];
    };

    // --- 2. Get Target ---
    Blockly.Blocks['rope_target_len'] = {
        init: function () {
            this.jsonInit({
                "message0": "🎯 Rope Length",
                "output": "Number",
                "colour": 230, // Blueish
                "tooltip": "Get the target rope length.",
                "helpUrl": ""
            });
        }
    };
    javascriptGenerator.forBlock['rope_target_len'] = function (block) {
        return [`(typeof getRopeTarget === 'function' && getRopeTarget()) || 10`, javascriptGenerator.ORDER_ATOMIC];
    };

    // --- 3. Visual: Enter Node (Log Visit) ---
    // User should place this at the START of their recursive function
    Blockly.Blocks['rope_vis_enter'] = {
        init: function () {
            this.jsonInit({
                "message0": "👀 Visualize Visit | Cut: %1 Sum: %2",
                "args0": [
                    { "type": "input_value", "name": "CUT", "check": "Number" },
                    { "type": "input_value", "name": "SUM", "check": "Number" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 290, // Purple
                "tooltip": "Visualize visiting a state. Place at start of function.",
                "helpUrl": ""
            });
        }
    };
    javascriptGenerator.forBlock['rope_vis_enter'] = function (block) {
        const cut = javascriptGenerator.valueToCode(block, 'CUT', javascriptGenerator.ORDER_ATOMIC) || '0';
        const sum = javascriptGenerator.valueToCode(block, 'SUM', javascriptGenerator.ORDER_ATOMIC) || '0';
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
                "message0": "🔙 Visualize Return",
                "previousStatement": null,
                "nextStatement": null,
                "colour": 290,
                "tooltip": "Visualize returning from a state. Place before return.",
                "helpUrl": ""
            });
        }
    };
    javascriptGenerator.forBlock['rope_vis_exit'] = function (block) {
        return `if (typeof popRopeNode === 'function') await popRopeNode();\n`;
    };

    // --- 5. Visual: Mark Status ---
    Blockly.Blocks['rope_vis_status'] = {
        init: function () {
            this.jsonInit({
                "message0": "🏷️ Mark Node: %1",
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
                "tooltip": "Mark the status of the current node.",
                "helpUrl": ""
            });
        }
    };
    javascriptGenerator.forBlock['rope_vis_status'] = function (block) {
        const status = block.getFieldValue('STATUS');
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
                "message0": "🎬 Init Visualization",
                "previousStatement": null,
                "nextStatement": null,
                "colour": 290,
                "tooltip": "Initialize the visualization tree.",
                "helpUrl": ""
            });
        }
    };
    javascriptGenerator.forBlock['rope_visual_init'] = function (block) {
        return `if (typeof initRopeTree === 'function') await initRopeTree();\n`;
    };
}
