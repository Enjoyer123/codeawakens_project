// Game state management
let currentScene = null;
let levelData = null;
let playerHp = 100;

let currentGameState = {
  currentNodeId: 0,
  direction: 0,
  goalReached: false,
  moveCount: 0,
  maxMoves: 50,
  isGameOver: false,
  weapon: null,
  hasGoodWeapon: false,
  playerHP: 100,
  weaponKey: "stick",
  weaponData: null,
  playerCoins: [], // Array to store collected coins
  dijkstraState: {
    visited: [],
    pq: [], // Priority Queue: [[distance, path], ...]
    mstWeight: 0 // MST weight สำหรับ Prim's algorithm
  }
};

// Directions array
export const directions = [
  { x: 1, y: 0, symbol: "→" }, // right
  { x: 0, y: 1, symbol: "↓" }, // down
  { x: -1, y: 0, symbol: "←" }, // left
  { x: 0, y: -1, symbol: "↑" }, // up
];

// Scene management
export function getCurrentScene() {
  return currentScene;
}

export function setCurrentScene(scene) {
  currentScene = scene;
}

// Level data management
export function setLevelData(data) {
  levelData = data;
}

export function getLevelData() {
  return levelData;
}

// Game state management
export function getCurrentGameState() {
  return {
    ...currentGameState,
    currentScene: currentScene,
    levelData: levelData
  };
}

export function setCurrentGameState(state) {
  currentGameState = { ...currentGameState, ...state };
}

// HP management
export function getPlayerHp() {
  return playerHp;
}

export function setPlayerHp(hp) {
  playerHp = hp;
}

export function resetPlayerHp(setPlayerHp) {
  playerHp = 100;
  if (setPlayerHp) setPlayerHp(100);
}

