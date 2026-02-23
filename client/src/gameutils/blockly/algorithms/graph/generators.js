// Blockly Graph Generators
import { javascriptGenerator } from "blockly/javascript";

export function defineGraphGenerators() {
    javascriptGenerator.forBlock["graph_get_neighbors"] = function (block) {
        const graph = javascriptGenerator.valueToCode(block, 'GRAPH', javascriptGenerator.ORDER_MEMBER) || '{}';
        const node = javascriptGenerator.valueToCode(block, 'NODE', javascriptGenerator.ORDER_MEMBER) || '0';
        return [`getGraphNeighbors(${node})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["graph_get_node_value"] = function (block) {
        const node = javascriptGenerator.valueToCode(block, 'NODE', javascriptGenerator.ORDER_ATOMIC) || '0';
        return [`getNodeValue(${node})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["graph_get_current_node"] = function (block) {
        return [`getCurrentNode()`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["graph_get_all_edges"] = function (block) {
        const graph = javascriptGenerator.valueToCode(block, 'GRAPH', javascriptGenerator.ORDER_MEMBER) || '{}';
        return [`getAllEdges(${graph})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["lists_sort_by_weight"] = function (block) {
        const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
        return [`sortEdgesByWeight(${list})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["graph_get_neighbors_with_weight"] = function (block) {
        const graph = javascriptGenerator.valueToCode(block, 'GRAPH', javascriptGenerator.ORDER_MEMBER) || '{}';
        const node = javascriptGenerator.valueToCode(block, 'NODE', javascriptGenerator.ORDER_MEMBER) || '0';
        return [`getGraphNeighborsWithWeight(${node})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    // DFS Visual Feedback generators
    javascriptGenerator.forBlock["graph_get_neighbors_visual"] = function (block) {
        const graph = javascriptGenerator.valueToCode(block, 'GRAPH', javascriptGenerator.ORDER_NONE) || 'null';
        const node = javascriptGenerator.valueToCode(block, 'NODE', javascriptGenerator.ORDER_NONE) || '0';
        // Treated the same as non-visual since algoExecutor handles tracing automatically
        return [`getGraphNeighbors(${node})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["mark_visited_visual"] = function (block) {
        const node = javascriptGenerator.valueToCode(block, 'NODE', javascriptGenerator.ORDER_NONE) || '0';
        return `await markVisitedWithVisual(${node});\n`;
    };

    javascriptGenerator.forBlock["show_path_visual"] = function (block) {
        const path = javascriptGenerator.valueToCode(block, 'PATH', javascriptGenerator.ORDER_NONE) || '[]';
        return `await showPathUpdateWithVisual(${path});\n`;
    };

    // Dijkstra Trace generators
    javascriptGenerator.forBlock["dijkstra_visit"] = function (block) {
        const node = javascriptGenerator.valueToCode(block, 'NODE', javascriptGenerator.ORDER_NONE) || '0';
        const dist = javascriptGenerator.valueToCode(block, 'DIST', javascriptGenerator.ORDER_NONE) || '0';
        return `if (typeof trace !== 'undefined') trace.push({ action: 'dijkstra_visit', node: ${node}, dist: ${dist} });\n`;
    };

    javascriptGenerator.forBlock["dijkstra_relax"] = function (block) {
        const from = javascriptGenerator.valueToCode(block, 'FROM', javascriptGenerator.ORDER_NONE) || '0';
        const to = javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_NONE) || '0';
        const newDist = javascriptGenerator.valueToCode(block, 'NEW_DIST', javascriptGenerator.ORDER_NONE) || '0';
        return `if (typeof trace !== 'undefined') trace.push({ action: 'dijkstra_relax', from: ${from}, to: ${to}, newDist: ${newDist} });\n`;
    };

    // Prim Trace generators
    javascriptGenerator.forBlock["prim_visit"] = function (block) {
        const node = javascriptGenerator.valueToCode(block, 'NODE', javascriptGenerator.ORDER_NONE) || '0';
        const parent = javascriptGenerator.valueToCode(block, 'PARENT', javascriptGenerator.ORDER_NONE) || 'null';
        const dist = javascriptGenerator.valueToCode(block, 'DIST', javascriptGenerator.ORDER_NONE) || '0';
        return `if (typeof trace !== 'undefined') trace.push({ action: 'prim_visit', node: ${node}, parent: ${parent}, dist: ${dist} });\n`;
    };

    javascriptGenerator.forBlock["prim_relax"] = function (block) {
        const from = javascriptGenerator.valueToCode(block, 'FROM', javascriptGenerator.ORDER_NONE) || '0';
        const to = javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_NONE) || '0';
        const newDist = javascriptGenerator.valueToCode(block, 'NEW_DIST', javascriptGenerator.ORDER_NONE) || '0';
        return `if (typeof trace !== 'undefined') trace.push({ action: 'prim_relax', from: ${from}, to: ${to}, newDist: ${newDist} });\n`;
    };

    // Kruskal Trace generators
    javascriptGenerator.forBlock["kruskal_visit"] = function (block) {
        const from = javascriptGenerator.valueToCode(block, 'FROM', javascriptGenerator.ORDER_NONE) || '0';
        const to = javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_NONE) || '0';
        const weight = javascriptGenerator.valueToCode(block, 'WEIGHT', javascriptGenerator.ORDER_NONE) || '0';
        return `if (typeof trace !== 'undefined') trace.push({ action: 'kruskal_visit', from: ${from}, to: ${to}, weight: ${weight} });\n`;
    };

    javascriptGenerator.forBlock["kruskal_add_edge"] = function (block) {
        const from = javascriptGenerator.valueToCode(block, 'FROM', javascriptGenerator.ORDER_NONE) || '0';
        const to = javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_NONE) || '0';
        const weight = javascriptGenerator.valueToCode(block, 'WEIGHT', javascriptGenerator.ORDER_NONE) || '0';
        return `if (typeof trace !== 'undefined') trace.push({ action: 'kruskal_add_edge', from: ${from}, to: ${to}, weight: ${weight} });\n`;
    };
}
