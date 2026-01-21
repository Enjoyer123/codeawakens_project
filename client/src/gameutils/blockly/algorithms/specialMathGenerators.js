// Special Math Generators for Algorithm Visual Feedback (Knapsack, Ant DP)
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

export function defineSpecialMathGenerators() {
    // Special math_max generator with visual feedback for Knapsack and Ant DP
    javascriptGenerator.forBlock["math_max"] = function (block) {
        console.log('[GENERATOR] math_max being called');
        const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_ATOMIC) || '0';
        const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_ATOMIC) || '0';

        const valueA = (a && a.trim()) ? a : '0';
        const valueB = (b && b.trim()) ? b : '0';

        try {
            // Check if this is inside a knapsack function
            let parentBlock = block.getParent();
            let isKnapsack = false;

            while (parentBlock) {
                if (parentBlock.type === 'procedures_defreturn') {
                    const funcName = parentBlock.getFieldValue('NAME') || '';
                    if (funcName.toLowerCase().includes('knapsack')) {
                        isKnapsack = true;
                        break;
                    }
                }
                parentBlock = parentBlock.getParent();
            }

            if (isKnapsack) {
                // Find function definition block for knapsack parameters
                let funcDefBlock = block.getParent();
                while (funcDefBlock && funcDefBlock.type !== 'procedures_defreturn') {
                    funcDefBlock = funcDefBlock.getParent();
                }

                if (funcDefBlock) {
                    let iParamName = 'i';
                    let jParamName = 'j';
                    try {
                        if (funcDefBlock.mutationToDom) {
                            const mutation = funcDefBlock.mutationToDom();
                            const argNodes = mutation && (mutation.querySelectorAll ? mutation.querySelectorAll('arg') : mutation.getElementsByTagName('arg'));
                            if (argNodes && argNodes.length >= 4) {
                                const iArg = argNodes[2] && argNodes[2].getAttribute ? argNodes[2].getAttribute('name') : null;
                                const jArg = argNodes[3] && argNodes[3].getAttribute ? argNodes[3].getAttribute('name') : null;
                                if (iArg) iParamName = javascriptGenerator.nameDB_.getName(iArg, Blockly.Names.NameType.VARIABLE);
                                if (jArg) jParamName = javascriptGenerator.nameDB_.getName(jArg, Blockly.Names.NameType.VARIABLE);
                            }
                        }
                    } catch (e) { }

                    let itemVarName = null;
                    let capVarName = null;
                    try {
                        let p = block.getParent();
                        while (p) {
                            if (p.type === 'for_loop_dynamic' || p.type === 'for_index' || p.type === 'controls_for') {
                                const varField = p.getFieldValue && p.getFieldValue('VAR');
                                if (varField) {
                                    const resolved = javascriptGenerator.nameDB_.getName(varField, Blockly.Names.NameType.VARIABLE);
                                    if (resolved === 'item') itemVarName = resolved;
                                    if (resolved === 'cap') capVarName = resolved;
                                }
                            }
                            p = p.getParent();
                        }
                    } catch (e) { }

                    const iState = itemVarName || iParamName;
                    const jState = capVarName || jParamName;
                    return [`await knapsackMaxWithVisual(${valueA}, ${valueB}, ${iState}, ${jState})`, javascriptGenerator.ORDER_FUNCTION_CALL];
                }
            }

            // Default to Ant DP for non-knapsack max blocks
            let rVarName = 'typeof r !== "undefined" ? r : 0';
            let cVarName = 'typeof c !== "undefined" ? c : 0';
            try {
                let p = block.getParent();
                while (p) {
                    if (p.type === 'for_loop_dynamic' || p.type === 'for_index' || p.type === 'controls_for') {
                        const varField = p.getFieldValue && p.getFieldValue('VAR');
                        if (varField) {
                            const resolved = javascriptGenerator.nameDB_.getName(varField, Blockly.Names.NameType.VARIABLE);
                            if (resolved === 'r') rVarName = 'r';
                            if (resolved === 'c') cVarName = 'c';
                        }
                    }
                    p = p.getParent();
                }
            } catch (e) { }

            const logCode = `console.log('--- Calling antMaxWithVisual at (' + (${rVarName}) + ',' + (${cVarName}) + ') ---')`;
            return [`(${logCode}, await antMaxWithVisual(${valueA}, ${valueB}, ${rVarName}, ${cVarName}))`, javascriptGenerator.ORDER_FUNCTION_CALL];

        } catch (e) {
            console.error('Generator error in math_max:', e);
        }

        return [`Math.max(${valueA}, ${valueB})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };
}
