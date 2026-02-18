/**
 * graphVisualApi.js
 *
 * Higher-level API wrappers that combine graph logic with visual feedback.
 * These are the functions exposed to the execution context (user code).
 */

import { getCurrentGameState } from '../../../shared/game';
import { getGraphNeighborsWithWeight, getGraphNeighbors } from './logic';
import {
    highlightNode,
    highlightEdge,
    highlightNeighborNodes,
    markNodeAsVisited,
    showCurrentPath,
    getDfsVisualState
} from './drawing';

// getGraphNeighbors imported from ./logic (supports both edge-list and adjacency-list)

/**
 * Get graph neighbors with visual feedback (synchronous version)
 */
export function getGraphNeighborsWithVisualSync(graph, node) {
    const currentState = getCurrentGameState();
    const scene = currentState.currentScene;

    if (!scene) {
        return getGraphNeighbors(graph, node);
    }

    highlightNode(scene, node, 0x00ff00, 600);
    getDfsVisualState().currentScanningNode = node;

    const neighbors = getGraphNeighbors(graph, node);

    if (neighbors.length > 0) {
        highlightNeighborNodes(scene, neighbors, 0xff0000, 600);
    }

    neighbors.forEach((neighbor, index) => {
        setTimeout(() => {
            highlightEdge(scene, node, neighbor, 0xff0000, 600);
        }, index * 200);
    });

    return neighbors;
}

/**
 * Get graph neighbors with weight and visual feedback (async)
 */
export async function getGraphNeighborsWithWeightWithVisualSync(graph, node) {
    const currentState = getCurrentGameState();
    const scene = currentState.currentScene;

    if (!scene) {
        return getGraphNeighborsWithWeight(graph, node);
    }

    highlightNode(scene, node, 0x00ff00, 800);
    getDfsVisualState().currentScanningNode = node;

    const neighborsWithWeight = getGraphNeighborsWithWeight(graph, node);
    const neighbors = neighborsWithWeight.map(nw => nw[0]);

    if (neighbors.length > 0) {
        highlightNeighborNodes(scene, neighbors, 0xff0000, 800);

        for (let i = 0; i < neighborsWithWeight.length; i++) {
            const [neighbor] = neighborsWithWeight[i];
            highlightEdge(scene, node, neighbor, 0xff0000, 800);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    return neighborsWithWeight;
}

/**
 * Get graph neighbors with visual feedback (async version with delays)
 */
export async function getGraphNeighborsWithVisual(graph, node) {
    const currentState = getCurrentGameState();
    const scene = currentState.currentScene;

    if (!scene) {
        console.warn('No scene available for visual feedback');
        return getGraphNeighbors(graph, node);
    }

    if (scene.dfsEdgeHighlightGraphics) {
        scene.dfsEdgeHighlightGraphics.clear();
    }

    highlightNode(scene, node, 0x00ff00, 600);
    getDfsVisualState().currentScanningNode = node;

    await new Promise(resolve => setTimeout(resolve, 600));

    const neighbors = getGraphNeighbors(graph, node);

    if (neighbors.length > 0) {
        highlightNeighborNodes(scene, neighbors, 0xff0000, 600);
    }

    if (!scene.dfsEdgeHighlightGraphics) {
        scene.dfsEdgeHighlightGraphics = scene.add.graphics();
        scene.dfsEdgeHighlightGraphics.setDepth(2.5);
    }

    for (let i = 0; i < neighbors.length; i++) {
        highlightEdge(scene, node, neighbors[i], 0xff0000, 600);
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    return neighbors;
}

/**
 * Mark node as visited with visual feedback
 */
export async function markVisitedWithVisual(node) {
    const currentState = getCurrentGameState();
    const scene = currentState.currentScene;
    const dfsState = getDfsVisualState();

    if (scene) {
        markNodeAsVisited(scene, node);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    dfsState.visitedNodes.add(node);

    // Update Dijkstra state for real-time table display
    try {
        const { updateDijkstraVisited } = await import('./dijkstra_state');
        const visitedArray = Array.from(dfsState.visitedNodes);
        updateDijkstraVisited(visitedArray);
    } catch (err) {
        // Ignore if module not found
    }
}

/**
 * Show path update with visual feedback
 */
export async function showPathUpdateWithVisual(path) {
    const currentState = getCurrentGameState();
    const scene = currentState.currentScene;
    const dfsState = getDfsVisualState();

    if (scene && path) {
        const pathArray = Array.isArray(path) ? path : (path && path.length !== undefined ? Array.from(path) : []);

        if (pathArray.length > 0) {
            showCurrentPath(scene, pathArray);
            await new Promise(resolve => setTimeout(resolve, 400));
        }

        dfsState.currentPath = pathArray;
    }
}
