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

import { getSubsetSumInitCode } from './instrumentSubsetSum';
import { getCoinChangeInitCode } from './instrumentCoinChange';
import { getNQueenInitCode } from './instrumentNQueen';
import { getKnapsackInitCode, getRopePartitionInitCode, instrumentRopePartition, getSimplifiedHelpersInitCode } from './instrumentOther';

import {
    startCoinChangeSelectionTracking,
} from '@/gameutils/blockly';

import { startSubsetSumTrackingVisual } from '@/gameutils/blockly';

import {
    startKnapsackSelectionTracking,
} from '@/gameutils/blockly';


import { resetCoinChangeTableState } from '@/gameutils/blockly';
import { resetKnapsackTableState } from '@/gameutils/blockly';
import { resetSubsetSumTableState } from '@/gameutils/blockly';




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
        isNQueen: !!currentLevel?.nqueenData,
        isEmei: !!currentLevel?.n && !!currentLevel?.tourists, // Emei heuristics
        isRopePartition: false, // Detected via type
        isTrainSchedule: false // Detected via types
    };

    // Check appliedData for specific types
    const applied = currentLevel?.appliedData;
    const appliedType = String(applied?.type || '').toUpperCase();


    if (currentLevel?.type === 'rope_partition') flags.isRopePartition = true; // Use level type or applied type
    if (currentLevel?.type === 'train_schedule') flags.isTrainSchedule = true;

    // Init Codes Container
    const initCodes = {
        knapsack: '',
        subsetSum: '',
        coinChange: '',
        nqueen: '',
        ropePartition: '',
        helpers: ''
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

    // Always inject simplified helpers for Text Code users
    initCodes.helpers = getSimplifiedHelpersInitCode();

    return {
        modifiedCode,
        initCodes,
        flags
    };
};
