// Graph Logic Functions (Pure Logic, No Visuals)
import { getCurrentGameState } from '../../../shared/game';

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
    // console.log('[getGraphNeighborsWithWeight] ===== CALLED =====');
    // ... logging kept to minimum for performance, or can be re-enabled if needed

    if (!graph || typeof graph !== 'object') {
        console.warn('Invalid graph:', graph);
        return [];
    }

    // Check if graph is an adjacency list object format: {0: [1, 2], 1: [0, 2], ...}
    // This happens when edges parameter is passed as an object
    if (!Array.isArray(graph)) {
        const nodeKey = String(node);
        const neighbors = graph[nodeKey] || graph[node];

        if (Array.isArray(neighbors) && neighbors.length > 0) {
            // Need to get weights from levelData.edges
            const currentState = getCurrentGameState();
            const levelData = currentState.levelData;

            if (levelData && levelData.edges) {
                return neighbors.map(neighbor => {
                    const edge = levelData.edges.find(e =>
                        (e.from === node && e.to === neighbor) ||
                        (e.from === neighbor && e.to === node) ||
                        (e.u === node && e.v === neighbor) ||
                        (e.u === neighbor && e.v === node)
                    );
                    const weight = edge && edge.value !== undefined && edge.value !== null
                        ? Number(edge.value)
                        : (edge && edge.weight !== undefined ? Number(edge.weight) : 1);
                    return [neighbor, weight];
                });
            }

            // Fallback: return neighbors with default weight 1
            return neighbors.map(n => [n, 1]);
        }
    }

    // Check if graph is an edge list format: [[u, v, weight], ...] or [{from, to, value}, ...]
    if (Array.isArray(graph) && graph.length > 0) {
        const firstEdge = graph[0];

        // Check if it's array format [[u, v, weight], ...] or [[u, v], ...] (without weight)
        if (Array.isArray(firstEdge)) {
            // Check if edges have weights
            const hasWeights = firstEdge.length >= 3 && firstEdge[2] !== undefined;

            if (!hasWeights) {
                // Edges don't have weights, need to get from levelData.edges
                const currentState = getCurrentGameState();
                const levelData = currentState.levelData;

                if (levelData && levelData.edges) {
                    const neighbors = [];
                    for (const edge of graph) {
                        if (!Array.isArray(edge) || edge.length < 2) continue;
                        const u = edge[0];
                        const v = edge[1];

                        // Check if this edge connects to our node
                        if (u === node || v === node) {
                            const neighbor = u === node ? v : u;
                            // Find weight from levelData.edges
                            const edgeData = levelData.edges.find(e =>
                                (e.from === u && e.to === v) ||
                                (e.from === v && e.to === u) ||
                                (e.u === u && e.v === v) ||
                                (e.u === v && e.v === u)
                            );
                            const weight = edgeData && edgeData.value !== undefined
                                ? Number(edgeData.value)
                                : (edgeData && edgeData.weight !== undefined ? Number(edgeData.weight) : 1);
                            neighbors.push([neighbor, weight]);
                        }
                    }
                    return neighbors;
                }
                return [];
            }

            // Edges have weights, proceed normally
            const neighbors = [];
            for (const edge of graph) {
                if (!Array.isArray(edge) || edge.length < 3) continue;
                const u = edge[0];
                const v = edge[1];
                const weight = edge[2];

                // Check if this edge connects to our node (undirected)
                if (u === node) {
                    neighbors.push([v, weight]);
                } else if (v === node) {
                    neighbors.push([u, weight]);
                }
            }
            return neighbors;
        }

        // Check if it's object format [{from, to, value}, ...]
        if (firstEdge && typeof firstEdge === 'object' && ('from' in firstEdge || 'u' in firstEdge)) {
            const neighbors = [];
            for (const edge of graph) {
                const u = edge.from !== undefined ? edge.from : edge.u;
                const v = edge.to !== undefined ? edge.to : edge.v;
                const weight = edge.value !== undefined ? edge.value : edge.weight;

                // Check if this edge connects to our node (undirected)
                if (u === node) {
                    neighbors.push([v, weight]);
                } else if (v === node) {
                    neighbors.push([u, weight]);
                }
            }
            return neighbors;
        }
    }

    // Otherwise, use adjacency list format with levelData.edges
    const currentState = getCurrentGameState();
    const levelData = currentState.levelData;

    if (!levelData || !levelData.edges) {
        console.warn('Level data or edges not available');
        return [];
    }

    const nodeKey = String(node);
    const neighbors = graph[nodeKey] || graph[node] || [];

    // Get edges with weights
    return neighbors.map(neighbor => {
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
}

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
