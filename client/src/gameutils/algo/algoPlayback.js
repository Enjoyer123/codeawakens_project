/**
 * algoPlayback.js — Record & Playback System
 *
 * Dispatcher: รับ trace array + level type → เรียก playback function ที่ถูกด่าน
 */

import { playCoinChangeBacktrackAnimation } from './playback/coinChangePlaybackBacktrack';
import { playCoinChangeDpAnimation } from './playback/coinChangePlaybackDp';
import { playNQueenAnimation } from "./playback/nqueenPlayback.js";
import { playKnapsackBacktrackAnimation } from './playback/knapsackPlaybackBt';
import { playKnapsackDpAnimation } from './playback/knapsackPlaybackDp';
import { playSubsetSumBacktrackAnimation } from './playback/subsetSumPlaybackBt';
import { playSubsetSumDpAnimation } from "./playback/subsetSumPlaybackDp.js";
import { playDijkstraAnimation } from './playback/dijkstraPlayback.js';
import { playPrimAnimation } from './playback/primPlayback.js';
import { playKruskalAnimation } from './playback/kruskalPlayback.js';
import { playGraphAnimation } from './playback/graphPlayback.js';
import { playEmeiAnimation } from './playback/emeiPlayback.js';



/**
 * ตรวจว่า level นี้เป็น algo level ที่ใช้ระบบ Record & Playback หรือไม่
 * @param {Object} level - level data
 * @returns {boolean}
 */
export function isAlgoLevel(level) {
    if (!level) return false;

    // ตรวจจาก gameType หรือ appliedData.type
    const gameType = level.game_type || '';
    const appliedType = level.applied_data?.type || '';


    const algoTypes = [
        'dfs', 'bfs', 'dijkstra', 'kruskal', 'prim',
        'nqueen', 'coin_change', 'knapsack', 'subset_sum',
        'emei_mountain', 'graph_max_capacity'
    ];

    // เช็คจาก gameType
    if (algoTypes.some(t => gameType.toLowerCase().includes(t))) return true;

    // เช็คจาก appliedData.type (เช่น "GRAPH_DFS", "BACKTRACKING_NQUEEN")
    const appliedLower = appliedType.toLowerCase();
    if (algoTypes.some(t => appliedLower.includes(t))) return true;

    // เช็คจากว่ามี algo-specific data
    if (level.nqueen_data || level.knapsack_data || level.subset_sum_data || level.coin_change_data) return true;

    // เช็คจาก function_name ใน test_cases (รองรับชื่อฟังก์ชันย่อ เช่น DIJ, KRUS)
    const algoFunctions = [
        'DFS', 'BFS', 'DIJKSTRA', 'DIJ',
        'KRUSKAL', 'KRUS', 'PRIM',
        'NQUEEN', 'COINCHANGE', 'KNAPSACK', 'SUBSETSUM', 'MAXCAPACITY'
    ];
    if (level.test_cases?.some(tc => algoFunctions.includes(tc.function_name?.toUpperCase()))) return true;

    // Fallback: ถ้า level มี nodes + edges + test_cases → น่าจะเป็น graph algo level
    if ((level.nodes?.length > 0) && (level.edges?.length > 0) && (level.test_cases?.length > 0)) return true;

    return false;
}

/**
 * ตรวจประเภท algo จาก level data
 */
export function detectAlgoType(level) {
    const gameType = (level.game_type || '').toLowerCase();
    const appliedType = (level.applied_data?.type || '').toLowerCase();
    const combined = gameType + ' ' + appliedType;

    if (combined.includes('dfs')) return 'DFS';
    if (combined.includes('bfs')) return 'BFS';
    if (combined.includes('dijkstra')) return 'DIJKSTRA';
    if (combined.includes('kruskal')) return 'KRUSKAL';
    if (combined.includes('prim')) return 'PRIM';

    // Detect by test_cases function_name when gameType is not set
    const funcName = level.test_cases?.[0]?.function_name?.toUpperCase();
    if (funcName === 'DFS') return 'DFS';
    if (funcName === 'BFS') return 'BFS';
    if (funcName === 'DIJ' || funcName === 'DIJKSTRA') return 'DIJKSTRA';
    if (funcName === 'KRUS' || funcName === 'KRUSKAL') return 'KRUSKAL';
    if (funcName === 'PRIM') return 'PRIM';
    if (level.nqueen_data || combined.includes('nqueen')) return 'NQUEEN';
    if (level.coin_change_data || combined.includes('coin_change') || combined.includes('coinchange')) return 'COINCHANGE';
    if (level.knapsack_data || combined.includes('knapsack')) return 'KNAPSACK';
    if (level.subset_sum_data || combined.includes('subset_sum') || combined.includes('subsetsum')) return 'SUBSETSUM';
    if (combined.includes('emei') || combined.includes('max_capacity') || combined.includes('graph_max_capacity')) return 'EMEI';

    // Detect Emei Mountain via function name
    if (funcName === 'MAXCAPACITY') return 'EMEI';

    // Fallback: already checked function_name above
    return funcName || 'UNKNOWN';
}

/**
 * เล่น Animation ตาม trace array
 * @param {Phaser.Scene} scene - Phaser scene
 * @param {string} algoType - ประเภท algorithm (DFS, NQUEEN, etc.)
 * @param {Array} trace - array ของ steps จาก algoExecutor
 * @param {Object} options - ตั้งค่าเพิ่มเติม (speed, etc.)
 */
export async function playAlgoAnimation(scene, algoType, trace, options = {}) {
    const { speed = 1.0 } = options;


    switch (algoType) {
        case 'DFS':
        case 'BFS':
            return playGraphAnimation(scene, trace, { speed, algoType });

        case 'DIJKSTRA':
            return playDijkstraAnimation(scene, trace, { speed, result: options.result });
        case 'PRIM':
            return playPrimAnimation(scene, trace, { speed, result: options.result });
        case 'KRUSKAL':
            return playKruskalAnimation(scene, trace, { speed, result: options.result });
        case 'NQUEEN':
            return playNQueenAnimation(scene, trace, { speed, result: options.result });

        case 'COINCHANGE': {
            const levelData = scene.levelData || {};
            const catName = (levelData.category?.category_name || '').toLowerCase();
            const catId = levelData.category_id;
            const appliedType = (levelData.applied_data?.type || '').toLowerCase();
            const gameType = (levelData.game_type || '').toLowerCase();

            const isDP = catName.includes('dynamic') || catId === 6 || appliedType.includes('dp') || gameType.includes('dp');
            const isGreedy = catName.includes('greedy') || catId === 4 || appliedType.includes('greedy') || gameType.includes('greedy');

            if (isDP) {
                return playCoinChangeDpAnimation(scene, trace, { speed });
            } else if (isGreedy) {
                return playCoinChangeBacktrackAnimation(scene, trace, { speed, isGreedy: true });
            } else {
                return playCoinChangeBacktrackAnimation(scene, trace, { speed, isGreedy: false });
            }
        }

        case 'KNAPSACK': {
            const levelData = scene.levelData || {};
            const catName = (levelData.category?.category_name || '').toLowerCase();
            const catId = levelData.category_id;
            const appliedType = (levelData.applied_data?.type || '').toLowerCase();
            const gameType = (levelData.game_type || '').toLowerCase();

            const isDP = catName.includes('dynamic') || catId === 6 || appliedType.includes('dp') || gameType.includes('dp');

            if (isDP) {
                return playKnapsackDpAnimation(scene, trace, { speed, result: options.result });
            } else {
                return playKnapsackBacktrackAnimation(scene, trace, { speed, result: options.result });
            }
        }

        case 'SUBSETSUM': {
            const levelData = scene.levelData || {};
            const catName = (levelData.category?.category_name || '').toLowerCase();
            const catId = levelData.category_id;
            const appliedType = (levelData.applied_data?.type || '').toLowerCase();
            const gameType = (levelData.game_type || '').toLowerCase();

            const isDP = catName.includes('dynamic') || catId === 6 || appliedType.includes('dp') || gameType.includes('dp');

            if (isDP) {
                return playSubsetSumDpAnimation(scene, trace, { speed, result: options.result });
            } else {
                return playSubsetSumBacktrackAnimation(scene, trace, { speed, result: options.result });
            }
        }

        case 'EMEI':
            return playEmeiAnimation(scene, trace, { speed, result: options.result });

        default:
            console.warn(`⚠️ [algoPlayback] No playback for type: ${algoType}`);
            return;
    }
}

