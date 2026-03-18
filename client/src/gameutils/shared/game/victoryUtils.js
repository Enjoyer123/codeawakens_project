// Victory conditions system
import { getCurrentGameState } from './gameState';
import { getPlayerCoins } from '../../entities/coinUtils';
import { allPeopleRescued, getRescuedPeople } from '../../entities/personUtils';

/**
 * ตรวจสอบเงื่อนไขชนะตาม victoryConditions ที่กำหนดใน level
 */
export function checkVictoryConditions(victoryConditions, levelData, overrideState = null) {
  if (!victoryConditions || victoryConditions.length === 0) {
    return {
      completed: false,
      message: "❌ ไม่มีเงื่อนไขชนะที่กำหนด",
      failedConditions: []
    };
  }

  const currentState = overrideState || getCurrentGameState();
  const failedConditions = [];
  let allCompleted = true;

  for (const condition of victoryConditions) {
    const result = checkSingleVictoryCondition(condition, currentState, levelData);

    if (!result.completed) {
      allCompleted = false;
      failedConditions.push({
        type: condition.type,
        description: condition.description,
        reason: result.reason
      });
    }
  }

  if (allCompleted) {
    const descriptions = victoryConditions.map(c => c.description).join(" และ ");
    return {
      completed: true,
      message: `🎉 ยินดีด้วย! ${descriptions} สำเร็จ!`,
      failedConditions: []
    };
  } else {
    const failedDescriptions = failedConditions.map(fc => fc.description).join(", ");
    return {
      completed: false,
      message: `❌ ยังไม่สำเร็จ: ${failedDescriptions}`,
      failedConditions
    };
  }
}

/**
 * ตรวจสอบเงื่อนไขชนะเดียว
 */
function checkSingleVictoryCondition(condition, currentState, levelData) {
  switch (condition.type) {
    case "reach_goal":
      return {
        completed: currentState.goalReached,
        reason: currentState.goalReached ? "" : "ยังไม่ถึงเป้าหมาย"
      };

    case "coins_sorted": {
      const playerCoins = getPlayerCoins();
      if (playerCoins.length === 0) {
        return { completed: false, reason: "ยังไม่ได้เก็บเหรียญเลย" };
      }
      
      const isSorted = playerCoins.every((c, i, arr) => i === 0 || arr[i - 1].value <= c.value);

      return {
        completed: isSorted,
        reason: isSorted ? "" : "เหรียญยังไม่เรียงถูกต้อง"
      };
    }

    case "all_people_rescued": {
      const allRescued = allPeopleRescued();
      return {
        completed: allRescued,
        reason: allRescued ? "" : "ยังช่วยคนไม่ครบ"
      };
    }

    case "back_to_start":
      return {
        completed: currentState.currentNodeId === levelData.start_node_id,
        reason: currentState.currentNodeId === levelData.start_node_id ? "" : "ยังไม่กลับมาจุดเริ่มต้น"
      };

    case "all_monsters_defeated": {
      const monsters = levelData.map_entities?.filter(e => e.entity_type === 'MONSTER') || [];
      const allDefeated = !monsters.length || monsters.every(m => m.defeated);
      return {
        completed: allDefeated,
        reason: allDefeated ? "" : "ยังฆ่า Monster ไม่หมด"
      };
    }

    case "all_coins_collected": {
      const coins = levelData.map_entities?.filter(e => e.entity_type === 'COIN') || [];
      const totalCoins = coins.length;
      if (totalCoins === 0) return { completed: true, reason: "" };
      const collected = getPlayerCoins().length >= totalCoins;
      return {
        completed: collected,
        reason: collected ? "" : "ยังเก็บเหรียญไม่หมด"
      };
    }

    case "mst_connected": {
      const connected = checkMSTConnected(levelData);
      return {
        completed: connected,
        reason: connected ? "" : "ยังเชื่อมต่อทุก node ไม่ได้"
      };
    }

    case "function_return_test": {
      const testResult = currentState.testCaseResult;
      if (!testResult) {
        return { completed: false, reason: "ยังไม่ได้รันโค้ดหรือไม่มี test cases" };
      }
      return {
        completed: testResult.passed,
        reason: testResult.passed ? "" : testResult.message
      };
    }

    default:
      return {
        completed: false,
        reason: `เงื่อนไขชนะไม่รู้จัก: ${condition.type}`
      };
  }
}

/**
 * สร้างข้อความ hint สำหรับเงื่อนไขที่ยังไม่สำเร็จ
 */
export function generateVictoryHint(failedConditions, levelData) {
  if (failedConditions.length === 0) return "";

  const hints = [];

  for (const fc of failedConditions) {
    switch (fc.type) {
      case "reach_goal":
        hints.push(`❌ ยังไม่ถึง Node ${levelData.goal_node_id}`);
        break;
      case "coins_sorted":
        hints.push("❌ เหรียญยังไม่เรียงถูกต้อง");
        break;
      case "all_people_rescued": {
        const rescued = getRescuedPeople().length;
        const peopleEntities = levelData.map_entities?.filter(e => e.entity_type === 'PEOPLE') || [];
        const total = peopleEntities.length;
        hints.push(`❌ ยังช่วยคนไม่ครบ (${rescued}/${total})`);
        break;
      }
      case "back_to_start":
        hints.push(`❌ ยังไม่กลับมาจุดเริ่มต้น (Node ${levelData.start_node_id})`);
        break;
      case "all_monsters_defeated": {
        const monsters = levelData.map_entities?.filter(e => e.entity_type === 'MONSTER') || [];
        const defeated = monsters.filter(m => m.defeated).length;
        const totalMonsters = monsters.length;
        hints.push(`❌ ยังฆ่า Monster ไม่หมด (${defeated}/${totalMonsters})`);
        break;
      }
      case "all_coins_collected": {
        const collected = getPlayerCoins().length;
        const coins = levelData.map_entities?.filter(e => e.entity_type === 'COIN') || [];
        const totalCoins = coins.length;
        hints.push(`❌ ยังเก็บเหรียญไม่หมด (${collected}/${totalCoins})`);
        break;
      }
      case "mst_connected":
        hints.push("❌ ยังเชื่อมต่อทุก node ไม่ได้");
        break;
      default:
        hints.push(`❌ ${fc.description}: ${fc.reason}`);
    }
  }

  return hints.join(" ");
}

/**
 * ตรวจสอบว่าทุก node เชื่อมต่อกัน (MST connected) ด้วย BFS
 */
function checkMSTConnected(levelData) {
  if (!levelData.nodes?.length) return true;
  if (!levelData.edges?.length) return false;

  const startNodeId = levelData.start_node_id || levelData.nodes[0].id;
  const visited = new Set();
  const queue = [startNodeId];

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    levelData.edges
      .filter(e => e.from === nodeId || e.to === nodeId)
      .map(e => e.from === nodeId ? e.to : e.from)
      .filter(id => !visited.has(id))
      .forEach(id => queue.push(id));
  }

  return levelData.nodes.every(n => visited.has(n.id));
}
