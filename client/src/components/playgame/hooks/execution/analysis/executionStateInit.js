/**
 * executionStateInit.js
 * 
 * Handles strict initialization of level-specific state before code execution.
 * This includes:
 * 1. Resetting UI visuals (tables, grids, counts).
 * 2. Determining active algorithm flags (isNQueen, isKnapsack, etc.).
 * 3. Generating initialization code strings (initCodes).
 * 4. Applying pre-execution code transforms (e.g. AntDP unconditional patches).
 */

import {
    getSubsetSumInitCode,
    getKnapsackInitCode,
    getCoinChangeInitCode,
    getNQueenInitCode,
    getAntDpInitCode,
    instrumentAntDp,
    getRopePartitionInitCode,
    instrumentRopePartition
} from './executionInstrumentation';

import {
    startCoinChangeSelectionTracking,
} from '../../../../../gameutils/blockly/algorithms/coin_change/blocklyCoinChangeVisual';

import { startSubsetSumTrackingVisual } from '../../../../../gameutils/blockly/core/blocklyHelpers';

import {
    startKnapsackSelectionTracking,
} from '../../../../../gameutils/blockly/algorithms/knapsack/blocklyKnapsackVisual';


import { resetCoinChangeTableState } from '../../../../../gameutils/blockly/algorithms/coin_change/coinChangeStateManager';
import { resetKnapsackTableState } from '../../../../../gameutils/blockly/algorithms/knapsack/knapsackStateManager';
import { resetSubsetSumTableState } from '../../../../../gameutils/blockly/algorithms/subset_sum/subsetSumStateManager';

import {
    resetAntDpTableState
} from '../../../../../gameutils/blockly/algorithms/ant_dp/antDpStateManager';


/**
 * Initializes the state for the current level execution.
 * 
 * @param {object} currentLevel - The current level data object.
 * @param {string} code - The user's code.
 * @returns {object} - { 
 *   code: string (possibly modified), 
 *   initCodes: object (map of init strings), 
 *   flags: object (boolean flags for each algo type) 
 * }
 */
export const initializeLevelState = (currentLevel, code) => {
    let modifiedCode = code;

    // Default flags
    const flags = {
        isKnapsack: !!currentLevel?.knapsackData,
        isSubsetSum: !!currentLevel?.subsetSumData,
        isCoinChange: !!currentLevel?.coinChangeData,
        isAntDp: false, // Detected via appliedData type
        isNQueen: !!currentLevel?.nqueenData,
        isEmei: !!currentLevel?.n && !!currentLevel?.tourists, // Emei heuristics
        isRopePartition: false, // Detected via type
        isTrainSchedule: false // Detected via types
    };

    // Check appliedData for specific types
    const applied = currentLevel?.appliedData;
    const appliedType = String(applied?.type || '').toUpperCase();

    if (appliedType.includes('ANT')) flags.isAntDp = true;
    if (currentLevel?.type === 'rope_partition') flags.isRopePartition = true; // Use level type or applied type
    if (currentLevel?.type === 'train_schedule') flags.isTrainSchedule = true;

    // Init Codes Container
    const initCodes = {
        knapsack: '',
        subsetSum: '',
        coinChange: '',
        antDp: '',
        nqueen: '',
        ropePartition: ''
    };

    // --- Knapsack ---
    if (flags.isKnapsack) {
        startKnapsackSelectionTracking();
        try { resetKnapsackTableState(); } catch (e) { }
        initCodes.knapsack = getKnapsackInitCode(currentLevel);
        if (initCodes.knapsack) {
            console.log('🔍 Initialized knapsack variables');
        }
    }

    // --- Subset Sum ---
    if (flags.isSubsetSum) {
        startSubsetSumTrackingVisual();
        try { resetSubsetSumTableState(); } catch (e) { }
        initCodes.subsetSum = getSubsetSumInitCode(currentLevel);
        if (initCodes.subsetSum) console.log('🔍 Initialized subset sum variables');
    }

    // --- Coin Change ---
    if (flags.isCoinChange) {
        startCoinChangeSelectionTracking();
        try { resetCoinChangeTableState(); } catch (e) { }
        initCodes.coinChange = getCoinChangeInitCode(currentLevel);
        if (initCodes.coinChange) console.log('🔍 Initialized coin change variables');
    }

    // --- Ant DP ---
    if (flags.isAntDp) {
        try { resetAntDpTableState(); } catch (e) { }
        initCodes.antDp = getAntDpInitCode(currentLevel);

        // Critical: Apply Ant DP patches immediately to the code
        try {
            modifiedCode = instrumentAntDp(modifiedCode, true, initCodes.antDp);
        } catch (e) {
            console.warn('[executionStateInit] Error checking Ant DP instrumentation:', e);
        }
    }

    // --- N-Queen ---
    if (flags.isNQueen) {
        initCodes.nqueen = getNQueenInitCode(currentLevel);
        console.log('🔍 Initialized N-Queen variables');
    }

    // --- Rope Partition ---
    if (flags.isRopePartition) {
        initCodes.ropePartition = getRopePartitionInitCode(true); // Using boolean true as placeholder if needed by logic
        // Verify code instrumentation for Rope Partition
        try {
            modifiedCode = instrumentRopePartition(modifiedCode, true);
        } catch (e) {
            console.warn('[executionStateInit] Error checking Rope Partition instrumentation:', e);
        }
    }

    return {
        modifiedCode,
        initCodes,
        flags
    };
};
