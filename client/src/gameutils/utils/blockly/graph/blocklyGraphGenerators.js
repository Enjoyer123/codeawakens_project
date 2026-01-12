// Blockly Graph Generators
import { javascriptGenerator } from "blockly/javascript";

export function defineGraphGenerators() {
    javascriptGenerator.forBlock["graph_get_neighbors"] = function (block) {
        const graph = javascriptGenerator.valueToCode(block, 'GRAPH', javascriptGenerator.ORDER_MEMBER) || '{}';
        const node = javascriptGenerator.valueToCode(block, 'NODE', javascriptGenerator.ORDER_MEMBER) || '0';
        return [`getGraphNeighborsWithVisualSync(${graph}, ${node})`, javascriptGenerator.ORDER_FUNCTION_CALL];
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
        return [`await getGraphNeighborsWithWeightWithVisualSync(${graph}, ${node})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    // DFS Visual Feedback generators
    javascriptGenerator.forBlock["graph_get_neighbors_visual"] = function (block) {
        const graph = javascriptGenerator.valueToCode(block, 'GRAPH', javascriptGenerator.ORDER_NONE) || 'null';
        const node = javascriptGenerator.valueToCode(block, 'NODE', javascriptGenerator.ORDER_NONE) || '0';
        return [`await getGraphNeighborsWithVisual(${graph}, ${node})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["mark_visited_visual"] = function (block) {
        const node = javascriptGenerator.valueToCode(block, 'NODE', javascriptGenerator.ORDER_NONE) || '0';
        return `await markVisitedWithVisual(${node});\n`;
    };

    javascriptGenerator.forBlock["show_path_visual"] = function (block) {
        const path = javascriptGenerator.valueToCode(block, 'PATH', javascriptGenerator.ORDER_NONE) || '[]';
        return `await showPathUpdateWithVisual(${path});\n`;
    };
}
