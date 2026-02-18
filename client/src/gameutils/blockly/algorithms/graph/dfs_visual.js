/**
 * blocklyDfsVisual.js
 *
 * Barrel file — re-exports all DFS/MST/graph visual functions from split modules.
 * This preserves backward compatibility for all existing consumers.
 *
 * Split into:
 *   dfsDrawing.js      — Phaser drawing primitives (node/edge highlights, magic circles, cleanup)
 *   mstVisual.js       — MST/Kruskal-specific visual feedback
 *   graphVisualApi.js   — High-level graph API wrappers for execution context
 */

// DFS Drawing primitives
export {
  highlightNode,
  highlightEdge,
  markNodeAsVisited,
  showCurrentPath,
  clearScanningHighlights,
  clearDfsVisuals,
  highlightNeighborNodes
} from './drawing';

// MST / Kruskal visuals
export {
  showMSTEdges,
  showKruskalRoot,
  clearKruskalVisuals,
  showMSTEdgesFromList
} from './mst_visual';

// Graph Visual API (execution context wrappers)
export {
  getGraphNeighborsWithVisualSync,
  getGraphNeighborsWithWeightWithVisualSync,
  getGraphNeighborsWithVisual,
  markVisitedWithVisual,
  showPathUpdateWithVisual
} from './api';
