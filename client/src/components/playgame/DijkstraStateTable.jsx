// Dijkstra State Table Component
// แสดง visited และ Priority Queue (PQ) แบบ real-time สำหรับ Dijkstra algorithm

import React, { useEffect, useState } from 'react';
import { getCurrentGameState } from '../../gameutils/utils/gameUtils';

/**
 * DijkstraStateTable Component
 * แสดงตาราง visited และ PQ สำหรับ Dijkstra algorithm
 */
const DijkstraStateTable = ({ currentLevel }) => {
  const [visited, setVisited] = useState([]);
  const [pq, setPq] = useState([]);
  const [mstWeight, setMstWeight] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [algorithmName, setAlgorithmName] = useState('Dijkstra');

  useEffect(() => {
    // ตรวจสอบว่า level เป็นประเภท Shortest Path หรือ Minimum Spanning Tree
    // ตรวจสอบหลายรูปแบบของ category data structure
    let categoryName = '';
    
    if (currentLevel?.category?.category_name) {
      categoryName = currentLevel.category.category_name.toLowerCase();
    } else if (currentLevel?.category_name) {
      categoryName = currentLevel.category_name.toLowerCase();
    } else if (typeof currentLevel === 'object') {
      // Debug: log เพื่อดู structure
      console.log('🔍 DijkstraStateTable - currentLevel structure:', {
        hasCategory: !!currentLevel.category,
        category: currentLevel.category,
        keys: Object.keys(currentLevel)
      });
    }
    
    if (categoryName) {
      const isShortestPath = categoryName.includes('shortest path') || 
                            categoryName.includes('minimum spanning tree') ||
                            categoryName.includes('dijkstra') ||
                            categoryName.includes('prim') ||
                            categoryName.includes('kruskal');
      setIsVisible(isShortestPath);
      
      // กำหนดชื่อ algorithm ตาม category
      let algoName = 'Dijkstra'; // default
      if (categoryName.includes('prim')) {
        algoName = 'Prim';
      } else if (categoryName.includes('kruskal')) {
        algoName = 'Kruskal';
      } else if (categoryName.includes('minimum spanning tree')) {
        algoName = 'MST';
      } else if (categoryName.includes('dijkstra') || categoryName.includes('shortest path')) {
        algoName = 'Dijkstra';
      }
      setAlgorithmName(algoName);
      
      console.log('🔍 DijkstraStateTable - categoryName:', categoryName, 'isVisible:', isShortestPath, 'algorithmName:', algoName);
    } else {
      setIsVisible(false);
    }
  }, [currentLevel]);

  useEffect(() => {
    // Listen for Dijkstra state updates from game state
    const updateInterval = setInterval(() => {
      const gameState = getCurrentGameState();
      if (gameState && gameState.dijkstraState) {
        if (gameState.dijkstraState.visited) {
          setVisited(gameState.dijkstraState.visited);
        }
        if (gameState.dijkstraState.pq) {
          setPq(gameState.dijkstraState.pq);
        }
        if (gameState.dijkstraState.mstWeight !== undefined) {
          setMstWeight(gameState.dijkstraState.mstWeight);
        }
      } else {
        // Debug: log if state is missing
        if (gameState && !gameState.dijkstraState) {
          console.log('🔍 DijkstraStateTable - gameState exists but dijkstraState is missing');
        }
      }
    }, 100); // Update every 100ms

    return () => clearInterval(updateInterval);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-90 border-2 border-yellow-500 rounded-lg p-3 z-[9999] max-w-md" style={{ position: 'absolute' }}>
      <div className="text-yellow-400 font-bold text-sm mb-2 flex items-center gap-2">
        <span>📊 {algorithmName} Algorithm State</span>
      </div>
      
      {/* Visited Row */}
      <div className="mb-3">
        <div className="text-green-400 font-semibold text-xs mb-1 flex items-center gap-1">
          <span>✅ Visited:</span>
        </div>
        <div className="bg-gray-800 rounded p-2 min-h-[40px] max-h-[80px] overflow-y-auto">
          {visited.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {visited.map((node, index) => (
                <span
                  key={index}
                  className="bg-green-600 text-white px-2 py-1 rounded text-xs font-mono"
                >
                  {node}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-500 text-xs italic">ว่าง</span>
          )}
        </div>
      </div>

      {/* Priority Queue Row */}
      <div className="mb-3">
        <div className="text-blue-400 font-semibold text-xs mb-1 flex items-center gap-1">
          <span>📋 Priority Queue (PQ):</span>
        </div>
        <div className="bg-gray-800 rounded p-2 min-h-[60px] max-h-[200px] overflow-y-auto">
          {pq.length > 0 ? (
            <div className="space-y-1">
              {pq.map((item, index) => {
                // PQ format: [distance, path]
                const distance = Array.isArray(item) && item.length > 0 ? item[0] : '?';
                const path = Array.isArray(item) && item.length > 1 ? item[1] : [];
                const pathStr = Array.isArray(path) ? path.join('→') : String(path);
                
                return (
                  <div
                    key={index}
                    className="bg-blue-900 bg-opacity-50 border border-blue-500 rounded p-1 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-300 font-bold font-mono min-w-[40px]">
                        d:{distance}
                      </span>
                      <span className="text-blue-300 font-mono">
                        path: [{pathStr}]
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <span className="text-gray-500 text-xs italic">ว่าง</span>
          )}
        </div>
      </div>

      {/* MST Weight Row - แสดงเฉพาะในด่าน Prim/Kruskal */}
      {(algorithmName === 'Prim' || algorithmName === 'Kruskal' || algorithmName === 'MST') && (
        <div>
          <div className="text-purple-400 font-semibold text-xs mb-1 flex items-center gap-1">
            <span>⚖️ MST Weight:</span>
          </div>
          <div className="bg-gray-800 rounded p-2 min-h-[30px] flex items-center">
            <span className="text-purple-300 font-bold font-mono text-lg">
              {mstWeight}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DijkstraStateTable;

