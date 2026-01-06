// Person rescue management functions
import { getCurrentGameState, setCurrentGameState } from '../game/gameState';

// เก็บข้อมูลคนที่ต้องช่วย
let rescuedPeople = [];

// ฟังก์ชันช่วยคน
export async function rescuePerson() {
  const currentState = getCurrentGameState();
  if (!currentState.currentScene) {
    console.log("No current scene available for rescue");
    return false;
  }

  const currentNodeId = currentState.currentNodeId;
  const levelData = currentState.levelData;

  if (!levelData || !levelData.people) {
    console.log("No level data or people available");
    return false;
  }

  const person = levelData.people.find(p => p.nodeId === currentNodeId);
  if (!person) {
    console.log(`No person at node ${currentNodeId}`);
    return false;
  }

  if (person.rescued) {
    console.log(`Person at node ${currentNodeId} already rescued`);
    return false;
  }

  // ช่วยคนสำเร็จ
  person.rescued = true;
  rescuedPeople.push({
    nodeId: currentNodeId,
    personName: person.personName,
    rescuedAt: Date.now()
  });

  console.log(`✅ ช่วย ${person.personName} ที่ node ${currentNodeId} สำเร็จ!`);

  // อัปเดต UI
  if (currentState.currentScene) {
    const { rescuePersonVisual } = await import('../phaser/phaserCollection');
    rescuePersonVisual(currentState.currentScene, currentNodeId);
  }

  return true;
}

// ฟังก์ชันช่วยคนที่ node ที่กำหนด
export async function rescuePersonAtNode(nodeId) {
  const currentState = getCurrentGameState();
  if (!currentState.currentScene) {
    console.log("No current scene available for rescue");
    return false;
  }

  // Ensure nodeId is a number
  const targetNodeId = Number(nodeId);

  const levelData = currentState.levelData;

  if (!levelData || !levelData.people) {
    console.log("No level data or people available");
    return false;
  }

  const person = levelData.people.find(p => p.nodeId === targetNodeId);
  if (!person) {
    console.log(`No person at node ${targetNodeId} (input: ${nodeId})`);
    return false;
  }

  if (person.rescued) {
    console.log(`Person at node ${targetNodeId} already rescued`);
    return false;
  }

  // ช่วยคนสำเร็จ
  person.rescued = true;
  rescuedPeople.push({
    nodeId: targetNodeId,
    personName: person.personName,
    rescuedAt: Date.now()
  });

  console.log(`✅ ช่วย ${person.personName} ที่ node ${targetNodeId} สำเร็จ!`);

  // อัปเดต UI
  if (currentState.currentScene) {
    const { rescuePersonVisual } = await import('../phaser/phaserCollection');
    rescuePersonVisual(currentState.currentScene, targetNodeId);
  }

  return true;
}

// ตรวจสอบว่ามีคนที่ node นี้หรือไม่
export function hasPerson() {
  const currentState = getCurrentGameState();
  if (!currentState.currentScene || !currentState.levelData) {
    return false;
  }

  const currentNodeId = currentState.currentNodeId;
  const person = currentState.levelData.people?.find(p => p.nodeId === currentNodeId && !p.rescued);

  return !!person;
}

// ตรวจสอบว่าคนที่ node นี้ถูกช่วยแล้วหรือไม่
export function personRescued() {
  const currentState = getCurrentGameState();
  if (!currentState.currentScene || !currentState.levelData) {
    return false;
  }

  const currentNodeId = currentState.currentNodeId;
  const person = currentState.levelData.people?.find(p => p.nodeId === currentNodeId);

  if (!person) {
    return false;
  }

  return person.rescued;
}

// นับจำนวนคนที่ช่วยแล้ว
export function getPersonCount() {
  return rescuedPeople.length;
}

// ตรวจสอบว่าช่วยคนทั้งหมดแล้วหรือไม่
export function allPeopleRescued() {
  const currentState = getCurrentGameState();
  if (!currentState.levelData || !currentState.levelData.people) {
    return false;
  }

  const totalPeople = currentState.levelData.people.length;
  const rescuedCount = rescuedPeople.length;

  console.log(`People rescued: ${rescuedCount}/${totalPeople}`);
  return rescuedCount >= totalPeople;
}

// รับรายชื่อคนที่ช่วยแล้ว
export function getRescuedPeople() {
  return [...rescuedPeople];
}

// ล้างข้อมูลคนที่ช่วยแล้ว (สำหรับ reset)
export function clearRescuedPeople() {
  rescuedPeople = [];
  console.log("Rescued people cleared");
}

// รีเซ็ตสถานะคนทั้งหมด
export async function resetAllPeople() {
  const currentState = getCurrentGameState();
  if (!currentState.levelData || !currentState.levelData.people) {
    return;
  }

  // รีเซ็ตสถานะ rescued ของทุกคน
  currentState.levelData.people.forEach(person => {
    person.rescued = false;
  });

  // ล้างข้อมูลคนที่ช่วยแล้ว
  clearRescuedPeople();

  // อัปเดต UI
  if (currentState.currentScene) {
    const { updatePersonDisplay } = await import('../phaser/phaserCollection');
    updatePersonDisplay(currentState.currentScene);
  }

  console.log("All people reset to not rescued");
}

