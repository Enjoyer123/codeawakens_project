// Stack operations and treasure management
import { getCurrentGameState, setCurrentGameState } from '../game/gameState';

// เก็บข้อมูล stack สำหรับเก็บ node ที่เดินผ่าน
let nodeStack = [];

// ฟังก์ชันดึงข้อมูล stack
export function getStack() {
  return [...nodeStack];
}

// ฟังก์ชัน push node ลงใน stack
export async function pushToStack(nodeId) {
  nodeStack.push(nodeId);
  console.log(`Node ${nodeId} pushed to stack. Stack:`, nodeStack);
  await new Promise(resolve => setTimeout(resolve, 200));
  return true;
}

// ฟังก์ชัน pop node ออกจาก stack
export async function popFromStack() {
  if (nodeStack.length === 0) {
    console.log("Stack is empty, cannot pop");
    return null;
  }

  const nodeId = nodeStack.pop();
  console.log(`Node ${nodeId} popped from stack. Stack:`, nodeStack);
  await new Promise(resolve => setTimeout(resolve, 200));
  return nodeId;
}

// ฟังก์ชันตรวจสอบว่า stack ว่างหรือไม่
export function isStackEmpty() {
  return nodeStack.length === 0;
}

// ฟังก์ชันนับจำนวน node ใน stack
export function getStackCount() {
  return nodeStack.length;
}

// ฟังก์ชันตรวจสอบว่ามีสมบัติที่ node นี้หรือไม่
export function hasTreasureAtNode(nodeId) {
  const currentState = getCurrentGameState();
  if (!currentState.levelData || !currentState.levelData.treasures) {
    return false;
  }

  const treasure = currentState.levelData.treasures.find(t => t.nodeId === nodeId);
  return !!treasure && !treasure.collected;
}

// ฟังก์ชันเก็บสมบัติ
export function collectTreasure(nodeId) {
  const currentState = getCurrentGameState();
  console.log(`=== COLLECT TREASURE DEBUG ===`);
  console.log(`nodeId: ${nodeId}`);
  console.log(`levelData:`, !!currentState.levelData);
  console.log(`treasures:`, currentState.levelData?.treasures);

  if (!currentState.levelData || !currentState.levelData.treasures) {
    console.log("No levelData or treasures found");
    return false;
  }

  const treasure = currentState.levelData.treasures.find(t => t.nodeId === nodeId);
  console.log(`Found treasure:`, treasure);

  if (treasure && !treasure.collected) {
    treasure.collected = true;
    setCurrentGameState({ treasureCollected: true });
    console.log(`✅ Treasure collected at node ${nodeId}: ${treasure.name}`);

    // อัปเดตการแสดงผลสมบัติ
    if (currentState.currentScene) {
      import('../phaser/phaserCollection').then(({ collectTreasureVisual }) => {
        collectTreasureVisual(currentState.currentScene, nodeId);
      });
    }

    return true;
  } else if (treasure && treasure.collected) {
    console.log(`Treasure at node ${nodeId} already collected`);
  } else {
    console.log(`No treasure found at node ${nodeId}`);
  }
  return false;
}

// ฟังก์ชันดึงรายการสมบัติที่เก็บแล้ว
export function getCollectedTreasures() {
  const currentState = getCurrentGameState();
  if (!currentState.levelData || !currentState.levelData.treasures) {
    return [];
  }
  return currentState.levelData.treasures.filter(t => t.collected);
}

// ฟังก์ชันตรวจสอบว่าสมบัติถูกเก็บแล้วหรือไม่
export function isTreasureCollected(nodeId) {
  const currentState = getCurrentGameState();
  if (!currentState.levelData || !currentState.levelData.treasures) {
    return false;
  }

  const treasure = currentState.levelData.treasures.find(t => t.nodeId === nodeId);
  return treasure ? treasure.collected : false;
}

// ฟังก์ชันล้าง stack
export function clearStack() {
  nodeStack = [];
  setCurrentGameState({ treasureCollected: false });

  // Reset treasure collected status in levelData
  const currentState = getCurrentGameState();
  if (currentState.levelData && currentState.levelData.treasures) {
    currentState.levelData.treasures.forEach(treasure => {
      treasure.collected = false;
    });
    console.log("Treasures reset in levelData");
  }

  console.log("Stack cleared");
}

// Helper functions for Blockly blocks
export function pushNode() {
  const currentState = getCurrentGameState();
  return pushToStack(currentState.currentNodeId);
}

export function popNode() {
  return popFromStack();
}

export function keepItem() {
  // Keep the last item in stack (don't pop)
  const stack = getStack();
  if (stack.length > 0) {
    console.log(`Keeping item: Node ${stack[stack.length - 1]}`);
  }
}

export function hasTreasure() {
  const currentState = getCurrentGameState();
  return currentState.treasureCollected || false;
}

export function treasureCollected() {
  const currentState = getCurrentGameState();
  return currentState.treasureCollected || false;
}

export function stackEmpty() {
  return isStackEmpty();
}

export function stackCount() {
  return getStackCount();
}

