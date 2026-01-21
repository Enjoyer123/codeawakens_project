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
        const isPQCheck = condition.includes('PQ') || condition.includes('pq');
        const logTag = isPQCheck ? '[DEBUG-LOOP-PQ]' : '[DEBUG-LOOP-WHILE]';
        return `
    console.log('${logTag} Start condition:', ${condition});
    let __safety_loop_count = 0;
    while (${condition}) {
       __safety_loop_count++;
       if (__safety_loop_count > 1000) { 
         console.error('${logTag} Infinite loop detected!');
         break; 
       }
       ${doCode}
    }
    console.log('${logTag} End loop');
    \n`;
    };

    javascriptGenerator.forBlock["controls_for"] = function (block) {
        const variable = javascriptGenerator.nameDB_.getName(
            block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE);
        const from = javascriptGenerator.valueToCode(block, 'FROM',
            javascriptGenerator.ORDER_ASSIGNMENT) || '0';
        const to = javascriptGenerator.valueToCode(block, 'TO',
            javascriptGenerator.ORDER_ASSIGNMENT) || '0';
        const increment = javascriptGenerator.valueToCode(block, 'BY',
            javascriptGenerator.ORDER_ASSIGNMENT) || '1';
        const branch = javascriptGenerator.statementToCode(block, 'DO');

        return `
    console.log('[DEBUG-LOOP-FOR] Start:', { var: '${variable}', from: ${from}, to: ${to} });
    for (let ${variable} = ${from}; ${variable} <= ${to}; ${variable} += ${increment}) {
       ${branch}
    }
    console.log('[DEBUG-LOOP-FOR] End:', { var: '${variable}' });
    \n`;
    };

    javascriptGenerator.forBlock["for_index"] = function (block) {
        const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE);
        const from = block.getFieldValue('FROM');
        const to = block.getFieldValue('TO');
        const branch = javascriptGenerator.statementToCode(block, 'DO');
        return `
    for (let ${variable} = ${from}; ${variable} <= ${to}; ${variable}++) {
        ${branch}
    }
    `;
    };

    javascriptGenerator.forBlock["for_loop_dynamic"] = function (block) {
        const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE);
        const from = javascriptGenerator.valueToCode(block, 'FROM', javascriptGenerator.ORDER_ATOMIC) || '0';
        const to = javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_ATOMIC) || '0';
        const branch = javascriptGenerator.statementToCode(block, 'DO');
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
            block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE);
        const list = javascriptGenerator.valueToCode(block, 'LIST',
            javascriptGenerator.ORDER_ASSIGNMENT) || '[]';
        const branch = javascriptGenerator.statementToCode(block, 'DO');
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
        const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE);
        const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
        const branch = javascriptGenerator.statementToCode(block, 'DO');
        const listCode = list.trim();
        const isEdges = listCode.includes('edges') || listCode.includes('Edges');
        const varName = variable || block.getFieldValue('VAR') || 'item';
        const isEdgeData = varName.includes('edge') || varName.includes('Edge');
        const isAsync = list.includes('await');

        if (isAsync) {
            let code = `
      const listItems = await (${list});
      for (let i = 0; i < listItems.length; i++) {
          const ${variable} = listItems[i];`;
            if (isEdges && isEdgeData) {
                code += `
          if (Array.isArray(${variable}) && ${variable}.length >= 3) {
            const u = ${variable}[0];
            const v = ${variable}[1];
            const weight = ${variable}[2];
            const currentState = getCurrentGameState();
            if (currentState && currentState.currentScene) {
              await highlightKruskalEdge(currentState.currentScene, u, v, weight, 800);
            }
          }`;
            }
            code += `
          ${branch}
      }
      `;
            return code;
        } else {
            let code = `
      const listItems = await ${list};
      for (let i = 0; i < (listItems ? listItems.length : 0); i++) {
          const ${variable} = listItems[i];`;
            if (isEdges && isEdgeData) {
                code += `
          if (Array.isArray(${variable}) && ${variable}.length >= 3) {
            const u = ${variable}[0];
            const v = ${variable}[1];
            const weight = ${variable}[2];
            const currentState = getCurrentGameState();
            if (currentState && currentState.currentScene) {
              await highlightKruskalEdge(currentState.currentScene, u, v, weight, 800);
            }
          }`;
            }
            code += `
          ${branch}
      }
      `;
            return code;
        }
    };
}
