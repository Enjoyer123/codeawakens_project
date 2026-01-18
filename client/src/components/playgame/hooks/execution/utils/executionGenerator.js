import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";
import { defineAllGenerators } from '../../../../../gameutils/utils/blockly/core/blocklyGenerators';

export const setupCustomGenerator = (currentLevel) => {
    // CRITICAL: Check what generator is currently set (likely default Blockly generator)
    const currentGen = javascriptGenerator.forBlock["procedures_defreturn"];
    console.log('[useCodeExecution] Current generator before override:', currentGen?.toString().substring(0, 150));

    // CRITICAL: Define custom generator function that will be used
    const customProcGen = function (block) {
        console.log('[CUSTOM GENERATOR] ════════════════════════════════════════════');
        console.log('[CUSTOM GENERATOR] procedures_defreturn called - THIS MUST APPEAR!');
        const name = javascriptGenerator.nameDB_.getName(
            block.getFieldValue('NAME') || 'unnamed',
            Blockly.Names.NameType.PROCEDURE
        );
        console.log('[CUSTOM GENERATOR] Function name:', name);
        const args = [];
        // Ensure generator has a variable map and is initialized for this workspace
        try {
            if (javascriptGenerator.nameDB_ && block.workspace && block.workspace.getVariableMap) {
                javascriptGenerator.nameDB_.setVariableMap(block.workspace.getVariableMap());
            }
            if (typeof javascriptGenerator.init === 'function' && block.workspace) {
                javascriptGenerator.init(block.workspace);
            }
        } catch (e) {
            console.warn('[CUSTOM GENERATOR] Could not init generator nameDB or init:', e);
        }
        // Read function parameters ONLY from mutation DOM
        try {
            if (block.mutationToDom) {
                const mutation = block.mutationToDom();
                if (mutation) {
                    const argNodes = mutation.querySelectorAll ? mutation.querySelectorAll('arg') : mutation.getElementsByTagName('arg');
                    console.log('[CUSTOM GENERATOR] Mutation DOM arg nodes:', argNodes.length);
                    for (let i = 0; i < argNodes.length; i++) {
                        const argNode = argNodes[i];
                        const argName = argNode.getAttribute('name');
                        if (argName) {
                            args[i] = javascriptGenerator.nameDB_.getName(
                                argName,
                                Blockly.Names.NameType.VARIABLE
                            );
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('[CUSTOM GENERATOR] Error reading mutation DOM arguments:', e);
        }

        let argsString = '';
        if (args.length > 0) {
            argsString = args.join(', ');
        }
        console.log('[CUSTOM GENERATOR] Args string:', argsString);

        // Add parameter validation for knapsack function
        let paramValidation = '';
        if (name.toLowerCase().includes('knapsack') && args.length === 4) {
            // Check if capacity is valid (not undefined or null)
            const capacityVar = args[0]; // Assuming first arg is capacity or we check all
            paramValidation = `
  if (${capacityVar} === undefined || ${capacityVar} === null) { 
      console.warn('Knapsack called with undefined/null capacity, returning 0');
      return 0; 
  }
`;
        }

        // Add variable declarations for coinChange function
        let localVarDeclarations = '';
        if (name.toLowerCase().includes('coinchange')) {
            // Ensure local variables are declared if they might be missing
            // This is a safety measure
        }

        let branch = javascriptGenerator.statementToCode(block, 'STACK');

        // Sanitize branch: remove stray returns that may be duplicated by Blockly fragments
        try {
            branch = branch.replace(/return\s*;\s*$/gm, '');
            // Only remove "return solution;" if it's strictly just that line
            // branch = branch.replace(/^\s*return\s+solution\s*;\s*$/gm, '');
        } catch (e) {
            console.warn('[CUSTOM GENERATOR] Error sanitizing branch:', e);
        }

        // CRITICAL FIX: For N-Queen solve function, manually process next connections
        // if Blockly's default generator fails to traverse them (common issue with recursive blocks)
        if (currentLevel?.nqueenData && name.toLowerCase().includes('solve')) {
            console.log('[CUSTOM GENERATOR] 🔍 Checking N-Queen solve function branch...');
            console.log('[CUSTOM GENERATOR] 🔍 Branch (first 500 chars):', branch.substring(0, 500));

            // Check if branch contains the recursive case (the loop)
            const hasRecursiveCase = branch.includes('for (let') || branch.includes('solve(') || branch.includes('const fromValue');
            console.log('[CUSTOM GENERATOR] 🔍 Branch has recursive case:', hasRecursiveCase);

            if (!hasRecursiveCase) {
                console.warn('[CUSTOM GENERATOR] ⚠️ N-Queen solve function MISSING recursive case! Attempting manual recovery...');

                // Manually walk the 'STACK' connection
                let nextCode = '';
                const stackInput = block.getInput('STACK');
                if (stackInput && stackInput.connection) {
                    let currentBlock = stackInput.connection.targetBlock();

                    // Specific logic for if_only pattern often used in N-Queen
                    if (currentBlock) {
                        console.log('[CUSTOM GENERATOR] 🔧 Found first block in STACK:', currentBlock.type);

                        // If it's an if_only block (base case), check what's AFTER it
                        if (currentBlock.type === 'logic_if_only' || currentBlock.type === 'controls_if') {
                            // The recursive part should be AFTER the if block (nextConnection)
                            if (currentBlock.nextConnection && currentBlock.nextConnection.targetBlock()) {
                                console.log('[CUSTOM GENERATOR] 🔧 Found block AFTER if_only/base case - processing manually...');
                                currentBlock = currentBlock.nextConnection.targetBlock();

                                // Process this block and subsequent blocks
                                while (currentBlock) {
                                    try {
                                        const blockCode = javascriptGenerator.blockToCode(currentBlock);
                                        if (blockCode) {
                                            const codeStr = typeof blockCode === 'string' ? blockCode : (Array.isArray(blockCode) ? blockCode[0] : '');
                                            if (codeStr && codeStr.trim()) {
                                                nextCode += codeStr;
                                                console.log('[CUSTOM GENERATOR] 🔧 Processed next block:', currentBlock.type, '- code length:', codeStr.length);
                                            }
                                        }
                                    } catch (e) {
                                        console.warn('[CUSTOM GENERATOR] Error processing next block:', currentBlock.type, e);
                                    }

                                    // Move to next block in chain
                                    if (currentBlock.nextConnection && currentBlock.nextConnection.targetBlock()) {
                                        currentBlock = currentBlock.nextConnection.targetBlock();
                                    } else {
                                        break;
                                    }
                                }

                                if (nextCode.trim()) {
                                    branch += nextCode;
                                    console.log('[CUSTOM GENERATOR] ✅ Added next code, new branch length:', branch.length);
                                    console.log('[CUSTOM GENERATOR] ✅ Next code preview:', nextCode.substring(0, 500));
                                } else {
                                    console.warn('[CUSTOM GENERATOR] ⚠️ No code generated from next blocks');
                                }
                            } else {
                                console.warn('[CUSTOM GENERATOR] ⚠️ if_only block has no next connection');
                            }
                        } else {
                            console.warn('[CUSTOM GENERATOR] ⚠️ STACK first block is not if_only or doesn\'t exist');
                        }
                    }

                    // Check again after fix - relaxed check for any recursive call pattern
                    const hasRecursiveCaseAfter = branch.includes('for (let') || branch.includes('solve(') || branch.includes('solve (') || branch.includes('const fromValue');
                    console.log('[CUSTOM GENERATOR] 🔍 Branch has recursive case (after fix):', hasRecursiveCaseAfter);
                    if (!hasRecursiveCaseAfter) {
                        console.error('[CUSTOM GENERATOR] ❌ ERROR: Branch still missing recursive case after fix!');
                        console.error('[CUSTOM GENERATOR] ❌ Final branch length:', branch.length);
                        console.error('[CUSTOM GENERATOR] ❌ Final branch last 500 chars:', branch.substring(Math.max(0, branch.length - 500)));
                    }
                }
            }
        }

        if (!branch || branch.trim().length === 0) {
            console.warn('[CUSTOM GENERATOR] ⚠️ WARNING: Function body is EMPTY! This will cause function to return undefined.');
            console.warn('[CUSTOM GENERATOR] Block type:', block.type);
            console.warn('[CUSTOM GENERATOR] Block ID:', block.id);
            console.warn('[CUSTOM GENERATOR] Block connections:', {
                hasInput: !!block.getInput('STACK'),
                hasNext: !!block.getNextBlock(),
                childBlocks: block.getChildren().map(c => ({ type: c.type, id: c.id }))
            });
        }

        // Generate return statement if any
        const returnValue = javascriptGenerator.valueToCode(block, 'RETURN', javascriptGenerator.ORDER_NONE) || '';
        const returnStatement = returnValue ? `  return ${returnValue};\n` : '';

        // Generate async function with Safety Yield (conditional)
        // Skip yield if __isVisualRun is false (background testing)

        // Safety Step Limit: Increment and check counter
        const stepLimitCode = "if (typeof globalThis !== 'undefined') { globalThis.__stepCount = (globalThis.__stepCount || 0) + 1; if (globalThis.__stepCount > 5000000) throw new Error('Infinite Loop / Recursion Limit Exceeded (5M steps)'); }";
        const code = `async function ${name}(${argsString}) {\n  if (typeof globalThis !== 'undefined' && globalThis.__isVisualRun !== false) await new Promise(r => setTimeout(r, 0));\n  ${stepLimitCode}\n${paramValidation}${localVarDeclarations}${branch}${returnStatement}}`;
        console.error('[CUSTOM GENERATOR] Generated code preview:', code);
        return code;
    };

    // CRITICAL: Use Object.defineProperty to force override generator
    // This ensures the generator cannot be easily overridden by default Blockly generator
    try {
        delete javascriptGenerator.forBlock["procedures_defreturn"];
    } catch (e) {
        console.warn('[useCodeExecution] Could not delete generator:', e);
    }

    // Use Object.defineProperty for maximum control
    Object.defineProperty(javascriptGenerator.forBlock, "procedures_defreturn", {
        value: customProcGen,
        writable: true,
        configurable: true,
        enumerable: true
    });

    // Also call defineAllGenerators (which also sets it)
    defineAllGenerators();

    // Override again after defineAllGenerators using Object.defineProperty
    Object.defineProperty(javascriptGenerator.forBlock, "procedures_defreturn", {
        value: customProcGen,
        writable: true,
        configurable: true,
        enumerable: true
    });

    // Verify override
    const afterOverride = javascriptGenerator.forBlock["procedures_defreturn"];
    const isCustom = afterOverride === customProcGen;
    console.log('[useCodeExecution] Generator override complete');
    console.log('[useCodeExecution] Generator is custom (=== check):', isCustom);
    console.log('[useCodeExecution] Generator function preview:', afterOverride?.toString().substring(0, 150));

    return customProcGen;
};

export const verifyGenerator = (workspaceRef) => {
    // Get all procedure definition blocks to check what we're generating
    if (!workspaceRef.current) return;

    const procBlocks = workspaceRef.current.getAllBlocks().filter(b => b.type === 'procedures_defreturn');
    console.log('[useCodeExecution] Found procedure definition blocks:', procBlocks.length);
    procBlocks.forEach(block => {
        const blockName = block.getFieldValue('NAME');
        console.log('[useCodeExecution] Procedure block:', blockName);
        if (block.mutationToDom) {
            const mutation = block.mutationToDom();
            if (mutation) {
                const args = mutation.querySelectorAll ? mutation.querySelectorAll('arg') : mutation.getElementsByTagName('arg');
                console.log('[useCodeExecution] Procedure block args count:', args.length);
                for (let i = 0; i < args.length; i++) {
                    console.log('[useCodeExecution] Arg', i, ':', args[i].getAttribute('name'));
                }
            }
        }
    });
};
