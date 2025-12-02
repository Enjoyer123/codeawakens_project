/**
 * Hook for code execution logic
 */

// Removed unused imports: useState, useRef
import { javascriptGenerator } from "blockly/javascript";
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
import {
  collectCoin, haveCoin, getCoinCount, getCoinValue, swapCoins, compareCoins, isSorted,
  rescuePersonAtNode, hasPerson, personRescued, getPersonCount, moveToNode,
  pushNode, popNode, keepItem, hasTreasure, treasureCollected, stackEmpty, stackCount
} from '../../../gameutils/utils/blocklyUtils';
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
    console.log("Game reset - Stack and treasure cleared");

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

    // Update player position in Phaser (HP bar now handled in bottom UI)
    if (getCurrentGameState().currentScene) {
      updatePlayer(getCurrentGameState().currentScene, currentLevel.startNodeId, 0);
    }

    const code = javascriptGenerator.workspaceToCode(workspaceRef.current);

    if (!code.trim()) {
      setCurrentHint("❌ ไม่มี blocks! ลาก blocks มาจาก toolbox");
      setGameState("ready");
      setIsRunning(false);
      return;
    }

    console.log("Generated code:", code);
    console.log("Starting HP:", getPlayerHp());
    console.log("Current scene available:", !!getCurrentGameState().currentScene);
    console.log("Current game state:", getCurrentGameState());

    // รอให้ผู้เล่นกลับไปตำแหน่งแรกก่อน แล้วค่อยรันโค้ด
    setCurrentHint("🔄 กำลังเตรียมเกม...");
    await new Promise(resolve => setTimeout(resolve, 1000)); // รอ 1 วินาที

    try {
      console.log("Creating AsyncFunction with code:", code);
      const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
      const execFunction = new AsyncFunction(
        "moveForward", "turnLeft", "turnRight", "hit", "foundMonster", "canMoveForward", "nearPit", "atGoal",
        "collectCoin", "haveCoin", "getCoinCount", "getCoinValue", "swapCoins", "compareCoins", "isSorted",
        "getPlayerCoins", "addCoinToPlayer", "clearPlayerCoins", "swapPlayerCoins", "comparePlayerCoins",
        "getPlayerCoinValue", "getPlayerCoinCount", "arePlayerCoinsSorted",
        "rescuePersonAtNode", "hasPerson", "personRescued", "getPersonCount", "allPeopleRescued",
        "getStack", "pushToStack", "popFromStack", "isStackEmpty", "getStackCount", "hasTreasureAtNode", "collectTreasure", "isTreasureCollected", "clearStack",
        "pushNode", "popNode", "keepItem", "hasTreasure", "treasureCollected", "stackEmpty", "stackCount",
        "moveToNode",
        code
      );

      console.log("Executing function...");

      // Add timeout to prevent infinite loops - longer timeout for loop blocks
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Execution timeout - possible infinite loop")), 30000); // 30 seconds timeout
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

      await Promise.race([
        execFunction(
          moveForward, turnLeft, turnRight, hit, foundMonster, canMoveForward, nearPit, atGoal,
          collectCoin, haveCoin, getCoinCount, getCoinValue, swapCoins, compareCoins, isSorted,
          getPlayerCoins, addCoinToPlayer, clearPlayerCoinsUtil, swapPlayerCoins, comparePlayerCoins,
          getPlayerCoinValue, getPlayerCoinCount, arePlayerCoinsSorted,
          rescuePersonAtNode, hasPerson, personRescued, getPersonCount, allPeopleRescued,
          getStack, pushToStack, popFromStack, isStackEmpty, getStackCount, hasTreasureAtNode, collectTreasure, isTreasureCollected, clearStack,
          pushNode, popNode, keepItem, hasTreasure, treasureCollected, stackEmpty, stackCount,
          wrappedMoveToNode
        ),
        timeoutPromise
      ]);
      console.log("Function execution completed");

      const finalState = getCurrentGameState();
      console.log("Final state after execution:", finalState);

      // ตรวจสอบเงื่อนไขการผ่านด่านตาม victoryConditions
      console.log("🔍 CHECKING VICTORY CONDITIONS");
      console.log("🔍 Current Level ID:", currentLevel.id);
      console.log("🔍 Victory Conditions:", currentLevel.victoryConditions);

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

