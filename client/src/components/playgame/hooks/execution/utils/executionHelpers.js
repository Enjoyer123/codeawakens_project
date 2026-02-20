/**
 * executionHelpers.js
 * 
 * Pure utility functions extracted from useCodeExecution.js:
 * - Graph map creation from level data
 * - Emei Mountain parameter building
 * - Coin change variable re-detection
 * - Execution-counting wrappers for move functions
 */

import { moveToNode, moveAlongPath } from '../../../../../gameutils/blockly';

/**
 * Creates a bidirectional graph adjacency map from nodes and edges.
 * @param {Array} nodes - Array of node objects with `id` property
 * @param {Array} edges - Array of edge objects with `from` and `to` properties
 * @returns {Object} Adjacency map: { nodeId: [neighborId, ...] }
 */
export const createGraphMap = (nodes, edges) => {
    const graph = {};
    if (!nodes || !edges) return graph;

    nodes.forEach(node => {
        graph[String(node.id)] = [];
    });

    edges.forEach(edge => {
        const from = String(edge.from);
        const to = String(edge.to);
        if (graph[from] && !graph[from].includes(Number(to))) {
            graph[from].push(Number(to));
        }
        if (graph[to] && !graph[to].includes(Number(from))) {
            graph[to].push(Number(from));
        }
    });

    return graph;
};

/**
 * Builds Emei Mountain parameters from the primary test case and level data.
 * @param {Object} currentLevel - Current level data
 * @returns {Object} Emei parameters: { n, edges, start, end, tourists }
 */
export const buildEmeiParams = (currentLevel) => {
    const primaryTC = currentLevel?.test_cases?.find(tc => tc.is_primary);
    const tcParams = primaryTC?.input_params
        ? (typeof primaryTC.input_params === 'string' ? JSON.parse(primaryTC.input_params) : primaryTC.input_params)
        : null;

    return {
        n: tcParams?.n || currentLevel.maxCapacityData?.nodes?.length || currentLevel.nodes?.length || 0,
        edges: tcParams?.edges || (currentLevel.maxCapacityData?.edges || currentLevel.edges || []).map(e => [
            e.u !== undefined ? e.u : (e.from !== undefined ? e.from : 0),
            e.v !== undefined ? e.v : (e.to !== undefined ? e.to : 0),
            e.weight !== undefined ? Number(e.weight) : (e.value !== undefined ? Number(e.value) : 1)
        ]),
        start: tcParams?.start !== undefined ? tcParams.start : (currentLevel.maxCapacityData?.start_node !== undefined ? currentLevel.maxCapacityData.start_node : (currentLevel.startNodeId || 0)),
        end: tcParams?.end !== undefined ? tcParams.end : (currentLevel.maxCapacityData?.goal_node !== undefined ? currentLevel.maxCapacityData.goal_node : (currentLevel.goalNodeId || 6)),
        tourists: tcParams?.tourists !== undefined ? tcParams.tourists : (currentLevel.maxCapacityData?.tourists || 99)
    };
};

/**
 * Creates wrapped move functions that count executions and throw on infinite loops.
 * @param {number} maxExecutions - Maximum number of function calls allowed
 * @returns {{ wrappedMoveToNode: Function, wrappedMoveAlongPath: Function, timeoutPromise: Promise }}
 */
export const createExecutionWrappers = (maxExecutions = 5000) => {
    let executionCount = 0;

    const wrappedMoveToNode = async (nodeId) => {
        executionCount++;
        if (executionCount > maxExecutions) {
            throw new Error("Too many executions - possible infinite loop");
        }
        return await moveToNode(nodeId);
    };

    const wrappedMoveAlongPath = async (path) => {
        executionCount++;
        if (executionCount > maxExecutions) {
            throw new Error("Too many executions - possible infinite loop");
        }
        return await moveAlongPath(path);
    };

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Execution timeout - possible infinite loop")), 60000);
    });

    return { wrappedMoveToNode, wrappedMoveAlongPath, timeoutPromise };
};
