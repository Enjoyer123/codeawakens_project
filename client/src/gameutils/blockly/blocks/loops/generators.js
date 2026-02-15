// Blockly Loop Generators
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

export function defineLoopGenerators() {
    javascriptGenerator.forBlock["repeat"] = function (block) {
        const times = block.getFieldValue('TIMES');
        const doCode = javascriptGenerator.statementToCode(block, 'DO');
        return `for (let i = 0; i < ${times}; i++) {\n${doCode}}\n`;
    };

    javascriptGenerator.forBlock["while_loop"] = function (block) {
        const condition = javascriptGenerator.valueToCode(block, 'CONDITION', javascriptGenerator.ORDER_NONE) || 'false';
        const doCode = javascriptGenerator.statementToCode(block, 'DO');

        // Clean Mode for Text Code Generation
        if (javascriptGenerator.isCleanMode) {
            // Strip outer parens if present to avoid ((condition))
            let cond = condition.trim();
            if (cond.startsWith('(') && cond.endsWith(')')) {
                cond = cond.slice(1, -1);
            }
            return `while (${cond}) {\n${doCode}}\n`;
        }

        return `while (${condition}) {\n${doCode}}\n`;
    };

    javascriptGenerator.forBlock["controls_for"] = function (block) {
        const variable = javascriptGenerator.nameDB_.getName(
            block.getFieldValue('VAR'), 'VARIABLE');
        const from = javascriptGenerator.valueToCode(block, 'FROM',
            javascriptGenerator.isCleanMode ? javascriptGenerator.ORDER_ATOMIC : javascriptGenerator.ORDER_ASSIGNMENT) || '0';
        const to = javascriptGenerator.valueToCode(block, 'TO',
            javascriptGenerator.isCleanMode ? javascriptGenerator.ORDER_ATOMIC : javascriptGenerator.ORDER_ASSIGNMENT) || '0';
        const increment = javascriptGenerator.valueToCode(block, 'BY',
            javascriptGenerator.isCleanMode ? javascriptGenerator.ORDER_ATOMIC : javascriptGenerator.ORDER_ASSIGNMENT) || '1';
        const branch = javascriptGenerator.statementToCode(block, 'DO');

        // Clean Mode for Text Code Generation
        if (javascriptGenerator.isCleanMode) {
            let innerTo = to.trim();
            if (innerTo.startsWith('(') && innerTo.endsWith(')')) {
                innerTo = innerTo.slice(1, -1).trim();
            }
            let condition = `${variable} <= ${to}`;
            // Optimization: if "to" is "X - 1" and increment is 1, use "i < X"
            if (increment === '1') {
                const match = innerTo.match(/^(.+)\s*-\s*1$/);
                if (match) {
                    const operand = match[1].trim();
                    condition = `${variable} < ${operand}`;
                }
            }
            let incCode = `${variable} += ${increment}`;
            if (increment === '1') incCode = `${variable}++`;
            return `for (let ${variable} = ${from}; ${condition}; ${incCode}) {\n${branch}}\n`;
        }

        return `for (let ${variable} = ${from}; ${variable} <= ${to}; ${variable} += ${increment}) {\n${branch}}\n`;
    };

    javascriptGenerator.forBlock["for_index"] = function (block) {
        const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
        const from = block.getFieldValue('FROM');
        const to = block.getFieldValue('TO');
        const branch = javascriptGenerator.statementToCode(block, 'DO');
        if (javascriptGenerator.isCleanMode) {
            return `for (let ${variable} = ${from}; ${variable} <= ${to}; ${variable}++) {\n${branch}}\n`;
        }
        return `
    for (let ${variable} = ${from}; ${variable} <= ${to}; ${variable}++) {
        ${branch}
    }
    `;
    };

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
