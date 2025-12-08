// DFS Visual Feedback System
// Provides visual feedback for DFS algorithm execution

import Phaser from "phaser";
import { getCurrentGameState } from '../gameUtils';

// Visual feedback state
let dfsVisualState = {
  currentScanningNode: null,
  visitedNodes: new Set(),
  currentPath: [],
  container: [],
  isActive: false
};

/**
 * Draw magic circle effect (วงแหวนเวท) - แบบเหมือนรูปภาพ
 * @param {Phaser.GameObjects.Graphics} graphics - Graphics object
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} radius - Circle radius
 * @param {number} color - Color hex
 * @param {number} alpha - Alpha value
 * @param {number} starRotation - Rotation for star only (สัญลักษณ์และดาวหมุน)
 */
function drawMagicCircle(graphics, x, y, radius, color, alpha, starRotation = 0) {
  // Glow effect layer (ชั้นเรืองแสง) - วาดก่อนเพื่อให้อยู่ด้านล่าง
  graphics.fillStyle(color, alpha * 0.25);
  graphics.fillCircle(x, y, radius * 1.2);
  graphics.fillStyle(color, alpha * 0.15);
  graphics.fillCircle(x, y, radius * 1.4);
  
  // Outer thick ring (วงแหวนนอก - หนา) - ไม่หมุน
  graphics.lineStyle(5, color, alpha);
  graphics.strokeCircle(x, y, radius);
  
  // Inner ring (วงแหวนใน) - ไม่หมุน
  graphics.lineStyle(3, color, alpha * 0.9);
  graphics.strokeCircle(x, y, radius * 0.75);
  
  // Draw 7-pointed star (heptagram) in the center (ดาว 7 แฉกตรงกลาง) - หมุน
  const starPoints = 7;
  const starRadius = radius * 0.5;
  const starPointsArray = [];
  
  // Calculate star points with rotation
  for (let i = 0; i < starPoints; i++) {
    const angle = (i / starPoints) * Math.PI * 2 - Math.PI / 2 + starRotation;
    const px = x + Math.cos(angle) * starRadius;
    const py = y + Math.sin(angle) * starRadius;
    starPointsArray.push({ x: px, y: py });
  }
  
  // Draw star by connecting every 3rd point (สร้างดาว 7 แฉก)
  graphics.lineStyle(3, color, alpha);
  for (let i = 0; i < starPoints; i++) {
    const nextIndex = (i + 3) % starPoints;
    graphics.lineBetween(
      starPointsArray[i].x, 
      starPointsArray[i].y,
      starPointsArray[nextIndex].x,
      starPointsArray[nextIndex].y
    );
  }
  
  // Draw symbols/runes around the circle (สัญลักษณ์เวทรอบวง) - หมุน
  const symbolCount = 7; // จำนวนสัญลักษณ์เท่ากับจำนวนแฉกของดาว
  const symbolRadius = radius * 0.9;
  
  for (let i = 0; i < symbolCount; i++) {
    const angle = (i / symbolCount) * Math.PI * 2 - Math.PI / 2 + starRotation;
    const symbolX = x + Math.cos(angle) * symbolRadius;
    const symbolY = y + Math.sin(angle) * symbolRadius;
    
    // Draw rune-like symbol (วาดสัญลักษณ์แบบ rune)
    graphics.lineStyle(2, color, alpha * 0.9);
    
    // Draw vertical line
    graphics.lineBetween(symbolX, symbolY - 6, symbolX, symbolY + 6);
    
    // Draw horizontal line
    graphics.lineBetween(symbolX - 4, symbolY, symbolX + 4, symbolY);
    
    // Draw diagonal lines (สร้างสัญลักษณ์แบบ X)
    graphics.lineBetween(symbolX - 3, symbolY - 3, symbolX + 3, symbolY + 3);
    graphics.lineBetween(symbolX - 3, symbolY + 3, symbolX + 3, symbolY - 3);
  }
  
  // Additional glow lines (เส้นเรืองแสงเพิ่มเติม) - หมุนตามดาว
  graphics.lineStyle(1, color, alpha * 0.3);
  for (let i = 0; i < starPoints; i++) {
    const angle = (i / starPoints) * Math.PI * 2 - Math.PI / 2 + starRotation;
    const outerX = x + Math.cos(angle) * radius;
    const outerY = y + Math.sin(angle) * radius;
    const innerX = x + Math.cos(angle) * starRadius;
    const innerY = y + Math.sin(angle) * starRadius;
    graphics.lineBetween(outerX, outerY, innerX, innerY);
  }
}

/**
 * Highlight a node in the Phaser scene with magic circle effect
 */
export function highlightNode(scene, nodeId, color = 0x00ff00, duration = 800) {
  if (!scene || !scene.levelData) return;
  
  const node = scene.levelData.nodes.find(n => n.id === nodeId);
  if (!node) return;

  // Create or update highlight graphics
  if (!scene.dfsHighlightGraphics) {
    scene.dfsHighlightGraphics = scene.add.graphics();
    scene.dfsHighlightGraphics.setDepth(3); // Above level graphics but below player
  }

  const graphics = scene.dfsHighlightGraphics;
  
  // Clear previous highlight
  graphics.clear();
  
  // Magic circle parameters
  const baseRadius = 30;
  const animationObj = { starRotation: 0, alpha: 1 };
  
  // Create pulsing and rotating animation (ช้ากว่าเดิม - duration * 2)
  const pulseTween = scene.tweens.add({
    targets: animationObj,
    alpha: { from: 1, to: 0.4 },
    starRotation: { from: 0, to: Math.PI * 2 },
    duration: duration * 2, // ช้ากว่าเดิม 2 เท่า
    yoyo: false, // ไม่ yoyo สำหรับ rotation
    repeat: -1,
    ease: 'Linear', // ใช้ Linear สำหรับการหมุนที่สม่ำเสมอ
    onUpdate: function() {
      if (!graphics || !node) return;
      graphics.clear();
      
      // Draw magic circle - หมุนแค่ดาวและสัญลักษณ์, วงแหวนไม่หมุน
      drawMagicCircle(
        graphics, 
        node.x, 
        node.y, 
        baseRadius, 
        color, 
        animationObj.alpha,
        animationObj.starRotation
      );
    }
  });
  
  // Store tween reference for cleanup
  if (!scene.dfsHighlightTweens) {
    scene.dfsHighlightTweens = [];
  }
  scene.dfsHighlightTweens.push(pulseTween);
}

/**
 * Highlight an edge between two nodes with animation (ขยับจากจุด scan ไปจุดที่เจอ)
 */
export function highlightEdge(scene, fromNodeId, toNodeId, color = 0xff0000, duration = 600) {
  if (!scene || !scene.levelData) return;
  
  const fromNode = scene.levelData.nodes.find(n => n.id === fromNodeId);
  const toNode = scene.levelData.nodes.find(n => n.id === toNodeId);
  
  if (!fromNode || !toNode) return;

  if (!scene.dfsEdgeHighlightGraphics) {
    scene.dfsEdgeHighlightGraphics = scene.add.graphics();
    scene.dfsEdgeHighlightGraphics.setDepth(2.5);
  }

  // Create a separate graphics object for this animated edge
  const edgeGraphics = scene.add.graphics();
  edgeGraphics.setDepth(2.5);
  
  // Animation object to track progress
  const progressObj = { progress: 0 };
  
  // Calculate angle and distance
  const angle = Phaser.Math.Angle.Between(fromNode.x, fromNode.y, toNode.x, toNode.y);
  const distance = Phaser.Math.Distance.Between(fromNode.x, fromNode.y, toNode.x, toNode.y);
  
  // Animate the edge drawing from start to end
  scene.tweens.add({
    targets: progressObj,
    progress: 1,
    duration: duration,
    ease: 'Power2.easeOut',
    onUpdate: function() {
      // Clear and redraw the edge based on progress
      edgeGraphics.clear();
      
      // Calculate current end position based on progress
      const currentDistance = distance * progressObj.progress;
      const currentEndX = fromNode.x + Math.cos(angle) * currentDistance;
      const currentEndY = fromNode.y + Math.sin(angle) * currentDistance;
      
      // Draw line from start to current position
      edgeGraphics.lineStyle(5, color, 0.8);
      edgeGraphics.lineBetween(fromNode.x, fromNode.y, currentEndX, currentEndY);
      
      // Add arrow at the current end position
      if (progressObj.progress > 0.1) { // Only show arrow after some progress
        const arrowLength = 15;
        const arrowX = currentEndX - Math.cos(angle) * arrowLength;
        const arrowY = currentEndY - Math.sin(angle) * arrowLength;
        
        edgeGraphics.fillStyle(color, 0.8);
        edgeGraphics.fillTriangle(
          currentEndX, currentEndY,
          arrowX + Math.sin(angle) * 8, arrowY - Math.cos(angle) * 8,
          arrowX - Math.sin(angle) * 8, arrowY + Math.cos(angle) * 8
        );
      }
    },
    onComplete: function() {
      // After animation completes, keep the edge visible
      // The edge will remain until cleared by clearDfsVisuals
    }
  });
  
  // Store edge graphics for cleanup
  if (!scene.dfsEdgeGraphicsList) {
    scene.dfsEdgeGraphicsList = [];
  }
  scene.dfsEdgeGraphicsList.push(edgeGraphics);
}

/**
 * Mark a node as visited
 */
export function markNodeAsVisited(scene, nodeId) {
  if (!scene || !scene.levelData) return;
  
  const node = scene.levelData.nodes.find(n => n.id === nodeId);
  if (!node) return;

  if (!scene.dfsVisitedGraphics) {
    scene.dfsVisitedGraphics = scene.add.graphics();
    scene.dfsVisitedGraphics.setDepth(2);
  }

  const graphics = scene.dfsVisitedGraphics;
  
  // Draw visited indicator (small circle)
  graphics.fillStyle(0x888888, 0.5);
  graphics.fillCircle(node.x, node.y, 15);
  
  dfsVisualState.visitedNodes.add(nodeId);
}

/**
 * Show current path being explored
 */
export function showCurrentPath(scene, path) {
  if (!scene || !scene.levelData) return;

  if (!scene.dfsPathGraphics) {
    scene.dfsPathGraphics = scene.add.graphics();
    scene.dfsPathGraphics.setDepth(2.8);
  }

  const graphics = scene.dfsPathGraphics;
  graphics.clear();
  
  // Only draw if path is valid and has at least 2 nodes
  if (path && Array.isArray(path) && path.length >= 2) {
    // Draw path as connected line (cyan color)
    graphics.lineStyle(4, 0x00ffff, 0.9);
    
    for (let i = 0; i < path.length - 1; i++) {
      const fromNodeId = path[i];
      const toNodeId = path[i + 1];
      
      const fromNode = scene.levelData.nodes.find(n => n.id === fromNodeId);
      const toNode = scene.levelData.nodes.find(n => n.id === toNodeId);
      
      if (fromNode && toNode) {
        graphics.lineBetween(fromNode.x, fromNode.y, toNode.x, toNode.y);
      }
    }
    
    // Highlight nodes in path
    path.forEach(nodeId => {
      const node = scene.levelData.nodes.find(n => n.id === nodeId);
      if (node) {
        graphics.fillStyle(0x00ffff, 0.3);
        graphics.fillCircle(node.x, node.y, 20);
      }
    });
  }
  
  dfsVisualState.currentPath = path;
}

/**
 * Clear scanning highlights (node, neighbors, edges) but keep path
 */
export function clearScanningHighlights(scene) {
  if (!scene) return;
  
  // Stop all tweens (node highlight animations)
  if (scene.dfsHighlightTweens) {
    scene.dfsHighlightTweens.forEach(tween => {
      if (tween && tween.isActive) {
        tween.stop();
      }
    });
    scene.dfsHighlightTweens = [];
  }
  
  // Clear node highlight (green magic circle)
  if (scene.dfsHighlightGraphics) {
    scene.dfsHighlightGraphics.clear();
  }
  
  // Clear neighbor highlights (red circles)
  if (scene.dfsNeighborHighlightGraphics) {
    scene.dfsNeighborHighlightGraphics.clear();
  }
  
  // Clear edge highlights
  if (scene.dfsEdgeHighlightGraphics) {
    scene.dfsEdgeHighlightGraphics.clear();
  }
  
  // Clear all animated edge graphics
  if (scene.dfsEdgeGraphicsList) {
    scene.dfsEdgeGraphicsList.forEach(graphics => {
      if (graphics && graphics.destroy) {
        graphics.destroy();
      }
    });
    scene.dfsEdgeGraphicsList = [];
  }
  
  // Reset scanning state
  dfsVisualState.currentScanningNode = null;
}

/**
 * Clear all DFS visual feedback
 */
export function clearDfsVisuals(scene) {
  if (!scene) return;
  
  // Stop all tweens
  if (scene.dfsHighlightTweens) {
    scene.dfsHighlightTweens.forEach(tween => {
      if (tween && tween.isActive) {
        tween.stop();
      }
    });
    scene.dfsHighlightTweens = [];
  }
  
  if (scene.dfsHighlightGraphics) {
    scene.dfsHighlightGraphics.clear();
  }
  if (scene.dfsNeighborHighlightGraphics) {
    scene.dfsNeighborHighlightGraphics.clear();
  }
  if (scene.dfsEdgeHighlightGraphics) {
    scene.dfsEdgeHighlightGraphics.clear();
  }
  
  // Clear all animated edge graphics
  if (scene.dfsEdgeGraphicsList) {
    scene.dfsEdgeGraphicsList.forEach(graphics => {
      if (graphics && graphics.destroy) {
        graphics.destroy();
      }
    });
    scene.dfsEdgeGraphicsList = [];
  }
  
  if (scene.dfsPathGraphics) {
    scene.dfsPathGraphics.clear();
  }
  if (scene.dfsVisitedGraphics) {
    scene.dfsVisitedGraphics.clear();
  }
  
  dfsVisualState = {
    currentScanningNode: null,
    visitedNodes: new Set(),
    currentPath: [],
    container: [],
    isActive: false
  };
}

/**
 * Highlight multiple nodes at once (for neighbors)
 */
export function highlightNeighborNodes(scene, nodeIds, color = 0xff0000, duration = 600) {
  if (!scene || !scene.levelData) return;
  
  // Create or update neighbor highlight graphics
  if (!scene.dfsNeighborHighlightGraphics) {
    scene.dfsNeighborHighlightGraphics = scene.add.graphics();
    scene.dfsNeighborHighlightGraphics.setDepth(2.8); // Between current node and edges
  }
  
  const graphics = scene.dfsNeighborHighlightGraphics;
  graphics.clear();
  
  // Highlight each neighbor node
  nodeIds.forEach(nodeId => {
    const node = scene.levelData.nodes.find(n => n.id === nodeId);
    if (node) {
      graphics.lineStyle(4, color, 0.9);
      graphics.strokeCircle(node.x, node.y, 25);
      graphics.fillStyle(color, 0.3);
      graphics.fillCircle(node.x, node.y, 25);
    }
  });
}

/**
 * Get graph neighbors with visual feedback (synchronous version for expression context)
 * This function provides visual feedback but returns synchronously
 */
export function getGraphNeighborsWithVisualSync(graph, node) {
  const currentState = getCurrentGameState();
  const scene = currentState.currentScene;
  
  if (!scene) {
    return getGraphNeighbors(graph, node);
  }

  // Highlight current scanning node (green) - non-blocking
  highlightNode(scene, node, 0x00ff00, 600);
  dfsVisualState.currentScanningNode = node;
  
  // Get neighbors immediately
  const neighbors = getGraphNeighbors(graph, node);
  
  // Highlight neighbor nodes (red)
  if (neighbors.length > 0) {
    highlightNeighborNodes(scene, neighbors, 0xff0000, 600);
  }
  
  // Highlight edges to neighbors with animation (ขยับจากจุด scan ไปจุดที่เจอ)
  neighbors.forEach((neighbor, index) => {
    // Add delay for each edge to show them sequentially
    setTimeout(() => {
      highlightEdge(scene, node, neighbor, 0xff0000, 600);
    }, index * 200); // Stagger each edge by 200ms
  });
  
  return neighbors;
}

/**
 * Get graph neighbors with visual feedback (async version with delays)
 * This is a wrapper around getGraphNeighbors that adds visual feedback
 * Note: This function is async and returns a Promise, so it must be awaited
 */
export async function getGraphNeighborsWithVisual(graph, node) {
  const currentState = getCurrentGameState();
  const scene = currentState.currentScene;
  
  if (!scene) {
    console.warn('No scene available for visual feedback');
    return getGraphNeighbors(graph, node);
  }

  // Clear previous edge highlights
  if (scene.dfsEdgeHighlightGraphics) {
    scene.dfsEdgeHighlightGraphics.clear();
  }

  // Highlight current scanning node (green)
  highlightNode(scene, node, 0x00ff00, 600);
  dfsVisualState.currentScanningNode = node;
  
  // Wait a bit to show the highlight (slower)
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Get neighbors
  const neighbors = getGraphNeighbors(graph, node);
  
  // Highlight neighbor nodes (red)
  if (neighbors.length > 0) {
    highlightNeighborNodes(scene, neighbors, 0xff0000, 600);
  }
  
  // Initialize edge graphics if needed
  if (!scene.dfsEdgeHighlightGraphics) {
    scene.dfsEdgeHighlightGraphics = scene.add.graphics();
    scene.dfsEdgeHighlightGraphics.setDepth(2.5);
  }
  
  const edgeGraphics = scene.dfsEdgeHighlightGraphics;
  
  // Highlight edges to neighbors with animation (ขยับจากจุด scan ไปจุดที่เจอ)
  for (let i = 0; i < neighbors.length; i++) {
    const neighbor = neighbors[i];
    // Use highlightEdge function which has animation
    highlightEdge(scene, node, neighbor, 0xff0000, 600);
    
    // Wait a bit before showing next edge
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Keep edges visible for a bit longer (slower)
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return neighbors;
}

/**
 * Mark node as visited with visual feedback
 */
export async function markVisitedWithVisual(node) {
  const currentState = getCurrentGameState();
  const scene = currentState.currentScene;
  
  if (scene) {
    markNodeAsVisited(scene, node);
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  
  dfsVisualState.visitedNodes.add(node);
}

/**
 * Check if item is being added to visited list (for visual feedback)
 */
export function isAddingToVisitedList(listVar) {
  // Simple heuristic: if variable name contains "visited" or "visit"
  const varName = String(listVar || '').toLowerCase();
  return varName.includes('visited') || varName.includes('visit');
}

/**
 * Check if item is being added to container list (for visual feedback)
 */
export function isAddingToContainerList(listVar) {
  // Simple heuristic: if variable name contains "container" or "stack"
  const varName = String(listVar || '').toLowerCase();
  return varName.includes('container') || varName.includes('stack');
}

/**
 * Show path update with visual feedback
 */
export async function showPathUpdateWithVisual(path) {
  const currentState = getCurrentGameState();
  const scene = currentState.currentScene;
  
  if (scene && path) {
    // Ensure path is an array
    const pathArray = Array.isArray(path) ? path : (path && path.length !== undefined ? Array.from(path) : []);
    
    if (pathArray.length > 0) {
      showCurrentPath(scene, pathArray);
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    
    dfsVisualState.currentPath = pathArray;
  }
}

// Import getGraphNeighbors
function getGraphNeighbors(graph, node) {
  if (!graph || typeof graph !== 'object') {
    console.warn('Invalid graph:', graph);
    return [];
  }
  const nodeKey = String(node);
  return graph[nodeKey] || graph[node] || [];
}

