/**
 * Hook for code execution logic
 */

// Removed unused imports: useState, useRef
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";
import { defineAllGenerators } from '../../../gameutils/utils/blockly/blocklyGenerators';
import {
  getCurrentGameState,
  setCurrentGameState,
  resetPlayerHp,
  clearPlayerCoins,
  clearRescuedPeople,
  resetAllPeople,
  clearStack,
  getPlayerHp
} from '../../../gameutils/utils/gameUtils';
import { updatePlayer, showGameOver, showVictory } from '../../../gameutils/utils/phaserGame';
import { resetEnemy } from '../../../gameutils/phaser/utils/enemyUtils';
import { checkVictoryConditions, generateVictoryHint } from '../../../gameutils/utils/gameUtils';
import { calculateFinalScore } from '../utils/scoreUtils';
import { extractFunctionName, checkTestCases } from '../../../gameutils/utils/testCaseUtils';
import { getGraphNeighbors as getGraphNeighborsNoVisual, getGraphNeighborsWithWeight as getGraphNeighborsWithWeightNoVisual } from '../../../gameutils/utils/blockly/blocklyHelpers';
import {
  collectCoin, haveCoin, getCoinCount, getCoinValue, swapCoins, compareCoins, isSorted,
  rescuePersonAtNode, hasPerson, personRescued, getPersonCount, moveToNode, moveAlongPath,
  getCurrentNode, getGraphNeighbors, getGraphNeighborsWithWeight, getNodeValue,
  getGraphNeighborsWithVisual, getGraphNeighborsWithVisualSync, getGraphNeighborsWithWeightWithVisualSync,
  markVisitedWithVisual, showPathUpdateWithVisual, clearDfsVisuals, showMSTEdges,
  findMinIndex, getAllEdges, sortEdgesByWeight, dsuFind, dsuUnion, showMSTEdgesFromList,
  updateDijkstraVisited, updateDijkstraPQ, updateMSTWeight, resetDijkstraState,
  pushNode, popNode, keepItem, hasTreasure, treasureCollected, stackEmpty, stackCount,
  selectKnapsackItemVisual, unselectKnapsackItemVisual, resetKnapsackItemsVisual,
  knapsackMaxWithVisual,
  resetKnapsackSelectionTracking, startKnapsackSelectionTracking, showKnapsackFinalSelection,
  addWarriorToSide1Visual, addWarriorToSide2Visual, resetSubsetSumWarriorsVisual,
  startSubsetSumTrackingVisual, showSubsetSumFinalSolutionVisual, resetSubsetSumTrackingVisual,
  addWarriorToSelectionVisual, resetCoinChangeVisualDisplay,
  resetCoinChangeSelectionTracking, startCoinChangeSelectionTracking, trackCoinChangeDecision, showCoinChangeFinalSolution
} from '../../../gameutils/utils/blocklyUtils';
import {
  highlightKruskalEdge, showKruskalRoot, clearKruskalVisuals
} from '../../../gameutils/utils/blockly/blocklyDfsVisual';
import {
  getPlayerCoins, addCoinToPlayer, clearPlayerCoins as clearPlayerCoinsUtil,
  swapPlayerCoins, comparePlayerCoins, getPlayerCoinValue, getPlayerCoinCount,
  arePlayerCoinsSorted, allPeopleRescued
} from '../../../gameutils/utils/gameUtils';
import {
  getStack, pushToStack, popFromStack, isStackEmpty, getStackCount,
  hasTreasureAtNode, collectTreasure, isTreasureCollected
} from '../../../gameutils/utils/gameUtils';

/**
 * Hook for code execution
 * @param {Object} params - Parameters object
 * @returns {Function} runCode function
 */
export function useCodeExecution({
  workspaceRef,
  currentLevel,
  setPlayerNodeId,
  setPlayerDirection,
  setPlayerHp,
  setIsCompleted,
  setIsRunning,
  setIsGameOver,
  setGameState,
  setCurrentHint,
  setShowProgressModal,
  setTimeSpent,
  setGameResult,
  setFinalScore,
  gameStartTime,
  setAttempts,
  setRescuedPeople,
  blocklyJavaScriptReady,
  codeValidation,
  isPreview,
  patternId,
  onUnlockPattern,
  onUnlockLevel,
  goodPatterns,
  hintOpenCount,
  moveForward,
  turnLeft,
  turnRight,
  hit,
  foundMonster,
  canMoveForward,
  nearPit,
  atGoal
}) {
  const runCode = async () => {
    console.log("runCode function called!");
    console.log("workspaceRef.current:", !!workspaceRef.current);
    console.log("getCurrentGameState().currentScene:", !!getCurrentGameState().currentScene);

    if (!workspaceRef.current || !getCurrentGameState().currentScene) {
      console.log("System not ready - early return");
      setCurrentHint("❌ ระบบยังไม่พร้อม");
      return;
    }

    // เช็ค code validation สำหรับด่านที่มี textcode: true
    if (currentLevel?.textcode && !blocklyJavaScriptReady) {
      setCurrentHint("❌ ระบบแปลงโค้ดยังไม่พร้อมใช้งาน กรุณารอสักครู่");
      return;
    }

    if (currentLevel?.textcode && !codeValidation.isValid) {
      setCurrentHint(`❌ ${codeValidation.message}`);
      return;
    }

    setIsRunning(true);
    setGameState("running");
    setIsCompleted(false);
    setIsGameOver(false);
    setCurrentHint("🏃 กำลังเรียกใช้โปรแกรม...");

    // Start timing the attempt
    gameStartTime.current = Date.now();
    setAttempts(prev => prev + 1);

    // Reset to start position และ sync HP
    setCurrentGameState({
      currentNodeId: currentLevel.startNodeId,
      direction: 0,
      goalReached: false,
      moveCount: 0,
      isGameOver: false,
      playerCoins: [] // ล้างเหรียญที่เก็บไว้
    });

    // IMPORTANT: Reset HP และ sync กับ React state
    resetPlayerHp(setPlayerHp);
    console.log("Game reset - HP set to:", getPlayerHp());

    // ล้างเหรียญที่เก็บไว้
    clearPlayerCoins();
    console.log("Game reset - Coins cleared");

    // ล้างข้อมูลคนที่ช่วยแล้ว
    clearRescuedPeople();
    setRescuedPeople([]);
    await resetAllPeople();
    console.log("Game reset - Rescued people cleared");

    // ล้างข้อมูล stack และสมบัติ
    clearStack();
    
    // Reset knapsack items to original positions
    if (currentLevel?.knapsackData) {
      resetKnapsackItemsVisual();
      console.log("Game reset - Knapsack items reset");
    }
    
    // Reset subset sum warriors to original positions
    if (currentLevel?.subsetSumData) {
      resetSubsetSumWarriorsVisual();
      console.log("Game reset - Subset Sum warriors reset");
    }
    
    console.log("Game reset - Stack and treasure cleared");

    // Reset Dijkstra state
    resetDijkstraState();
    console.log("Game reset - Dijkstra state cleared");

    // อัปเดตการแสดงผลสมบัติหลังจาก reset
    if (getCurrentGameState().currentScene) {
      import('../../../gameutils/utils/phaser/phaserCollection').then(({ updateTreasureDisplay }) => {
        updateTreasureDisplay(getCurrentGameState().currentScene);
      });
    }

    // รีเซ็ตเหรียญในเกมให้กลับมาแสดง
    if (getCurrentGameState().currentScene) {
      // รีเซ็ตเหรียญที่เก็บไว้แล้วให้กลับมาแสดง
      if (getCurrentGameState().currentScene.coins) {
        getCurrentGameState().currentScene.coins.forEach(coin => {
          coin.collected = false;
          coin.sprite.setVisible(true);
          const valueText = coin.sprite.getData('valueText');
          const glow = coin.sprite.getData('glow');
          if (valueText) valueText.setVisible(true);
          if (glow) glow.setVisible(true);
        });
        console.log("Game reset - Coins reset in scene (showing all coins)");
      }

      // รีเซ็ตคนที่ถูกช่วยไว้ให้กลับมาแสดง
      if (getCurrentGameState().currentScene.people) {
        getCurrentGameState().currentScene.people.forEach(person => {
          person.setVisible(true);
          if (person.nameLabel) {
            person.nameLabel.setVisible(true);
          }
          if (person.rescueEffect) {
            person.rescueEffect.setVisible(true);
          }
        });
        console.log("Game reset - People reset in scene (showing all people)");
      }

      // รีเซ็ตสมบัติที่เก็บไว้ให้กลับมาแสดง
      if (getCurrentGameState().currentScene.treasures) {
        getCurrentGameState().currentScene.treasures.forEach(treasure => {
          treasure.setVisible(true);
          if (treasure.nameLabel) {
            treasure.nameLabel.setVisible(true);
          }
          if (treasure.glowEffect) {
            treasure.glowEffect.setVisible(true);
          }
        });
        console.log("Game reset - Treasures reset in scene (showing all treasures)");
      }
    }

    // Clear DFS visual feedback before starting
    const currentScene = getCurrentGameState().currentScene;
    if (currentScene) {
      clearDfsVisuals(currentScene);
    }

    // Reset monsters state using new utility functions
    if (getCurrentGameState().currentScene && getCurrentGameState().currentScene.monsters) {
      getCurrentGameState().currentScene.monsters.forEach(monster => {
        monster.data.defeated = false;
        monster.data.inBattle = false;
        monster.data.isChasing = false;
        monster.data.lastAttackTime = null;
        monster.data.hp = 3;

        // Use new utility function to reset enemy
        resetEnemy(monster.sprite, monster.sprite.x, monster.sprite.y);
        if (monster.glow) {
          monster.glow.setVisible(true);
          monster.glow.setFillStyle(0xff0000, 0.2);
        }
        if (monster.sprite.anims) {
          monster.sprite.anims.play('vampire-idle', true);
        }
      });
    }

    setPlayerNodeId(currentLevel.startNodeId);
    setPlayerDirection(0);
    
    // Set direction in game state first
    setCurrentGameState({ direction: 0 });

    // Update player position in Phaser (HP bar now handled in bottom UI)
    // Pass direction 0 (right) explicitly to ensure correct initial direction
    if (getCurrentGameState().currentScene) {
      const scene = getCurrentGameState().currentScene;
      if (scene.player) {
        scene.player.directionIndex = 0;
        scene.player.currentNodeIndex = currentLevel.startNodeId;
      }
      updatePlayer(scene, currentLevel.startNodeId, 0);
    }

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
        console.log('[CUSTOM GENERATOR] Final args:', args);
      } catch (e) {
        console.error('[CUSTOM GENERATOR] Error reading function parameters:', e);
      }
      
      // Add parameter validation for knapsack function
      let paramValidation = '';
      if (name.toLowerCase().includes('knapsack') && args.length === 4) {
        paramValidation = `
          if (!Array.isArray(${args[0]}) || !Array.isArray(${args[1]}) || 
              typeof ${args[2]} !== 'number' || isNaN(${args[2]}) ||
              typeof ${args[3]} !== 'number' || isNaN(${args[3]})) {
            console.error('knapsack: Invalid parameters', { w: ${args[0]}, v: ${args[1]}, i: ${args[2]}, j: ${args[3]} });
            return 0;
          }
        `;
      }
      
      // Add variable declarations for coinChange function
      let localVarDeclarations = '';
      if (name.toLowerCase().includes('coinchange')) {
        const includeVar = javascriptGenerator.nameDB_.getName('include', Blockly.Names.NameType.VARIABLE);
        const excludeVar = javascriptGenerator.nameDB_.getName('exclude', Blockly.Names.NameType.VARIABLE);
        const includeResultVar = javascriptGenerator.nameDB_.getName('includeResult', Blockly.Names.NameType.VARIABLE);
        localVarDeclarations = `let ${includeVar}, ${excludeVar}, ${includeResultVar};\n`;
      }
      
      const argsString = args.length > 0 ? args.join(', ') : '';
      let branch = javascriptGenerator.statementToCode(block, 'STACK');
      
      console.log('[CUSTOM GENERATOR] Function body (branch) length:', branch.length);
      console.log('[CUSTOM GENERATOR] Function body (branch) preview:', branch.substring(0, 500));
      console.log('[CUSTOM GENERATOR] Function body (branch) last 500 chars:', branch.substring(Math.max(0, branch.length - 500)));
      
      // CRITICAL FIX: For N-Queen solve function, manually process next connections
      // statementToCode processes next connections of blocks in the statement,
      // but it doesn't process next connections of blocks that have their own statements (like if_only)
      if (name.toLowerCase().includes('solve')) {
        const hasRecursiveCase = branch.includes('for (let col') || branch.includes('const fromValue = 0');
        console.log('[CUSTOM GENERATOR] 🔍 Branch has recursive case (before fix):', hasRecursiveCase);
        
        if (!hasRecursiveCase) {
          console.warn('[CUSTOM GENERATOR] ⚠️ Branch missing recursive case, attempting to manually process next connections...');
          
          // Get the first block in STACK
          const stackBlock = block.getInputTargetBlock('STACK');
          console.log('[CUSTOM GENERATOR] 🔍 STACK block:', {
            hasStackBlock: !!stackBlock,
            stackBlockType: stackBlock?.type,
            stackBlockId: stackBlock?.id
          });
          
          if (stackBlock && stackBlock.type === 'if_only') {
            console.log('[CUSTOM GENERATOR] 🔍 Found if_only block in STACK, checking next connection...');
            
            // Check if if_only block has a next connection (this should contain the recursive case)
            const hasNextConnection = stackBlock.nextConnection && stackBlock.nextConnection.targetBlock();
            console.log('[CUSTOM GENERATOR] 🔍 if_only block next connection:', {
              hasNextConnection: !!hasNextConnection,
              nextBlockType: hasNextConnection?.type,
              nextBlockId: hasNextConnection?.id
            });
            
            if (hasNextConnection) {
              const nextBlock = stackBlock.nextConnection.targetBlock();
              console.log('[CUSTOM GENERATOR] 🔍 Found next block after if_only:', nextBlock.type, nextBlock.id);
              
              // Generate code for next blocks manually
              let nextCode = '';
              let currentBlock = nextBlock;
              let processedIds = new Set();
              
              while (currentBlock && !processedIds.has(currentBlock.id)) {
                processedIds.add(currentBlock.id);
                
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
        
        // Check again after fix
        const hasRecursiveCaseAfter = branch.includes('for (let col') || branch.includes('const fromValue = 0');
        console.log('[CUSTOM GENERATOR] 🔍 Branch has recursive case (after fix):', hasRecursiveCaseAfter);
        if (!hasRecursiveCaseAfter) {
          console.error('[CUSTOM GENERATOR] ❌ ERROR: Branch still missing recursive case after fix!');
          console.error('[CUSTOM GENERATOR] ❌ Final branch length:', branch.length);
          console.error('[CUSTOM GENERATOR] ❌ Final branch last 500 chars:', branch.substring(Math.max(0, branch.length - 500)));
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
      
      // Generate async function
      const code = `async function ${name}(${argsString}) {\n${paramValidation}${localVarDeclarations}${branch}}`;
      console.log('[CUSTOM GENERATOR] Generated code preview:', code.substring(0, 500));
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
    
    // Get all procedure definition blocks to check what we're generating
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
    
    // Generate code with our custom generator guaranteed to be in place
    let code = '';
    try {
      // One final override before generating using Object.defineProperty
      Object.defineProperty(javascriptGenerator.forBlock, "procedures_defreturn", {
        value: customProcGen,
        writable: true,
        configurable: true,
        enumerable: true
      });
      
      // Double-check before generating
      const finalCheck = javascriptGenerator.forBlock["procedures_defreturn"];
      const finalCheckStr = finalCheck?.toString() || '';
      const isOurCustomGen = finalCheckStr.includes('CUSTOM GENERATOR');
      console.log('[useCodeExecution] Final check before workspaceToCode - is custom:', isOurCustomGen);
      console.log('[useCodeExecution] Final check - generator preview:', finalCheckStr.substring(0, 200));
      
      // If generator is not our custom one, try one more override
      if (!isOurCustomGen) {
        console.error('[useCodeExecution] WARNING: Generator is NOT our custom one! Forcing override again...');
        Object.defineProperty(javascriptGenerator.forBlock, "procedures_defreturn", {
          value: customProcGen,
          writable: true,
          configurable: true,
          enumerable: true
        });
      }
      
      code = javascriptGenerator.workspaceToCode(workspaceRef.current);
    } catch (e) {
      console.error('[useCodeExecution] Error generating code:', e);
      throw e;
    }
    
    // Log the generated code to see what's actually being generated
    console.log('[useCodeExecution] ✅ Code generation completed!');
    console.log('[useCodeExecution] Generated code preview (before fix):', code.substring(0, 1500));
    console.log('[useCodeExecution] Full generated code length:', code.length);
    console.log('[useCodeExecution] Generated code (last 500 chars):', code.substring(Math.max(0, code.length - 500)));
    
    // CRITICAL FIX: Check if this is N-Queen problem (has solve function and references to n/board)
    const hasSolve = code.includes('async function solve');
    const hasN = code.includes('var n') || code.includes('let n') || code.includes('n =') || code.includes('nqueen') || /\bn\b/.test(code);
    // Check for board - more comprehensive pattern (check for any reference to board variable)
    const hasBoard = code.includes('var board') || 
                     code.includes('let board') || 
                     code.includes('board[') || 
                     code.includes('board[i]') || 
                     code.includes('listVar = board') ||
                     code.includes('= board') ||
                     code.includes(' board') ||
                     /\bboard\b/.test(code);
    const isNQueenProblem = hasSolve && hasN && hasBoard;
    
    console.log('[useCodeExecution] 🔍 N-Queen detection:', {
      hasSolve,
      hasN,
      hasBoard,
      isNQueenProblem,
      hasForCol: code.includes('for (let col'),
      codeLength: code.length
    });
    
    // CRITICAL FIX: If N-Queen problem and missing recursive case, manually extract from workspace
    if (isNQueenProblem && !code.includes('for (let col')) {
      console.warn('[useCodeExecution] ⚠️ N-Queen code missing recursive case, attempting to extract from workspace...');
      console.log('[useCodeExecution] 🔍 Current code (first 1000 chars):', code.substring(0, 1000));
      console.log('[useCodeExecution] 🔍 Current code (last 500 chars):', code.substring(Math.max(0, code.length - 500)));
      
      try {
        // Find the solve function definition block
        const solveBlocks = workspaceRef.current.getBlocksByType('procedures_defreturn', false);
        console.log('[useCodeExecution] 🔍 Found procedures_defreturn blocks:', solveBlocks.length);
        
        const solveBlock = solveBlocks.find(b => {
          const name = b.getFieldValue('NAME');
          console.log('[useCodeExecution] 🔍 Checking block name:', name);
          return name && name.toLowerCase().includes('solve');
        });
        
        console.log('[useCodeExecution] 🔍 Found solve block:', !!solveBlock);
        
        if (solveBlock) {
          // Get the first block in STACK (should be if_only)
          const stackBlock = solveBlock.getInputTargetBlock('STACK');
          console.log('[useCodeExecution] 🔍 STACK block:', {
            exists: !!stackBlock,
            type: stackBlock?.type,
            id: stackBlock?.id
          });
          
          if (stackBlock && stackBlock.type === 'if_only') {
            // Check if if_only has a next connection (recursive case)
            console.log('[useCodeExecution] 🔍 Checking nextConnection:', {
              hasNextConnection: !!stackBlock.nextConnection,
              nextConnectionType: stackBlock.nextConnection?.type,
              nextConnectionTarget: !!stackBlock.nextConnection?.targetBlock(),
              nextConnectionTargetType: stackBlock.nextConnection?.targetBlock()?.type,
              nextConnectionTargetId: stackBlock.nextConnection?.targetBlock()?.id
            });
            
            const nextBlock = stackBlock.nextConnection?.targetBlock();
            console.log('[useCodeExecution] 🔍 Next block after if_only:', {
              exists: !!nextBlock,
              type: nextBlock?.type,
              id: nextBlock?.id
            });
            
            // Also try to get next block via different methods if targetBlock() doesn't work
            let actualNextBlock = nextBlock;
            if (!actualNextBlock && stackBlock.nextConnection) {
              // Method 1: Try targetConnection.getSourceBlock()
              const targetConnection = stackBlock.nextConnection.targetConnection;
              if (targetConnection) {
                actualNextBlock = targetConnection.getSourceBlock();
                console.log('[useCodeExecution] 🔍 Found next block via targetConnection.getSourceBlock():', {
                  exists: !!actualNextBlock,
                  type: actualNextBlock?.type,
                  id: actualNextBlock?.id
                });
              }
              
              // Method 2: If still not found, try to find all blocks and check which one connects to this block
              if (!actualNextBlock) {
                console.log('[useCodeExecution] 🔍 Trying to find next block by scanning all blocks...');
                const allBlocks = workspaceRef.current.getAllBlocks(false);
                console.log('[useCodeExecution] 🔍 Total blocks in workspace:', allBlocks.length);
                
                for (const block of allBlocks) {
                  // Check if this block has a previous connection that connects to stackBlock
                  if (block.previousConnection) {
                    const targetConn = block.previousConnection.targetConnection;
                    if (targetConn) {
                      const sourceBlock = targetConn.getSourceBlock ? targetConn.getSourceBlock() : (targetConn.sourceBlock_ || null);
                      if (sourceBlock && sourceBlock.id === stackBlock.id) {
                        actualNextBlock = block;
                        console.log('[useCodeExecution] 🔍 Found next block by scanning (matched by id):', {
                          type: actualNextBlock?.type,
                          id: actualNextBlock?.id,
                          varField: actualNextBlock?.getFieldValue('VAR')
                        });
                        break;
                      }
                    }
                  }
                }
                
                // Method 3: If still not found, try to find for_loop_dynamic with VAR='col' near the solve function
                if (!actualNextBlock) {
                  console.log('[useCodeExecution] 🔍 Trying to find for_loop_dynamic with VAR=col...');
                  for (const block of allBlocks) {
                    if (block.type === 'for_loop_dynamic' && block.getFieldValue('VAR') === 'col') {
                      // Check if it's in the same function (has solve block as ancestor)
                      let parent = block.getSurroundParent();
                      let isInSolveFunction = false;
                      while (parent) {
                        if (parent.type === 'procedures_defreturn' && parent.getFieldValue('NAME')?.toLowerCase().includes('solve')) {
                          isInSolveFunction = true;
                          break;
                        }
                        parent = parent.getSurroundParent();
                      }
                      
                      if (isInSolveFunction) {
                        actualNextBlock = block;
                        console.log('[useCodeExecution] 🔍 Found for_loop_dynamic (col) in solve function:', {
                          type: actualNextBlock?.type,
                          id: actualNextBlock?.id
                        });
                        break;
                      }
                    }
                  }
                }
              }
            }
            
            if (actualNextBlock) {
              // Generate code for next blocks
              // CRITICAL: Only extract the first for_loop_dynamic block (recursive case)
              // Don't extract nested loops or duplicate code
              let nextCode = '';
              let currentBlock = actualNextBlock;
              let processedIds = new Set();
              let foundForLoop = false;
              
              while (currentBlock && !processedIds.has(currentBlock.id)) {
                processedIds.add(currentBlock.id);
                console.log('[useCodeExecution] 🔧 Processing block:', currentBlock.type, currentBlock.id);
                
                // Check if this is the for_loop_dynamic for col (recursive case)
                if (currentBlock.type === 'for_loop_dynamic') {
                  const varField = currentBlock.getField('VAR');
                  const varName = varField ? varField.getValue() : null;
                  console.log('[useCodeExecution] 🔍 Found for_loop_dynamic with VAR:', varName);
                  
                  if (varName === 'col' || varName?.toLowerCase().includes('col')) {
                    console.log('[useCodeExecution] ✅ Found recursive case loop (for col)');
                    foundForLoop = true;
                    
                    try {
                      // Before generating code, we need to ensure nameDB_ has the correct mappings
                      // Get actual variable names from workspace for n, board, solution
                      const nVar = workspaceRef.current.getVariable('n');
                      const boardVar = workspaceRef.current.getVariable('board');
                      const solutionVar = workspaceRef.current.getVariable('solution');
                      
                      if (nVar) {
                        const nName = javascriptGenerator.nameDB_.getName(nVar.getId(), Blockly.Names.NameType.VARIABLE);
                        console.log('[useCodeExecution] 🔍 n variable ID:', nVar.getId(), '-> name:', nName);
                      }
                      if (boardVar) {
                        const boardName = javascriptGenerator.nameDB_.getName(boardVar.getId(), Blockly.Names.NameType.VARIABLE);
                        console.log('[useCodeExecution] 🔍 board variable ID:', boardVar.getId(), '-> name:', boardName);
                      }
                      if (solutionVar) {
                        const solutionName = javascriptGenerator.nameDB_.getName(solutionVar.getId(), Blockly.Names.NameType.VARIABLE);
                        console.log('[useCodeExecution] 🔍 solution variable ID:', solutionVar.getId(), '-> name:', solutionName);
                      }
                      
                      // Generate code for the for_loop_dynamic block only
                      // This will include all nested blocks (if_only, place, solve, remove, etc.)
                      const blockCode = javascriptGenerator.blockToCode(currentBlock);
                      if (blockCode) {
                        const codeStr = typeof blockCode === 'string' ? blockCode : (Array.isArray(blockCode) ? blockCode[0] : '');
                        if (codeStr && codeStr.trim()) {
                          nextCode += codeStr;
                          console.log('[useCodeExecution] 🔧 Generated code for recursive case loop:', currentBlock.type, '- length:', codeStr.length);
                          console.log('[useCodeExecution] 🔧 Generated code preview (first 500):', codeStr.substring(0, 500));
                          console.log('[useCodeExecution] 🔧 Generated code preview (last 500):', codeStr.substring(Math.max(0, codeStr.length - 500)));
                          
                          // Check if code has duplicate fromValue declarations
                          const fromValueMatches = codeStr.match(/\bconst\s+fromValue\b/g);
                          if (fromValueMatches && fromValueMatches.length > 1) {
                            console.warn('[useCodeExecution] ⚠️ WARNING: Recursive case has multiple fromValue declarations:', fromValueMatches.length);
                            console.warn('[useCodeExecution] ⚠️ This may cause "Identifier already declared" errors');
                          }
                        }
                      }
                    } catch (e) {
                      console.warn('[useCodeExecution] Error generating code for recursive case loop:', currentBlock.type, e);
                    }
                    
                    // Stop after finding the recursive case loop
                    break;
                  }
                }
                
                // If we haven't found the recursive case loop yet, continue
                if (!foundForLoop) {
                  try {
                    const blockCode = javascriptGenerator.blockToCode(currentBlock);
                    if (blockCode) {
                      const codeStr = typeof blockCode === 'string' ? blockCode : (Array.isArray(blockCode) ? blockCode[0] : '');
                      if (codeStr && codeStr.trim()) {
                        nextCode += codeStr;
                        console.log('[useCodeExecution] 🔧 Generated code for next block:', currentBlock.type, '- length:', codeStr.length);
                        console.log('[useCodeExecution] 🔧 Generated code preview (first 300):', codeStr.substring(0, 300));
                      }
                    }
                  } catch (e) {
                    console.warn('[useCodeExecution] Error generating code for next block:', currentBlock.type, e);
                  }
                }
                
                // Move to next block in chain
                if (currentBlock.nextConnection && currentBlock.nextConnection.targetBlock()) {
                  currentBlock = currentBlock.nextConnection.targetBlock();
                } else {
                  break;
                }
              }
              
              console.log('[useCodeExecution] 🔧 Total nextCode length:', nextCode.length);
              console.log('[useCodeExecution] 🔧 nextCode preview (first 500):', nextCode.substring(0, 500));
              
              if (nextCode.trim()) {
                // Find the solve function in code and insert recursive case before "return null;"
                const solveFuncMatch = code.match(/async\s+function\s+solve\s*\([^)]*\)\s*\{/);
                if (solveFuncMatch) {
                  const solveStartIndex = solveFuncMatch.index;
                  console.log('[useCodeExecution] 🔍 Found solve function at index:', solveStartIndex);
                  
                  // Find "return null;" or last closing brace of solve function
                  let insertIndex = -1;
                  
                  // Try to find "return null;" first
                  const returnNullPattern = /return\s+null\s*;/;
                  const returnNullMatch = code.substring(solveStartIndex).match(returnNullPattern);
                  
                  if (returnNullMatch) {
                    insertIndex = solveStartIndex + returnNullMatch.index;
                    console.log('[useCodeExecution] 🔍 Found return null; at index:', insertIndex);
                  } else {
                    // If no return null, find the last closing brace before the next function or end of code
                    let braceCount = 0;
                    let lastBraceIndex = -1;
                    for (let i = solveStartIndex; i < code.length; i++) {
                      if (code[i] === '{') braceCount++;
                      else if (code[i] === '}') {
                        braceCount--;
                        if (braceCount === 0) {
                          lastBraceIndex = i;
                          break;
                        }
                      }
                    }
                    
                    if (lastBraceIndex !== -1) {
                      insertIndex = lastBraceIndex;
                      console.log('[useCodeExecution] 🔍 Found function closing brace at index:', insertIndex);
                    }
                  }
                  
                  if (insertIndex !== -1) {
                    // Don't rename variables - block scope wrapper will handle isolation
                    // Just replace Blockly-generated variable names with actual names
                    let fixedNextCode = nextCode;
                    
                    // CRITICAL: Replace Blockly-generated variable names with actual names
                    // Get actual variable names from workspace using nameDB_
                    const nVar = workspaceRef.current.getVariable('n');
                    const boardVar = workspaceRef.current.getVariable('board');
                    const solutionVar = workspaceRef.current.getVariable('solution');
                    
                    // Get Blockly-generated names for these variables
                    let nGeneratedName = 'n';
                    let boardGeneratedName = 'board';
                    let solutionGeneratedName = 'solution';
                    
                    if (nVar) {
                      nGeneratedName = javascriptGenerator.nameDB_.getName(nVar.getId(), Blockly.Names.NameType.VARIABLE);
                    }
                    if (boardVar) {
                      boardGeneratedName = javascriptGenerator.nameDB_.getName(boardVar.getId(), Blockly.Names.NameType.VARIABLE);
                    }
                    if (solutionVar) {
                      solutionGeneratedName = javascriptGenerator.nameDB_.getName(solutionVar.getId(), Blockly.Names.NameType.VARIABLE);
                    }
                    
                    console.log('[useCodeExecution] 🔍 Variable name mappings:', {
                      n: nGeneratedName,
                      board: boardGeneratedName,
                      solution: solutionGeneratedName
                    });
                    
                    // Replace Blockly-generated names with actual names in recursive case
                    // Use word boundaries to avoid partial replacements
                    if (nGeneratedName !== 'n') {
                      fixedNextCode = fixedNextCode.replace(new RegExp(`\\b${nGeneratedName}\\b`, 'g'), 'n');
                    }
                    if (boardGeneratedName !== 'board') {
                      fixedNextCode = fixedNextCode.replace(new RegExp(`\\b${boardGeneratedName}\\b`, 'g'), 'board');
                    }
                    if (solutionGeneratedName !== 'solution') {
                      fixedNextCode = fixedNextCode.replace(new RegExp(`\\b${solutionGeneratedName}\\b`, 'g'), 'solution');
                    }
                    
                    console.log('[useCodeExecution] 🔧 Replaced variable names in recursive case');
                    console.log('[useCodeExecution] 🔧 Fixed nextCode after var replacement (first 500):', fixedNextCode.substring(0, 500));
                    
                    // Wrap recursive case in block scope to isolate variables
                    // This prevents conflicts with base case variables
                    const wrappedCode = '{\n' + fixedNextCode + '\n}';
                    
                    // Insert recursive case code before return null or before closing brace
                    code = code.substring(0, insertIndex) + '\n' + wrappedCode + '\n' + code.substring(insertIndex);
                    console.log('[useCodeExecution] ✅ Injected recursive case code, new code length:', code.length);
                    console.log('[useCodeExecution] ✅ Code after injection (first 1500):', code.substring(solveStartIndex, solveStartIndex + 1500));
                  } else {
                    console.error('[useCodeExecution] ❌ Could not find insertion point for recursive case');
                  }
                } else {
                  console.error('[useCodeExecution] ❌ Could not find solve function in generated code');
                }
              } else {
                console.warn('[useCodeExecution] ⚠️ No code generated from next blocks');
              }
            } else {
              console.warn('[useCodeExecution] ⚠️ if_only block has no next connection');
            }
          } else {
            console.warn('[useCodeExecution] ⚠️ STACK first block is not if_only:', stackBlock?.type);
          }
        } else {
          console.warn('[useCodeExecution] ⚠️ Could not find solve function block');
        }
      } catch (e) {
        console.error('[useCodeExecution] Error extracting recursive case from workspace:', e);
        console.error('[useCodeExecution] Error stack:', e.stack);
      }
    }
    
    // CRITICAL FIX: Remove stub functions for N-Queen before injecting real implementations
    
    if (isNQueenProblem) {
      console.log('[useCodeExecution] 🔧 Removing N-Queen stub functions...');
      
      // Pattern 1: Remove stub functions with comments
      code = code.replace(/\/\/\s*Check if placing queen.*?\n\s*async function safe\s*\([^)]*\)\s*\{[^}]*return false;?\s*\}/gs, '');
      code = code.replace(/\/\/\s*Place queen at.*?\n\s*(?:async\s+)?function place\s*\([^)]*\)\s*\{\s*\}/gs, '');
      code = code.replace(/\/\/\s*Remove queen from.*?\n\s*(?:async\s+)?function remove\s*\([^)]*\)\s*\{\s*\}/gs, '');
      
      // Pattern 2: Remove stub functions without comments
      code = code.replace(/async function safe\s*\([^)]*\)\s*\{\s*return false;?\s*\}/g, '');
      code = code.replace(/function safe\s*\([^)]*\)\s*\{\s*\}/g, '');
      code = code.replace(/(?:async\s+)?function place\s*\([^)]*\)\s*\{\s*\}/g, '');
      code = code.replace(/(?:async\s+)?function remove\s*\([^)]*\)\s*\{\s*\}/g, '');
      
      console.log('[useCodeExecution] ✅ Stub functions removed');
      console.log('[useCodeExecution] Code after cleanup (first 1000):', code.substring(0, 1000));
    }
    
    // CRITICAL: For N-Queen problem, ALWAYS fix procedure calls regardless of generator type
    
    console.log('[useCodeExecution] 🔍 N-Queen detection:', {
      hasSolve,
      hasN,
      hasBoard,
      isNQueenProblem
    });
    
    if (isNQueenProblem) {
      console.log('[useCodeExecution] 🔍 Detected N-Queen problem - applying fixes...');
      
      // Find all solve(row, col) patterns
      const solveRowColPattern = /solve\d*\s*\(\s*row\s*,\s*col\s*\)/g;
      const allMatches = [...code.matchAll(solveRowColPattern)];
      console.log(`[useCodeExecution] 🔍 Found ${allMatches.length} solve(row, col) calls to fix for N-Queen`);
      
      if (allMatches.length > 0) {
        // Log context for debugging
        allMatches.forEach((match, idx) => {
          const start = Math.max(0, match.index - 80);
          const end = Math.min(code.length, match.index + match[0].length + 80);
          const context = code.substring(start, end).replace(/\n/g, '\\n');
          console.log(`[useCodeExecution] Match ${idx + 1} at ${match.index}: ...${context}...`);
        });
      }
      
      let replacementCount = 0;
      
      // Step 1: Replace in if conditions -> safe(row, col)
      // Step 1: Replace in if conditions -> safe(row, col)
      // Handle both double and single parentheses
      code = code.replace(/if\s*\(\s*\(?\s*await\s+solve\d*\s*\(\s*row\s*,\s*col\s*\)/g, (match) => {
        if (match.includes('safe') || match.includes('place') || match.includes('remove')) {
          return match; // Already replaced
        }
        replacementCount++;
        const fixed = match.replace(/solve\d*/g, 'safe');
        console.log(`[useCodeExecution] 🔧 [${replacementCount}] N-Queen: if condition "${match.trim()}" -> "${fixed.trim()}"`);
        return fixed;
      });
      
      // Step 2: Replace in else blocks -> remove(row, col)
      code = code.replace(/else\s*\{\s*await\s+solve\d*\s*\(\s*row\s*,\s*col\s*\)/g, (match) => {
        replacementCount++;
        console.log(`[useCodeExecution] 🔧 [${replacementCount}] N-Queen: else block solve -> remove`);
        return match.replace(/solve\d*/g, 'remove');
      });
      
      // Step 3: Replace remaining statements -> place(row, col)
      code = code.replace(/await\s+solve\d*\s*\(\s*row\s*,\s*col\s*\)\s*;/g, (match) => {
        if (!match.includes('safe') && !match.includes('place') && !match.includes('remove')) {
          replacementCount++;
          console.log(`[useCodeExecution] 🔧 [${replacementCount}] N-Queen: statement solve -> place`);
          return match.replace(/solve\d*/g, 'place');
        }
        return match;
      });
      
      console.log(`[useCodeExecution] ✅ N-Queen fixes applied: ${replacementCount}/${allMatches.length} replacements`);
      
      // Verify replacements worked
      const remainingMatches = [...code.matchAll(solveRowColPattern)];
      if (remainingMatches.length > 0) {
        console.warn(`[useCodeExecution] ⚠️ WARNING: Still found ${remainingMatches.length} solve(row, col) calls after fix!`);
        remainingMatches.forEach((match, idx) => {
          const start = Math.max(0, match.index - 50);
          const end = Math.min(code.length, match.index + match[0].length + 50);
          console.warn(`[useCodeExecution] Remaining match ${idx + 1}: ...${code.substring(start, end)}...`);
        });
      }
      
      console.log('[useCodeExecution] Generated code preview (after N-Queen fix):', code.substring(0, 1000));
    }
    
    // CRITICAL: Fix generated code if it has wrong function signature
    // Blockly's default generator generates: function solve(row, col) instead of async function solve(row)
    // We need to fix this by replacing the function signature AND function calls within
    if (code.includes('// Describe this function...')) {
      console.warn('[useCodeExecution] Detected default Blockly generator output - fixing code...');
      
      // First, find the function name (might be solve, solve2, solve3, etc.)
      const funcNameMatch = code.match(/function\s+(solve\d*)\s*\(/);
      const funcName = funcNameMatch ? funcNameMatch[1] : 'solve';
      
      // Fix function definition: function solve(row, col) -> async function solve(row)
      code = code.replace(
        new RegExp(`function\\s+(${funcName})\\s*\\([^)]*\\)\\s*\\{`, 'g'),
        (match, fName) => {
          // Extract the original params to check
          const paramsMatch = match.match(/\(([^)]*)\)/);
          const originalParams = paramsMatch ? paramsMatch[1] : '';
          
          // For solve function, it should only have 'row' parameter
          // Remove 'col' if it exists (it's a loop variable, not a function parameter)
          const correctParams = originalParams.split(',').map(p => p.trim()).filter(p => p !== 'col').join(', ');
          
          console.log(`[useCodeExecution] Fixing function ${fName}: params "${originalParams}" -> "${correctParams}"`);
          return `async function ${fName}(${correctParams}) {`;
        }
      );
      
      // CRITICAL: Fix function calls within the function body
      // ONLY fix calls to the solve function (funcName), NOT other functions like safe, place, remove
      // Pattern: solve3(row, col) -> solve3(row) or solve3(row + 1)
      // We need to remove the 'col' parameter from solve function calls only
      // Use a more robust pattern that matches function calls with or without await and handles empty params
      // IMPORTANT: Only match calls to the solve function itself, not other functions
      const functionCallPattern = new RegExp(`(await\\s+)?\\b${funcName}\\b\\s*\\(([^)]*)\\)`, 'g');
      let replaceCount = 0;
      code = code.replace(
        functionCallPattern,
        (match, awaitKeyword, params) => {
          const originalMatch = match;
          replaceCount++;
          
          // Handle empty parameters case
          if (!params || params.trim().length === 0) {
            const awaitStr = awaitKeyword ? awaitKeyword.trim() + ' ' : '';
            const newCall = `${awaitStr}${funcName}()`;
            console.log(`[useCodeExecution] Fixing function call (empty params): "${originalMatch.trim()}" -> "${newCall.trim()}"`);
            return newCall;
          }
          
          // Parse parameters and remove 'col' if it exists
          const paramList = params.split(',').map(p => p.trim()).filter(p => p.length > 0);
          
          // For solve function calls, filter out 'col' parameter
          // Keep only parameters that are 'row' or expressions containing 'row'
          const filteredParams = paramList.filter(p => {
            const trimmed = p.trim();
            // Remove standalone 'col' but keep 'row', 'row + 1', etc.
            if (trimmed === 'col') {
              return false;
            }
            // Keep anything that contains 'row' (like 'row', 'row + 1', '(row + 1)')
            if (trimmed.includes('row')) {
              return true;
            }
            // If no 'row' found and it's not 'col', keep it (might be a number or expression)
            return trimmed !== 'col';
          });
          
          // For solve function, it should only take one parameter (row or row + 1, etc.)
          // If we have filtered params, use the first one; otherwise use 'row' as default
          const finalParams = filteredParams.length > 0 ? [filteredParams[0]] : ['row'];
          
          const awaitStr = awaitKeyword ? awaitKeyword.trim() + ' ' : '';
          const newCall = `${awaitStr}${funcName}(${finalParams.join(', ')})`;
          
          if (originalMatch.trim() !== newCall.trim()) {
            console.log(`[useCodeExecution] Fixing ${funcName} call ${replaceCount}: "${originalMatch.trim()}" -> "${newCall.trim()}"`);
          }
          
          return newCall;
        }
      );
      
      console.log(`[useCodeExecution] Fixed ${replaceCount} ${funcName} function calls`);
      
      // CRITICAL: For N-Queen problem, fix procedure calls that should be safe, place, remove
      // The generated code incorrectly calls solve(row, col) instead of safe/place/remove
      // Pattern in generated code:
      // if ((await solve(row, col))) { await solve(row, col); solveResult = ... } else { await solve(row, col); }
      // Should become:
      // if ((await safe(row, col))) { await place(row, col); solveResult = ... } else { await remove(row, col); }
      
      // Find all solve(row, col) patterns first
      const solveRowColPattern = /solve\d*\s*\(\s*row\s*,\s*col\s*\)/g;
      const allMatches = [...code.matchAll(solveRowColPattern)];
      console.log(`[useCodeExecution] 🔍 Found ${allMatches.length} solve(row, col) calls to fix for N-Queen`);
      
      if (allMatches.length > 0) {
        // Log context for debugging
        allMatches.forEach((match, idx) => {
          const start = Math.max(0, match.index - 80);
          const end = Math.min(code.length, match.index + match[0].length + 80);
          const context = code.substring(start, end).replace(/\n/g, '\\n');
          console.log(`[useCodeExecution] Match ${idx + 1} at ${match.index}: ...${context}...`);
        });
      }
      
      let replacementCount = 0;
      
      // Use simpler, more direct replacement approach
      // Replace solve(row, col) patterns based on their position in the code
      
      // Step 1: Replace in if conditions - should be safe(row, col)
      // Pattern: if ((await solve(row, col))) - match solve in if condition
      code = code.replace(/if\s*\(\s*\(\s*await\s+solve(\d*)\s*\(\s*row\s*,\s*col\s*\)/g, (match, num) => {
        replacementCount++;
        console.log(`[useCodeExecution] 🔧 [${replacementCount}] if condition: solve${num} -> safe`);
        return `if ((await safe(row, col`;
      });
      
      // Also handle single paren: if (await solve(row, col))
      code = code.replace(/if\s*\(\s*await\s+solve(\d*)\s*\(\s*row\s*,\s*col\s*\)/g, (match, num) => {
        if (!match.includes('safe')) {
          replacementCount++;
          console.log(`[useCodeExecution] 🔧 [${replacementCount}] if condition: solve${num} -> safe (single paren)`);
          return `if (await safe(row, col`;
        }
        return match;
      });
      
      // Step 2: Replace in else blocks - should be remove(row, col)
      code = code.replace(/else\s*\{\s*await\s+solve(\d*)\s*\(\s*row\s*,\s*col\s*\)/g, (match, num) => {
        replacementCount++;
        console.log(`[useCodeExecution] 🔧 [${replacementCount}] else block: solve${num} -> remove`);
        return `else { await remove(row, col`;
      });
      
      // Step 3: Replace remaining solve(row, col) statements - should be place(row, col)
      // Pattern: await solve(row, col); (not in if/else)
      // We need to be careful - only replace if it's a statement, not in condition
      code = code.replace(/await\s+solve(\d*)\s*\(\s*row\s*,\s*col\s*\)\s*;/g, (match, num, offset) => {
        // Check if already replaced
        if (code.substring(Math.max(0, offset - 20), offset + match.length).includes('safe') ||
            code.substring(Math.max(0, offset - 20), offset + match.length).includes('place') ||
            code.substring(Math.max(0, offset - 20), offset + match.length).includes('remove')) {
          return match; // Already replaced
        }
        
        // Check context - skip if in if condition or else block
        const contextStart = Math.max(0, offset - 100);
        const contextEnd = Math.min(code.length, offset + match.length + 50);
        const context = code.substring(contextStart, contextEnd);
        
        // Skip if in if condition (should already be replaced as safe)
        if (context.includes('if') && !context.match(/;\s*if\s*\(/)) {
          const beforeMatch = context.substring(0, context.indexOf(match));
          if (beforeMatch.match(/if\s*\([^)]*$/)) {
            return match; // In if condition
          }
        }
        
        // Skip if in else block (should already be replaced as remove)
        if (context.includes('else')) {
          const beforeMatch = context.substring(0, context.indexOf(match));
          if (beforeMatch.match(/else\s*\{[^}]*$/)) {
            return match; // In else block
          }
        }
        
        // This should be place(row, col)
        replacementCount++;
        console.log(`[useCodeExecution] 🔧 [${replacementCount}] statement: solve${num} -> place`);
        return `await place(row, col);`;
      });
      
      console.log(`[useCodeExecution] ✅ Total replacements: ${replacementCount}/${allMatches.length}`);
      
      // CRITICAL FIX: Ensure return solution is in base case
      // Find base case (if row == n block) and ensure it returns solution
      const hasReturnSolution = code.includes('return solution');
      const hasReturnSolutionInBaseCase = /if\s*\([^)]*row[^)]*n[^)]*\)\s*\{[\s\S]*?return solution/.test(code);
      
      if (!hasReturnSolution || !hasReturnSolutionInBaseCase) {
        console.log('[useCodeExecution] 🔧 Fixing: Adding return solution to base case');
        console.log('[useCodeExecution] 🔍 hasReturnSolution:', hasReturnSolution, 'hasReturnSolutionInBaseCase:', hasReturnSolutionInBaseCase);
        
        // Find the pattern: solution.push([i, j]); followed by closing braces, then recursive case
        const solutionPushIndex = code.indexOf('solution.push([i, j]);');
        console.log('[useCodeExecution] 🔍 solutionPushIndex:', solutionPushIndex);
        
        if (solutionPushIndex !== -1) {
          // Find where recursive case starts (look for "for (let col" or "const fromValue = 0" after base case)
          let recursiveCaseIndex = code.indexOf('for (let col', solutionPushIndex);
          if (recursiveCaseIndex === -1) {
            recursiveCaseIndex = code.indexOf('const fromValue = 0;', solutionPushIndex);
          }
          console.log('[useCodeExecution] 🔍 recursiveCaseIndex:', recursiveCaseIndex);
          
          if (recursiveCaseIndex !== -1) {
            // Find the last closing brace before recursive case (this is the if block's closing brace)
            const beforeRecursive = code.substring(solutionPushIndex, recursiveCaseIndex);
            let lastBraceIndex = -1;
            let braceCount = 0;
            for (let i = beforeRecursive.length - 1; i >= 0; i--) {
              if (beforeRecursive[i] === '}') {
                braceCount++;
                if (braceCount === 1) { // First closing brace from the end is the if block's closing brace
                  lastBraceIndex = solutionPushIndex + i;
                  break;
                }
              } else if (beforeRecursive[i] === '{') {
                braceCount--;
              }
            }
            
            console.log('[useCodeExecution] 🔍 lastBraceIndex:', lastBraceIndex);
            
            if (lastBraceIndex !== -1) {
              // Check if return solution already exists before this brace
              const beforeBrace = code.substring(Math.max(0, lastBraceIndex - 200), lastBraceIndex);
              console.log('[useCodeExecution] 🔍 beforeBrace (last 200 chars):', beforeBrace.substring(Math.max(0, beforeBrace.length - 100)));
              
              if (!beforeBrace.includes('return solution')) {
                code = code.substring(0, lastBraceIndex) + '\nreturn solution;\n' + code.substring(lastBraceIndex);
                console.log('[useCodeExecution] ✅ Added return solution to base case');
              } else {
                console.log('[useCodeExecution] ℹ️ return solution already exists in base case');
              }
            }
          }
        }
      } else {
        console.log('[useCodeExecution] ✅ return solution already exists in base case');
      }
      
      console.log('[useCodeExecution] Generated code preview (after N-Queen fix):', code.substring(0, 1000));
    }
    
    // Check if generated code has the wrong function signature
    const solveFunctionMatch = code.match(/function\s+(\w+)\s*\(([^)]*)\)/);
    if (solveFunctionMatch) {
      const funcName = solveFunctionMatch[1];
      const funcParams = solveFunctionMatch[2];
      console.log('[useCodeExecution] Found function after fix:', funcName, 'with params:', funcParams);
      if (funcName.includes('solve') && !code.includes(`async function ${funcName}`)) {
        console.error('[useCodeExecution] ERROR: Generated code still has wrong function signature (missing async)!');
        console.error('[useCodeExecution] Expected: async function solve(row)');
        console.error('[useCodeExecution] Got:', solveFunctionMatch[0]);
      }
    }

    if (!code.trim()) {
      setCurrentHint("❌ ไม่มี blocks! ลาก blocks มาจาก toolbox");
      setGameState("ready");
      setIsRunning(false);
      return;
    }

    console.log("Generated code:", code);
    
    // Debug: Log full generated code for N-Queen
    if (currentLevel?.nqueenData && code.includes('async function solve')) {
      console.log('🔍 [N-Queen Debug] Full generated code:');
      console.log(code);
      
      // Extract solve function
      const solveFuncMatch = code.match(/async function solve\d*\([^)]*\)\s*\{[\s\S]*?\n\}/);
      if (solveFuncMatch) {
        console.log('🔍 [N-Queen Debug] Solve function:');
        console.log(solveFuncMatch[0]);
      }
    }
    console.log("Generated code (first 1000 chars):", code.substring(0, 1000));
    console.log("Starting HP:", getPlayerHp());
    console.log("Current scene available:", !!getCurrentGameState().currentScene);
    console.log("Current game state:", getCurrentGameState());
    console.log("Knapsack data:", currentLevel?.knapsackData);

    // รอให้ผู้เล่นกลับไปตำแหน่งแรกก่อน แล้วค่อยรันโค้ด
    setCurrentHint("🔄 กำลังเตรียมเกม...");
    await new Promise(resolve => setTimeout(resolve, 1000)); // รอ 1 วินาที

    try {
      // Create graph map from level data
      const createGraphMap = (nodes, edges) => {
        const graph = {};
        if (!nodes || !edges) return graph;
        
        // Initialize all nodes with empty arrays
        nodes.forEach(node => {
          graph[String(node.id)] = [];
        });
        
        // Add edges (bidirectional)
        edges.forEach(edge => {
          const from = String(edge.from);
          const to = String(edge.to);
          if (graph[from] && !graph[from].includes(Number(to))) {
            graph[from].push(Number(to));
          }
          if (graph[to] && !graph[to].includes(Number(from))) {
            graph[to].push(Number(from));
          }
        });
        
        return graph;
      };
      
      const map = createGraphMap(currentLevel?.nodes || [], currentLevel?.edges || []);
      console.log("Created graph map:", map);
      
      // Create all_nodes array for Prim's algorithm
      const all_nodes = (currentLevel?.nodes || []).map(node => node.id);
      console.log("Created all_nodes:", all_nodes);

      console.log("Creating AsyncFunction with code:", code);
      const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
      const execFunction = new AsyncFunction(
        "map", // Add map as first parameter
        "all_nodes", // Add all_nodes for Prim's algorithm
        "moveForward", "turnLeft", "turnRight", "hit", "foundMonster", "canMoveForward", "nearPit", "atGoal",
        "collectCoin", "haveCoin", "getCoinCount", "getCoinValue", "swapCoins", "compareCoins", "isSorted",
        "getPlayerCoins", "addCoinToPlayer", "clearPlayerCoins", "swapPlayerCoins", "comparePlayerCoins",
        "getPlayerCoinValue", "getPlayerCoinCount", "arePlayerCoinsSorted",
        "rescuePersonAtNode", "hasPerson", "personRescued", "getPersonCount", "allPeopleRescued",
        "getStack", "pushToStack", "popFromStack", "isStackEmpty", "getStackCount", "hasTreasureAtNode", "collectTreasure", "isTreasureCollected", "clearStack",
        "pushNode", "popNode", "keepItem", "hasTreasure", "treasureCollected", "stackEmpty", "stackCount",
        "moveToNode", "moveAlongPath", "getCurrentNode", "getGraphNeighbors", "getGraphNeighborsWithWeight", "getNodeValue",
        "getGraphNeighborsWithVisual", "getGraphNeighborsWithVisualSync", "getGraphNeighborsWithWeightWithVisualSync",
        "markVisitedWithVisual", "showPathUpdateWithVisual", "clearDfsVisuals", "showMSTEdges",
        "findMinIndex", "getAllEdges", "sortEdgesByWeight", "dsuFind", "dsuUnion", "showMSTEdgesFromList",
        "highlightKruskalEdge", "showKruskalRoot", "clearKruskalVisuals",
        "updateDijkstraVisited", "updateDijkstraPQ", "updateMSTWeight", "resetDijkstraState",
        "selectKnapsackItemVisual", "unselectKnapsackItemVisual", "resetKnapsackItemsVisual", "knapsackMaxWithVisual",
        "addWarriorToSide1Visual", "addWarriorToSide2Visual", "resetSubsetSumWarriorsVisual",
        "addWarriorToSelectionVisual",
        "getCurrentGameState", "setCurrentGameState",
        code
      );

      console.log("Executing function...");

      // Add timeout to prevent infinite loops - longer timeout for Dijkstra/algorithm blocks
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Execution timeout - possible infinite loop")), 60000); // 60 seconds timeout for algorithms
      });

      // Add execution counter to detect infinite loops - higher limit for loop blocks
      let executionCount = 0;
      const maxExecutions = 5000; // Maximum number of function calls - increased for loops

      // Wrap functions to count executions
      const wrappedMoveToNode = async (nodeId) => {
        executionCount++;
        if (executionCount > maxExecutions) {
          throw new Error("Too many executions - possible infinite loop");
        }
        return await moveToNode(nodeId);
      };

      // Wrap moveAlongPath to count executions
      const wrappedMoveAlongPath = async (path) => {
        executionCount++;
        if (executionCount > maxExecutions) {
          throw new Error("Too many executions - possible infinite loop");
        }
        return await moveAlongPath(path);
      };

      // Capture return value from function execution
      // Parse code to find the variable name that stores the function result
      // Support multiple patterns: var result = await coinChange(...), result = await coinChange(...), var path = await DFS(...)
      let varName = 'path'; // Default
      
      // Try to detect function type first
      const isCoinChange = /coinChange\d*|COINCHANGE\d*|COIN_CHANGE\d*/i.test(code);
      const isSubsetSum = /subsetSum\d*|SUBSETSUM\d*|SUBSET_SUM\d*/i.test(code);
      const isKnapsack = /knapsack\d*|KNAPSACK\d*/i.test(code);
      const isNQueen = /solve\d*|SOLVE\d*|nQueen\d*|NQUEEN\d*/i.test(code);
      
      console.log('🔍 Function type detection:', { isCoinChange, isSubsetSum, isKnapsack, isNQueen });
      
      // Try specific patterns first based on function type
      if (isCoinChange) {
        // For Coin Change, default to 'result' (used in example XML)
        varName = 'result';
        console.log("🔍 Using default 'result' for Coin Change");
        
        // Try to find actual variable name from code
        const coinChangeMatch = code.match(/(?:var\s+)?(\w+)\s*=\s*(?:\(?\s*await\s+)?coinChange\d*\s*\(/i);
        if (coinChangeMatch) {
          varName = coinChangeMatch[1];
          console.log("🔍 Found Coin Change variable name from code:", varName);
        } else {
          // Also check for result variable assignment
          if (code.match(/var\s+result\s*=/i) || code.match(/result\s*=/i)) {
            varName = 'result';
            console.log("🔍 Confirmed 'result' variable exists in code");
          }
        }
      } else if (isSubsetSum) {
        const subsetSumMatch = code.match(/(?:var\s+)?(\w+)\s*=\s*(?:\(?\s*await\s+)?subsetSum\d*\s*\(/i);
        if (subsetSumMatch) {
          varName = subsetSumMatch[1];
          console.log("🔍 Found Subset Sum variable name:", varName);
        }
      } else if (isKnapsack) {
        const knapsackMatch = code.match(/(?:var\s+)?(\w+)\s*=\s*(?:\(?\s*await\s+)?knapsack\d*\s*\(/i);
        if (knapsackMatch) {
          varName = knapsackMatch[1];
          console.log("🔍 Found Knapsack variable name:", varName);
        }
      } else if (isNQueen) {
        // For N-Queen, default to 'result' (used in example XML)
        varName = 'result';
        console.log("🔍 Using default 'result' for N-Queen");
        
        // Try to find actual variable name from code
        const resultMatch = code.match(/(?:var\s+)?(\w+)\s*=\s*(?:\(?\s*await\s+)?solve\d*\s*\(/i);
        if (resultMatch) {
          varName = resultMatch[1];
          console.log("🔍 Found N-Queen variable name from code:", varName);
        } else {
          // Also check for result variable assignment
          if (code.match(/var\s+result\s*=/i) || code.match(/result\s*=/i)) {
            varName = 'result';
            console.log("🔍 Confirmed 'result' variable exists in code for N-Queen");
          }
        }
      } else {
        // Generic pattern for graph algorithms
      const pathMatch = code.match(/(?:var\s+)?(\w+)\s*=\s*\(?\s*await\s+\w+\s*\(/i);
        if (pathMatch) {
          varName = pathMatch[1];
          console.log("🔍 Found variable name using generic pattern:", varName);
        }
      }
      
      // Final fallback
      if (varName === 'path' && !isCoinChange && !isSubsetSum && !isKnapsack && !isNQueen) {
        console.log("🔍 Using default variable name 'path'");
      }
      
      // Initialize knapsack variables if knapsackData exists
      let knapsackInitCode = '';
      if (currentLevel?.knapsackData) {
        const knapsackData = currentLevel.knapsackData;
        const weights = knapsackData.items ? knapsackData.items.map(item => item.weight) : [];
        const values = knapsackData.items ? knapsackData.items.map(item => item.price) : [];
        const n = weights.length;
        const capacity = knapsackData.capacity || 0;
        
          // Start tracking knapsack selections
          startKnapsackSelectionTracking();
          
          knapsackInitCode = `
            // Initialize knapsack variables from level data
            var weights = ${JSON.stringify(weights)};
            var values = ${JSON.stringify(values)};
            var n = ${n};
            var capacity = ${capacity};
            console.log('🔍 Knapsack variables initialized:', { weights, values, n, capacity });
          `;
          console.log('🔍 Initialized knapsack variables:', { weights, values, n, capacity });
        }
      
      // Initialize subset sum variables if subsetSumData exists
      let subsetSumInitCode = '';
      if (currentLevel?.subsetSumData) {
        const subsetSumData = currentLevel.subsetSumData;
        console.log('🔍 subsetSumData found:', subsetSumData);
        const warriors = subsetSumData.warriors || [];
        const targetSum = subsetSumData.target_sum || 0;
        
        // Start tracking subset sum decisions
        startSubsetSumTrackingVisual();
        
        subsetSumInitCode = `
          // Initialize subset sum variables from level data
          var warriors = ${JSON.stringify(warriors)};
          var target_sum = ${targetSum};
          console.log('🔍 Subset Sum variables initialized:', { warriors, target_sum });
        `;
        console.log('🔍 Initialized subset sum variables:', { warriors, target_sum: targetSum });
        console.log('🔍 subsetSumInitCode:', subsetSumInitCode);
      } else {
        console.log('🔍 No subsetSumData found in currentLevel:', currentLevel);
      }
      
      // Initialize coin change variables if coinChangeData exists
      let coinChangeInitCode = '';
      if (currentLevel?.coinChangeData) {
        const coinChangeData = currentLevel.coinChangeData;
        console.log('🔍 coinChangeData found:', coinChangeData);
        const monsterPower = coinChangeData.monster_power || 32;
        const warriors = coinChangeData.warriors || [1, 5, 10, 25]; // Default coin values
        
        // Start tracking coin change selections
        startCoinChangeSelectionTracking();
        
        coinChangeInitCode = `
          // Initialize coin change variables from level data
          var monster_power = ${monsterPower};
          var warriors = ${JSON.stringify(warriors)};
          console.log('🔍 Coin Change variables initialized:', { monster_power, warriors });
        `;
        console.log('🔍 Initialized coin change variables:', { monster_power: monsterPower, warriors });
        console.log('🔍 coinChangeInitCode:', coinChangeInitCode);
      } else {
        console.log('🔍 No coinChangeData found in currentLevel:', currentLevel);
      }
      
      // Initialize N-Queen variables and helper functions if nqueenData exists
      let nqueenInitCode = '';
      if (currentLevel?.nqueenData) {
        const nqueenData = currentLevel.nqueenData;
        console.log('🔍 nqueenData found:', nqueenData);
        const n = nqueenData.n || 4;
        
        // Create helper functions for N-Queen
        nqueenInitCode = `
          // Initialize N-Queen variables from level data
          var n = ${n};
          
          // Initialize board (2D array to track queen positions)
          var board = [];
          for (var i = 0; i < n; i++) {
            board[i] = [];
            for (var j = 0; j < n; j++) {
              board[i][j] = 0; // 0 = empty, 1 = queen
            }
          }
          
          // Helper function: Check if placing queen at (row, col) is safe
          async function safe(row, col) {
            // Check column
            for (var i = 0; i < row; i++) {
              if (board[i][col] === 1) {
                return false;
              }
            }
            
            // Check upper-left diagonal
            for (var i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
              if (board[i][j] === 1) {
                return false;
              }
            }
            
            // Check upper-right diagonal
            for (var i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
              if (board[i][j] === 1) {
                return false;
              }
            }
            
            return true;
          }
          
          // Helper function: Place queen at (row, col)
          async function place(row, col) {
            board[row][col] = 1;
          }
          
          // Helper function: Remove queen from (row, col)
          async function remove(row, col) {
            board[row][col] = 0;
          }
          
          console.log('🔍 N-Queen variables initialized:', { n });
        `;
        console.log('🔍 Initialized N-Queen variables:', { n });
        console.log('🔍 nqueenInitCode:', nqueenInitCode);
      } else {
        console.log('🔍 No nqueenData found in currentLevel:', currentLevel);
      }
      
      // Double-check variable name by looking at actual code before creating wrapper
      // Try multiple patterns to find the actual variable assignment
      if (isCoinChange) {
        console.log('🔍 Searching for variable assignment in Coin Change code...');
        console.log('🔍 Code preview (last 800 chars):', code.substring(Math.max(0, code.length - 800)));
        
        // Try multiple patterns - Blockly generates: variable = (await coinChange(...));
        // Note: Blockly variables_set generator uses: variable = value;\n (no 'var' keyword)
        // It may wrap the await expression in parentheses: result = (await coinChange(...));
        const patterns = [
          /(\w+)\s*=\s*\(?\s*\(?\s*await\s+coinChange\d*\s*\(/i,  // result = (await coinChange(...)) or result = await coinChange(...)
          /(\w+)\s*=\s*await\s+coinChange\d*\s*\(/i,  // result = await coinChange(...)
          /var\s+(\w+)\s*=\s*\(?\s*await\s+coinChange\d*\s*\(/i,  // var result = await coinChange(...)
        ];
        
        let foundVarName = null;
        for (let i = 0; i < patterns.length; i++) {
          const pattern = patterns[i];
          const match = code.match(pattern);
          if (match && match[1]) {
            foundVarName = match[1];
            console.log(`🔍 Found variable name using pattern ${i + 1}:`, foundVarName);
            console.log('🔍 Matched line:', code.substring(Math.max(0, code.indexOf(match[0]) - 50), code.indexOf(match[0]) + match[0].length + 50));
            break;
          }
        }
        
        if (foundVarName) {
          if (foundVarName !== varName) {
            console.warn('⚠️ Variable name mismatch! Extracted:', varName, 'but code uses:', foundVarName);
            varName = foundVarName;
            console.log('🔍 Updated variable name to:', varName);
          } else {
            console.log('✅ Confirmed variable name from code:', varName);
          }
        } else {
          console.error('❌ Could not find variable assignment in code!');
          console.log('🔍 Current varName:', varName);
          console.log('🔍 Last 1000 chars of code:', code.substring(Math.max(0, code.length - 1000)));
          // Force use 'result' as it's the most common in Coin Change example XML
          if (varName !== 'result') {
            console.warn('⚠️ Forcing varName to "result" as fallback');
            varName = 'result';
          }
        }
      }
      
      console.log('🔍 Final variable name for return:', varName);
      console.log('🔍 Full code (last 500 chars):', code.substring(Math.max(0, code.length - 500)));
      
      // Create a wrapper that captures return value AND executes code only once
      // For Coin Change and N-Queen, the code already has: result = (await coinChange4(...)) or result = (await solve(...));
      // So we just need to return result
      let returnStatement = '';
      if (isCoinChange || isNQueen) {
        // For Coin Change, check both varName and 'result' as fallback
        // Build the return statement using string concatenation to avoid nested template expression issues
        returnStatement = `
        // After executing code, return the variable that stores the function result
        console.log('🔍 [codeWithReturnCapture] Code executed, checking ${varName}...');
        console.log('🔍 [codeWithReturnCapture] ${varName} type:', typeof ${varName});
        console.log('🔍 [codeWithReturnCapture] ${varName} value:', typeof ${varName} !== 'undefined' ? ${varName} : 'UNDEFINED');
        if (typeof ${varName} !== 'undefined' && ${varName} !== null) {
          console.log('🔍 [codeWithReturnCapture] Returning ${varName}:', ${varName});
        return ${varName};
        } else if (typeof result !== 'undefined' && result !== null) {
          const varNameType = typeof ${varName};
          console.log('🔍 [codeWithReturnCapture] ${varName} is ' + varNameType + ', using result:', result);
          return result;
        } else {
          console.error('❌ [codeWithReturnCapture] Both ${varName} and result are undefined/null!');
          console.log('🔍 [codeWithReturnCapture] ${varName}:', ${varName}, 'type:', typeof ${varName});
          console.log('🔍 [codeWithReturnCapture] result:', result, 'type:', typeof result);
          return undefined;
        }
        `;
      } else {
        returnStatement = `
        // After executing code, return the variable that stores the function result
        console.log('🔍 [codeWithReturnCapture] Code executed, returning ${varName}');
        console.log('🔍 [codeWithReturnCapture] ${varName} type:', typeof ${varName});
        console.log('🔍 [codeWithReturnCapture] ${varName} value:', ${varName});
        return ${varName};
        `;
      }
      
      const codeWithReturnCapture = `
        ${knapsackInitCode}
        ${subsetSumInitCode}
        ${coinChangeInitCode}
        ${nqueenInitCode}
        ${code}
        ${returnStatement}
      `;
      
      // DEBUG: Check for duplicate function definitions (stub functions)
      if (isNQueen) {
        console.log('🔍 ===== FULL CODE TO EXECUTE (N-Queen) =====');
        console.log('🔍 nqueenInitCode length:', nqueenInitCode.length);
        console.log('🔍 code length:', code.length);
        console.log('🔍 Full codeWithReturnCapture length:', codeWithReturnCapture.length);
        
        // Check for safe() definitions
        const safeMatches = [...codeWithReturnCapture.matchAll(/async function safe/g)];
        console.log('🔍 Found', safeMatches.length, 'safe() definitions');
        if (safeMatches.length > 1) {
          console.warn('⚠️ WARNING: Multiple safe() definitions found! Stub function may not be removed.');
          safeMatches.forEach((match, idx) => {
            const start = Math.max(0, match.index - 50);
            const end = Math.min(codeWithReturnCapture.length, match.index + 200);
            const context = codeWithReturnCapture.substring(start, end);
            console.warn(`⚠️ safe() definition ${idx + 1} at index ${match.index}:`, context.substring(0, 150));
          });
        }
        
        // Check for place() definitions
        const placeMatches = [...codeWithReturnCapture.matchAll(/function place/g)];
        console.log('🔍 Found', placeMatches.length, 'place() definitions');
        if (placeMatches.length > 1) {
          console.warn('⚠️ WARNING: Multiple place() definitions found! Stub function may not be removed.');
          placeMatches.forEach((match, idx) => {
            const start = Math.max(0, match.index - 50);
            const end = Math.min(codeWithReturnCapture.length, match.index + 200);
            const context = codeWithReturnCapture.substring(start, end);
            console.warn(`⚠️ place() definition ${idx + 1} at index ${match.index}:`, context.substring(0, 150));
          });
        }
        
        // Check for remove() definitions
        const removeMatches = [...codeWithReturnCapture.matchAll(/function remove/g)];
        console.log('🔍 Found', removeMatches.length, 'remove() definitions');
        if (removeMatches.length > 1) {
          console.warn('⚠️ WARNING: Multiple remove() definitions found! Stub function may not be removed.');
          removeMatches.forEach((match, idx) => {
            const start = Math.max(0, match.index - 50);
            const end = Math.min(codeWithReturnCapture.length, match.index + 200);
            const context = codeWithReturnCapture.substring(start, end);
            console.warn(`⚠️ remove() definition ${idx + 1} at index ${match.index}:`, context.substring(0, 150));
          });
        }
        
        console.log('🔍 ==========================================');
      }
      
      console.log('🔍 codeWithReturnCapture (first 500 chars):', codeWithReturnCapture.substring(0, 500));
      console.log('🔍 codeWithReturnCapture (last 500 chars):', codeWithReturnCapture.substring(Math.max(0, codeWithReturnCapture.length - 500)));
      // Also check if 'result' appears in the code
      if (isCoinChange) {
        const hasResultVar = codeWithReturnCapture.includes('var result') || codeWithReturnCapture.includes('result =');
        console.log('🔍 Coin Change code contains "result" variable:', hasResultVar);
        if (hasResultVar && varName !== 'result') {
          console.warn('⚠️ Code contains "result" but varName is:', varName);
        }
      }
      
      const execFunctionWithReturn = new AsyncFunction(
        "map", "all_nodes",
        "moveForward", "turnLeft", "turnRight", "hit", "foundMonster", "canMoveForward", "nearPit", "atGoal",
        "collectCoin", "haveCoin", "getCoinCount", "getCoinValue", "swapCoins", "compareCoins", "isSorted",
        "getPlayerCoins", "addCoinToPlayer", "clearPlayerCoins", "swapPlayerCoins", "comparePlayerCoins",
        "getPlayerCoinValue", "getPlayerCoinCount", "arePlayerCoinsSorted",
        "rescuePersonAtNode", "hasPerson", "personRescued", "getPersonCount", "allPeopleRescued",
        "getStack", "pushToStack", "popFromStack", "isStackEmpty", "getStackCount", "hasTreasureAtNode", "collectTreasure", "isTreasureCollected", "clearStack",
        "pushNode", "popNode", "keepItem", "hasTreasure", "treasureCollected", "stackEmpty", "stackCount",
        "moveToNode", "moveAlongPath", "getCurrentNode", "getGraphNeighbors", "getGraphNeighborsWithWeight", "getNodeValue",
        "getGraphNeighborsWithVisual", "getGraphNeighborsWithVisualSync", "getGraphNeighborsWithWeightWithVisualSync",
        "markVisitedWithVisual", "showPathUpdateWithVisual", "clearDfsVisuals", "showMSTEdges",
        "findMinIndex", "getAllEdges", "sortEdgesByWeight", "dsuFind", "dsuUnion", "showMSTEdgesFromList",
        "highlightKruskalEdge", "showKruskalRoot", "clearKruskalVisuals",
        "updateDijkstraVisited", "updateDijkstraPQ", "updateMSTWeight", "resetDijkstraState",
        "selectKnapsackItemVisual", "unselectKnapsackItemVisual", "resetKnapsackItemsVisual", "knapsackMaxWithVisual",
        "addWarriorToSide1Visual", "addWarriorToSide2Visual", "resetSubsetSumWarriorsVisual",
        "addWarriorToSelectionVisual", "trackCoinChangeDecision",
        "getCurrentGameState", "setCurrentGameState",
        codeWithReturnCapture
      );
      
      // Execute code ONCE with return capture (no separate execution)
      let functionReturnValue = null;
      try {
        const returnValue = await Promise.race([
          execFunctionWithReturn(
            map, all_nodes,
            moveForward, turnLeft, turnRight, hit, foundMonster, canMoveForward, nearPit, atGoal,
            collectCoin, haveCoin, getCoinCount, getCoinValue, swapCoins, compareCoins, isSorted,
            getPlayerCoins, addCoinToPlayer, clearPlayerCoinsUtil, swapPlayerCoins, comparePlayerCoins,
            getPlayerCoinValue, getPlayerCoinCount, arePlayerCoinsSorted,
            rescuePersonAtNode, hasPerson, personRescued, getPersonCount, allPeopleRescued,
            getStack, pushToStack, popFromStack, isStackEmpty, getStackCount, hasTreasureAtNode, collectTreasure, isTreasureCollected, clearStack,
            pushNode, popNode, keepItem, hasTreasure, treasureCollected, stackEmpty, stackCount,
            wrappedMoveToNode, wrappedMoveAlongPath, getCurrentNode, getGraphNeighbors, getGraphNeighborsWithWeight, getNodeValue,
            getGraphNeighborsWithVisual, getGraphNeighborsWithVisualSync, getGraphNeighborsWithWeightWithVisualSync,
            markVisitedWithVisual, showPathUpdateWithVisual, clearDfsVisuals, showMSTEdges,
            findMinIndex, getAllEdges, sortEdgesByWeight, dsuFind, dsuUnion, showMSTEdgesFromList,
            highlightKruskalEdge, showKruskalRoot, clearKruskalVisuals,
            updateDijkstraVisited, updateDijkstraPQ, updateMSTWeight, resetDijkstraState,
            selectKnapsackItemVisual, unselectKnapsackItemVisual, resetKnapsackItemsVisual,
            knapsackMaxWithVisual,
            addWarriorToSide1Visual, addWarriorToSide2Visual, resetSubsetSumWarriorsVisual,
            addWarriorToSelectionVisual, trackCoinChangeDecision,
            getCurrentGameState, setCurrentGameState
          ),
          timeoutPromise
        ]);
        functionReturnValue = returnValue;
        console.log("Function execution completed with return capture");
        console.log("Function return value (from capture):", functionReturnValue);
      } catch (returnError) {
        console.warn("Could not capture return value:", returnError);
        functionReturnValue = undefined;
        console.log("Function execution completed");
        console.log("Function return value (fallback):", functionReturnValue);
      }

      const finalState = getCurrentGameState();
      console.log("Final state after execution:", finalState);

      // Extract function name from code
      console.log("🔍 ===== EXTRACTING FUNCTION NAME =====");
      console.log("🔍 Full code length:", code.length);
      console.log("🔍 Full code:", code);
      console.log("🔍 Code snippet (first 500 chars):", code.substring(0, 500));
      console.log("🔍 Code snippet (last 500 chars):", code.substring(Math.max(0, code.length - 500)));
      
      // DEBUG: Check if recursive case exists in N-Queen solve function
      if (code.includes('async function solve')) {
        const solveFuncMatch = code.match(/async function solve\d*\([^)]*\)\s*\{([\s\S]*)\}/);
        if (solveFuncMatch) {
          const funcBody = solveFuncMatch[1];
          const hasRecursiveCase = funcBody.includes('for (let col') || funcBody.includes('const fromValue = 0');
          const hasReturnNull = funcBody.includes('return null');
          console.log('🔍 N-Queen solve function analysis:');
          console.log('🔍   Has recursive case (for col loop):', hasRecursiveCase);
          console.log('🔍   Has return null:', hasReturnNull);
          console.log('🔍   Function body length:', funcBody.length);
          if (!hasRecursiveCase) {
            console.error('❌ ERROR: Recursive case missing in solve function!');
          }
          
          // CRITICAL FIX: Add return null at the end of function if missing
          if (hasRecursiveCase && !hasReturnNull) {
            console.log('🔧 Fixing: Adding return null at end of solve function');
            // Find the closing brace of the solve function
            // Start from function definition
            const funcStart = code.indexOf('async function solve');
            if (funcStart !== -1) {
              // Find the opening brace
              const openBraceIndex = code.indexOf('{', funcStart);
              if (openBraceIndex !== -1) {
                // Count braces to find the matching closing brace
                let braceCount = 0;
                let closeBraceIndex = -1;
                for (let i = openBraceIndex; i < code.length; i++) {
                  if (code[i] === '{') braceCount++;
                  if (code[i] === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                      closeBraceIndex = i;
                      break;
                    }
                  }
                }
                
                if (closeBraceIndex !== -1) {
                  // Insert return null before the closing brace
                  code = code.substring(0, closeBraceIndex) + '\n  return null;\n' + code.substring(closeBraceIndex);
                  console.log('✅ Added return null to solve function at index', closeBraceIndex);
                } else {
                  console.warn('⚠️ Could not find closing brace for solve function');
                }
              }
            }
          }
        }
      }
      
      const functionName = extractFunctionName(code);
      console.log("🔍 Extracted function name:", functionName);
      console.log("🔍 =====================================");

      // Check test cases if available
      let testCaseResult = null;
      console.log("🔍 Checking test cases condition:", {
        hasTestCases: !!currentLevel?.test_cases,
        testCasesLength: currentLevel?.test_cases?.length || 0,
        hasFunctionName: !!functionName,
        testCases: currentLevel?.test_cases
      });
      
      if (currentLevel?.test_cases && currentLevel.test_cases.length > 0 && functionName) {
        console.log("🔍 ✅ Condition passed! Checking test cases for function:", functionName);
        
        // Prepare game functions for test case execution (without visual feedback)
        // No-op functions for visual feedback (test cases run in background)
        const noOpVisual = () => Promise.resolve();
        const noOpVisualSync = () => {};
        const noOpMove = () => Promise.resolve(true); // No-op for movement
        
        const gameFunctionsForTest = {
          // Movement functions - all no-op for test cases (no visual feedback)
          moveForward: noOpMove,
          turnLeft: noOpVisual,
          turnRight: noOpVisual,
          hit: noOpMove,
          foundMonster: () => false,
          canMoveForward: () => true,
          nearPit: () => false,
          atGoal: () => false,
          // Coin functions - no-op
          collectCoin: noOpMove,
          haveCoin: () => false,
          getCoinCount: () => 0,
          getCoinValue: () => 0,
          swapCoins: noOpMove,
          compareCoins: () => 0,
          isSorted: () => true,
          getPlayerCoins: () => [],
          addCoinToPlayer: noOpMove,
          clearPlayerCoins: noOpVisualSync,
          swapPlayerCoins: noOpMove,
          comparePlayerCoins: () => 0,
          getPlayerCoinValue: () => 0,
          getPlayerCoinCount: () => 0,
          arePlayerCoinsSorted: () => true,
          // Person rescue functions - no-op
          rescuePersonAtNode: noOpMove,
          hasPerson: () => false,
          personRescued: () => false,
          getPersonCount: () => 0,
          // Coin Change tracking function - needs to work for test cases
          trackCoinChangeDecision: trackCoinChangeDecision,
          allPeopleRescued: () => true,
          // Stack functions - no-op
          getStack: () => [],
          pushToStack: noOpMove,
          popFromStack: () => null,
          isStackEmpty: () => true,
          getStackCount: () => 0,
          hasTreasureAtNode: () => false,
          collectTreasure: noOpMove,
          isTreasureCollected: () => false,
          clearStack: noOpVisualSync,
          pushNode: noOpMove,
          popNode: noOpMove,
          keepItem: noOpMove,
          hasTreasure: () => false,
          treasureCollected: () => false,
          stackEmpty: () => true,
          stackCount: () => 0,
          // Movement functions - all no-op for test cases
          moveToNode: noOpMove,
          moveAlongPath: noOpVisual,
          getCurrentNode: () => 0, // Return default node
          // Graph functions - use non-visual versions
          getGraphNeighbors: getGraphNeighborsNoVisual || getGraphNeighbors,
          getGraphNeighborsWithWeight: getGraphNeighborsWithWeightNoVisual || getGraphNeighborsWithWeight,
          getNodeValue: (node) => typeof node === 'number' ? node : parseInt(node) || 0,
          // Visual functions - all no-op for test cases
          getGraphNeighborsWithVisual: getGraphNeighborsNoVisual || getGraphNeighbors,
          getGraphNeighborsWithVisualSync: getGraphNeighborsNoVisual || getGraphNeighbors,
          getGraphNeighborsWithWeightWithVisualSync: getGraphNeighborsWithWeightNoVisual || getGraphNeighborsWithWeight,
          markVisitedWithVisual: noOpVisual,
          showPathUpdateWithVisual: noOpVisual,
          clearDfsVisuals: noOpVisualSync,
          showMSTEdges: noOpVisualSync,
          findMinIndex, // Keep this as it's needed for algorithms
          getAllEdges, // Keep this as it's needed for algorithms
          sortEdgesByWeight, // Keep this as it's needed for algorithms
          dsuFind, // Keep this as it's needed for algorithms
          dsuUnion, // Keep this as it's needed for algorithms
          showMSTEdgesFromList: noOpVisualSync,
          highlightKruskalEdge: noOpVisualSync,
          showKruskalRoot: noOpVisualSync,
          clearKruskalVisuals: noOpVisualSync,
          updateDijkstraVisited: noOpVisualSync,
          updateDijkstraPQ: noOpVisualSync,
          updateMSTWeight: noOpVisualSync,
          resetDijkstraState: noOpVisualSync,
          selectKnapsackItemVisual: noOpVisualSync,
          unselectKnapsackItemVisual: noOpVisualSync,
          resetKnapsackItemsVisual: noOpVisualSync,
          knapsackMaxWithVisual: knapsackMaxWithVisual, // Need this for knapsack test cases
          addWarriorToSide1Visual: noOpVisualSync,
          addWarriorToSide2Visual: noOpVisualSync,
          resetSubsetSumWarriorsVisual: noOpVisualSync,
          // Coin Change tracking function - needs to work for test cases
          trackCoinChangeDecision: trackCoinChangeDecision,
          getCurrentGameState, 
          setCurrentGameState
        };
        
        testCaseResult = await checkTestCases(
          functionReturnValue, 
          currentLevel.test_cases, 
          functionName,
          code,
          gameFunctionsForTest,
          map,
          all_nodes
        );
        console.log("\n🔍 ===== TEST CASE RESULT SUMMARY =====");
        console.log("🔍 Passed:", testCaseResult.passed);
        console.log("🔍 Total tests:", testCaseResult.totalTests);
        console.log("🔍 Passed tests:", testCaseResult.passedTests.length, testCaseResult.passedTests);
        console.log("🔍 Failed tests:", testCaseResult.failedTests.length, testCaseResult.failedTests);
        console.log("🔍 Message:", testCaseResult.message);
        console.log("🔍 ======================================\n");
        
        // Show knapsack final selection after code execution completes
        if (currentLevel?.knapsackData) {
          await showKnapsackFinalSelection();
        }
        
        // Show subset sum final solution after code execution completes
        // This ensures all warriors are placed correctly even if algorithm stops early
        if (currentLevel?.subsetSumData) {
          const targetSum = currentLevel.subsetSumData.target_sum || 0;
          await showSubsetSumFinalSolutionVisual(targetSum);
        }
        
        // Show coin change final solution after code execution completes
        // This displays warriors that were selected during execution
        if (currentLevel?.coinChangeData) {
          await showCoinChangeFinalSolution();
        }
        
        // Store test case result in game state for victory condition check
        setCurrentGameState({
          testCaseResult: testCaseResult
        });
        console.log("🔍 Stored testCaseResult in game state");
        
        if (!testCaseResult.passed) {
          setCurrentHint(testCaseResult.message);
        } else {
          setCurrentHint(testCaseResult.message);
        }
      } else {
        console.log("🔍 ❌ Condition NOT passed - test cases check skipped");
        console.log("🔍 Reasons:", {
          noTestCases: !currentLevel?.test_cases,
          emptyTestCases: currentLevel?.test_cases?.length === 0,
          noFunctionName: !functionName
        });
      }

      // ตรวจสอบเงื่อนไขการผ่านด่านตาม victoryConditions
      console.log("🔍 CHECKING VICTORY CONDITIONS");
      console.log("🔍 Current Level ID:", currentLevel.id);
      console.log("🔍 Victory Conditions:", currentLevel.victoryConditions);
      
      // Get updated state that includes testCaseResult (after setCurrentGameState)
      const stateForVictoryCheck = getCurrentGameState();
      console.log("🔍 State for victory check:", stateForVictoryCheck);
      console.log("🔍 testCaseResult in state:", stateForVictoryCheck.testCaseResult);

      const victoryResult = checkVictoryConditions(currentLevel.victoryConditions, currentLevel);
      const levelCompleted = victoryResult.completed;
      const completionMessage = victoryResult.message;

      console.log("🔍 VICTORY RESULT:", victoryResult);
      console.log("🔍 LEVEL COMPLETED:", levelCompleted);
      console.log("🔍 COMPLETION MESSAGE:", completionMessage);

      if (!levelCompleted) {
        // แสดง hint สำหรับเงื่อนไขที่ยังไม่สำเร็จ
        const hintMessage = generateVictoryHint(victoryResult.failedConditions, currentLevel);
        if (hintMessage) {
          setCurrentHint(hintMessage);
        }

        // ถ้ายังไม่ผ่านเงื่อนไขและยังไม่ตาย ให้ game over
        const currentState = getCurrentGameState();
        if (getPlayerHp() > 0 && !currentState.isGameOver) {
          console.log("Code execution completed but victory conditions not met - Game Over");
          
          setIsGameOver(true);
          setGameState("gameOver");
          setIsRunning(false);

          // Calculate time spent
          if (gameStartTime.current) {
            const endTime = Date.now();
            setTimeSpent(Math.floor((endTime - gameStartTime.current) / 1000));
          }

          setGameResult('gameover');
          
          // Set final score to 0
          setFinalScore({ totalScore: 0, stars: 0, pattern_bonus_score: 0 });

          // Show game over screen
          const currentState = getCurrentGameState();
          if (currentState.currentScene) {
            showGameOver(currentState.currentScene);
          }

          // Show progress modal (only in normal mode)
          if (!isPreview) {
            setShowProgressModal(true);
          }

          setCurrentHint("❌ ไม่ผ่านเงื่อนไขการผ่านด่าน");
          return;
        }
      }

      if (levelCompleted) {
        setIsCompleted(true);
        setGameState("completed");

        // ระบบคะแนน: ใช้ patternTypeId จาก finalState ถ้าไม่มีให้ fallback หาใน goodPatterns
        let patternTypeId = finalState.patternTypeId;
        if (!patternTypeId && goodPatterns && goodPatterns.length > 0) {
          // หา pattern ที่ match 100% (หรือใกล้เคียงที่สุด)
          const bestPattern = goodPatterns.find(p => p.pattern_type_id);
          if (bestPattern) patternTypeId = bestPattern.pattern_type_id;
        }
        if (!patternTypeId) patternTypeId = 0;
        const scoreData = calculateFinalScore(finalState.isGameOver, patternTypeId, hintOpenCount);
        setFinalScore(scoreData);

        const weaponInfo = finalState.weaponData;
        if (completionMessage) {
          setCurrentHint(`${completionMessage} (${weaponInfo?.name || ''}) - คะแนน: ${scoreData.totalScore} ⭐${scoreData.stars}`);
        }

        // แสดง Victory screen
        if (getCurrentGameState().currentScene) {
          const victoryType = currentLevel.goalType === "ช่วยคน" ? 'rescue' : 'normal';
          showVictory(getCurrentGameState().currentScene, victoryType);
        }

        // Calculate time spent and show progress modal
        if (gameStartTime.current) {
          const endTime = Date.now();
          setTimeSpent(Math.floor((endTime - gameStartTime.current) / 1000));
        }
        setGameResult('victory');
        
        // In preview mode, unlock pattern and level
        if (isPreview) {
          // Use patternId from props (the pattern being tested)
          if (patternId && onUnlockPattern) {
            await onUnlockPattern(patternId);
          } else if (onUnlockPattern) {
            // Fallback: find matched pattern if patternId not provided
            const matchedPattern = goodPatterns.find(p => p.pattern_id === patternId) || goodPatterns[0];
            if (matchedPattern) {
              await onUnlockPattern(matchedPattern.pattern_id);
            }
          }
          if (onUnlockLevel && currentLevel) {
            await onUnlockLevel(currentLevel.level_id);
          }
        } else {
          setShowProgressModal(true);
        }
      }
    } catch (error) {
      setGameState("ready");

      // Even if there's a timeout, check victory conditions
      console.log("🔍 EXECUTION ERROR - Checking victory conditions anyway");
      const finalState = getCurrentGameState();
      console.log("Final state after error:", finalState);

      // ตรวจสอบเงื่อนไขการผ่านด่านแม้เมื่อเกิด error
      console.log("🔍 CHECKING VICTORY CONDITIONS AFTER ERROR");
      console.log("🔍 Current Level ID:", currentLevel.id);
      console.log("🔍 Victory Conditions:", currentLevel.victoryConditions);

      const victoryResult = checkVictoryConditions(currentLevel.victoryConditions, currentLevel);
      const levelCompleted = victoryResult.completed;
      const completionMessage = victoryResult.message;

      console.log("🔍 VICTORY RESULT AFTER ERROR:", victoryResult);
      console.log("🔍 LEVEL COMPLETED AFTER ERROR:", levelCompleted);

      if (levelCompleted) {
        setIsCompleted(true);
        setGameState("completed");

        // ระบบคะแนน: ใช้ patternTypeId จาก finalState ถ้าไม่มีให้ fallback หาใน goodPatterns
        let patternTypeId = finalState.patternTypeId;
        if (!patternTypeId && goodPatterns && goodPatterns.length > 0) {
          // หา pattern ที่ match 100% (หรือใกล้เคียงที่สุด)
          const bestPattern = goodPatterns.find(p => p.pattern_type_id);
          if (bestPattern) patternTypeId = bestPattern.pattern_type_id;
        }
        if (!patternTypeId) patternTypeId = 0;
        const scoreData = calculateFinalScore(finalState.isGameOver, patternTypeId, hintOpenCount);
        setFinalScore(scoreData);

        const weaponInfo = finalState.weaponData;
        if (completionMessage) {
          setCurrentHint(`${completionMessage} (${weaponInfo?.name || ''}) - คะแนน: ${scoreData.totalScore} ⭐${scoreData.stars}`);
        }

        // แสดง Victory screen
        if (getCurrentGameState().currentScene) {
          const victoryType = currentLevel.goalType === "ช่วยคน" ? 'rescue' : 'normal';
          showVictory(getCurrentGameState().currentScene, victoryType);
        }

        // In preview mode, unlock pattern and level
        if (isPreview) {
          // Use patternId from props (the pattern being tested)
          if (patternId && onUnlockPattern) {
            await onUnlockPattern(patternId);
          } else if (onUnlockPattern) {
            // Fallback: find matched pattern if patternId not provided
            const matchedPattern = goodPatterns.find(p => p.pattern_id === patternId) || goodPatterns[0];
            if (matchedPattern) {
              await onUnlockPattern(matchedPattern.pattern_id);
            }
          }
          if (onUnlockLevel && currentLevel) {
            await onUnlockLevel(currentLevel.level_id);
          }
        } else {
          setShowProgressModal(true);
        }
      } else {
        if (error.message.includes("infinite loop") || error.message.includes("timeout")) {
          setCurrentHint("❌ เกิด infinite loop - โค้ดรันไม่หยุด กรุณาเพิ่มเงื่อนไขหยุดการทำงาน");
        } else if (error.message.includes("undefined")) {
          setCurrentHint("❌ ตัวแปรไม่ได้ถูกกำหนดค่า - กรุณาใช้ block 'ตั้งค่า' เพื่อกำหนดค่าตัวแปร");
        } else {
          setCurrentHint(`💥 ${error.message}`);
        }
      }

      console.error("Execution error:", error);
    }

    setIsRunning(false);
  };

  return { runCode };
}

