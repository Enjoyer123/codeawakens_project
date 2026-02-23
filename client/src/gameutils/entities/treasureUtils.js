// Treasure management logic (Pure state, no visuals)
import { getCurrentGameState, setCurrentGameState } from '../shared/game/gameState';

// ตรวจสอบว่ามีสมบัติที่ node นี้หรือไม่
export function hasTreasureAtNode(nodeId) {
    const currentState = getCurrentGameState();
    if (!currentState.levelData || !currentState.levelData.treasures) {
        return false;
    }

    const treasure = currentState.levelData.treasures.find(t => t.nodeId === nodeId);
    return !!treasure && !treasure.collected;
}

// ฟังก์ชันเก็บสมบัติ (แบบ Pure Logic ห้ามเรียก Phaser โดยตรง)
export function collectTreasure(nodeId) {
    const currentState = getCurrentGameState();

    if (!currentState.levelData || !currentState.levelData.treasures) {
        return { success: false, reason: "no_data" };
    }

    const treasure = currentState.levelData.treasures.find(t => t.nodeId === nodeId);

    if (treasure && !treasure.collected) {
        treasure.collected = true;
        setCurrentGameState({ treasureCollected: true });
        return { success: true, nodeId };
    }

    return { success: false, reason: "already_collected_or_missing" };
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

export function resetTreasures() {
    setCurrentGameState({ treasureCollected: false });
    // Reset treasure collected status in levelData
    const currentState = getCurrentGameState();
    if (currentState.levelData && currentState.levelData.treasures) {
        currentState.levelData.treasures.forEach(treasure => {
            treasure.collected = false;
        });
    }
}

// Helpers for blockly execution backward-compat
export function hasTreasure() {
    const currentState = getCurrentGameState();
    return currentState.treasureCollected || false;
}

export function treasureCollected() {
    const currentState = getCurrentGameState();
    return currentState.treasureCollected || false;
}
