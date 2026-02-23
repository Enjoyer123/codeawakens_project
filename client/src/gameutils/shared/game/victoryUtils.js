// Victory conditions system
import { getCurrentGameState } from './gameState';
import { getPlayerCoins } from '../../entities/coinUtils';
import { allPeopleRescued, getRescuedPeople } from '../../entities/personUtils';

/**
 * ตรวจสอบเงื่อนไขชนะตาม victoryConditions ที่กำหนดใน level
 * @param {Array} victoryConditions - อาร์เรย์ของเงื่อนไขชนะ
 * @param {Object} levelData - ข้อมูลด่าน
 * @param {Object|null} overrideState - (Optional) State to use instead of getCurrentGameState()
 */
export function checkVictoryConditions(victoryConditions, levelData, overrideState = null) {
  console.log("🔍 checkVictoryConditions called");
  console.log("🔍 using overrideState:", !!overrideState);

  if (!victoryConditions || victoryConditions.length === 0) {
    console.log("🔍 No victory conditions found");
    return {
      completed: false,
      message: "❌ ไม่มีเงื่อนไขชนะที่กำหนด",
      failedConditions: []
    };
  }

  const currentState = overrideState || getCurrentGameState();
  console.log("🔍 Current state:", currentState);
  console.log("🔍 testCaseResult in currentState:", currentState.testCaseResult);
  const failedConditions = [];
  let allCompleted = true;

  for (const condition of victoryConditions) {
    console.log("🔍 Checking condition:", condition.type);
    const result = checkSingleVictoryCondition(condition, currentState, levelData);
    console.log("🔍 Condition result:", result);

    if (!result.completed) {
      allCompleted = false;
      failedConditions.push({
        type: condition.type,
        description: condition.description,
        reason: result.reason
      });
    }
  }

  console.log("🔍 All completed:", allCompleted);
  console.log("🔍 Failed conditions:", failedConditions);

  if (allCompleted) {
    const descriptions = victoryConditions.map(c => c.description).join(" และ ");
    console.log("🔍 VICTORY! All conditions met");
    return {
      completed: true,
      message: `🎉 ยินดีด้วย! ${descriptions} สำเร็จ!`,
      failedConditions: []
    };
  } else {
    const failedDescriptions = failedConditions.map(fc => fc.description).join(", ");
    console.log("🔍 NOT VICTORY! Some conditions failed");
    return {
      completed: false,
      message: `❌ ยังไม่สำเร็จ: ${failedDescriptions}`,
      failedConditions
    };
  }
}

/**
 * ตรวจสอบเงื่อนไขชนะเดียว
 * @param {Object} condition - เงื่อนไขชนะ
 * @param {Object} currentState - สถานะปัจจุบันของเกม
 * @param {Object} levelData - ข้อมูลด่าน
 * @returns {Object} - ผลลัพธ์การตรวจสอบ { completed: boolean, reason: string }
 */
function checkSingleVictoryCondition(condition, currentState, levelData) {
  console.log(`=== Checking condition: ${condition.type} ===`);
  console.log(`=== Condition data from database:`, condition);

  switch (condition.type) {
    case "reach_goal":
      console.log("reach_goal - goalReached:", currentState.goalReached);
      console.log("reach_goal - currentNodeId:", currentState.currentNodeId);
      console.log("reach_goal - goalNodeId:", levelData.goalNodeId);
      return {
        completed: currentState.goalReached,
        reason: currentState.goalReached ? "" : "ยังไม่ถึงเป้าหมาย"
      };

    case "coins_sorted":
      const sortedPlayerCoins = getPlayerCoins();
      if (sortedPlayerCoins.length === 0) {
        return {
          completed: false,
          reason: "ยังไม่ได้เก็บเหรียญเลย"
        };
      }

      // ตรวจสอบว่าเหรียญเรียงจากน้อยไปมาก
      let isSorted = true;
      for (let i = 0; i < sortedPlayerCoins.length - 1; i++) {
        if (sortedPlayerCoins[i].value > sortedPlayerCoins[i + 1].value) {
          isSorted = false;
          break;
        }
      }

      return {
        completed: isSorted,
        reason: isSorted ? "" : "เหรียญยังไม่เรียงถูกต้อง"
      };

    case "all_people_rescued":
      const allRescued = allPeopleRescued();
      return {
        completed: allRescued,
        reason: allRescued ? "" : "ยังช่วยคนไม่ครบ"
      };

    case "treasure_collected":
      const treasureCollected = currentState.treasureCollected || false;
      return {
        completed: treasureCollected,
        reason: treasureCollected ? "" : "ยังไม่ได้เก็บสมบัติ"
      };

    case "back_to_start":
      const backToStart = currentState.currentNodeId === levelData.startNodeId;
      return {
        completed: backToStart,
        reason: backToStart ? "" : "ยังไม่กลับมาจุดเริ่มต้น"
      };

    case "all_monsters_defeated":
      const allMonstersDefeated = checkAllMonstersDefeated(levelData);
      return {
        completed: allMonstersDefeated,
        reason: allMonstersDefeated ? "" : "ยังฆ่า Monster ไม่หมด"
      };

    case "all_coins_collected":
      console.log("=== all_coins_collected condition check ===");
      const allCoinsCollected = checkAllCoinsCollected(levelData);
      const collectedPlayerCoins = getPlayerCoins();
      const totalCoins = levelData.coinPositions?.length || 0;
      console.log("all_coins_collected - playerCoins.length:", collectedPlayerCoins.length);
      console.log("all_coins_collected - totalCoins:", totalCoins);
      console.log("all_coins_collected - result:", allCoinsCollected);
      console.log("=== END all_coins_collected condition check ===");
      return {
        completed: allCoinsCollected,
        reason: allCoinsCollected ? "" : "ยังเก็บเหรียญไม่หมด"
      };

    case "mst_connected":
      // เช็คว่าทุก node เชื่อมต่อกันได้ (Minimum Spanning Tree connected)
      const mstConnected = checkMSTConnected(levelData);
      return {
        completed: mstConnected,
        reason: mstConnected ? "" : "ยังเชื่อมต่อทุก node ไม่ได้"
      };

    case "function_return_test":
      // เช็ค return value ของ function กับ test cases
      const testCaseResult = currentState.testCaseResult;
      if (!testCaseResult) {
        return {
          completed: false,
          reason: "ยังไม่ได้รันโค้ดหรือไม่มี test cases"
        };
      }
      return {
        completed: testCaseResult.passed,
        reason: testCaseResult.passed ? "" : testCaseResult.message
      };

    default:
      return {
        completed: false,
        reason: `เงื่อนไขชนะไม่รู้จัก: ${condition.type}`
      };
  }
}

/**
 * สร้างข้อความ hint สำหรับเงื่อนไขที่ยังไม่สำเร็จ
 * @param {Array} failedConditions - เงื่อนไขที่ยังไม่สำเร็จ
 * @param {Object} levelData - ข้อมูลด่าน
 * @returns {string} - ข้อความ hint
 */
export function generateVictoryHint(failedConditions, levelData) {
  if (failedConditions.length === 0) {
    return "";
  }

  const hints = [];
  const currentState = getCurrentGameState();

  for (const failedCondition of failedConditions) {
    switch (failedCondition.type) {
      case "reach_goal":
        hints.push(`❌ ยังไม่ถึง Node ${levelData.goalNodeId}`);
        break;

      case "coins_sorted":
        const playerCoins = getPlayerCoins();
        if (playerCoins.length > 0) {
          const coinValues = playerCoins.map(c => c.value).join(', ');
          hints.push(`❌ เหรียญยังไม่เรียงถูกต้อง ลำดับปัจจุบัน: ${coinValues}`);
        } else {
          hints.push("❌ ยังไม่ได้เก็บเหรียญเลย");
        }
        break;

      case "all_people_rescued":
        const rescuedCount = getRescuedPeople().length;
        const totalPeople = levelData.people?.length || 0;
        hints.push(`❌ ยังช่วยคนไม่ครบ (${rescuedCount}/${totalPeople})`);
        break;

      case "treasure_collected":
        hints.push("❌ ยังไม่ได้เก็บสมบัติ");
        break;

      case "back_to_start":
        hints.push(`❌ ยังไม่กลับมาจุดเริ่มต้น (Node ${levelData.startNodeId})`);
        break;

      case "all_monsters_defeated":
        const defeatedCount = getDefeatedMonstersCount(levelData);
        const totalMonsters = levelData.monsters?.length || 0;
        hints.push(`❌ ยังฆ่า Monster ไม่หมด (${defeatedCount}/${totalMonsters})`);
        break;

      case "all_coins_collected":
        const collectedCount = getPlayerCoins().length;
        const totalCoins = levelData.coinPositions?.length || 0;
        hints.push(`❌ ยังเก็บเหรียญไม่หมด (${collectedCount}/${totalCoins})`);
        break;

      case "mst_connected":
        hints.push("❌ ยังเชื่อมต่อทุก node ไม่ได้");
        break;

      default:
        hints.push(`❌ ${failedCondition.description}: ${failedCondition.reason}`);
    }
  }

  return hints.join(" ");
}

/**
 * ตรวจสอบว่า Monster ทั้งหมดถูกฆ่าแล้วหรือไม่
 * @param {Object} levelData - ข้อมูลด่าน
 * @returns {boolean} - true ถ้า Monster ทั้งหมดถูกฆ่าแล้ว
 */
function checkAllMonstersDefeated(levelData) {
  if (!levelData.monsters || levelData.monsters.length === 0) {
    return true; // ไม่มี Monster = ผ่าน
  }

  return levelData.monsters.every(monster => monster.defeated === true);
}

/**
 * ตรวจสอบว่าเหรียญทั้งหมดถูกเก็บแล้วหรือไม่
 * @param {Object} levelData - ข้อมูลด่าน
 * @returns {boolean} - true ถ้าเหรียญทั้งหมดถูกเก็บแล้ว
 */
function checkAllCoinsCollected(levelData) {
  console.log("=== checkAllCoinsCollected DEBUG ===");
  console.log("levelData.coinPositions:", levelData.coinPositions);

  if (!levelData.coinPositions || levelData.coinPositions.length === 0) {
    console.log("checkAllCoinsCollected - no coins in level, returning true");
    return true; // ไม่มีเหรียญ = ผ่าน
  }

  const playerCoins = getPlayerCoins();
  const totalCoins = levelData.coinPositions.length;

  console.log("playerCoins:", playerCoins);
  console.log("playerCoins.length:", playerCoins.length);
  console.log("totalCoins:", totalCoins);
  console.log("coinPositions details:", levelData.coinPositions.map(c => ({ id: c.id, value: c.value, collected: c.collected })));

  // ตรวจสอบว่าเก็บเหรียญครบตามจำนวนที่กำหนดในด่าน
  const result = playerCoins.length >= totalCoins;
  console.log("checkAllCoinsCollected - result:", result);
  console.log("=== END checkAllCoinsCollected DEBUG ===");

  return result;
}

/**
 * นับจำนวน Monster ที่ถูกฆ่าแล้ว
 * @param {Object} levelData - ข้อมูลด่าน
 * @returns {number} - จำนวน Monster ที่ถูกฆ่าแล้ว
 */
function getDefeatedMonstersCount(levelData) {
  if (!levelData.monsters || levelData.monsters.length === 0) {
    return 0;
  }

  return levelData.monsters.filter(monster => monster.defeated === true).length;
}

/**
 * ตรวจสอบว่าทุก node เชื่อมต่อกันได้ (Minimum Spanning Tree connected)
 * ใช้ BFS/DFS เพื่อเช็คว่าทุก node สามารถไปถึงได้จาก start node
 * @param {Object} levelData - ข้อมูลด่าน
 * @returns {boolean} - true ถ้าทุก node เชื่อมต่อกันได้
 */
function checkMSTConnected(levelData) {
  if (!levelData.nodes || levelData.nodes.length === 0) {
    return true; // ไม่มี node = ผ่าน
  }

  if (!levelData.edges || levelData.edges.length === 0) {
    return false; // ไม่มี edge = ไม่เชื่อมต่อ
  }

  const startNodeId = levelData.startNodeId || levelData.nodes[0].id;
  const visited = new Set();
  const queue = [startNodeId];

  // BFS to check connectivity
  while (queue.length > 0) {
    const currentNodeId = queue.shift();

    if (visited.has(currentNodeId)) {
      continue;
    }

    visited.add(currentNodeId);

    // Find all connected nodes
    const connectedNodes = levelData.edges
      .filter(edge => edge.from === currentNodeId || edge.to === currentNodeId)
      .map(edge => edge.from === currentNodeId ? edge.to : edge.from)
      .filter(nodeId => !visited.has(nodeId));

    queue.push(...connectedNodes);
  }

  // Check if all nodes are visited
  const allNodesVisited = levelData.nodes.every(node => visited.has(node.id));

  console.log("🔍 MST Connected check:", {
    totalNodes: levelData.nodes.length,
    visitedNodes: visited.size,
    allNodesVisited
  });

  return allNodesVisited;
}

