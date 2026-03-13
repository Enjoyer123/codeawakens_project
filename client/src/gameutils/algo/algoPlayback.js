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
            const appliedType = (levelData.algo_data?.type || '').toLowerCase();
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
            const appliedType = (levelData.algo_data?.type || '').toLowerCase();
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
            const appliedType = (levelData.algo_data?.type || '').toLowerCase();
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

