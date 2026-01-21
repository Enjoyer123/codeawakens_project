// Graph Helper Functions
import { getCurrentGameState } from '../../../shared/game';
import {
    highlightNode,
    showCurrentPath,
    showKruskalRoot,
    showMSTEdgesFromList as showMSTEdgesFromListVisual
} from '../../graph/blocklyDfsVisual';
import { updateDijkstraPQ } from '../../graph/dijkstraStateManager';

// Import pure logic functions
import {
    getGraphNeighbors,
    getNodeValue,
    getCurrentNode,
    getGraphNeighborsWithWeight,
    getAllEdges,
    sortEdgesByWeight
} from './graphLogic';

// Re-export pure logic functions
export {
    getGraphNeighbors,
    getNodeValue,
    getCurrentNode,
    getGraphNeighborsWithWeight,
    getAllEdges,
    sortEdgesByWeight
};

/**
 * Find index of minimum value in list (for Priority Queue)
 * Assumes list contains tuples [distance, path] and finds minimum distance
 * Also provides visual feedback by highlighting the selected node
 */
export async function findMinIndex(list, exclusionList = null) {
    if (!Array.isArray(list) || list.length === 0) {
        console.warn('findMinIndex: list is empty or not an array');
        return -1;
    }

    let minIndex = -1;
    let minValue = null;

    for (let i = 0; i < list.length; i++) {
        // Skip if in exclusion list
        if (exclusionList && Array.isArray(exclusionList) && exclusionList[i] === true) {
            continue;
        }
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

/**
 * Find index of maximum value in list
 * Useful for Max-Capacity path finding (Bottleneck Dijkstra)
 */
export async function findMaxIndex(list, exclusionList = null) {
    if (!Array.isArray(list) || list.length === 0) {
        console.warn('findMaxIndex: list is empty or not an array');
        return -1;
    }

    let maxIndex = -1;
    let maxValue = null;

    for (let i = 0; i < list.length; i++) {
        // Skip if in exclusion list
        if (exclusionList && Array.isArray(exclusionList) && exclusionList[i] === true) {
            continue;
        }
        const item = list[i];
        let value;

        // Handle tuple format [capacity, path] or simple list
        if (Array.isArray(item) && item.length > 0) {
            value = Number(item[0]);
        } else if (typeof item === 'number') {
            value = item;
        } else if (item && typeof item === 'object') {
            value = Number(item.value || item.capacity || 0);
        } else {
            continue;
        }

        if (isNaN(value)) continue;

        if (maxValue === null || value > maxValue) {
            maxValue = value;
            maxIndex = i;
        }
    }

    // Visual feedback for search
    const currentState = getCurrentGameState();
    const scene = currentState.currentScene;

    if (scene && list[maxIndex] && Array.isArray(list[maxIndex]) && list[maxIndex].length > 1) {
        const selectedPath = list[maxIndex][1];
        if (Array.isArray(selectedPath) && selectedPath.length > 0) {
            const selectedNode = selectedPath[selectedPath.length - 1];
            // Highlight the node being picked from PQ
            highlightNode(scene, selectedNode, 0x3b82f6, 600); // Blue for Cable Car theme
        }
    }

    return maxIndex;
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
