// Dijkstra State Manager
// จัดการ state ของ Dijkstra algorithm (visited และ PQ) เพื่อแสดงในตาราง real-time

import { getCurrentGameState, setCurrentGameState } from '../gameUtils';

/**
 * Update Dijkstra visited list
 * @param {Array} visited - Array of visited node IDs
 */
export function updateDijkstraVisited(visited) {
  const currentState = getCurrentGameState();
  setCurrentGameState({
    dijkstraState: {
      ...currentState.dijkstraState,
      visited: Array.isArray(visited) ? [...visited] : []
    }
  });
}

/**
 * Update Dijkstra Priority Queue
 * @param {Array} pq - Priority Queue array: [[distance, path], ...]
 */
export function updateDijkstraPQ(pq) {
  const currentState = getCurrentGameState();
  setCurrentGameState({
    dijkstraState: {
      ...currentState.dijkstraState,
      pq: Array.isArray(pq) ? pq.map(item => {
        // Deep copy to prevent reference issues
        if (Array.isArray(item)) {
          return [item[0], Array.isArray(item[1]) ? [...item[1]] : item[1]];
        }
        return item;
      }) : []
    }
  });
}

/**
 * Update MST weight (for Prim's algorithm)
 * @param {number} weight - MST weight value
 */
export function updateMSTWeight(weight) {
  const weightNum = Number(weight) || 0;
  console.log('📊 updateMSTWeight called with weight:', weight, 'converted to:', weightNum);
  
  const currentState = getCurrentGameState();
  setCurrentGameState({
    dijkstraState: {
      ...currentState.dijkstraState,
      mstWeight: weightNum
    }
  });
  
  console.log('📊 Updated dijkstraState.mstWeight to:', weightNum);
}

/**
 * Reset Dijkstra state
 */
export function resetDijkstraState() {
  setCurrentGameState({
    dijkstraState: {
      visited: [],
      pq: [],
      mstWeight: 0
    }
  });
}

