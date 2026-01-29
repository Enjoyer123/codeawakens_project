// Custom hook for game action functions (moveForward, turnLeft, turnRight, hit)
import Phaser from 'phaser';
import { getCurrentGameState, setCurrentGameState, getPlayerHp } from '../../../gameutils/shared/game';
import {
  movePlayerWithCollisionDetection,
  createPitFallEffect,
  showGameOver,
  updatePlayer,
  updatePlayerArrow,
  rotatePlayer
} from '../../../gameutils/phaser';
import { hitEnemyWithDamage } from '../../../gameutils/phaser/player/playerCombat';
import { getWeaponData } from '../../../gameutils/shared/items';
import { showEffectWeaponFixed } from '../../../gameutils/shared/combat';

/**
 * Custom hook for game action functions
 * @param {Object} params
 * @param {Object} params.currentLevel - Current level data
 * @param {Function} params.setPlayerNodeId - Set player node ID state
 * @param {Function} params.setPlayerDirection - Set player direction state
 * @param {Function} params.setCurrentHint - Set current hint state
 * @param {Function} params.setIsGameOver - Set game over state
 * @param {Function} params.setGameState - Set game state
 * @param {Function} params.setShowProgressModal - Set show progress modal state (only for normal mode)
 * @param {Function} params.setTimeSpent - Set time spent state (only for normal mode)
 * @param {Function} params.setGameResult - Set game result state (only for normal mode)
 * @param {Function} params.gameStartTime - Ref to game start time (only for normal mode)
 * @param {boolean} params.isPreview - Whether this is preview mode
 * @returns {Object} Game action functions
 */
export const useGameActions = ({
  currentLevel,
  setPlayerNodeId,
  setPlayerDirection,
  setCurrentHint,
  setIsGameOver,
  setGameState,
  setShowProgressModal,
  setTimeSpent,
  setGameResult,
  gameStartTime,
  isPreview = false
}) => {
  /**
   * Move player forward
   */
  const moveForward = async () => {
    const currentState = getCurrentGameState();

    // เช็ค HP <= 0 หรือ isGameOver - ห้ามเดินต่อ
    const playerHP = getPlayerHp();
    if (currentState.goalReached || currentState.moveCount >= currentState.maxMoves || currentState.isGameOver || playerHP <= 0) {
      if (playerHP <= 0) {
        console.log("❌ Cannot move forward: Player HP is 0 or below");
      }
      return true;
    }

    console.log("moveForward called - current node:", currentState.currentNodeId, "direction:", currentState.direction, "HP:", playerHP);

    setCurrentGameState({ moveCount: currentState.moveCount + 1 });

    const currentNode = currentLevel.nodes.find((n) => n.id === currentState.currentNodeId);
    if (!currentNode) {
      throw new Error(`ไม่พบ Node ${currentState.currentNodeId}`);
    }

    const connectedNodes = currentLevel.edges
      .filter((edge) => edge.from === currentState.currentNodeId || edge.to === currentState.currentNodeId)
      .map((edge) => (edge.from === currentState.currentNodeId ? edge.to : edge.from))
      .map((nodeId) => currentLevel.nodes.find((n) => n.id === nodeId))
      .filter((node) => node);

    let targetNode = null;
    const directions = [
      { x: 1, y: 0, symbol: "→" }, // right
      { x: 0, y: 1, symbol: "↓" }, // down
      { x: -1, y: 0, symbol: "←" }, // left
      { x: 0, y: -1, symbol: "↑" }, // up
    ];
    const dirVector = directions[currentState.direction];

    for (let node of connectedNodes) {
      const dx = node.x - currentNode.x;
      const dy = node.y - currentNode.y;

      // คำนวณมุมของเส้นทาง
      const angle = Math.atan2(dy, dx);
      // คำนวณมุมของทิศทางที่หันหน้า
      const dirAngle = Math.atan2(dirVector.y, dirVector.x);

      // หาความแตกต่างของมุม
      let angleDiff = Math.abs(angle - dirAngle);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

      // ถ้ามุมต่างกันไม่เกิน 60 องศา (π/3) ถือว่าเป็นทิศทางเดียวกัน
      if (angleDiff < Math.PI / 3) {
        targetNode = node;
        break;
      }
    }

    if (!targetNode) {
      throw new Error(
        `ไม่สามารถเดินไปทาง ${directions[currentState.direction].symbol} จาก Node ${currentState.currentNodeId} ได้`
      );
    }

    console.log("Moving from node", currentNode.id, "to node", targetNode.id);

    await new Promise((resolve) => setTimeout(resolve, 300));

    // ใช้ระบบการตรวจจับการชนแบบ real-time
    if (getCurrentGameState().currentScene) {
      const moveResult = await movePlayerWithCollisionDetection(
        getCurrentGameState().currentScene,
        currentNode,
        targetNode,
        currentState.direction
      );

      if (moveResult.hitObstacle) {
        console.log("Player fell into pit! Movement stopped.");

        // สร้างเอฟเฟกต์การตกหลุม
        createPitFallEffect(getCurrentGameState().currentScene);

        // แสดง Game Over screen
        setTimeout(() => {
          showGameOver(getCurrentGameState().currentScene);
          setCurrentGameState({
            isGameOver: true
          });
          setIsGameOver(true);
          setGameState("gameOver");

          if (!isPreview) {
            setShowProgressModal(true);

            // Calculate time spent and show progress modal for game over
            if (gameStartTime?.current) {
              const endTime = Date.now();
              setTimeSpent(Math.floor((endTime - gameStartTime.current) / 1000));
            }
            setGameResult('gameover');
            setShowProgressModal(true);
          }
        }, 1500);

        return false;
      }

      // เช็คว่า HP หมดระหว่างเดินหรือไม่ (ไม่ได้อยู่ใน combat mode)
      if (moveResult.hpDepleted) {
        console.log("❌ Movement stopped: Player HP depleted during movement (not in combat mode)");
        const currentState = getCurrentGameState();

        // ตั้ง isGameOver ถ้ายังไม่ได้ตั้ง
        if (!currentState.isGameOver) {
          setCurrentGameState({
            isGameOver: true
          });
          setIsGameOver(true);
          setGameState("gameOver");

          if (!isPreview) {
            setTimeout(() => {
              showGameOver(getCurrentGameState().currentScene);
              setShowProgressModal(true);

              if (gameStartTime?.current) {
                const endTime = Date.now();
                setTimeSpent(Math.floor((endTime - gameStartTime.current) / 1000));
              }
              setGameResult('gameover');
            }, 500);
          }
        }

        return false;
      }

      if (moveResult.success) {
        // เช็ค HP อีกครั้งหลังจากเคลื่อนที่สำเร็จ (เฉพาะเมื่อไม่ได้อยู่ใน combat mode)
        const playerHP = getPlayerHp();
        const currentState = getCurrentGameState();

        if (playerHP <= 0 || currentState.isGameOver) {
          console.log("❌ Movement completed but HP is 0 or game over");

          if (!currentState.isGameOver) {
            setCurrentGameState({
              isGameOver: true
            });
            setIsGameOver(true);
            setGameState("gameOver");

            if (!isPreview) {
              setTimeout(() => {
                showGameOver(getCurrentGameState().currentScene);
                setShowProgressModal(true);

                if (gameStartTime?.current) {
                  const endTime = Date.now();
                  setTimeSpent(Math.floor((endTime - gameStartTime.current) / 1000));
                }
                setGameResult('gameover');
              }, 500);
            }
          }

          return false;
        }

        const goalReached = targetNode.id === currentLevel.goalNodeId;
        console.log('moveForward goalReached check:', goalReached, 'targetNode.id:', targetNode.id, 'goalNodeId:', currentLevel.goalNodeId);
        setCurrentGameState({
          currentNodeId: targetNode.id,
          goalReached: goalReached
        });

        setPlayerNodeId(targetNode.id);
      }
    } else {
      // Fallback สำหรับกรณีที่ไม่มี scene
      const goalReached = targetNode.id === currentLevel.goalNodeId;
      console.log('moveForward fallback goalReached check:', goalReached, 'targetNode.id:', targetNode.id, 'goalNodeId:', currentLevel.goalNodeId);
      setCurrentGameState({
        currentNodeId: targetNode.id,
        goalReached: goalReached
      });

      setPlayerNodeId(targetNode.id);

      // อัพเดท player position ใน Phaser
      if (getCurrentGameState().currentScene) {
        console.log("Updating player position in Phaser to node", targetNode.id);
        updatePlayer(getCurrentGameState().currentScene, targetNode.id, currentState.direction);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
    return false;
  };

  /**
   * Hit enemy
   */
  const hit = async () => {
    const currentState = getCurrentGameState();
    if (currentState.goalReached || currentState.isGameOver) return;

    console.log("Hit function called");

    const scene = currentState.currentScene;
    if (!scene || !scene.player) return;

    // หา monster ที่ใกล้ที่สุด
    let nearestMonster = null;
    let nearestDistance = Infinity;

    if (scene.monsters && scene.monsters.length > 0) {
      scene.monsters.forEach((monster) => {
        if (monster.data.defeated || monster.sprite?.getData('defeated') || monster.isDefeated) return;

        const distance = Phaser.Math.Distance.Between(
          scene.player.x, scene.player.y,
          monster.sprite.x, monster.sprite.y
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestMonster = monster;
        }
      });
    }

    if (!nearestMonster) {
      setCurrentHint("❌ ไม่มีศัตรูในระยะโจมตี");
      return;
    }

    console.log("Found nearest monster:", nearestMonster);

    // โจมตีศัตรูโดยตรง
    const success = hitEnemyWithDamage(scene.player, 50);
    if (success) {
      console.log("Successfully hit enemy");

      // แสดง weapon effect
      const currentState = getCurrentGameState();
      const weaponData = getWeaponData(currentState.weaponKey || 'stick');
      const weaponSprite = scene.player; // ใช้ player sprite เป็น weapon sprite

      // เรียก showEffectWeaponFixed เพื่อแสดง effect
      console.log("แอฟเฟกต์อาวุธ:", currentState.weaponKey || 'stick');
      showEffectWeaponFixed(nearestMonster, 50, currentState.weaponKey || 'stick', weaponSprite);

      // รอให้ animation เสร็จก่อนเดินต่อ (killEnemy ใช้ 800ms)
      await new Promise((resolve) => setTimeout(resolve, 900));

      // ตรวจสอบว่า monster ตายแล้วหรือไม่
      if (nearestMonster.data?.defeated || nearestMonster.sprite?.getData('defeated')) {
        console.log("Monster defeated, continuing game");
        setCurrentHint("⚔️ ศัตรูตายแล้ว! เดินต่อได้");
      }
    } else {
      console.log("Failed to hit enemy");
      setCurrentHint("❌ โจมตีไม่สำเร็จ");
    }

    console.log("Hit function completed");
  };

  /**
   * Turn left
   */
  const turnLeft = async () => {
    const currentState = getCurrentGameState();
    if (currentState.goalReached || currentState.moveCount >= currentState.maxMoves || currentState.isGameOver) return;

    console.log("turnLeft called - current direction:", currentState.direction);

    await new Promise((resolve) => setTimeout(resolve, 300));
    const newDirection = (currentState.direction + 3) % 4;
    setPlayerDirection(newDirection);

    console.log("Turning left - new direction:", newDirection);

    // อัพเดท player direction ใน Phaser ผ่าน rotatePlayer
    if (getCurrentGameState().currentScene) {
      rotatePlayer(getCurrentGameState().currentScene, newDirection);
    } else {
      // Fallback update logic if no scene
      setCurrentGameState({ direction: newDirection });
      console.log("No current scene available for arrow update");
    }
  };

  /**
   * Turn right
   */
  const turnRight = async () => {
    const currentState = getCurrentGameState();
    if (currentState.goalReached || currentState.moveCount >= currentState.maxMoves || currentState.isGameOver) return;

    console.log("turnRight called - current direction:", currentState.direction);

    await new Promise((resolve) => setTimeout(resolve, 300));
    const newDirection = (currentState.direction + 1) % 4;
    setPlayerDirection(newDirection);

    console.log("Turning right - new direction:", newDirection);

    // อัพเดท player direction ใน Phaser ผ่าน rotatePlayer
    if (getCurrentGameState().currentScene) {
      rotatePlayer(getCurrentGameState().currentScene, newDirection);
    } else {
      // Fallback update logic if no scene
      setCurrentGameState({ direction: newDirection });
      console.log("No current scene available for arrow update");
    }
  };

  return {
    moveForward,
    turnLeft,
    turnRight,
    hit
  };
};

