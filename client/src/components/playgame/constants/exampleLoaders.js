/**
 * Example Loader Configuration
 * 
 * This file contains all the configuration for loading example blocks
 * into the Blockly workspace. Each loader includes metadata for display
 * and the actual loader function.
 */

import { loadDfsExampleBlocks } from '../../../gameutils/blockly/example/loadDfsExample';
import { loadBfsExampleBlocks } from '../../../gameutils/blockly/example/loadBfsExample';
import { loadDijkstraExampleBlocks } from '../../../gameutils/blockly/example/loadDijkstraExample';
import { loadPrimExampleBlocks } from '../../../gameutils/blockly/example/loadPrimExample';
import { loadKnapsackExampleBlocks } from '../../../gameutils/blockly/example/loadKnapsackExample';
import { loadDynamicKnapsackExampleBlocks } from '../../../gameutils/blockly/example/loadDynamicKnapsackExample';
import { loadKruskalExampleBlocks } from '../../../gameutils/blockly/example/loadKruskalExample';
import { loadSubsetSumExampleBlocks } from '../../../gameutils/blockly/example/loadSubsetSumExample';
import { loadDynamicSubsetSumExampleBlocks } from '../../../gameutils/blockly/example/loadDynamicSubsetSumExample';
import { loadCoinChangeExampleBlocks } from '../../../gameutils/blockly/example/loadCoinChangeExample';
import { loadDynamicCoinChangeExampleBlocks } from '../../../gameutils/blockly/example/loadDynamicCoinChangeExample';
import { loadGreedyCoinChangeExampleBlocks } from '../../../gameutils/blockly/example/loadGreedyCoinChangeExample';
import { loadNQueenExampleBlocks } from '../../../gameutils/blockly/example/loadNQueenExample';
import { loadTrainScheduleExampleBlocks } from '../../../gameutils/blockly/example/loadTrainScheduleExample';
import { loadRopePartitionExampleBlocks } from '../../../gameutils/blockly/example/loadRopePartitionExample';
import { loadEmeiMountainExample } from '../../../gameutils/blockly/example/loadEmeiMountainExample';

/**
 * Array of example loader configurations
 * Each object contains:
 * - id: unique identifier
 * - label: short display name
 * - title: full title for tooltip
 * - description: algorithm description
 * - icon: emoji icon
 * - className: Tailwind CSS classes for styling
 * - loader: function to load the example blocks
 */
export const EXAMPLE_LOADERS = [
    {
        id: 'dfs',
        label: 'DFS',
        title: 'โหลด DFS example blocks',
        description: 'Depth First Search',
        icon: '📦',
        className: 'bg-blue-600/20 border-blue-500/50 hover:bg-blue-600/30 text-blue-200',
        loader: loadDfsExampleBlocks
    },
    {
        id: 'bfs',
        label: 'BFS',
        title: 'โหลด BFS example blocks',
        description: 'Breadth First Search',
        icon: '📦',
        className: 'bg-green-600/20 border-green-500/50 hover:bg-green-600/30 text-green-200',
        loader: loadBfsExampleBlocks
    },
    {
        id: 'dijkstra',
        label: 'Dijkstra',
        title: 'โหลด Dijkstra example blocks',
        description: 'Shortest Path Algorithm',
        icon: '📦',
        className: 'bg-purple-600/20 border-purple-500/50 hover:bg-purple-600/30 text-purple-200',
        loader: loadDijkstraExampleBlocks
    },
    {
        id: 'prim',
        label: 'Prim',
        title: 'โหลด Prim example blocks',
        description: 'Minimum Spanning Tree',
        icon: '📦',
        className: 'bg-blue-500/20 border-blue-400/50 hover:bg-blue-500/30 text-blue-200',
        loader: loadPrimExampleBlocks
    },
    {
        id: 'kruskal',
        label: 'Kruskal',
        title: 'โหลด Kruskal example blocks',
        description: 'Minimum Spanning Tree',
        icon: '📦',
        className: 'bg-orange-600/20 border-orange-500/50 hover:bg-orange-600/30 text-orange-200',
        loader: loadKruskalExampleBlocks
    },
    {
        id: 'knapsack',
        label: 'Knapsack',
        title: 'โหลด Knapsack',
        description: 'Normal Knapsack Algorithm',
        icon: '🎒',
        className: 'bg-yellow-600/20 border-yellow-500/50 hover:bg-yellow-600/30 text-yellow-200',
        loader: loadKnapsackExampleBlocks
    },
    {
        id: 'knapsack_dp',
        label: 'Knapsack (DP)',
        title: 'โหลด Knapsack (DP)',
        description: 'Dynamic Programming',
        icon: '🎒',
        className: 'bg-yellow-700/20 border-yellow-600/50 hover:bg-yellow-700/30 text-yellow-200',
        loader: loadDynamicKnapsackExampleBlocks
    },
    {
        id: 'train_schedule',
        label: 'Train Schedule',
        title: 'โหลด Train Schedule',
        description: 'Scheduling Algorithm',
        icon: '🚂',
        className: 'bg-pink-700/20 border-pink-600/50 hover:bg-pink-700/30 text-pink-200',
        loader: loadTrainScheduleExampleBlocks
    },
    {
        id: 'subset_sum',
        label: 'Subset Sum',
        title: 'โหลด Subset Sum',
        description: 'Backtracking',
        icon: '⚔️',
        className: 'bg-red-600/20 border-red-500/50 hover:bg-red-600/30 text-red-200',
        loader: loadSubsetSumExampleBlocks
    },
    {
        id: 'subset_sum_dp',
        label: 'Subset Sum (DP)',
        title: 'โหลด Subset Sum (DP)',
        description: 'Dynamic Programming',
        icon: '⚔️',
        className: 'bg-red-700/20 border-red-600/50 hover:bg-red-700/30 text-red-200',
        loader: loadDynamicSubsetSumExampleBlocks
    },
    {
        id: 'coin_change',
        label: 'Coin Change',
        title: 'โหลด Coin Change',
        description: 'Normal Algorithm',
        icon: '🪙',
        className: 'bg-indigo-600/20 border-indigo-500/50 hover:bg-indigo-600/30 text-indigo-200',
        loader: loadCoinChangeExampleBlocks
    },
    {
        id: 'coin_change_dp',
        label: 'Coin Change (DP)',
        title: 'โหลด Dynamic Coin Change (DP)',
        description: 'Dynamic Programming',
        icon: '🪙',
        className: 'bg-indigo-700/20 border-indigo-600/50 hover:bg-indigo-700/30 text-indigo-200',
        loader: loadDynamicCoinChangeExampleBlocks
    },
    {
        id: 'coin_change_greedy',
        label: 'Coin Change (Greedy)',
        title: 'โหลด Greedy Coin Change',
        description: 'Greedy Algorithm',
        icon: '🪙',
        className: 'bg-indigo-800/20 border-indigo-700/50 hover:bg-indigo-800/30 text-indigo-200',
        loader: loadGreedyCoinChangeExampleBlocks
    },
    {
        id: 'n_queen',
        label: 'N-Queen',
        title: 'โหลด N-Queen',
        description: 'Backtracking',
        icon: '👑',
        className: 'bg-teal-600/20 border-teal-500/50 hover:bg-teal-600/30 text-teal-200',
        loader: loadNQueenExampleBlocks
    },
    {
        id: 'rope_partition',
        label: 'Rope Partition',
        title: 'โหลด Rope Partition',
        description: 'Backtracking',
        icon: '🪢',
        className: 'bg-cyan-600/20 border-cyan-500/50 hover:bg-cyan-600/30 text-cyan-200',
        loader: loadRopePartitionExampleBlocks
    },
    {
        id: 'dijkstra_emei',
        label: 'Dijkstra (Emei)',
        title: 'โหลด Dijkstra Max-Cap (ง้อไบ๊)',
        description: 'Emei Mountain Variant',
        icon: '⛰️',
        className: 'bg-indigo-600/20 border-indigo-500/50 hover:bg-indigo-600/30 text-indigo-200',
        loader: (workspace) => loadEmeiMountainExample(workspace, 'dijkstra')
    },
    {
        id: 'prim_emei',
        label: 'Prim (Emei)',
        title: 'โหลด Prim Max-Cap (ง้อไบ๊)',
        description: 'Emei Mountain Variant',
        icon: '⛰️',
        className: 'bg-pink-600/20 border-pink-500/50 hover:bg-pink-600/30 text-pink-200',
        loader: (workspace) => loadEmeiMountainExample(workspace, 'prim')
    }
];
