import React, { useState, useMemo } from 'react';
import { usePublicBlocks } from '../../services/hooks/useBlocks';
import PageLoader from '../../components/shared/Loading/PageLoader';
import PageError from '../../components/shared/Error/PageError';
import { getImageUrlSafe } from '@/utils/imageUtils';

const VERIFIED_SYNTAX = {
    // Actions & Movement
    "move_forward": "await moveForward();",
    "turn_left": "await turnLeft();",
    "turn_right": "await turnRight();",
    "hit": "await hit();",
    "rescue_person": "await rescuePersonAtNode(nodeId);",
    "keep_item": "keepItem()",
    "collect_coin": "await collectCoin();",
    "rescue_person_at_node": "await rescuePersonAtNode(nodeId);",
    "move_to_node": "await moveToNode(nodeId);",
    "move_along_path": "await moveAlongPath(path);",

    // Loops
    "for_each_person": "for (let i = 0; i < 10; i++) { }",
    "for_each_coin": "for (let i = 0; i < coins.length; i++) { }",
    "repeat": "for (let i = 0; i < times; i++) { }",
    "for_index": "for (let i = from; i <= to; i++) { }",
    "while_loop": "while (condition) { }",
    "for_loop_dynamic": "for (let i = from; i <= to; i++) { }",
    "for_each_in_list": "for (let item of list) { }",

    // Lists & Data
    "lists_remove_first_return": "list.shift()",
    "lists_get_first": "list[0]",
    "lists_get_last": "list[list.length - 1]",
    "lists_find_min_index": "findMinIndex(list)",
    "lists_find_max_index": "findMaxIndex(list)",
    "lists_add_item": "list.push(item)",
    "lists_remove_last": "list.pop()",
    "lists_contains": "list.includes(item)",
    "lists_concat": "list1.concat(list2)",
    "lists_length": "list.length",
    "lists_isEmpty": "list.length === 0",
    "lists_indexOf": "list.indexOf(item)",
    "lists_getIndex": "list[index]",
    "lists_setIndex": "list[index] = value;",
    "lists_get_at_index": "list[index]",
    "lists_remove_at_index": "list.splice(index, 1);",
    "lists_create_empty": "[]",
    "lists_create_with": "[item1, item2, ...]",

    // Graph
    "graph_get_neighbors": "getGraphNeighbors(graph, node)",
    "graph_get_neighbors_with_weight": "getGraphNeighborsWithWeight(graph, node)",
    "graph_get_all_edges": "getAllEdges(graph)",
    "graph_get_node_value": "getNodeValue(node)",
    "graph_get_current_node": "getCurrentNode()",
    "lists_sort_by_weight": "sortEdgesByWeight(edges)",

    // Logic
    "if_only": "if (condition) { }",
    "if_else": "if (condition) { } else { }",
    "if_return": "if (condition) { return; }",
    "logic_compare": "(a === b), (a !== b), (a < b), etc.",
    "logic_boolean": "true, false",
    "logic_negate": "!condition",
    "logic_operation": "(a && b), (a || b)",
    "logic_null": "null",
    "logic_not_in": "!list.includes(item)",

    // Math
    "math_number": "123",
    "math_arithmetic": "(a + b), (a - b), etc.",
    "math_compare": "(a === b), (a < b), etc.",
    "math_max": "Math.max(a, b)",
    "math_min": "Math.min(a, b)",
    "math_single": "Math.sqrt(x), etc.",

    // Advanced / DSU
    "dsu_find": "dsuFind(parent, node)",
    "dsu_union": "dsuUnion(parent, rank, rootU, rootV)",
    "dict_create": "{}",
    "dict_set": "dict[key] = value;",
    "dict_get": "dict[key]",
    "dict_has_key": "dict.hasOwnProperty(key)",

    // N-Queen
    "nqueen_place": "await place(row, col)",
    "nqueen_remove": "await remove(row, col)",
    "nqueen_is_safe": "await safe(row, col)",
    "place": "await place(row, col)",
    "delete": "await remove(row, col)",
    "is_safe": "await safe(row, col)",

    // Visuals & Algo Specials
    "rope_visual_init": "await initRopeTree()",
    "rope_get_cuts": "getCuts()",
    "rope_target_len": "getTarget()",
    "rope_vis_enter": "await pushNode(cut, sum);",
    "rope_vis_exit": "await popNode();",
    "rope_vis_status": "await updateStatus(status);",
    "sort_trains": "sortTrains(trains)",
    "get_train_value": "train.key",
    "assign_train_visual": "assignTrainVisual(train, platform)",
    "highlightPeak": "await highlightPeak(node)",
    "highlightPath": "await highlightPath(parent, end, bottleneck)",
    "showResult": "await showFinalResult(bottleneck, rounds)",
    "trackDecision": "trackDecision(target, coinIndex, result)"
};

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'Movement', label: 'Movement' },
    { id: 'Logic', label: 'Logic' },
    { id: 'Loops', label: 'Loops' },
    { id: 'Math', label: 'Math' },
    { id: 'Lists', label: 'Lists' },
    { id: 'Graph', label: 'Graph' },
    { id: 'Visual', label: 'Visual' }
];

const BlockManual = () => {
    // Fetch a large number of blocks at once to simplify tab filtering
    const { data, isLoading, isError, error } = usePublicBlocks(1, 150);
    const [activeTab, setActiveTab] = useState('all');

    const blocks = data?.blocks || [];

    const filteredBlocks = useMemo(() => {
        if (activeTab === 'all') return blocks;
        return blocks.filter(block => {
            // Flexible matching for category
            const cat = block.category?.toLowerCase() || '';
            const target = activeTab.toLowerCase();
            return cat.includes(target) || target.includes(cat);
        });
    }, [blocks, activeTab]);

    if (isLoading) {
        return <PageLoader message="Loading Block Manual..." />;
    }

    if (isError) {
        return <PageError message={error?.message} title="Failed to load blocks" />;
    }

    return (
        <div className="min-h-screen bg-[#120a1f] p-6 pt-24 text-white font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-black text-[#a855f7] uppercase tracking-wider mb-2 drop-shadow-lg">
                        Block Manual
                    </h1>
                    <p className="text-gray-400 text-lg">Master the Syntax of CodeAwakens</p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`px-6 py-2 rounded-full border-2 transition-all pixel-font text-xs
                                ${activeTab === cat.id
                                    ? 'bg-[#a855f7] border-white text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                                    : 'bg-[#1e1430] border-[#a855f7]/50 text-gray-400 hover:border-[#a855f7] hover:text-[#c084fc]'}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="bg-[#1e1430] border-2 border-[#a855f7] rounded-xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#a855f7]/20 text-[#c084fc] border-b border-[#a855f7]/50">
                                    <th className="p-4 w-24 font-bold tracking-wider text-center">Block</th>
                                    <th className="p-4 w-32 font-bold tracking-wider">Name</th>
                                    <th className="p-4 w-32 font-bold tracking-wider">Block Key</th>
                                    <th className="p-4 w-48 font-bold tracking-wider hidden md:table-cell">Description</th>
                                    <th className="p-4 font-bold tracking-wider">JavaScript Syntax</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBlocks.map((block) => {
                                    const syntax = VERIFIED_SYNTAX[block.block_key] || block.syntax_example || 'N/A';

                                    return (
                                        <tr key={block.block_id} className="border-b border-[#a855f7]/20 last:border-0 hover:bg-[#a855f7]/10 transition-colors">
                                            <td className="p-4 text-center">
                                                <div className="w-16 h-12 mx-auto bg-[#120a1f] p-1 rounded border border-[#a855f7]/30 flex items-center justify-center">
                                                    {block.block_image ? (
                                                        <img
                                                            src={getImageUrlSafe(block.block_image)}
                                                            alt={block.block_name}
                                                            className="max-w-full max-h-full object-contain"
                                                        />
                                                    ) : (
                                                        <div className="text-[10px] text-gray-500 break-all leading-tight">
                                                            {block.block_name}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-[#c084fc]">{block.block_name}</div>
                                                <div className="text-[10px] text-gray-500 uppercase">{block.category}</div>
                                            </td>
                                            <td className="p-4">
                                                <code className="text-[11px] bg-[#120a1f] px-2 py-1 rounded border border-[#a855f7]/20 text-gray-400">
                                                    {block.block_key}
                                                </code>
                                            </td>
                                            <td className="p-4 text-sm text-gray-300 hidden md:table-cell">
                                                {block.description || '-'}
                                            </td>
                                            <td className="p-4">
                                                <code className="bg-black/40 px-3 py-2 rounded border border-[#a855f7]/30 text-[#10B981] font-mono text-sm block overflow-x-auto whitespace-nowrap">
                                                    {syntax}
                                                </code>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {filteredBlocks.length === 0 && (
                            <div className="p-20 text-center text-gray-500 italic">
                                No blocks found in this category.
                            </div>
                        )}
                    </div>
                </div>


            </div>
        </div>
    );
};

export default BlockManual;
