// Game state management (เก็บข้อมูลส่วนกลางให้ทั้งเกมดึงไปใช้ได้ทันทีโดยไม่ต้องรอ React)
let currentScene = null; // เก็บ instance ของ Phaser Scene ล่าสุด
let levelData = null; // เก็บข้อมูลด่านปัจจุบัน
let playerHp = 100; // เก็บเลือดผู้เล่นแยกไว้เพื่อให้อ่าน/เขียนไวขึ้น

// State หลักที่เปลี่ยนบ่อยตอนเล่นเกม (Phaser จะมาอ่าน/เขียนตรงนี้)
let currentGameState = {
  currentNodeId: 0,
  direction: 0,
  goalReached: false,
  moveCount: 0,
  maxMoves: 50,
  isGameOver: false,
  playerHP: 100,
  weaponKey: "stick",
  weaponData: null,
  playerCoins: []
};

// Directions array
export const directions = [
  { x: 1, y: 0, symbol: "→" }, // right
  { x: 0, y: 1, symbol: "↓" }, // down
  { x: -1, y: 0, symbol: "←" }, // left
  { x: 0, y: -1, symbol: "↑" }, // up
];

// เอาฉากไปใช้
export function getCurrentScene() {
  return currentScene;
}

// อัปเดตฉากตอน GameScene.create
export function setCurrentScene(scene) {
  currentScene = scene;
}

// อัปเดตข้อมูลด่านตอนโหลดเสร็จ
export function setLevelData(data) {
  levelData = data;
}

// ขอข้อมูลด่าน
export function getLevelData() {
  return levelData;
}

// ดึง State ทั้งหมด (พ่วง scene กับ levelData ตามไปด้วยเลยจะได้ใช้ง่ายๆ)
export function getCurrentGameState() {
  // console.log("currentGameState", currentGameState);
  return {
    ...currentGameState,
    currentScene: currentScene,
    levelData: levelData
  };
}

// อัปเดต State (ทับเฉพาะค่าที่ส่งมา)
export function setCurrentGameState(state) {
  currentGameState = { ...currentGameState, ...state };
}

// ขอดูเลือดหน่อย
export function getPlayerHp() {
  return playerHp;
}

// ตั้งค่าเลือดใหม่
export function setPlayerHp(hp) {
  playerHp = hp;
}

// รีเซ็ตเลือดเป็น 100 (และถ้าส่ง React setter มา ก็เซ็ตของ React ด้วย)
export function resetPlayerHp(setPlayerHpState) {
  playerHp = 100;
  if (setPlayerHpState) setPlayerHpState(100);
}

