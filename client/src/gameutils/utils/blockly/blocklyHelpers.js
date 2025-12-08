// Blockly Helper Functions - Game Functions
import { 
  getCurrentGameState, 
  setCurrentGameState, 
  getCurrentScene
} from '../gameUtils';
import { 
  getPlayerCoins,
  addCoinToPlayer,
  swapPlayerCoins,
  comparePlayerCoins,
  getPlayerCoinValue,
  getPlayerCoinCount,
  arePlayerCoinsSorted
} from '../gameUtils';
import { collectCoinByPlayer, haveCoinAtPosition } from '../phaser/phaserCollection';
import { 
  rescuePerson as gameRescuePerson,
  rescuePersonAtNode as gameRescuePersonAtNode,
  hasPerson as gameHasPerson,
  personRescued as gamePersonRescued,
  getPersonCount as gameGetPersonCount, 
  allPeopleRescued as gameAllPeopleRescued,
  getRescuedPeople as gameGetRescuedPeople,
  clearRescuedPeople as gameClearRescuedPeople,
  resetAllPeople as gameResetAllPeople
} from '../gameUtils';
import { moveToNode as phaserMoveToNode } from '../../phaser/utils/playerMovement';
import { 
  getStack as gameGetStack,
  pushToStack as gamePushToStack,
  popFromStack as gamePopFromStack,
  isStackEmpty as gameIsStackEmpty,
  getStackCount as gameGetStackCount,
  hasTreasureAtNode as gameHasTreasureAtNode,
  collectTreasure as gameCollectTreasure,
  isTreasureCollected as gameIsTreasureCollected,
  clearStack as gameClearStack
} from '../gameUtils';

// Movement functions
export async function turnLeft() {
  const currentState = getCurrentGameState();
  if (currentState.goalReached || currentState.moveCount >= currentState.maxMoves || currentState.isGameOver) return;
  await new Promise((resolve) => setTimeout(resolve, 300));
  setCurrentGameState({ direction: (currentState.direction + 3) % 4 });
}

export async function turnRight() {
  const currentState = getCurrentGameState();
  if (currentState.goalReached || currentState.moveCount >= currentState.maxMoves || currentState.isGameOver) return;
  await new Promise((resolve) => setTimeout(resolve, 300));
  setCurrentGameState({ direction: (currentState.direction + 1) % 4 });
}

// Coin collection functions
export async function collectCoin() {
  const currentState = getCurrentGameState();
  if (currentState.goalReached || currentState.isGameOver) return;
  
  console.log("Collect coin function called");
  await new Promise((resolve) => setTimeout(resolve, 200));
  
  const scene = getCurrentScene();
  
  if (scene && scene.player) {
    console.log(`collectCoin called - player at (${scene.player.x}, ${scene.player.y})`);
    const collected = collectCoinByPlayer(scene, scene.player.x, scene.player.y);
    
    if (collected) {
      const playerX = scene.player.x;
      const playerY = scene.player.y;
      
      const collectedCoins = scene.coins.filter(coin => {
        if (!coin.collected) return false;
        
        const distance = Math.sqrt(
          Math.pow(playerX - coin.x, 2) + Math.pow(playerY - coin.y, 2)
        );
        
        return distance <= 100;
      });
      
      if (collectedCoins.length === 0) {
        const recentlyCollected = scene.coins.filter(coin => {
          if (!coin.collected) return false;
          const existingCoins = getPlayerCoins();
          const alreadyInInventory = existingCoins.some(playerCoin => playerCoin.id === coin.id);
          return !alreadyInInventory;
        });
        collectedCoins.push(...recentlyCollected);
      }
      
      for (const collectedCoin of collectedCoins) {
        const existingCoins = getPlayerCoins();
        const alreadyCollected = existingCoins.some(coin => coin.id === collectedCoin.id);
        
        if (!alreadyCollected) {
          addCoinToPlayer({
            id: collectedCoin.id,
            value: collectedCoin.value,
            x: collectedCoin.x,
            y: collectedCoin.y
          });
        }
      }
    }
  }
  
  await new Promise((resolve) => setTimeout(resolve, 300));
}

export function haveCoin() {
  const currentState = getCurrentGameState();
  if (currentState.goalReached || currentState.isGameOver) return false;
  
  const scene = getCurrentScene();
  
  if (scene && scene.player) {
    return haveCoinAtPosition(scene, scene.player.x, scene.player.y);
  }
  
  return false;
}

// Coin sorting functions
export async function swapCoins(index1, index2) {
  const currentState = getCurrentGameState();
  if (currentState.goalReached || currentState.isGameOver) return;
  
  await new Promise((resolve) => setTimeout(resolve, 200));
  swapPlayerCoins(index1, index2);
  await new Promise((resolve) => setTimeout(resolve, 300));
}

export function compareCoins(index1, index2, operator) {
  return comparePlayerCoins(index1, index2, operator);
}

export function getCoinValue(index) {
  return getPlayerCoinValue(index);
}

export function getCoinCount() {
  return getPlayerCoinCount();
}

export function isSorted(order) {
  return arePlayerCoinsSorted(order);
}

// Person rescue functions
export function rescuePerson() {
  return gameRescuePerson();
}

export function rescuePersonAtNode(nodeId) {
  return gameRescuePersonAtNode(nodeId);
}

export function hasPerson() {
  return gameHasPerson();
}

export function personRescued() {
  return gamePersonRescued();
}

export function getPersonCount() {
  return gameGetPersonCount();
}

export function allPeopleRescued() {
  return gameAllPeopleRescued();
}

export function getRescuedPeople() {
  return gameGetRescuedPeople();
}

export function clearRescuedPeople() {
  return gameClearRescuedPeople();
}

export function resetAllPeople() {
  return gameResetAllPeople();
}

// Move along path (for DFS)
export async function moveAlongPath(path) {
  if (!path || !Array.isArray(path) || path.length === 0) {
    console.warn('Invalid path:', path);
    return;
  }

  // Clear scanning highlights before moving (keep only path)
  const currentState = getCurrentGameState();
  if (currentState.currentScene) {
    const { clearScanningHighlights } = await import('./blocklyDfsVisual');
    clearScanningHighlights(currentState.currentScene);
  }

  // Move to each node in the path sequentially
  for (let i = 0; i < path.length; i++) {
    const nodeId = path[i];
    if (nodeId !== null && nodeId !== undefined) {
      await moveToNode(Number(nodeId));
      
      // Check if reached goal - if yes, clear all highlights except path
      const state = getCurrentGameState();
      if (state.currentScene && state.currentScene.levelData) {
        const goalNodeId = state.currentScene.levelData.goalNodeId;
        if (Number(nodeId) === goalNodeId) {
          // Reached goal - clear scanning highlights, keep only path
          const { clearScanningHighlights } = await import('./blocklyDfsVisual');
          clearScanningHighlights(state.currentScene);
        }
      }
      
      // Add small delay between moves for visualization
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
}

// Move to node function
export async function moveToNode(targetNodeId) {
  const currentState = getCurrentGameState();
  if (!currentState.currentScene) {
    console.log("No current scene available");
    return false;
  }
  
  const player = currentState.currentScene.player;
  if (!player) {
    console.log("No player found");
    return false;
  }
  
  const result = await phaserMoveToNode(player, targetNodeId);
  
  if (result) {
    const levelData = currentState.levelData;
    const goalReached = targetNodeId === levelData.goalNodeId;
    
    setCurrentGameState({ 
      currentNodeId: targetNodeId,
      goalReached: goalReached
    });
  }
  
  return result;
}

// Stack operations
export function getStack() {
  return gameGetStack();
}

export async function pushNode() {
  const currentState = getCurrentGameState();
  const currentNodeId = currentState.currentNodeId;
  return await gamePushToStack(currentNodeId);
}

export async function popNode() {
  const nodeId = await gamePopFromStack();
  if (nodeId !== null) {
    return await moveToNode(nodeId);
  }
  return false;
}

export function keepItem() {
  const currentState = getCurrentGameState();
  const currentNodeId = currentState.currentNodeId;
  return gameCollectTreasure(currentNodeId);
}

export function hasTreasure() {
  const currentState = getCurrentGameState();
  const currentNodeId = currentState.currentNodeId;
  return gameHasTreasureAtNode(currentNodeId);
}

export function treasureCollected() {
  const currentState = getCurrentGameState();
  const currentNodeId = currentState.currentNodeId;
  return gameIsTreasureCollected(currentNodeId);
}

export function stackEmpty() {
  return gameIsStackEmpty();
}

export function stackCount() {
  return gameGetStackCount();
}

export function clearStack() {
  return gameClearStack();
}

// Graph operations functions
export function getGraphNeighbors(graph, node) {
  if (!graph || typeof graph !== 'object') {
    console.warn('Invalid graph:', graph);
    return [];
  }
  const nodeKey = String(node);
  return graph[nodeKey] || graph[node] || [];
}

export function getNodeValue(node) {
  // For now, return the node ID as its value
  // This can be extended to get actual node data from the game state
  return typeof node === 'number' ? node : parseInt(node) || 0;
}

export function getCurrentNode() {
  const currentState = getCurrentGameState();
  return currentState.currentNodeId || 0;
}
