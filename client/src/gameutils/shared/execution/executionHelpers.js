/**
 * executionHelpers.js
 * 
 * Pure utility functions:
 * - Graph map creation from level data
 * - Emei Mountain parameter building
 * - Execution-counting wrappers for move functions
 */

import { moveToNode, moveAlongPath } from '../../blockly';

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
