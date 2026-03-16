// Person rescue management functions
import { getCurrentGameState, setCurrentGameState } from '../shared/game/gameState';

// เก็บข้อมูลคนที่ต้องช่วย
let rescuedPeople = [];

// ฟังก์ชันช่วยคน
export async function rescuePerson() {
  const currentState = getCurrentGameState();
  if (!currentState.currentScene) {
    return false;
  }

  const currentNodeId = currentState.currentNodeId;
  const levelData = currentState.levelData;

  if (!levelData || !levelData.map_entities) {
    return null;
  }

  const person = levelData.map_entities.filter(e => e.entity_type === 'PEOPLE').find(p => p.nodeId === currentNodeId);
  if (!person) {
    return false;
  }

  if (person.rescued) {
    return false;
  }

  // ช่วยคนสำเร็จ
  person.rescued = true;
  rescuedPeople.push({
    nodeId: currentNodeId,
    personName: person.personName,
    rescuedAt: Date.now()
  });

  return { success: true, nodeId: currentNodeId };
}

// ฟังก์ชันช่วยคนที่ node ที่กำหนด
export async function rescuePersonAtNode(nodeId) {
  const currentState = getCurrentGameState();
  if (!currentState.currentScene) {
    return false;
  }

  // Ensure nodeId is a number
  const targetNodeId = Number(nodeId);

  const levelData = currentState.levelData;

  if (!levelData || !levelData.map_entities) {
    return null;
  }

  const person = levelData.map_entities.filter(e => e.entity_type === 'PEOPLE').find(p => p.nodeId === targetNodeId);
  if (!person) {
    return false;
  }

  if (person.rescued) {
    return false;
  }

  // ช่วยคนสำเร็จ
  person.rescued = true;
  rescuedPeople.push({
    nodeId: targetNodeId,
    personName: person.personName,
    rescuedAt: Date.now()
  });


  return { success: true, nodeId: targetNodeId };
}

// ตรวจสอบว่ามีคนที่ node นี้หรือไม่
export function hasPerson() {
  const currentState = getCurrentGameState();
  if (!currentState.currentScene || !currentState.levelData) {
    return false;
  }

  const currentNodeId = currentState.currentNodeId;
  const person = currentState.levelData.map_entities?.filter(e => e.entity_type === 'PEOPLE')?.find(p => p.nodeId === currentNodeId && !p.rescued);

  return !!person;
}

// ตรวจสอบว่าคนที่ node นี้ถูกช่วยแล้วหรือไม่
export function personRescued() {
  const currentState = getCurrentGameState();
  if (!currentState.currentScene || !currentState.levelData) {
    return false;
  }

  const currentNodeId = currentState.currentNodeId;
  const person = currentState.levelData.map_entities?.filter(e => e.entity_type === 'PEOPLE')?.find(p => p.nodeId === currentNodeId);

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
  if (!currentState.levelData || !currentState.levelData.map_entities) {
    return false;
  }

  const peopleEntities = currentState.levelData.map_entities.filter(e => e.entity_type === 'PEOPLE');
  const totalPeople = peopleEntities.length;
  const rescuedCount = rescuedPeople.length;

  return rescuedCount >= totalPeople;
}

// รับรายชื่อคนที่ช่วยแล้ว
export function getRescuedPeople() {
  return [...rescuedPeople];
}

// ล้างข้อมูลคนที่ช่วยแล้ว (สำหรับ reset)
export function clearRescuedPeople() {
  rescuedPeople = [];
}

// รีเซ็ตสถานะคนทั้งหมด
export async function resetAllPeople() {
  const currentState = getCurrentGameState();
  if (!currentState.levelData || !currentState.levelData.map_entities) {
    return false;
  }

  const peopleEntities = currentState.levelData.map_entities.filter(e => e.entity_type === 'PEOPLE');

  peopleEntities.forEach(person => {
    person.rescued = false;
  });

  // ล้างข้อมูลคนที่ช่วยแล้ว
  clearRescuedPeople();

}

