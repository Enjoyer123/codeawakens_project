// Blockly Helper Functions - Game Functions
import { 
  getCurrentGameState, 
  setCurrentGameState, 
  getCurrentScene
} from '../gameUtils';
import { highlightNode, showCurrentPath, showMSTEdges, showMSTEdgesFromList as showMSTEdgesFromListVisual, highlightKruskalEdge, showKruskalRoot, clearKruskalVisuals } from './blocklyDfsVisual';
import { updateDijkstraVisited, updateDijkstraPQ } from './dijkstraStateManager';
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
import { 
  selectKnapsackItem, 
  unselectKnapsackItem, 
  resetKnapsackItems 
} from './blocklyKnapsackVisual';
import { 
  addWarriorToSide1, 
  addWarriorToSide2, 
  resetSubsetSumWarriors 
} from './blocklySubsetSumVisual';
import {
  resetSubsetSumTracking,
  startSubsetSumTracking,
  showSubsetSumFinalSolution
} from './blocklySubsetSumTracking';
import {
  addWarriorToSelection,
  resetCoinChangeVisual,
  resetCoinChangeSelectionTracking,
  startCoinChangeSelectionTracking,
  showCoinChangeFinalSolution,
  trackCoinChangeDecision
} from './blocklyCoinChangeVisual';

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

/**
 * Get neighbors with weight (for Dijkstra algorithm)
 * Returns array of [neighbor, weight] tuples
 */
export function getGraphNeighborsWithWeight(graph, node) {
  if (!graph || typeof graph !== 'object') {
    console.warn('Invalid graph:', graph);
    return [];
  }
  
  const currentState = getCurrentGameState();
  const scene = currentState.currentScene;
  const levelData = currentState.levelData;
  
  if (!levelData || !levelData.edges) {
    console.warn('Level data or edges not available');
    return [];
  }
  
  const nodeKey = String(node);
  const neighbors = graph[nodeKey] || graph[node] || [];
  
  // Get edges with weights
  const neighborsWithWeight = neighbors.map(neighbor => {
    // Find edge from node to neighbor
    const edge = levelData.edges.find(e => 
      (e.from === node && e.to === neighbor) || 
      (e.from === neighbor && e.to === node)
    );
    
    // Get weight from edge, default to 1 if not specified
    const weight = edge && edge.value !== undefined && edge.value !== null 
      ? Number(edge.value) 
      : 1;
    
    return [neighbor, weight];
  });
  
  return neighborsWithWeight;
}

/**
 * Find index of minimum value in list (for Priority Queue)
 * Assumes list contains tuples [distance, path] and finds minimum distance
 * Also provides visual feedback by highlighting the selected node
 */
export async function findMinIndex(list) {
  if (!Array.isArray(list) || list.length === 0) {
    console.warn('findMinIndex: list is empty or not an array');
    return -1;
  }
  
  let minIndex = 0;
  let minValue = null;
  
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    let value;
    
    // Handle tuple format [distance, path]
    if (Array.isArray(item) && item.length > 0) {
      value = Number(item[0]);
    } else if (typeof item === 'number') {
      value = item;
    } else if (item && typeof item === 'object' && item.distance !== undefined) {
      value = Number(item.distance);
    } else {
      continue;
    }
    
    if (isNaN(value)) {
      console.warn(`findMinIndex: item at index ${i} is not a valid number:`, item);
      continue;
    }
    
    if (minValue === null || value < minValue) {
      minValue = value;
      minIndex = i;
    }
  }
  
  if (minValue === null) {
    console.warn('findMinIndex: no valid minimum value found');
    return -1;
  }
  
  // Update Dijkstra PQ state for real-time table display
  try {
    updateDijkstraPQ(list);
  } catch (err) {
    // Ignore if function not available
  }
  
  // Visual feedback: Highlight the selected node from priority queue and show path
  const currentState = getCurrentGameState();
  const scene = currentState.currentScene;
  
  if (scene && list[minIndex] && Array.isArray(list[minIndex]) && list[minIndex].length > 1) {
    const selectedDistance = list[minIndex][0];
    const selectedPath = list[minIndex][1];
    if (Array.isArray(selectedPath) && selectedPath.length > 0) {
      const selectedNode = selectedPath[selectedPath.length - 1];
      const node = scene.levelData.nodes.find(n => n.id === selectedNode);
      
      if (node) {
        // Highlight the selected node (green magic circle) - shows which node was chosen from PQ
        highlightNode(scene, selectedNode, 0x00ff00, 600);
        // Show the path that was selected (non-blocking)
        showCurrentPath(scene, selectedPath);
        
        // Show distance text above the node to explain why it was chosen
        // Clear previous distance text if exists
        if (scene.dijkstraDistanceText) {
          scene.dijkstraDistanceText.destroy();
        }
        
        const distanceText = scene.add.text(node.x, node.y - 50, `ระยะทาง: ${selectedDistance}`, {
          fontSize: '16px',
          color: '#00ff00',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3,
          backgroundColor: '#000000',
          padding: { x: 8, y: 4 }
        });
        distanceText.setOrigin(0.5, 0.5);
        distanceText.setDepth(4); // Above highlight
        scene.dijkstraDistanceText = distanceText;
        
        // Wait for visual feedback to be visible (like Kruskal)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Fade out after 2 seconds
        scene.tweens.add({
          targets: distanceText,
          alpha: 0,
          duration: 1000,
          delay: 2000,
          onComplete: () => {
            if (distanceText && distanceText.destroy) {
              distanceText.destroy();
            }
            if (scene.dijkstraDistanceText === distanceText) {
              scene.dijkstraDistanceText = null;
            }
          }
        });
      }
    }
  }
  
  return minIndex;
}

// Kruskal's algorithm helper functions

/**
 * Get all edges from graph
 * @param {Object} graph - Graph object
 * @returns {Array} Array of edges: [[u, v, weight], ...]
 */
export function getAllEdges(graph) {
  if (!graph || typeof graph !== 'object') {
    console.warn('getAllEdges: Invalid graph:', graph);
    return [];
  }
  
  const currentState = getCurrentGameState();
  const levelData = currentState.levelData;
  
  if (!levelData || !levelData.edges) {
    console.warn('getAllEdges: Level data or edges not available');
    return [];
  }
  
  // Convert edges to format [u, v, weight]
  const edges = [];
  levelData.edges.forEach(edge => {
    if (edge.from !== undefined && edge.to !== undefined) {
      const weight = edge.value !== undefined ? Number(edge.value) : 1;
      edges.push([edge.from, edge.to, weight]);
    }
  });
  
  return edges;
}

/**
 * Sort edges by weight (ascending)
 * @param {Array} edges - Array of edges: [[u, v, weight], ...]
 * @returns {Array} Sorted edges
 */
export function sortEdgesByWeight(edges) {
  if (!Array.isArray(edges)) {
    console.warn('sortEdgesByWeight: edges is not an array:', edges);
    return [];
  }
  
  // Sort by weight (index 2)
  return [...edges].sort((a, b) => {
    const weightA = Array.isArray(a) && a.length > 2 ? Number(a[2]) : 0;
    const weightB = Array.isArray(b) && b.length > 2 ? Number(b[2]) : 0;
    return weightA - weightB;
  });
}

/**
 * DSU Find operation - find root of node with path compression
 * @param {Object} parent - Parent dictionary
 * @param {number} node - Node to find root for
 * @returns {number} Root node
 */
export async function dsuFind(parent, node) {
  if (!parent || typeof parent !== 'object') {
    console.warn('dsuFind: Invalid parent:', parent);
    return node;
  }
  
  const nodeKey = String(node);
  
  // If node is not in parent, initialize it
  if (parent[nodeKey] === undefined || parent[nodeKey] === null) {
    parent[nodeKey] = node;
    const root = node;
    
    // Visual feedback: show root
    const currentState = getCurrentGameState();
    const scene = currentState.currentScene;
    if (scene) {
      showKruskalRoot(scene, Number(node), Number(root));
      await new Promise(resolve => setTimeout(resolve, 200)); // Small delay for visual
    }
    
    return root;
  }
  
  // Path compression: if parent is not root, find root recursively
  if (parent[nodeKey] !== node) {
    parent[nodeKey] = await dsuFind(parent, parent[nodeKey]);
  }
  
  const root = parent[nodeKey];
  
  // Visual feedback: show root
  const currentState = getCurrentGameState();
  const scene = currentState.currentScene;
  if (scene) {
    showKruskalRoot(scene, Number(node), Number(root));
    await new Promise(resolve => setTimeout(resolve, 200)); // Small delay for visual
  }
  
  return root;
}

/**
 * DSU Union operation - union by rank
 * @param {Object} parent - Parent dictionary
 * @param {Object} rank - Rank dictionary
 * @param {number} rootU - Root of first set
 * @param {number} rootV - Root of second set
 */
export async function dsuUnion(parent, rank, rootU, rootV) {
  if (!parent || typeof parent !== 'object') {
    console.warn('dsuUnion: Invalid parent:', parent);
    return;
  }
  
  if (!rank || typeof rank !== 'object') {
    console.warn('dsuUnion: Invalid rank:', rank);
    return;
  }
  
  const rootUKey = String(rootU);
  const rootVKey = String(rootV);
  
  // Initialize ranks if not present
  if (rank[rootUKey] === undefined) rank[rootUKey] = 0;
  if (rank[rootVKey] === undefined) rank[rootVKey] = 0;
  
  // Union by rank: attach smaller tree to larger tree
  if (rank[rootUKey] < rank[rootVKey]) {
    parent[rootUKey] = rootV;
  } else if (rank[rootUKey] > rank[rootVKey]) {
    parent[rootVKey] = rootU;
  } else {
    // Same rank: attach one to other and increment rank
    parent[rootVKey] = rootU;
    rank[rootUKey] = (rank[rootUKey] || 0) + 1;
  }
  
  // Small delay for visual feedback
  await new Promise(resolve => setTimeout(resolve, 200));
}

/**
 * Show MST edges from a list (for Kruskal's algorithm)
 * @param {Array} mstEdges - Array of edges: [[u, v, weight], ...]
 */
export function showMSTEdgesFromList(mstEdges) {
  const currentState = getCurrentGameState();
  const scene = currentState.currentScene;
  
  if (!scene || !Array.isArray(mstEdges)) {
    console.warn('showMSTEdgesFromList: Invalid scene or mstEdges');
    return;
  }
  
  showMSTEdgesFromListVisual(scene, mstEdges, 0x00ffff);
}

/**
 * Select a knapsack item (move it into the bag) - for visual feedback
 * @param {number} itemIndex - Index of the item (0-based)
 */
export async function selectKnapsackItemVisual(itemIndex) {
  await selectKnapsackItem(itemIndex);
}

/**
 * Unselect a knapsack item (move it back to original position) - for visual feedback
 * @param {number} itemIndex - Index of the item (0-based)
 */
export async function unselectKnapsackItemVisual(itemIndex) {
  await unselectKnapsackItem(itemIndex);
}

/**
 * Helper function for Math.max in knapsack that adds visual feedback
 * Re-export from blocklyKnapsackVisual
 */
export { 
  knapsackMaxWithVisual,
  resetKnapsackSelectionTracking,
  startKnapsackSelectionTracking,
  showKnapsackFinalSelection
} from './blocklyKnapsackVisual';

/**
 * Reset all knapsack items to original positions
 */
export function resetKnapsackItemsVisual() {
  resetKnapsackItems();
}

/**
 * Add warrior to side1 - for visual feedback
 * @param {number} warriorIndex - Index of the warrior (0-based)
 */
export async function addWarriorToSide1Visual(warriorIndex) {
  await addWarriorToSide1(warriorIndex);
}

/**
 * Add warrior to side2 - for visual feedback
 * @param {number} warriorIndex - Index of the warrior (0-based)
 */
export async function addWarriorToSide2Visual(warriorIndex) {
  await addWarriorToSide2(warriorIndex);
}

/**
 * Reset all subset sum warriors to original positions
 */
export function resetSubsetSumWarriorsVisual() {
  resetSubsetSumWarriors();
}

/**
 * Add warrior to selection box - for Coin Change visual feedback
 */
export async function addWarriorToSelectionVisual(warriorIndex) {
  await addWarriorToSelection(warriorIndex);
}

/**
 * Reset coin change visual display
 */
export function resetCoinChangeVisualDisplay() {
  const currentState = getCurrentGameState();
  const scene = currentState.currentScene;
  if (scene) {
    resetCoinChangeVisual(scene);
  }
}

/**
 * Reset coin change selection tracking
 */
export function resetCoinChangeSelectionTrackingWrapper() {
  resetCoinChangeSelectionTracking();
}

/**
 * Start tracking coin change selections
 */
export function startCoinChangeSelectionTrackingWrapper() {
  startCoinChangeSelectionTracking();
}

/**
 * Track coin change decision (wrapper)
 */
export function trackCoinChangeDecisionWrapper(amount, index, include, exclude) {
  trackCoinChangeDecision(amount, index, include, exclude);
}

/**
 * Show final coin change solution (wrapper)
 */
export async function showCoinChangeFinalSolutionWrapper() {
  await showCoinChangeFinalSolution();
}

/**
 * Start tracking subset sum decisions
 */
export function startSubsetSumTrackingVisual() {
  startSubsetSumTracking();
}

/**
 * Show final subset sum solution
 * @param {number} targetSum - Target sum that was achieved
 */
export async function showSubsetSumFinalSolutionVisual(targetSum) {
  await showSubsetSumFinalSolution(targetSum);
}

/**
 * Reset subset sum tracking
 */
export function resetSubsetSumTrackingVisual() {
  resetSubsetSumTracking();
}
