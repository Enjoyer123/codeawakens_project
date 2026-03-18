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

import { isAlgoLevel as checkAlgoLevel, detectAlgoType as checkAlgoType } from '../shared/levelType';

export const isAlgoLevel = checkAlgoLevel;
export const detectAlgoType = checkAlgoType;

// ─── ตรวจประเภทด่าน (DP / Greedy / Backtrack) ───
function isDpLevel(scene) {
    const ld = scene.levelData || {};
    const catName = (ld.category?.category_name || '').toLowerCase();
    const algoType = (ld.algo_data?.type || '').toLowerCase();
    const gameType = (ld.game_type || '').toLowerCase();
    return catName.includes('dynamic') || ld.category_id === 6 || algoType.includes('dp') || gameType.includes('dp');
}

function isGreedyLevel(scene) {
    const ld = scene.levelData || {};
    const catName = (ld.category?.category_name || '').toLowerCase();
    const algoType = (ld.algo_data?.type || '').toLowerCase();
    const gameType = (ld.game_type || '').toLowerCase();
    return catName.includes('greedy') || ld.category_id === 4 || algoType.includes('greedy') || gameType.includes('greedy');
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

        case 'COINCHANGE':
            if (isDpLevel(scene)) return playCoinChangeDpAnimation(scene, trace, { speed });
            return playCoinChangeBacktrackAnimation(scene, trace, { speed, isGreedy: isGreedyLevel(scene) });

        case 'KNAPSACK':
            if (isDpLevel(scene)) return playKnapsackDpAnimation(scene, trace, { speed, result: options.result });
            return playKnapsackBacktrackAnimation(scene, trace, { speed, result: options.result });

        case 'SUBSETSUM':
            if (isDpLevel(scene)) return playSubsetSumDpAnimation(scene, trace, { speed, result: options.result });
            return playSubsetSumBacktrackAnimation(scene, trace, { speed, result: options.result });

        case 'EMEI':
            return playEmeiAnimation(scene, trace, { speed, result: options.result });

        default:
            console.warn(`⚠️ [algoPlayback] No playback for type: ${algoType}`);
            return;
    }
}

