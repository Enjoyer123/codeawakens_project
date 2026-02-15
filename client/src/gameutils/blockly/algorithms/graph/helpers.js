// Graph Helper Functions
import { getCurrentGameState } from '../../../shared/game';
import {
    highlightNode,
    highlightEdge,
    showCurrentPath
} from './drawing';
import {
    showKruskalRoot,
    showMSTEdgesFromList as showMSTEdgesFromListVisual
} from './mst_visual';
import { updateDijkstraPQ } from './dijkstra_state';

// Import pure logic functions
import {
    getGraphNeighbors,
    getNodeValue,
    getCurrentNode,
    getGraphNeighborsWithWeight,
    getAllEdges,
    sortEdgesByWeight,
} from './logic';

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
export function findMinIndex(list, exclusionList = null) {
    if (!Array.isArray(list) || list.length === 0) {
        return -1;
    }

    let minIndex = -1;
    let minValue = null;

    for (let i = 0; i < list.length; i++) {
        if (exclusionList && Array.isArray(exclusionList) && exclusionList[i] === true) {
            continue;
        }
        const item = list[i];
        let value;

        if (Array.isArray(item) && item.length > 0) {
            value = Number(item[0]);
        } else if (typeof item === 'number') {
            value = item;
        } else if (item && typeof item === 'object' && item.distance !== undefined) {
            value = Number(item.distance);
        } else {
            continue;
        }

        if (isNaN(value)) continue;

        if (minValue === null || value < minValue) {
            minValue = value;
            minIndex = i;
        }
    }

    return minIndex;
}

/**
 * Find min index with Dijkstra visual feedback
 */
export async function findMinIndexWithVisual(list, exclusionList = null) {
    const minIndex = findMinIndex(list, exclusionList);
    if (minIndex === -1) return minIndex;

    // Update Dijkstra PQ state
    try { updateDijkstraPQ(list); } catch (err) { }

    // Visual feedback
    const currentState = getCurrentGameState();
    const scene = currentState.currentScene;

    if (scene && list[minIndex] && Array.isArray(list[minIndex]) && list[minIndex].length > 1) {
        const selectedDistance = list[minIndex][0];
        const selectedPath = list[minIndex][1];
        if (Array.isArray(selectedPath) && selectedPath.length > 0) {
            const selectedNode = selectedPath[selectedPath.length - 1];
            const node = scene.levelData.nodes.find(n => n.id === selectedNode);

            if (node) {
                highlightNode(scene, selectedNode, 0x00ff00, 600);
                showCurrentPath(scene, selectedPath);

                if (scene.dijkstraDistanceText) {
                    scene.dijkstraDistanceText.destroy();
                }

                const distanceText = scene.add.text(node.x, node.y - 50, `ระยะทาง: ${selectedDistance} `, {
                    fontSize: '16px',
                    color: '#00ff00',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 3,
                    backgroundColor: '#000000',
                    padding: { x: 8, y: 4 }
                });
                distanceText.setOrigin(0.5, 0.5);
                distanceText.setDepth(4);
                scene.dijkstraDistanceText = distanceText;

                await new Promise(resolve => setTimeout(resolve, 500));

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
export function findMaxIndex(list, exclusionList = null) {
    if (!Array.isArray(list) || list.length === 0) {
        return -1;
    }

    let maxIndex = -1;
    let maxValue = null;

    for (let i = 0; i < list.length; i++) {
        if (exclusionList && Array.isArray(exclusionList) && exclusionList[i] === true) {
            continue;
        }
        const item = list[i];
        let value;

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

    return maxIndex;
}

/**
 * Find max index with visual feedback (Emei/Cable Car)
 */
export async function findMaxIndexWithVisual(list, exclusionList = null) {
    const maxIndex = findMaxIndex(list, exclusionList);
    if (maxIndex === -1) return maxIndex;

    const currentState = getCurrentGameState();
    const scene = currentState.currentScene;

    if (scene && list[maxIndex] && Array.isArray(list[maxIndex]) && list[maxIndex].length > 1) {
        const selectedPath = list[maxIndex][1];
        if (Array.isArray(selectedPath) && selectedPath.length > 0) {
            const selectedNode = selectedPath[selectedPath.length - 1];
            highlightNode(scene, selectedNode, 0x3b82f6, 600);
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
export function dsuFind(parent, node) {
    if (!parent || typeof parent !== 'object') {
        return node;
    }

    const nodeKey = String(node);

    if (parent[nodeKey] === undefined || parent[nodeKey] === null) {
        parent[nodeKey] = node;
        return node;
    }

    // Path compression
    if (parent[nodeKey] !== node) {
        parent[nodeKey] = dsuFind(parent, parent[nodeKey]);
    }

    return parent[nodeKey];
}

/**
 * DSU Find with Kruskal visual feedback
 */
export async function dsuFindWithVisual(parent, node) {
    const root = dsuFind(parent, node);

    const currentState = getCurrentGameState();
    const scene = currentState.currentScene;
    if (scene) {
        showKruskalRoot(scene, Number(node), Number(root));
        await new Promise(resolve => setTimeout(resolve, 200));
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
export function dsuUnion(parent, rank, rootU, rootV) {
    if (!parent || typeof parent !== 'object') return;
    if (!rank || typeof rank !== 'object') return;

    const rootUKey = String(rootU);
    const rootVKey = String(rootV);

    if (rank[rootUKey] === undefined) rank[rootUKey] = 0;
    if (rank[rootVKey] === undefined) rank[rootVKey] = 0;

    if (rank[rootUKey] < rank[rootVKey]) {
        parent[rootUKey] = rootV;
    } else if (rank[rootUKey] > rank[rootVKey]) {
        parent[rootVKey] = rootU;
    } else {
        parent[rootVKey] = rootU;
        rank[rootUKey] = (rank[rootUKey] || 0) + 1;
    }
}

/**
 * DSU Union with visual delay
 */
export async function dsuUnionWithVisual(parent, rank, rootU, rootV) {
    dsuUnion(parent, rank, rootU, rootV);
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
