// Blockly Loop Generators
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

export function defineLoopGenerators() {

    javascriptGenerator.forBlock['controls_for'] = function(block) {
        // We override controls_for to use 'let' instead of 'var' so recursive functions (e.g., NQueen) safely isolated their loop variables.
        const variable0 = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
        const argument0 = javascriptGenerator.valueToCode(block, 'FROM', javascriptGenerator.ORDER_ASSIGNMENT) || '0';
        const argument1 = javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_ASSIGNMENT) || '0';
        const increment = javascriptGenerator.valueToCode(block, 'BY', javascriptGenerator.ORDER_ASSIGNMENT) || '1';
        let branch = javascriptGenerator.statementToCode(block, 'DO') || '';
        branch = javascriptGenerator.addLoopTrap(branch, block);
        
        let yieldStr = '';
        if (!javascriptGenerator.isCleanMode) {
            yieldStr = `if (typeof globalThis !== 'undefined' && globalThis.__isVisualRun !== false) await new Promise(r => setTimeout(r, 0));\n`;
            branch = yieldStr + branch;
        }

        let code = '';
        const up = parseFloat(increment) >= 0;
        
        // Clean mode (simplistic)
        if (javascriptGenerator.isCleanMode) {
            let op = up ? '<=' : '>=';
            let incCode = '';
            if (increment === '1') incCode = `${variable0}++`;
            else if (increment === '-1') incCode = `${variable0}--`;
            else incCode = `${variable0} += ${increment}`;
            
            // Optimization for NQueen: if to is "N - 1"
            let toStr = argument1;
            let innerTo = toStr.trim();
            if (innerTo.startsWith('(') && innerTo.endsWith(')')) innerTo = innerTo.slice(1, -1).trim();
            if (increment === '1' && innerTo.match(/^(.+)\s*-\s*1$/)) {
                op = '<';
                toStr = innerTo.match(/^(.+)\s*-\s*1$/)[1].trim();
            }
            code = `for (let ${variable0} = ${argument0}; ${variable0} ${op} ${toStr}; ${incCode}) {\n${branch}}\n`;
            return code;
        }

        // Standard execution mode (handles dynamic numbers properly)
        code = `
        for (let ${variable0} = Number(${argument0}); ${up ? `${variable0} <= Number(${argument1})` : `${variable0} >= Number(${argument1})`}; ${variable0} += Number(${increment})) {
            ${branch}
        }
        `;
        return code;
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

    // --- หุ้มเกราะป้องกัน Loop ว่างเปล่า (Sync Infinite Loop Starvation) ---
    const yieldCode = `if (typeof globalThis !== 'undefined' && globalThis.__isVisualRun !== false) await new Promise(r => setTimeout(r, 0));\n`;
    
    javascriptGenerator.forBlock['controls_whileUntil'] = function(block) {
        const until = block.getFieldValue('MODE') === 'UNTIL';
        const argument0 = javascriptGenerator.valueToCode(block, 'BOOL', until ? javascriptGenerator.ORDER_LOGICAL_NOT : javascriptGenerator.ORDER_NONE) || 'false';
        let branch = javascriptGenerator.statementToCode(block, 'DO') || '';
        branch = javascriptGenerator.addLoopTrap(branch, block);
        
        // ถ้าเป็นโหมดเล่นจริง ให้ฉีด Yield เข้าไปในทุกๆ รอบลูป
        if (!javascriptGenerator.isCleanMode) {
            branch = yieldCode + branch;
        }

        if (until) {
            return 'while (!(' + argument0 + ')) {\n' + branch + '}\n';
        } else {
            return 'while (' + argument0 + ') {\n' + branch + '}\n';
        }
    };

    javascriptGenerator.forBlock['controls_repeat_ext'] = function(block) {
        let repeats = javascriptGenerator.valueToCode(block, 'TIMES', javascriptGenerator.ORDER_ASSIGNMENT) || '0';
        let branch = javascriptGenerator.statementToCode(block, 'DO') || '';
        branch = javascriptGenerator.addLoopTrap(branch, block);

        if (!javascriptGenerator.isCleanMode) {
            branch = yieldCode + branch;
        }

        let code = '';
        const loopVar = javascriptGenerator.nameDB_.getDistinctName('count', Blockly.Names.NameType.VARIABLE);
        let endVar = repeats;
        if (!repeats.match(/^\w+$/) && !String(repeats).match(/^\d+$/)) {
            endVar = javascriptGenerator.nameDB_.getDistinctName('repeat_end', Blockly.Names.NameType.VARIABLE);
            code += 'const ' + endVar + ' = ' + repeats + ';\n';
        }
        code += 'for (let ' + loopVar + ' = 0; ' + loopVar + ' < ' + endVar + '; ' + loopVar + '++) {\n' +
            branch + '}\n';
        return code;
    };
}
