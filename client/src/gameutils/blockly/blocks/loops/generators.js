// Blockly Loop Generators
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

export function defineLoopGenerators() {
    javascriptGenerator.forBlock["for_loop_dynamic"] = function (block) {
        const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
        const from = javascriptGenerator.valueToCode(block, 'FROM', javascriptGenerator.ORDER_ATOMIC) || '0';
        const to = javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_ATOMIC) || '0';
        const branch = javascriptGenerator.statementToCode(block, 'DO');

        if (javascriptGenerator.isCleanMode) {
            let innerTo = to.trim();
            if (innerTo.startsWith('(') && innerTo.endsWith(')')) {
                innerTo = innerTo.slice(1, -1).trim();
            }
            let condition = `${variable} <= ${to}`;
            // Optimization: if "to" is "X - 1", use "i < X"
            const match = innerTo.match(/^(.+)\s*-\s*1$/);
            if (match) {
                const operand = match[1].trim();
                condition = `${variable} < ${operand}`;
            }
            let incCode = `${variable}++`;
            return `for (let ${variable} = ${from}; ${condition}; ${incCode}) {\n${branch}}\n`;
        }

        const normFrom = `((v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; })(${from})`;
        const normTo = `((v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; })(${to})`;
        return `
    for (let ${variable} = ${normFrom}; ${variable} <= ${normTo}; ${variable}++) {
        ${branch}
    }
    `;
    };

    javascriptGenerator.forBlock["controls_forEach"] = function (block) {
        const variable = javascriptGenerator.nameDB_.getName(
            block.getFieldValue('VAR'), 'VARIABLE');
        const list = javascriptGenerator.valueToCode(block, 'LIST',
            javascriptGenerator.ORDER_ASSIGNMENT) || '[]';
        const branch = javascriptGenerator.statementToCode(block, 'DO');

        // Clean Mode
        if (javascriptGenerator.isCleanMode) {
            return `for (let ${variable} of ${list}) {\n${branch}}\n`;
        }

        return `
    const __list = ${list};
    if (Array.isArray(__list)) {
      for (let ${variable} of __list) {
        ${branch}
      }
    }
    \n`;
    };

    javascriptGenerator.forBlock["for_each_in_list"] = function (block) {
        const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
        const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
        const branch = javascriptGenerator.statementToCode(block, 'DO');

        // Clean Mode
        if (javascriptGenerator.isCleanMode) {
            return `for (let ${variable} of ${list}) {\n${branch}}\n`;
        }

        // Standard handling with async safety
        return `
        const __list = await ${list};
        if (Array.isArray(__list)) {
            for (let ${variable} of __list) {
                ${branch}
            }
        }
        `;
    };
    javascriptGenerator.forBlock["controls_flow_statements"] = function (block) {
        if (block.getFieldValue('FLOW') === 'BREAK') {
            return 'break;\n';
        } else {
            return 'continue;\n';
        }
    };
}
