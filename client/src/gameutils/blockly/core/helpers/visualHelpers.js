// Algorithm Visualization Helper Functions
import { getCurrentGameState } from '../../../shared/game';
import { resetCoinChangeVisual } from '../../algorithms/coin_change/blocklyCoinChangeVisual';

// ==========================================
// Direct re-exports (no added logic needed)
// ==========================================

// Knapsack visual functions
export {
    selectKnapsackItem as selectKnapsackItemVisual,
    unselectKnapsackItem as unselectKnapsackItemVisual,
    resetKnapsackItems as resetKnapsackItemsVisual,
    knapsackMaxWithVisual,
    resetKnapsackSelectionTracking,
    startKnapsackSelectionTracking,
    showKnapsackFinalSelection
} from '../../algorithms/knapsack/blocklyKnapsackVisual';

// Ant DP visual functions
export { antMaxWithVisual, showAntDpFinalPath } from '../../algorithms/ant_dp/blocklyAntDpVisual';

// Subset Sum visual functions
export {
    addWarriorToSide1 as addWarriorToSide1Visual,
    addWarriorToSide2 as addWarriorToSide2Visual,
    resetSubsetSumWarriors as resetSubsetSumWarriorsVisual
} from '../../algorithms/subset_sum/blocklySubsetSumVisual';

export {
    startSubsetSumTracking as startSubsetSumTrackingVisual,
    showSubsetSumFinalSolution as showSubsetSumFinalSolutionVisual,
    resetSubsetSumTracking as resetSubsetSumTrackingVisual
} from '../../algorithms/subset_sum/blocklySubsetSumTracking';

// Coin Change visual functions
export {
    addWarriorToSelection as addWarriorToSelectionVisual,
    resetCoinChangeSelectionTracking as resetCoinChangeSelectionTrackingWrapper,
    startCoinChangeSelectionTracking as startCoinChangeSelectionTrackingWrapper,
    trackCoinChangeDecision as trackCoinChangeDecisionWrapper,
    showCoinChangeFinalSolution as showCoinChangeFinalSolutionWrapper
} from '../../algorithms/coin_change/blocklyCoinChangeVisual';

// ==========================================
// Functions with added logic (kept as wrappers)
// ==========================================

/**
 * Reset coin change visual display — needs scene lookup
 */
export function resetCoinChangeVisualDisplay() {
    const currentState = getCurrentGameState();
    const scene = currentState.currentScene;
    if (scene) {
        resetCoinChangeVisual(scene);
    }
}
