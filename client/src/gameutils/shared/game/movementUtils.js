// Movement helper functions
import { getCurrentGameState, setCurrentGameState, getLevelData, directions } from './gameState';

// ฟังก์ชันเดินไปที่ node ที่กำหนด
export async function moveToNode(targetNodeId) {
  const currentState = getCurrentGameState();
  if (!currentState.currentScene || !currentState.levelData) {
    console.log("No current scene or level data available");
    return false;
  }

  const currentNodeId = currentState.currentNodeId;
  const levelData = currentState.levelData;

  // ตรวจสอบว่า target node มีอยู่หรือไม่
  const targetNode = levelData.nodes.find(node => node.id === targetNodeId);
  if (!targetNode) {
    console.log(`Target node ${targetNodeId} not found`);
    return false;
  }

  // ถ้าอยู่ที่ node เดียวกันแล้ว
  if (currentNodeId === targetNodeId) {
    console.log(`Already at node ${targetNodeId}`);
    return true;
  }

  // หาเส้นทางจาก current node ไป target node
  const path = findPath(currentNodeId, targetNodeId, levelData);
  if (!path || path.length === 0) {
    console.log(`No path found from node ${currentNodeId} to node ${targetNodeId}`);
    return false;
  }

  console.log(`Moving from node ${currentNodeId} to node ${targetNodeId} via path:`, path);

  // เดินตามเส้นทาง
  for (let i = 1; i < path.length; i++) {
    const nextNodeId = path[i];
    const success = await moveToNextNode(nextNodeId);
    if (!success) {
      console.log(`Failed to move to node ${nextNodeId}`);
      return false;
    }
    // รอสักครู่เพื่อให้การเคลื่อนที่ดูเป็นธรรมชาติ
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`Successfully moved to node ${targetNodeId}`);
  return true;
}

// ฟังก์ชันหาเส้นทางระหว่างสอง nodes (BFS)
function findPath(startNodeId, endNodeId, levelData) {
  const visited = new Set();
  const queue = [[startNodeId]];

  while (queue.length > 0) {
    const path = queue.shift();
    const currentNodeId = path[path.length - 1];

    if (currentNodeId === endNodeId) {
      return path;
    }

    if (visited.has(currentNodeId)) {
      continue;
    }

    visited.add(currentNodeId);

    // หา nodes ที่เชื่อมต่อกับ current node
    const connectedNodes = levelData.edges
      .filter(edge => edge.from === currentNodeId || edge.to === currentNodeId)
      .map(edge => edge.from === currentNodeId ? edge.to : edge.from)
      .filter(nodeId => !visited.has(nodeId));

    for (const nextNodeId of connectedNodes) {
      queue.push([...path, nextNodeId]);
    }
  }

  return null; // ไม่พบเส้นทาง
}

// ฟังก์ชันเดินไป node ถัดไป
async function moveToNextNode(nextNodeId) {
  const currentState = getCurrentGameState();
  const currentNodeId = currentState.currentNodeId;
  const levelData = currentState.levelData;

  const currentNode = levelData.nodes.find(node => node.id === currentNodeId);
  const nextNode = levelData.nodes.find(node => node.id === nextNodeId);

  if (!currentNode || !nextNode) {
    return false;
  }

  // คำนวณทิศทางที่ต้องหัน
  const dx = nextNode.x - currentNode.x;
  const dy = nextNode.y - currentNode.y;

  let targetDirection;
  if (Math.abs(dx) > Math.abs(dy)) {
    targetDirection = dx > 0 ? 0 : 2; // right or left
  } else {
    targetDirection = dy > 0 ? 1 : 3; // down or up
  }

  // หันไปทิศทางที่ถูกต้อง
  const currentDirection = currentState.direction;
  const directionDiff = (targetDirection - currentDirection + 4) % 4;

  for (let i = 0; i < directionDiff; i++) {
    await turnRight();
  }

  // เดินไปข้างหน้า
  await moveForward();

  return true;
}

// ฟังก์ชันหันขวา (helper function for moveToNode)
async function turnRight() {
  const currentState = getCurrentGameState();
  if (currentState.goalReached || currentState.moveCount >= currentState.maxMoves || currentState.isGameOver) return;
  await new Promise(resolve => setTimeout(resolve, 300));
  setCurrentGameState({ direction: (currentState.direction + 1) % 4 });
}

// ฟังก์ชันเดินไปข้างหน้า (helper function for moveToNode)
// Note: This is a simplified version for moveToNode only
// The main moveForward is implemented in useGameActions.js
async function moveForward() {
  // Import movePlayerWithCollisionDetection dynamically to avoid circular dependency
  const { movePlayerWithCollisionDetection } = await import('../../phaser/player/phaserGamePlayer');
  const currentState = getCurrentGameState();

  if (!currentState.currentScene || !currentState.levelData) {
    return false;
  }

  const currentNodeId = currentState.currentNodeId;
  const currentNode = currentState.levelData.nodes.find(n => n.id === currentNodeId);
  if (!currentNode) return false;

  // Find next node in current direction
  const dirVector = [
    { x: 1, y: 0 }, // right
    { x: 0, y: 1 }, // down
    { x: -1, y: 0 }, // left
    { x: 0, y: -1 } // up
  ][currentState.direction];

  const connectedNodes = currentState.levelData.edges
    .filter(edge => edge.from === currentNodeId || edge.to === currentNodeId)
    .map(edge => edge.from === currentNodeId ? edge.to : edge.from)
    .map(nodeId => currentState.levelData.nodes.find(n => n.id === nodeId))
    .filter(node => node);

  let targetNode = null;
  for (let node of connectedNodes) {
    const dx = node.x - currentNode.x;
    const dy = node.y - currentNode.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if ((dirVector.x > 0 && dx > 0) || (dirVector.x < 0 && dx < 0)) {
        targetNode = node;
        break;
      }
    } else {
      if ((dirVector.y > 0 && dy > 0) || (dirVector.y < 0 && dy < 0)) {
        targetNode = node;
        break;
      }
    }
  }

  if (!targetNode) return false;

  // Use movePlayerWithCollisionDetection
  const moveResult = await movePlayerWithCollisionDetection(
    currentState.currentScene,
    currentNode,
    targetNode
  );

  if (moveResult.success && !moveResult.hitObstacle) {
    setCurrentGameState({ currentNodeId: targetNode.id });
    return true;
  }

  return false;
}

