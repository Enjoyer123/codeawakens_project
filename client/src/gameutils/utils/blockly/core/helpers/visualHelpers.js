// Algorithm Visualization Helper Functions
import { getCurrentGameState } from '../../../gameUtils';
import {
    selectKnapsackItem,
    unselectKnapsackItem,
    resetKnapsackItems
} from '../../algorithms/knapsack/blocklyKnapsackVisual';
import {
    addWarriorToSide1,
    addWarriorToSide2,
    resetSubsetSumWarriors
} from '../../algorithms/subset_sum/blocklySubsetSumVisual';
import {
    resetSubsetSumTracking,
    startSubsetSumTracking,
    showSubsetSumFinalSolution
} from '../../algorithms/subset_sum/blocklySubsetSumTracking';
import {
    addWarriorToSelection,
    resetCoinChangeVisual,
    resetCoinChangeSelectionTracking,
    startCoinChangeSelectionTracking,
    showCoinChangeFinalSolution,
    trackCoinChangeDecision
} from '../../algorithms/coin_change/blocklyCoinChangeVisual';

/**
 * Select a knapsack item (move it into the bag) - for visual feedback
 * @param {number} itemIndex - Index of the item (0-based)
 */
export async function selectKnapsackItemVisual(itemIndex) {
    await selectKnapsackItem(itemIndex);
}

/**
 * Unselect a knapsack item (move it back to original position) - for visual feedback
 * @param {number} itemIndex - Index of the item (0-based)
 */
export async function unselectKnapsackItemVisual(itemIndex) {
    await unselectKnapsackItem(itemIndex);
}

/**
 * Helper function for Math.max in knapsack that adds visual feedback
 * Re-export from blocklyKnapsackVisual
 */
export {
    knapsackMaxWithVisual,
    resetKnapsackSelectionTracking,
    startKnapsackSelectionTracking,
    showKnapsackFinalSelection
} from '../../algorithms/knapsack/blocklyKnapsackVisual';

/**
 * Helper for Math.max in Ant DP that adds visual feedback (consider vs chosen)
 */
export { antMaxWithVisual, showAntDpFinalPath } from '../../algorithms/ant_dp/blocklyAntDpVisual';

/**
 * Reset all knapsack items to original positions
 */
export function resetKnapsackItemsVisual() {
    resetKnapsackItems();
}

/**
 * Add warrior to side1 - for visual feedback
 * @param {number} warriorIndex - Index of the warrior (0-based)
 */
export async function addWarriorToSide1Visual(warriorIndex) {
    await addWarriorToSide1(warriorIndex);
}

/**
 * Add warrior to side2 - for visual feedback
 * @param {number} warriorIndex - Index of the warrior (0-based)
 */
export async function addWarriorToSide2Visual(warriorIndex) {
    await addWarriorToSide2(warriorIndex);
}

/**
 * Reset all subset sum warriors to original positions
 */
export function resetSubsetSumWarriorsVisual() {
    resetSubsetSumWarriors();
}

/**
 * Add warrior to selection box - for Coin Change visual feedback
 */
export async function addWarriorToSelectionVisual(warriorIndex) {
    await addWarriorToSelection(warriorIndex);
}

/**
 * Reset coin change visual display
 */
export function resetCoinChangeVisualDisplay() {
    const currentState = getCurrentGameState();
    const scene = currentState.currentScene;
    if (scene) {
        resetCoinChangeVisual(scene);
    }
}

/**
 * Reset coin change selection tracking
 */
export function resetCoinChangeSelectionTrackingWrapper() {
    resetCoinChangeSelectionTracking();
}

/**
 * Start tracking coin change selections
 */
export function startCoinChangeSelectionTrackingWrapper() {
    startCoinChangeSelectionTracking();
}

/**
 * Track coin change decision (wrapper)
 */
export function trackCoinChangeDecisionWrapper(amount, index, include, exclude) {
    trackCoinChangeDecision(amount, index, include, exclude);
}

/**
 * Show final coin change solution (wrapper)
 */
export async function showCoinChangeFinalSolutionWrapper() {
    await showCoinChangeFinalSolution();
}

/**
 * Start tracking subset sum decisions
 */
export function startSubsetSumTrackingVisual() {
    startSubsetSumTracking();
}

/**
 * Show final subset sum solution
 * @param {number} targetSum - Target sum that was achieved
 */
export async function showSubsetSumFinalSolutionVisual(targetSum) {
    await showSubsetSumFinalSolution(targetSum);
}

/**
 * Reset subset sum tracking
 */
export function resetSubsetSumTrackingVisual() {
    resetSubsetSumTracking();
}
